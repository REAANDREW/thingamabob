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

  return Object.freeze({
    messageType: options.messageType,
    duplicateDelivery: options.duplicateDelivery,
    qualityOfService: options.qualityOfService,
    retain: options.retain,
    remainingLength: options.remainingLength
  });
}

function Message(options) {
  return Object.freeze({
    messageType: options.fixedHeader.messageType,
    duplicateDelivery: options.fixedHeader.duplicateDelivery,
    qualityOfService: options.fixedHeader.qualityOfService,
    retain: options.fixedHeader.retain,
    remainingLength: options.fixedHeader.remainingLength,
    protocolName: options.variableHeader.protocolName
  });
}

function ProtocolNameParser() {

  function parse(inputBuffer, readIndex) {
    var length = inputBuffer.readUInt16BE(readIndex.value);
    readIndex.value += 2;
    var start = readIndex.value;
    var end = start + length;
    var result =  inputBuffer.toString('utf8', start, end);
    return result;
  }

  return Object.freeze({
    parse: parse
  });
}

function MessageParser() {

  var fixedHeaderParser = new FixedHeaderParser();
  var protocolNameParser = new ProtocolNameParser();

  function parse(inputBuffer) {
    var readIndex = new ReadIndex();
    var fixedHeader = fixedHeaderParser.parse(inputBuffer, readIndex);
    var protocolName = protocolNameParser.parse(inputBuffer, readIndex);
    var variableHeader = {
      protocolName: protocolName
    };

    var message = new Message({
      fixedHeader: fixedHeader,
      variableHeader: variableHeader
    });

    return message;
  }

  return Object.freeze({
    parse: parse
  });
}

function ReadIndex() {
  var value = 0;
  return {
    value: value
  };
}

function FixedHeaderParser() {

  function parseMessageType(inputBuffer, readIndex) {
    var firstByte = inputBuffer.readUInt8(readIndex.value);
    var fourBitTransformation = ((firstByte & 0xf0) >> 4);
    return fourBitTransformation;
  }

  function parseDuplicateDelivery(inputBuffer, readIndex) {
    var firstByte = inputBuffer.readUInt8(readIndex.value);
    var oneBitTransformation = ((firstByte & 0x08) >> 3);
    return oneBitTransformation;
  }

  function parseQualityOfService(inputBuffer, readIndex) {
    var firstByte = inputBuffer.readUInt8(readIndex.value);
    var twoBitTransformation = ((firstByte & 0x06) >> 1);
    return twoBitTransformation;
  }

  function parseRetain(inputBuffer, readIndex) {
    var firstByte = inputBuffer.readUInt8(readIndex.value);
    return firstByte & 0x01;
  }

  function parseRemainingLength(inputBuffer, readIndex) {
    var multiplier = 1;
    var value = 0;
    var digit;
    do {
      digit = inputBuffer.readUInt8(++readIndex.value);
      value += (digit & 127) * multiplier;
      multiplier *= 128;
    } while ((digit & 128) !== 0);
    return value;
  }

  function parse(inputBuffer, readIndex) {
    var messageType = parseMessageType(inputBuffer, readIndex);
    var duplicateDelivery = parseDuplicateDelivery(inputBuffer, readIndex);
    var qualityOfService = parseQualityOfService(inputBuffer, readIndex);
    var retain = parseRetain(inputBuffer, readIndex);
    var remainingLength = parseRemainingLength(inputBuffer, readIndex);

    readIndex.value++;
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
  MessageParser: MessageParser,
  FixedHeaderParser: FixedHeaderParser,
  ProtocolNameParser: ProtocolNameParser,
  ReadIndex: ReadIndex
};
