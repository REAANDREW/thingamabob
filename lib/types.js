'use strict';

var constants = require('./constants');

function defaultValue(value, defaultVal) {
  return value || defaultVal;
}

function ensureArg(value) {
  if (value === null || value === undefined) {
    throw new Error('argument is null or undefined');
  }
  return value;
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

function ConnAckMessage(args) {

  var sessionPresent = defaultValue(args.sessionPresent, false);
  var returnCode = ensureArg(args.returnCode);

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
    toBuffer: toBuffer,
    messageType: constants.messageTypes.CONNACK,
    duplicateDelivery: 0,
    qualityOfService: 0,
    retain: 0,
    remainingLength: 2,
    sessionPresent: sessionPresent,
    returnCode: returnCode
  });
}

function ConnectMessage(args) {

  args = args || {};
  args.headers = defaultValue(args.headers, {});
  args.headers.fixed = defaultValue(args.headers.fixed, {});
  args.headers.variable = defaultValue(args.headers.variable, {});
  args.headers.variable.connectFlags =
    defaultValue(args.headers.variable.connectFlags, {});

  var headers;

  (function initialize() {
    var connectFlags = args.headers.variable.connectFlags;
    headers = {
      fixed: {
        messageType: constants.messageTypes.CONNECT
      },
      variable: {
        keepAlive: args.keepAlive || 60,
        protocol: {
          name: constants.protocol.name,
          version: constants.protocol.version
        },
        connectFlags: {
          cleanSession : defaultValue(connectFlags.cleanSession,0)
        }
      }
    };
  })();

  function toBuffer() {
    var input = new Buffer(12);
    input.writeUInt8(0 | 16, 0);
    input.writeUInt8(fixedHeader.remainingLength, 1);
    input.writeUInt16BE(protocolName.length, 2);
    input.write(protocolName, 4);
    input.writeUInt8(protocolVersion, 8);

    var connectFlagsBit = 0;
    connectFlagsBit |= (connectFlags.cleanSession ? 2 : 0);
    connectFlagsBit |= (connectFlags.will ? 4 : 0);
    connectFlagsBit |= (connectFlags.willQos << 3);

    input.writeUInt8(connectFlagsBit, 9);
    input.writeUInt16BE(keepAlive, 10);

    return input;
  }

  return {
    toBuffer: toBuffer,
    headers: headers
  };
}

module.exports = {
  FixedHeader: FixedHeader,
  ConnectMessage: ConnectMessage,
  ConnAckMessage: ConnAckMessage
};
