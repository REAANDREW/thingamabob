'use strict';

var messageTypes = {
  RESERVED: 0,
  CONNECT: 1,
  CONNACK: 2,
  PUBLISH: 3,
  PUBACK: 4,
  PUBREC: 5,
  PUBREL: 6,
  PUBCOMP: 7,
  SUBSCRIBE: 8,
  SUBACK: 9,
  UNSUBSCRIBE: 10,
  UNSUBACK: 11,
  PINGREQ: 12,
  PINGRESP: 13,
  DISCONNECT: 14
};

var qualityOfService = {
  AT_MOST_ONCE: 0,
  AT_LEAST_ONCE: 1,
  EXACTLY_ONCE: 2,
  RESERVED: 3
};

function FixedHeader(options) {

  var messageType = options.messageType;
  var duplicateDelivery = options.duplicateDelivery;
  var qualityOfService = options.qualityOfService;
  var retain = options.retain;
  var remainingLength = options.remainingLength;

  return Object.freeze({
    messageType: messageType,
    duplicateDelivery: duplicateDelivery,
    qualityOfService: qualityOfService,
    retain: retain,
    remainingLength: remainingLength
  });
}

function FixedHeaderParser() {

  function parseMessageType(inputBuffer) {
    var firstByte = inputBuffer.readUInt8(0);
    var fourBitTransformation = ((firstByte & 0xf0) >> 4);
    return fourBitTransformation;
  }

  function parseDuplicateDelivery(inputBuffer) {
    var firstByte = inputBuffer.readUInt8(0);
    var oneBitTransformation = ((firstByte & 0x08) >> 3);
    return oneBitTransformation;
  }

  function parseQualityOfService(inputBuffer) {
    var firstByte = inputBuffer.readUInt8(0);
    var twoBitTransformation = ((firstByte & 0x06) >> 1);
    return twoBitTransformation;
  }

  function parseRetain(inputBuffer) {
    var firstByte = inputBuffer.readUInt8(0);
    return firstByte & 0x01;
  }

  function parseRemainingLength(inputBuffer) {
    var multiplier = 1;
    var index = 1;
    var value = 0;
    var digit;
    do {
      digit = inputBuffer.readUInt8(index);
      value += (digit & 127) * multiplier;
      multiplier *= 128;
      index++;
    } while ((digit & 128) != 0);
    return value;
  }

  function parse(inputBuffer) {
    var messageType = parseMessageType(inputBuffer);
    var duplicateDelivery = parseDuplicateDelivery(inputBuffer);
    var qualityOfService = parseQualityOfService(inputBuffer);
    var retain = parseRetain(inputBuffer);
    var remainingLength = parseRemainingLength(inputBuffer);

    return new FixedHeader({
      messageType: messageType,
      duplicateDelivery: duplicateDelivery,
      qualityOfService: qualityOfService,
      retain: retain,
      remainingLength: remainingLength
    });
  }

  return Object.freeze({
    parse: parse
  });
}

module.exports = {
  messageTypes: messageTypes,
  qualityOfService: qualityOfService,
  FixedHeaderParser: FixedHeaderParser
};
