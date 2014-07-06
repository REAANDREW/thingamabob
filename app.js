/*
 * thingamabob
 * https://github.com/vagrant/mqtt-node
 *
 * Copyright (c) 2014 REAANDREW
 * Licensed under the MIT license.
 */

'use strict';

var net = require('net');

var server = net.createServer(function(connection){
  connection.on('data', function(buffer){
    console.log(buffer);

  });
  connection.on('end', function(){
    console.log('server disconnected');
  })
});

server.listen(8000, function(){
  console.log('server listening on port 8000');
});
