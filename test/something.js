var assert = require('assert');
var thingamabob = require('../lib/thingamabob');

function parseMessageType(inputBuffer) {
  var parser = thingamabob.FixedHeaderParser();
  var header = parser.parse(inputBuffer);
  return header.messageType;
}

function parseDuplicateDelivery(inputBuffer) {
  var parser = thingamabob.FixedHeaderParser();
  var header = parser.parse(inputBuffer);
  return header.duplicateDelivery;
}

function parseQualityOfService(inputBuffer) {
  var firstByte = inputBuffer.readUInt8(0);
  var twoBitTransformation = ((firstByte & 0x06) >> 1);
  return twoBitTransformation;
}

function parseRetain(inputBuffer){
  var firstByte = inputBuffer.readUInt8(0);
  return firstByte & 0x01;
}

describe('Parsing fixed header', function() {

  var input;
  var messageTypes;
  var qualityOfService;

  beforeEach(function() {
    input = new Buffer(1);
    messageTypes = thingamabob.messageTypes;
    qualityOfService = thingamabob.qualityOfService;
  });

  it('parses the DUP Flag', function() {
    input.writeUInt8(8, 0);
    assert.equal(parseDuplicateDelivery(input), true);
    input.writeUInt8(0, 0);
    assert.equal(parseDuplicateDelivery(input), false);
  });

  it('parses the RETAIN Flag',  function(){
    input.writeUInt8(1, 0);
    assert.equal(parseRetain(input), true);
    input.writeUInt8(0, 0);
    assert.equal(parseRetain(input), false);
  });

  describe('parses the Quality of Service', function() {

    it('of at most once', function() {
      input.writeUInt8(0, 0);
      assert.equal(parseQualityOfService(input), qualityOfService.AT_MOST_ONCE);
    });

    it('of at least once', function() {
      input.writeUInt8(2, 0);
      assert.equal(parseQualityOfService(input), qualityOfService.AT_LEAST_ONCE);
    });


    it('of exactly once', function() {
      input.writeUInt8(4, 0);
      assert.equal(parseQualityOfService(input), qualityOfService.EXACTLY_ONCE);
    });

    it('of reserved', function() {
      input.writeUInt8(4 + 2, 0);
      assert.equal(parseQualityOfService(input), qualityOfService.RESERVED);
    });

  });

  describe('parses the Message Type', function() {


    it('of Reserved', function() {
      input.writeUInt8(0, 0);
      assert.equal(parseMessageType(input), messageTypes.RESERVED);
      input.writeUInt8(128 + 64 + 32 + 16, 0);
      assert.equal(parseMessageType(input), 15);
    });

    it('of CONNECT', function() {
      input.writeUInt8(16, 0);
      assert.equal(parseMessageType(input), messageTypes.CONNECT);
    });

    it('of CONNACK', function() {
      input.writeUInt8(32, 0);
      assert.equal(parseMessageType(input), messageTypes.CONNACK);
    });

    it('of PUBLISH', function() {
      input.writeUInt8(32 + 16, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBLISH);
    });

    it('of PUBACK', function() {
      input.writeUInt8(64, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBACK);
    });

    it('of PUBREC', function() {
      input.writeUInt8(64 + 16, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBREC);
    });

    it('of PUBREL', function() {
      input.writeUInt8(64 + 32, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBREL);
    });

    it('of PUBCOMP', function() {
      input.writeUInt8(64 + 32 + 16, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBCOMP);
    });

    it('of SUBSCRIBE', function() {
      input.writeUInt8(128, 0);
      assert.equal(parseMessageType(input), messageTypes.SUBSCRIBE);
    });

    it('of SUBACK', function() {
      input.writeUInt8(128 + 16, 0);
      assert.equal(parseMessageType(input), messageTypes.SUBACK);
    });

    it('of UNSUBSCRIBE', function() {
      input.writeUInt8(128 + 32, 0);
      assert.equal(parseMessageType(input), messageTypes.UNSUBSCRIBE);
    });

    it('of UNSUBACK', function() {
      input.writeUInt8(128 + 32 + 16, 0);
      assert.equal(parseMessageType(input), messageTypes.UNSUBACK);
    });

    it('of PINGREQ', function() {
      input.writeUInt8(128 + 64, 0);
      assert.equal(parseMessageType(input), messageTypes.PINGREQ);
    });

    it('of PINGRESP', function() {
      input.writeUInt8(128 + 64 + 16, 0);
      assert.equal(parseMessageType(input), messageTypes.PINGRESP);
    });

    it('of DISCONNECT', function() {
      input.writeUInt8(128 + 64 + 32, 0);
      assert.equal(parseMessageType(input), messageTypes.DISCONNECT);
    });

  });
});
