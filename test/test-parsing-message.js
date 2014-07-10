'use strict';

var assert = require('assert');
var thingamabob = require('../lib/thingamabob');

describe('MessageParser', function() {

  var messageParser;
  var result;
  var messageTypes;
  var qualityOfService;
  var protocolName;

  beforeEach(function() {
    messageParser = new thingamabob.MessageParser();
    messageTypes = thingamabob.messageTypes;
    qualityOfService = thingamabob.qualityOfService;
    //KPAX
    protocolName = 'PROT';
    var input = new Buffer(8);
    //Need to make a model for this to have a test builder
    //as this is not clear at all what the magic numbers are
    //unless you know the spec like the back of your hand.
    input.writeUInt8(1 | 16 | 8 | 4 | 1, 0);
    input.writeUInt8(127, 1);
    input.writeUInt16BE(protocolName.length, 2);
    input.write(protocolName, 4);
    result = messageParser.parse(input);
  });

  it('parses fixed header', function() {
    assert.equal(result.messageType, messageTypes.CONNECT);
    assert.equal(result.duplicateDelivery, true);
    assert.equal(result.qualityOfService, qualityOfService.EXACTLY_ONCE);
    assert.equal(result.retain, true);
    assert.equal(result.remainingLength, 127);
  });

  it('parses the variable header', function(){
    assert.equal(result.protocolName, protocolName);
  });

});

describe('ProtocolNameParser', function() {

  it('Parse the protocol name', function() {
    var buffer = new Buffer(4);
    buffer.writeUInt16BE(0x02, 0);
    buffer.write('AA', 2);
    var protocolNameParser = new thingamabob.ProtocolNameParser();
    var result = protocolNameParser.parse(buffer, new thingamabob.ReadIndex());
    assert.equal(result, 'AA');
  });

});

describe('FixedHeaderParser', function() {

  var parser;
  var input;
  var messageTypes;
  var qualityOfService;

  beforeEach(function() {
    parser = new thingamabob.FixedHeaderParser();
    input = new Buffer(5);
    messageTypes = thingamabob.messageTypes;
    qualityOfService = thingamabob.qualityOfService;
  });

  function parse(input) {
    return parser.parse(input, new thingamabob.ReadIndex());
  }

  describe('parses the Remaining Length', function() {

    it('when a single byte', function() {
      input = new Buffer(2);
      input.writeUInt8(127, 1);
      assert.equal(parse(input).remainingLength, 127);
    });

    it('when two bytes', function() {
      input = new Buffer(3);
      input.writeUInt8(255, 1);
      input.writeUInt8(127, 2);
      assert.equal(parse(input).remainingLength, 128 * 128 - 1);
    });

    it('when three bytes', function() {
      input = new Buffer(4);
      input.writeUInt8(255, 1);
      input.writeUInt8(255, 2);
      input.writeUInt8(127, 3);
      assert.equal(parse(input).remainingLength, 128 * 128 * 128 - 1);
    });

    it('when four bytes', function() {
      input = new Buffer(5);
      input.writeUInt8(255, 1);
      input.writeUInt8(255, 2);
      input.writeUInt8(255, 3);
      input.writeUInt8(127, 4);
      assert.equal(parse(input).remainingLength, 128 * 128 * 128 * 128 - 1);
    });
  });

  it('parses the DUP Flag', function() {
    input.writeUInt8(8, 0);
    assert.equal(parse(input).duplicateDelivery, true);
    input.writeUInt8(0, 0);
    assert.equal(parse(input).duplicateDelivery, false);
  });

  it('parses the RETAIN Flag', function() {
    input.writeUInt8(1, 0);
    assert.equal(parse(input).retain, true);
    input.writeUInt8(0, 0);
    assert.equal(parse(input).retain, false);
  });

  describe('parses the Quality of Service', function() {

    it('of at most once', function() {
      input.writeUInt8(0, 0);
      assert.equal(parse(input).qualityOfService, qualityOfService.AT_MOST_ONCE);
    });

    it('of at least once', function() {
      input.writeUInt8(2, 0);
      assert.equal(parse(input).qualityOfService, qualityOfService.AT_LEAST_ONCE);
    });


    it('of exactly once', function() {
      input.writeUInt8(4, 0);
      assert.equal(parse(input).qualityOfService, qualityOfService.EXACTLY_ONCE);
    });

    it('of reserved', function() {
      input.writeUInt8(4 + 2, 0);
      assert.equal(parse(input).qualityOfService, qualityOfService.RESERVED);
    });

  });

  describe('parses the Message Type', function() {


    it('of Reserved', function() {
      input.writeUInt8(0, 0);
      assert.equal(parse(input).messageType, messageTypes.RESERVED);
      input.writeUInt8(128 + 64 + 32 + 16, 0);
      assert.equal(parse(input).messageType, 15);
    });

    it('of CONNECT', function() {
      input.writeUInt8(16, 0);
      assert.equal(parse(input).messageType, messageTypes.CONNECT);
    });

    it('of CONNACK', function() {
      input.writeUInt8(32, 0);
      assert.equal(parse(input).messageType, messageTypes.CONNACK);
    });

    it('of PUBLISH', function() {
      input.writeUInt8(32 + 16, 0);
      assert.equal(parse(input).messageType, messageTypes.PUBLISH);
    });

    it('of PUBACK', function() {
      input.writeUInt8(64, 0);
      assert.equal(parse(input).messageType, messageTypes.PUBACK);
    });

    it('of PUBREC', function() {
      input.writeUInt8(64 + 16, 0);
      assert.equal(parse(input).messageType, messageTypes.PUBREC);
    });

    it('of PUBREL', function() {
      input.writeUInt8(64 + 32, 0);
      assert.equal(parse(input).messageType, messageTypes.PUBREL);
    });

    it('of PUBCOMP', function() {
      input.writeUInt8(64 + 32 + 16, 0);
      assert.equal(parse(input).messageType, messageTypes.PUBCOMP);
    });

    it('of SUBSCRIBE', function() {
      input.writeUInt8(128, 0);
      assert.equal(parse(input).messageType, messageTypes.SUBSCRIBE);
    });

    it('of SUBACK', function() {
      input.writeUInt8(128 + 16, 0);
      assert.equal(parse(input).messageType, messageTypes.SUBACK);
    });

    it('of UNSUBSCRIBE', function() {
      input.writeUInt8(128 + 32, 0);
      assert.equal(parse(input).messageType, messageTypes.UNSUBSCRIBE);
    });

    it('of UNSUBACK', function() {
      input.writeUInt8(128 + 32 + 16, 0);
      assert.equal(parse(input).messageType, messageTypes.UNSUBACK);
    });

    it('of PINGREQ', function() {
      input.writeUInt8(128 + 64, 0);
      assert.equal(parse(input).messageType, messageTypes.PINGREQ);
    });

    it('of PINGRESP', function() {
      input.writeUInt8(128 + 64 + 16, 0);
      assert.equal(parse(input).messageType, messageTypes.PINGRESP);
    });

    it('of DISCONNECT', function() {
      input.writeUInt8(128 + 64 + 32, 0);
      assert.equal(parse(input).messageType, messageTypes.DISCONNECT);
    });

  });
});
