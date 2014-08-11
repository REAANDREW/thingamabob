'use strict';

var assert = require('assert');
var net = require('net');
var thingamabob = require('../lib/thingamabob');
var parsers = require('../lib/parsers');
var constants = require('../lib/constants');
var messageTypes = constants.messageTypes;
var returnCodes = constants.returnCodes;
var types = require('../lib/types');

describe.skip('sending', function() {

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

    describe('starting a TCP session with the server', function() {

        it('if the first packet sent is not a CONNECT message then the server closes the connection', function(done) {
            var message = new types.ConnectMessage();
            var messageBytes = message.toBuffer();

            //change the message type
            messageBytes[0] |= 32;

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

    describe('sending CONNECT command', function() {

        describe('multiple times', function() {

            it.skip('returns protocol violation response for the second CONNECT message', function(done) {
                var responseCount = 0;
                var message = new types.ConnectMessage();
                client = net.connect({
                    port: port
                }, function() {
                    client.on('data', function(data) {
                        responseCount++;
                        var messageParser = new parsers.ConnAckMessageParser();
                        var connackMessage = messageParser.parse(data);
                        if (connackMessage.returnCode === constants.returnCodes.UNACCEPTABLE_PROTOCOL_LEVEL &&
                            responseCount === 2) {
                            client.destroy();
                            done();
                        }
                    });
                    client.write(message.toBuffer());
                    client.write(message.toBuffer());
                });
            });

        });

        describe('the server closes the connection', function() {

            it('when the protocol name is not equal to MQTT', function(done) {
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

            it('when the reserved flag is set on the connect flags', function(done) {
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

            it('when the Will Flag is set to 0 and the Will QoS is not set to 0 _0x00_', function(done) {
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
                        assert.equal(connAck.sessionPresent, false);
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
                        assert.equal(connAck.returnCode, returnCodes.CONNECTION_ACCEPTED);
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

        it('returns a CONNACK message with invalid protocol level when the protocol level does not equal 4', function(done) {
            var message = new types.ConnectMessage({
                protocolVersion: 101
            });
            client = net.connect({
                port: port
            }, function() {
                client.on('data', function(data) {
                    var messageParser = new parsers.ConnAckMessageParser();
                    var connackMessage = messageParser.parse(data);
                    assert.equal(connackMessage.returnCode,
                        constants.returnCodes.UNACCEPTABLE_PROTOCOL_LEVEL);
                    client.destroy();
                    done();
                });
                client.write(message.toBuffer());
            });
        });
    });

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
