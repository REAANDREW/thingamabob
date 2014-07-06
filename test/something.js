var assert = require('assert');
var thingamabob = require('../lib/thingamabob');

function parseMessageType(inputBuffer) {
  var firstByte = inputBuffer.readUInt8(0);
  var fourBitTransformation = ((0xf0 & firstByte) >> 4);
  return fourBitTransformation;
}

describe('Parsing fixed header', function() {

  describe('parses the Message Type', function() {

    var input;
    var messageTypes;

    beforeEach(function() {
      input = new Buffer(1);
      messageTypes = thingamabob.messageTypes;
    });

    it('of Reserved', function() {
      input.writeUInt8(0, 0);
      assert.equal(parseMessageType(input), messageTypes.RESERVED);
    });

    it('of CONNECT', function() {
      input.writeUInt8(16, 0);
      assert.equal(parseMessageType(input), messageTypes.CONNECT);
    });

    it('of CONNACK', function() {
      input.writeUInt8(32, 0);
      assert.equal(parseMessageType(input), messageTypes.CONNACK);
    });

    it('of PUBLISH', function(){
      input.writeUInt8(32+16, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBLISH);
    });

    it('of PUBACK', function(){
      input.writeUInt8(64, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBACK);
    });

    it('of PUBREC', function(){
      input.writeUInt8(64+16, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBREC);
    });

    it('of PUBREL', function(){
      input.writeUInt8(64+32, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBREL);
    });

    it('of PUBCOMP', function(){
      input.writeUInt8(64+32+16, 0);
      assert.equal(parseMessageType(input), messageTypes.PUBCOMP);
    });

    it('of SUBSCRIBE', function(){
      input.writeUInt8(128, 0);
      assert.equal(parseMessageType(input), messageTypes.SUBSCRIBE);
    });

    it('of SUBACK', function(){
      input.writeUInt8(128+16, 0);
      assert.equal(parseMessageType(input), messageTypes.SUBACK);
    });

    it('of UNSUBSCRIBE', function(){
      input.writeUInt8(128+32, 0);
      assert.equal(parseMessageType(input), messageTypes.UNSUBSCRIBE);
    });

    it('of UNSUBACK', function(){
      input.writeUInt8(128+32+16, 0);
      assert.equal(parseMessageType(input), messageTypes.UNSUBACK);
    });

    it('of PINGREQ', function(){
      input.writeUInt8(128+64, 0);
      assert.equal(parseMessageType(input), messageTypes.PINGREQ);
    });

    it('of PINGRESP', function(){
      input.writeUInt8(128+64+16, 0);
      assert.equal(parseMessageType(input), messageTypes.PINGRESP);
    });

    it('of DISCONNECT', function(){
      input.writeUInt8(128+64+32, 0);
      assert.equal(parseMessageType(input), messageTypes.DISCONNECT);
    });
  });
});
