var assert = require('assert');

var messageTypes = {
  RESERVED : 0
}

function parseMessageType(inputBuffer){
  var firstByte = inputBuffer.readUInt8(0);
  var fourBitTransformation = ((0xf0 & firstByte) >> 4);
  return fourBitTransformation;
}

describe('Parsing fixed header', function(){

  describe('parses the Message Type', function(){
  
    it('of Reserved', function(){
      var input = new Buffer(1);
      input.writeUInt8(0, 0);
      var result = parseMessageType(input);
      assert.equal(result, messageTypes.RESERVED);
    });

    

  });

});
