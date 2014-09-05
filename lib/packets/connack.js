'use strict';

var constants = require('../constants');
var services = require('../services');

module.exports = {
    parsePacket: parsePacket,
    message: message
};

function defaultMessage() {
    var message = {};
    message.type = constants.messageTypes.CONNACK;
    message.headers = {};
    message.headers.fixed = {};
    message.headers.variable = {};
    return message;
}

function parseFlags(buffer, offset, flags) {
    var word = buffer.readUInt8(offset);
    var returnObj = {};
    var index = 1;
    for(var i = 0; i < flags.length; i++){
        var flag = flags[i];
        returnObj[flag] = (word & index) === 1;
        index = index*2;
    }
    return returnObj;
}

function parsePacket(buffer) {
    var message = defaultMessage();
    var connAckFlags;
    message.type = (buffer.readUInt8(0) & 32) >> 4;
    message.typeName = constants.messageTypeFor(message.type);
    var remainingLengthResult = buffer.readUInt8(1);
    if (remainingLengthResult instanceof Error) {
        return constants.errorCodes.connect.malformedRemainingLength;
    }
    message.headers.fixed.remainingLength = remainingLengthResult;

    var index = 1 + services.remainingLength.byteCount(remainingLengthResult);

    (function readConnAckFlags() {
        connAckFlags = parseFlags(buffer, index, ['sessionPresent']);
        message.headers.variable.connAckFlags = connAckFlags;
        index += 1;
    })();

    (function readReturnCodes() {
        var returnCodes = parseFlags(buffer, index, ['accepted', 'unacceptableProtocolVersion', 'identifierRejected', 'serverUnavailable', 'badUsernameOrPassword', 'notAuthorised']);
        message.headers.variable.returnCodes = returnCodes;
        index += 2;
    })();

    return services.okResult(message);
}


function message() {
    var buffers = new Array(4);
    var connAckFlags, returnCodes;

    var self = {
        withMessageType: withMessageType,
        withRemainingLength: withRemainingLength,
        withConnAckFlags: withConnAckFlags,
        withReturnCodes: withReturnCodes,
        buffer: buffer
    };

    // What is the point of being able to set this?
    // unless this is being moved into a generic place
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

    function withConnAckFlags(flags) {
        connAckFlags = flags;
        var flagsWord = 0;
        var buffer = new Buffer(1);

        function flip(word, value, confirm) {
            if (confirm) {
                return word | value;
            } else {
                return word;
            }
        }
        flagsWord = flip(flagsWord, 1, flags.sessionPresent);
        buffer.writeUInt8(flagsWord, 0);
        buffers[2] = buffer;
        return self;
    }

    function withReturnCodes(codes) {
        returnCodes = codes;
        var flags = codes;
        var flagsWord = 0;
        var buffer = new Buffer(1);

        function flip(word, value, confirm) {
            if (confirm) {
                return word | value;
            } else {
                return word;
            }
        }
        flagsWord = flip(flagsWord, 1, flags.accepted);
        flagsWord = flip(flagsWord, 2, flags.unacceptableProtocolVersion);
        flagsWord = flip(flagsWord, 4, flags.identifierRejected);
        flagsWord = flip(flagsWord, 8, flags.serverUnavailable);
        flagsWord = flip(flagsWord, 16, flags.badUsernameOrPassword);
        flagsWord = flip(flagsWord, 32, flags.notAuthorised);
        buffer.writeUInt8(flagsWord, 0);
        buffers[3] = buffer;
        return self;
    }

    function buffer() {
        var index;
        var messageBuffer = new Buffer(0);
        for (index = 0; index < buffers.length; index++) {
            messageBuffer = Buffer.concat([messageBuffer, buffers[index]]);
        }

        return messageBuffer;
    }

    (function initialize() {
        withMessageType(constants.messageTypes.CONNACK)
            .withRemainingLength(0x2)
            .withConnAckFlags({})
            .withReturnCodes({
                accepted: true
            });
    })();

    return self;
}
