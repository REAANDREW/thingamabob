'use strict';

var types = require('./types');

function ProtocolNameParser() {
  function parse(inputBuffer, readIndex) {
    var length = inputBuffer.readUInt16BE(readIndex);
    readIndex += 2;
    var start = readIndex;
    var end = start + length;
    var result = inputBuffer.toString('utf8', start, end);
    return result;
  }

  return Object.freeze({
    parse: parse
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
    var value = 0;
    var index = 1;
    var digit;
    do {
      digit = inputBuffer.readUInt8(index++);
      value += (digit & 127) * multiplier;
      multiplier *= 128;
    } while ((digit & 128) !== 0);
    return {
      value: value,
      byteCount: index
    };
  }

  function parse(inputBuffer) {
    var messageType = parseMessageType(inputBuffer);
    var duplicateDelivery = parseDuplicateDelivery(inputBuffer);
    var qualityOfService = parseQualityOfService(inputBuffer);
    var retain = parseRetain(inputBuffer);
    var remainingLength = parseRemainingLength(inputBuffer);

    return new types.FixedHeader({
      messageType: messageType,
      duplicateDelivery: duplicateDelivery,
      qualityOfService: qualityOfService,
      retain: retain,
      remainingLength: remainingLength.value,
      byteCount: remainingLength.byteCount
    });
  }

  return Object.freeze({
    parse: parse
  });
}

function ConnAckMessageParser() {
  var fixedHeaderParser = new FixedHeaderParser();

  function parse(data) {

    var fixedHeader = fixedHeaderParser.parse(data);
    var index = fixedHeader.byteCount;
    var connectAcknowledgeFlags = data.readUInt8(index);
    var sessionPresent = (connectAcknowledgeFlags & 1) === 1;
    var returnCode = data.readUInt8(++index);

    var msg = new types.ConnAckMessage({
      fixedHeader: fixedHeader,
      sessionPresent: sessionPresent,
      returnCode: returnCode
    });

    return msg;
  }

  return Object.freeze({
    parse: parse
  });
}

function ConnectMessageParser() {

  var fixedHeaderParser = new FixedHeaderParser();
  var protocolNameParser = new ProtocolNameParser();
  var connectFlags = {
    cleanSession: false,
    reserved: false
  };

  function parse(data) {

    var fixedHeader = fixedHeaderParser.parse(data);
    var index = fixedHeader.byteCount;
    var protocolName = protocolNameParser.parse(data, index);
    index += 6;
    var protocolLevel = data.readUInt8(index++);
    //Read the CONNECT Flags
    var connectFlagsWord = data.readUInt8(index);
    index += 1;
    var keepAlive = data.readUInt16BE(index);

    connectFlags.cleanSession = (connectFlagsWord & 2) === 2;
    connectFlags.reserved = (connectFlagsWord & 1) === 1;

    return {
      messageType: fixedHeader.messageType,
      duplicateDelivery: fixedHeader.duplicateDelivery,
      qualityOfService: fixedHeader.qualityOfService,
      retain: fixedHeader.retain,
      remainingLength: fixedHeader.remainingLength,
      protocolName: protocolName,
      protocolLevel: protocolLevel,
      connectFlags: connectFlags,
      keepAlive: keepAlive
    };

  }

  return Object.freeze({
    parse: parse
  });
}

module.exports = {
  FixedHeaderParser: FixedHeaderParser,
  ProtocolNameParser: ProtocolNameParser,
  ConnectMessageParser: ConnectMessageParser,
  ConnAckMessageParser: ConnAckMessageParser
};
