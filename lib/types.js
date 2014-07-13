'use strict';

var constants = require('./constants');

function defaultValue(value, defaultVal) {
  return value || defaultVal;
}

function FixedHeader(options) {
  return Object.freeze({
    messageType: options.messageType,
    duplicateDelivery: options.duplicateDelivery,
    qualityOfService: options.qualityOfService,
    retain: options.retain,
    remainingLength: options.remainingLength,
    byteCount: options.byteCount
  });
}

function ConnAckMessage(args){

  var sessionPresent = defaultValue(args.sessionPresent, false);
  var returnCode = args.returnCode;

  function toBuffer() {
    var input = new Buffer(4);
    input.writeUInt8(1 | 32, 0);
    input.writeUInt8(2, 1);

    var connAckFlags = 0;
    connAckFlags |= (sessionPresent ? 1 : 0);

    input.writeUInt8(connAckFlags, 2);
    input.writeUInt8(returnCode, 3);

    return input;
  }

  return Object.freeze({
    toBuffer: toBuffer
  });
}

function ConnectMessage(args) {

  args = args || {};
  var protocolName = defaultValue(args.protocolName, constants.PROTOCOL_NAME);
  var protocolVersion = defaultValue(args.protocolVersion, constants.PROTOCOL_VERSION);
  var cleanSession = defaultValue(args.cleanSession, false);

  function toBuffer() {
    var input = new Buffer(10);
    input.writeUInt8(1 | 16, 0);
    input.writeUInt8(1, 1);
    input.writeUInt16BE(protocolName.length, 2);
    input.write(protocolName, 4);
    input.writeUInt8(protocolVersion, 8);

    var connectFlags = 0;
    connectFlags |= (cleanSession ? 2 : 0);

    input.writeUInt8(connectFlags, 9);

    return input;
  }

  return Object.freeze({
    toBuffer: toBuffer
  });
}

module.exports = {
  FixedHeader: FixedHeader,
  ConnectMessage: ConnectMessage,
  ConnAckMessage : ConnAckMessage
};
