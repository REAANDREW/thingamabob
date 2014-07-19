'use strict';

var assert = require('assert');
var net = require('net');
var thingamabob = require('../lib/thingamabob');
var parsers = require('../lib/parsers');
var constants = require('../lib/constants');
var types = require('../lib/types');

var messageTypes = constants.messageTypes;
var returnCodes = constants.returnCodes;

describe('sending', function() {

  var server;
  var port;
  var client;
  var fixedHeaderParser;

  beforeEach(function(done) {
    fixedHeaderParser = new parsers.FixedHeaderParser();
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
        var message = new types.ConnectMessage({
          protocolName: protocolName
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

    describe('when the CONNECT FLAG of RESERVED is not zero', function() {

      it('the server closes the client connection', function(done) {
        var message = new types.ConnectMessage();
        var messageBytes = message.toBuffer();
        //set the reserved flag on the CONNECT flags
        messageBytes[messageBytes.length - 3] |= 1;
        client = net.connect({
          port: port
        }, function() {
          client.on('end', function() {
            done();
          });
          client.write(messageBytes);
        });
      });

    });

    describe('with Clean Session NOT set', function() {

    });

    describe('with Clean Session set', function() {

      it('returns a CONNACK message with Session Present set to false', function(done) {
        var message = new types.ConnectMessage({
          cleanSession: true
        });
        client = net.connect({
          port: port
        }, function() {
          client.on('data', function(data) {
            var parser = new parsers.ConnAckMessageParser();
            var connAck = parser.parse(data);
            assert.equal(connAck.variableHeader.sessionPresent, false);
            client.destroy();
            done();
          });
          client.write(message.toBuffer());
        });
      });

      it('returns a CONNACK message with a zero return code', function(done) {
        var message = new types.ConnectMessage({
          cleanSession: true
        });
        client = net.connect({
          port: port
        }, function() {
          client.on('data', function(data) {
            var parser = new parsers.ConnAckMessageParser();
            var connAck = parser.parse(data);
            assert.equal(connAck.variableHeader.returnCode, returnCodes.CONNECTION_ACCEPTED);
            client.destroy();
            done();
          });
          client.write(message.toBuffer());
        });
      });

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

    it('returns a CONNACK message  with an unacceptable protocol level');

    it('returns a CONNACK message', function(done) {
      var message = new types.ConnectMessage();
      client = net.connect({
        port: port
      }, function() {
        client.on('data', function(data) {
          var fixedHeaderParser = new parsers.FixedHeaderParser();
          var fixedHeader = fixedHeaderParser.parse(data);
          assert.equal(fixedHeader.messageType, messageTypes.CONNACK);
          assert.equal(fixedHeader.remainingLength, 2);
          client.destroy();
          done();
        });
        client.write(message.toBuffer());
      });
    });

  });

});
