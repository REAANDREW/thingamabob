'use strict';

var constants = require('./constants');

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

function ConnectMessage(args) {

  args = args || {};
  var protocolName = args.protocolName || constants.PROTOCOL_NAME;

  function toBuffer() {
    var input = new Buffer(8);
    input.writeUInt8(1 | 16, 0);
    input.writeUInt8(1, 1);
    input.writeUInt16BE(protocolName.length, 2);
    input.write(protocolName, 4);
    return input;
  }

  return Object.freeze({
    toBuffer : toBuffer
  });
}

module.exports = {
  FixedHeader: FixedHeader,
  ConnectMessage : ConnectMessage
};
