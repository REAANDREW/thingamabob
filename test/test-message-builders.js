'use strict';

require('should');
var packets = require('../lib/packets');

describe('Control Packet Builders', function() {
    describe('CONNECT', function() {});
    describe('CONNACK', function() {
        var packet = packets.connack;
        var TYPE = 32;
        var REMAININGLENGTH = 2;

        it('builds a default accepted message', function() {
            var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 1]);
            var actual = packet.message().buffer();
            actual.should.eql(expected);
        });
        it('can specify Session Present flag', function() {
            var expected = new Buffer([TYPE, REMAININGLENGTH, 1, 1]);
            var actual = packet.message().withConnAckFlags({
                sessionPresent: true
            }).buffer();
            actual.should.eql(expected);
        });
        describe('can specify return codes', function() {
            it('Connection Accepted', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 1]);
                var actual = packet.message().withReturnCodes({
                    accepted: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, unacceptable protocol version', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 2]);
                var actual = packet.message().withReturnCodes({
                    unacceptableProtocolVersion: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, identifier rejected', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 4]);
                var actual = packet.message().withReturnCodes({
                    identifierRejected: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, Server unavailable', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 8]);
                var actual = packet.message().withReturnCodes({
                    serverUnavailable: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, bad user name or password', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 16]);
                var actual = packet.message().withReturnCodes({
                    badUsernameOrPassword: true
                }).buffer();
                actual.should.eql(expected);
            });
            it('Connection Refused, not authorized', function() {
                var expected = new Buffer([TYPE, REMAININGLENGTH, 0, 32]);
                var actual = packet.message().withReturnCodes({
                    notAuthorised: true
                }).buffer();
                actual.should.eql(expected);
            });
        });
    });
});
