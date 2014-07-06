'use strict';

var net = require('net');
var client = net.connect({
    port: 8000
  },
  function() { //'connect' listener
    console.log('client connected');
    var b = new Buffer(5);
    b.writeUInt8(0x01, 0);
    b.writeUInt8(0x02, 1);
    b.writeUInt8(0x03, 2);
    b.writeUInt8(0x04, 3);
    b.writeUInt8(0x05, 4);

    client.write(b);
  });
client.on('data', function(data) {
  console.log(data.toString());
  client.end();
});
client.on('end', function() {
  console.log('client disconnected');
});
