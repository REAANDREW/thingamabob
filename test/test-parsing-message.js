'use strict';

var assert = require('assert');
var thingamabob = require('../lib/thingamabob');

describe('Parsing fixed header', function() {

  var parser;
  var input;
  var messageTypes;
  var qualityOfService;

  beforeEach(function() {
    parser = thingamabob.FixedHeaderParser();
    input = new Buffer(5);
    messageTypes = thingamabob.messageTypes;
    qualityOfService = thingamabob.qualityOfService;
  });

  describe('parses the Remaining Length', function() {

    it('when a single byte', function() {
      input = new Buffer(2);
      input.writeUInt8(127, 1);
      assert.equal(parser.parse(input).remainingLength, 127);
    });

    it('when two bytes', function() {
      input = new Buffer(3);
      input.writeUInt8(255, 1);
      input.writeUInt8(127, 2);
      assert.equal(parser.parse(input).remainingLength, 128 * 128 - 1);
    });

    it('when three bytes', function() {
      input = new Buffer(4);
      input.writeUInt8(255, 1);
      input.writeUInt8(255, 2);
      input.writeUInt8(127, 3);
      assert.equal(parser.parse(input).remainingLength, 128 * 128 * 128 - 1);
    });

    it('when four bytes', function(){
      input = new Buffer(5);
      input.writeUInt8(255, 1);
      input.writeUInt8(255, 2);
      input.writeUInt8(255, 3);
      input.writeUInt8(127, 4);
      assert.equal(parser.parse(input).remainingLength,128 * 128 * 128 * 128 - 1);
    });
  });

  it('parses the DUP Flag', function() {
    input.writeUInt8(8, 0);
    assert.equal(parser.parse(input).duplicateDelivery, true);
    input.writeUInt8(0, 0);
    assert.equal(parser.parse(input).duplicateDelivery, false);
  });

  it('parses the RETAIN Flag', function() {
    input.writeUInt8(1, 0);
    assert.equal(parser.parse(input).retain, true);
    input.writeUInt8(0, 0);
    assert.equal(parser.parse(input).retain, false);
  });

  describe('parses the Quality of Service', function() {

    it('of at most once', function() {
      input.writeUInt8(0, 0);
      assert.equal(parser.parse(input).qualityOfService, qualityOfService.AT_MOST_ONCE);
    });

    it('of at least once', function() {
      input.writeUInt8(2, 0);
      assert.equal(parser.parse(input).qualityOfService, qualityOfService.AT_LEAST_ONCE);
    });


    it('of exactly once', function() {
      input.writeUInt8(4, 0);
      assert.equal(parser.parse(input).qualityOfService, qualityOfService.EXACTLY_ONCE);
    });

    it('of reserved', function() {
      input.writeUInt8(4 + 2, 0);
      assert.equal(parser.parse(input).qualityOfService, qualityOfService.RESERVED);
    });

  });

  describe('parses the Message Type', function() {


    it('of Reserved', function() {
      input.writeUInt8(0, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.RESERVED);
      input.writeUInt8(128 + 64 + 32 + 16, 0);
      assert.equal(parser.parse(input).messageType, 15);
    });

    it('of CONNECT', function() {
      input.writeUInt8(16, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.CONNECT);
    });

    it('of CONNACK', function() {
      input.writeUInt8(32, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.CONNACK);
    });

    it('of PUBLISH', function() {
      input.writeUInt8(32 + 16, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.PUBLISH);
    });

    it('of PUBACK', function() {
      input.writeUInt8(64, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.PUBACK);
    });

    it('of PUBREC', function() {
      input.writeUInt8(64 + 16, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.PUBREC);
    });

    it('of PUBREL', function() {
      input.writeUInt8(64 + 32, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.PUBREL);
    });

    it('of PUBCOMP', function() {
      input.writeUInt8(64 + 32 + 16, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.PUBCOMP);
    });

    it('of SUBSCRIBE', function() {
      input.writeUInt8(128, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.SUBSCRIBE);
    });

    it('of SUBACK', function() {
      input.writeUInt8(128 + 16, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.SUBACK);
    });

    it('of UNSUBSCRIBE', function() {
      input.writeUInt8(128 + 32, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.UNSUBSCRIBE);
    });

    it('of UNSUBACK', function() {
      input.writeUInt8(128 + 32 + 16, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.UNSUBACK);
    });

    it('of PINGREQ', function() {
      input.writeUInt8(128 + 64, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.PINGREQ);
    });

    it('of PINGRESP', function() {
      input.writeUInt8(128 + 64 + 16, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.PINGRESP);
    });

    it('of DISCONNECT', function() {
      input.writeUInt8(128 + 64 + 32, 0);
      assert.equal(parser.parse(input).messageType, messageTypes.DISCONNECT);
    });

  });
});
