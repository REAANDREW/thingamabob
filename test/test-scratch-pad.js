describe('scratch pad', function(){

  it('should encode a string for the variable header protocol name', function(){

    var exampleProtocolName = new Buffer('THINGAMABOB');
    var protoNameBuffer = new Buffer(2+exampleProtocolName.length);
    protoNameBuffer.writeUInt8(0, 0);
    protoNameBuffer.writeUInt8(exampleProtocolName.length, 1);
    exampleProtocolName.copy(protoNameBuffer, 2, 0);
    console.log(protoNameBuffer.toString());
    console.log(protoNameBuffer);
  });

});
