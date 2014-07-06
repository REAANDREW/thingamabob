var assert = require('assert');

var messageTypes = {
  RESERVED: 0,
  CONNECT: 1
}

function parseMessageType(inputBuffer) {
  var firstByte = inputBuffer.readUInt8(0);
  var fourBitTransformation = ((0xf0 & firstByte) >> 4);
  return fourBitTransformation;
}

describe('Parsing fixed header', function() {

  describe('parses the Message Type', function() {

    var input;

    beforeEach(function() {
      input = new Buffer(1);
    });

    it('of Reserved', function() {
      input.writeUInt8(0, 0);
      assert.equal(parseMessageType(input), messageTypes.RESERVED);
    });

    it('of CONNECT', function() {
      input.writeUInt8(16, 0);
      assert.equal(parseMessageType(input), messageTypes.CONNECT);
    });

  });

});
