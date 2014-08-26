'use strict';

var constants = require('../constants');
var services = require('../services');

module.exports = {
    parsePacket: parsePacket,
    message : message
};

function defaultMessage() {
    var message = {};
    message.type = constants.messageTypes.CONNECT;
    message.headers = {};
    message.headers.fixed = {};
    message.headers.variable = {};
    message.headers.variable.protocol = {};
    message.payload = {};
    message.payload.client = {};
    message.payload.will = {};
    return message;
}

function parseConnectFlags(buffer, offset) {
    var word = buffer.readUInt8(offset);
    var returnObj = {};
    returnObj.reserved = (word & 1) === 1;
    returnObj.cleanSession = (word & 2) === 2;
    returnObj.willFlag = (word & 4) === 4;
    returnObj.willQos = (word & 24) >> 3;
    returnObj.willRetain = (word & 32) === 32;
    returnObj.passwordFlag = (word & 64) === 64;
    returnObj.usernameFlag = (word & 128) === 128;
    return returnObj;
}

function parsePacket(buffer) {
    var message = defaultMessage();
    var connectFlags;
    message.type = (buffer.readUInt8(0) & 16) >> 4;
    var remainingLengthResult = services.remainingLength.parse(buffer);
    if (remainingLengthResult instanceof Error) {
        return constants.errorCodes.connect.malformedRemainingLength;
    }
    message.headers.fixed.remainingLength = remainingLengthResult;

    var index = 1 + services.remainingLength.byteCount(remainingLengthResult);

    (function readProtocolName() {
        var protocolName = services.strings.decode(buffer, index);
        message.headers.variable.protocol.name = protocolName.value;
        index += protocolName.totalByteCount;
    })();

    (function readProtocolVersion() {
        var protocolVersion = buffer.readUInt8(index);
        message.headers.variable.protocol.version = protocolVersion;
        index += 1;
    })();

    (function readConnectFlags() {
        connectFlags = parseConnectFlags(buffer, index);
        message.headers.variable.connectFlags = connectFlags;
        index += 1;
    })();

    (function readKeepAlive() {
        var keepAlive = buffer.readUInt16BE(index);
        message.headers.variable.keepAlive = keepAlive;
        index += 2;
    })();

    (function readWill() {
        var clientIdentifier = services.strings.decode(buffer, index);
        message.payload.client.id = clientIdentifier.value;
        index += clientIdentifier.totalByteCount;

        if (connectFlags.willFlag) {
            var willTopic = services.strings.decode(buffer, index);
            message.payload.will.topic = willTopic.value;
            index += willTopic.totalByteCount;

            var willMessage = services.strings.decode(buffer, index);
            message.payload.will.message = willMessage.value;
            index += willMessage.totalByteCount;
        }

    })();

    (function readUsername() {
        if (connectFlags.usernameFlag) {
            var username = services.strings.decode(buffer, index);
            message.payload.username = username.value;
            index += username.totalByteCount;
        }
    })();

    (function readPassword() {
        if (connectFlags.passwordFlag) {
            var password = services.strings.decode(buffer, index);
            message.payload.password = password.value;
            index += password.totalByteCount;
        }
    })();

    return services.okResult(message);
}


function message() {
    var buffers = new Array(7);
    var payloadBuffers = [
        new Buffer(0),
        new Buffer(0),
        new Buffer(0),
        new Buffer(0)
    ];
    var connectFlags;

    var self = {
        withMessageType: withMessageType,
        withRemainingLength: withRemainingLength,
        withProtocolName: withProtocolName,
        withProtocolVersion: withProtocolVersion,
        withConnectFlags: withConnectFlags,
        withKeepAlive: withKeepAlive,
        withClientIdentifier: withClientIdentifier,
        withWillTopic: withWillTopic,
        withWillMessage: withWillMessage,
        withUsername: withUsername,
        withPassword: withPassword,
        buffer: buffer
    };

    function withMessageType(type) {
        var buffer = new Buffer(1);
        buffer.writeUInt8(type << 4, 0);
        buffers[0] = buffer;
        return self;
    }

    function withRemainingLength(value) {
        var buffer = new Buffer(services.remainingLength.encode(value));
        buffers[1] = buffer;
        return self;
    }

    function withProtocolName(value) {
        var encodedValue = services.strings.encode(value);
        buffers[2] = encodedValue;
        return self;
    }

    function withProtocolVersion(value) {
        var buffer = new Buffer(1);
        buffer.writeUInt8(value, 0);
        buffers[3] = buffer;
        return self;
    }

    function withConnectFlags(flags) {
        connectFlags = flags;
        var flagsWord = 0;
        var buffer = new Buffer(1);

        function flip(word, value, confirm) {
            if (confirm) {
                return word | value;
            } else {
                return word;
            }
        }
        flagsWord = flip(flagsWord, 1, flags.reserved);
        flagsWord = flip(flagsWord, 2, flags.cleanSession);
        flagsWord = flip(flagsWord, 4, flags.willFlag);
        flagsWord = (flags.willQos << 3) | flagsWord;
        flagsWord = flip(flagsWord, 32, flags.willRetain);
        flagsWord = flip(flagsWord, 64, flags.passwordFlag);
        flagsWord = flip(flagsWord, 128, flags.usernameFlag);
        buffer.writeUInt8(flagsWord, 0);
        buffers[4] = buffer;
        return self;
    }

    function withKeepAlive(value) {
        var buffer = new Buffer(2);
        buffer.writeUInt16BE(value, 0);
        buffers[5] = buffer;
        return self;
    }

    function withClientIdentifier(value) {
        var encodedValue = services.strings.encode(value);
        buffers[6] = encodedValue;
        return self;
    }

    function withWillTopic(value) {
        var encodedValue = services.strings.encode(value);
        payloadBuffers[0] = encodedValue;
        return self;
    }

    function withWillMessage(value) {
        var encodedValue = services.strings.encode(value);
        payloadBuffers[1] = encodedValue;
        return self;
    }

    function withUsername(value) {
        var encodedValue = services.strings.encode(value);
        payloadBuffers[2] = encodedValue;
        return self;
    }

    function withPassword(value) {
        var encodedValue = services.strings.encode(value);
        payloadBuffers[3] = encodedValue;
        return self;
    }

    function buffer() {
        // jshint maxcomplexity:5
        var index;
        var messageBuffer = new Buffer(0);
        for (index = 0; index < buffers.length; index++) {
            messageBuffer = Buffer.concat([messageBuffer, buffers[index]]);
        }

        if (connectFlags.willFlag) {
            messageBuffer = Buffer.concat([messageBuffer, payloadBuffers[0], payloadBuffers[1]]);
        }

        if (connectFlags.usernameFlag) {
            messageBuffer = Buffer.concat([messageBuffer, payloadBuffers[2]]);
        }

        if (connectFlags.passwordFlag) {
            messageBuffer = Buffer.concat([messageBuffer, payloadBuffers[3]]);
        }

        return messageBuffer;
    }

    (function initialize() {
        withMessageType(constants.messageTypes.CONNECT)
            .withRemainingLength(services.remainingLength.upperLimit(1))
            .withProtocolName(constants.protocol.name)
            .withProtocolVersion(constants.protocol.version)
            .withConnectFlags({})
            .withKeepAlive(60)
            .withClientIdentifier('')
            .withWillTopic('')
            .withWillMessage('')
            .withUsername('')
            .withPassword('');
    })();

    return self;
}
