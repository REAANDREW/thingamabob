/*
 * thingamabob
 * https://github.com/vagrant/mqtt-node
 *
 * Copyright (c) 2014 REAANDREW
 * Licensed under the MIT license.
 */

'use strict';

var thingamabob = require('./lib/thingamabob');
var net = require('net');

var parser = new thingamabob.FixedHeaderParser();

var server = net.createServer(function(connection){
  connection.on('data', function(buffer){
    var result = parser.parse(buffer);
    console.log(result);
    console.log(buffer);
    console.log(buffer.toString('utf-8'));
  });
  connection.on('end', function(){
    console.log('server disconnected');
  })
});

server.listen(8000, function(){
  console.log('server listening on port 8000');
});
