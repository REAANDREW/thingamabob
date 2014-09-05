'use strict';

require('should');
var packets = require('../lib/packets');

describe('Control Packet Builders', function() {

    describe('CONNECT', function() {
        var packet = packets.connect;

        it('builds a default message', function() {
            var expected = new Buffer([0x10, 0x7f, 0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x00, 0x00, 0x3c, 0x00, 0x00]);
            var actual = packet.message().buffer();
            actual.should.eql(expected);
        });

        it('can specify KeepAlive');
        describe('can specify Connect flags', function(){
            it('reserved');
            it('Clean Session');
            it('Will Flag');
            it('Will Qos');
            it('Will Retain');
            it('Password');
            it('Username');
        });
        it('can specify remaining length');
        it('can specify Client Identifier');
        it('can specify Will Topic');
        it('can specify Will Message');
        it('can specify Username');
        it('can specify Password');
    });

    describe('CONNACK', function() {
        var packet = packets.connack;
        var TYPE = 0x20;
        var REMAININGLENGTH = 0x02;

        it('builds a default accepted message', function() {
            var expected = new Buffer([TYPE, REMAININGLENGTH, 0x00, 0x01]);
            var actual = packet.message().buffer();
            actual.should.eql(expected);
        });
        it('can specify Session Present flag', function() {
            var expected = new Buffer([TYPE, REMAININGLENGTH, 0x01, 0x01]);
            var actual = packet.message().withConnAckFlags({
                sessionPresent: true
            }).buffer();
            actual.should.eql(expected);
        });
        describe('can specify return codes', function() {
            it('Connection Accepted', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0x00, 0x01]);
                var actual = packet.message().withReturnCodes({
                    accepted: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, unacceptable protocol version', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0x00, 0x02]);
                var actual = packet.message().withReturnCodes({
                    unacceptableProtocolVersion: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, identifier rejected', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0x00, 0x04]);
                var actual = packet.message().withReturnCodes({
                    identifierRejected: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, Server unavailable', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0x00, 0x08]);
                var actual = packet.message().withReturnCodes({
                    serverUnavailable: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, bad user name or password', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 0x10]);
                var actual = packet.message().withReturnCodes({
                    badUsernameOrPassword: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, not authorized', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 0x20]);
                var actual = packet.message().withReturnCodes({
                    notAuthorised: true
                }).buffer();
                actual.should.eql(expected);
            });
        });
    });
});
