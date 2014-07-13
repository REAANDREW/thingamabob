'use strict';

var net = require('net');

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
    remainingLength: options.remainingLength,
    byteCount: options.byteCount
  });
}

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

  function parse(inputBuffer, readIndex) {
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

    return {
      fixedHeader : fixedHeader
    };  

  }

  return Object.freeze({
    parse: parse
  });

}

function ConnectMessageHandler() {

  var protocolNameParser = new ProtocolNameParser();

  function handle(args) {
    var fixedHeader = args.fixedHeader;
    var data = args.data;
    var connection = args.connection;

    var protocolName = protocolNameParser.parse(data, fixedHeader.byteCount);
    if (protocolName !== 'MQTT') {
      connection.end();
    } else {
      var input = new Buffer(9);
      input.writeUInt8(1 | 32, 0);
      input.writeUInt8(2, 1);
      connection.write(input);
    }
  }

  return Object.freeze({
    handle: handle
  });
}

function ThingamabobServer(options) {

  var connectionTimeout = options.connectionTimeout;
  var protocolVersionNumber = options.protocolVersionNumber;
  var fixedHeaderParser = new FixedHeaderParser();
  var handlers = {};
  var server;

  (function initialize() {
    handlers[messageTypes.CONNECT] = new ConnectMessageHandler();
  })();

  function handleConnection(connection) {
    var t = setTimeout(function() {
      connection.end();
    }, connectionTimeout);
    connection.on('data', function(data) {
      clearTimeout(t);
      var fixedHeader = fixedHeaderParser.parse(data);
      var args = {
        connection: connection,
        data: data,
        fixedHeader: fixedHeader
      };
      var handler = handlers[fixedHeader.messageType];
      if (handler === null || handler === undefined) {
        connection.end();
      } else {
        handler.handle(args);
      }
    });
  }

  function listen(host, port, callback) {
    server = net.createServer(handleConnection);
    server.listen(port, host, callback);
  }

  function close(callback) {
    server.close(callback);
  }

  return Object.freeze({
    listen: listen,
    close: close
  });

}

function createServer(options) {
  return new ThingamabobServer(options);
}

module.exports = {
  messageTypes: messageTypes,
  qualityOfService: qualityOfService,
  FixedHeaderParser: FixedHeaderParser,
  ProtocolNameParser: ProtocolNameParser,
  ConnAckMessageParser : ConnAckMessageParser,
  createServer: createServer
};
