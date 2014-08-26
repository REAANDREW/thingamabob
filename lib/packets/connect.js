'use strict';

var constants = require('../constants');
var services = require('../services');

module.exports = {
    parsePacket : parsePacket
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
