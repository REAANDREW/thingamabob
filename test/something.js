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


  });
});
