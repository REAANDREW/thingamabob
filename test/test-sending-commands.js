'use strict';

describe.skip('sending', function() {

    describe('starting a TCP session with the server', function() {
        it('if the first packet sent is not a CONNECT message then the server closes the connection');
    });

    describe('sending CONNECT command', function() {
        describe('multiple times', function() {
            it('returns protocol violation response for the second CONNECT message');
        });

        describe('the server closes the connection', function() {
            it('when the protocol name is not equal to MQTT');
            it('when the reserved flag is set on the connect flags');
            it('when the Will Flag is set to 0 and the Will QoS is not set to 0 _0x00_');
        });

        describe('with Clean Session NOT set', function(){});

        describe('with Clean Session set', function() {
            it('returns a CONNACK message with Session Present set to false');
            it('returns a CONNACK message with a zero return code');
        });

        describe('n seconds after the connection was made', function() {
            it('the server closes the client connection');
        });

        it('returns a CONNACK message with invalid protocol level when the protocol level does not equal 4');
    });

    it('returns a CONNACK message');
});
