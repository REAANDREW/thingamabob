'use strict';

var assert = require('assert');
var net = require('net');
var thingamabob = require('../lib/thingamabob');
var messageTypes = thingamabob.messageTypes;

describe('sending', function() {

  var server;
  var port;
  var client;
  var fixedHeaderParser;

  beforeEach(function(done) {
    fixedHeaderParser = new thingamabob.FixedHeaderParser();
    port = 8000;
    server = thingamabob.createServer({
      connectionTimeout: 20,
      protocolVersionNumber: 4
    });
    server.listen('127.0.0.1', port, done);
  });

  afterEach(function(done) {
    server.close(done);
  });

  describe('sending CONNECT command', function() {

    describe('with a protocol name not equal to MQTT', function() {

      it('the server closes the client connection', function(done) {
        var protocolName = 'PROT';
        var message = new thingamabob.ConnectMessage({
          protocolName : protocolName 
        });
        client = net.connect({
          port: port
        }, function() {
          client.on('end', function() {
            done();
          });
          client.write(message.toBuffer());
        });
      });

    });

    describe('with Clean Session set', function(){

      it('returns a CONNACK message with Session Present set to false');
      it('returns a CONNACK message with a zero return code');

    });

    describe('n seconds after the connection was made', function() {

      it('the server closes the client connection', function(done) {
        var n = 30;
        client = net.connect({
          port: port
        }, function() {
          var connectionEnded = false;
          client.on('end', function() {
            connectionEnded = true;
          });
          setTimeout(function() {
            assert.ok(connectionEnded);
            done();
          }, n);
        });
      });

    });

    it('returns a CONNACK message  with an unacceptable protocol level', function(done) {

      var protocolName = 'MQTT';
      var input = new Buffer(8);
      input.writeUInt8(1 | 16, 0);
      input.writeUInt8(1, 1);
      input.writeUInt16BE(protocolName.length, 2);
      input.write(protocolName, 4);
      client = net.connect({
        port: port
      }, function() {
        client.on('data', function(data) {
          var connAckMessageParser = new thingamabob.ConnAckMessageParser();
          var message = connAckMessageParser.parse(data);
          assert.equal(message.fixedHeader.messageType, messageTypes.CONNACK);
          assert.equal(message.fixedHeader.remainingLength, 2);
          client.destroy();
          done();
        });
        client.write(input);
      });
    });

    it('returns a CONNACK message', function(done) {
      var protocolName = 'MQTT';
      var input = new Buffer(8);
      input.writeUInt8(1 | 16, 0);
      input.writeUInt8(1, 1);
      input.writeUInt16BE(protocolName.length, 2);
      input.write(protocolName, 4);
      client = net.connect({
        port: port
      }, function() {
        client.on('data', function(data) {
          var fixedHeaderParser = new thingamabob.FixedHeaderParser();
          var fixedHeader = fixedHeaderParser.parse(data);
          assert.equal(fixedHeader.messageType, messageTypes.CONNACK);
          assert.equal(fixedHeader.remainingLength, 2);
          client.destroy();
          done();
        });
        client.write(input);
      });
    });

  });

});
