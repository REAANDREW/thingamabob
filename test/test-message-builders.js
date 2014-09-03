'use strict';

require('should');
var packets = require('../lib/packets');

describe('Control Packet Builders', function(){
    describe('CONNECT', function(){});
    describe('CONNACK', function(){
        var packet = packets.connack;
        it('builds a default accepted message', function(){
            var expected = new Buffer([32, 2, 1, 1]);
            var actual = packet.message().buffer();
            actual.should.eql(expected);
        });
        it('can specify Session Present flag');
        it('can specify return codes');
    });
});
