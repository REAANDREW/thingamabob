'use strict';

var assert = require('assert');
var constants = require('../lib/constants');
var services = require('../lib/services');

function parseRemainingLength(buffer) {
    var bytes = services.remainingLength.readBytes(buffer);
    return services.remainingLength.decode(bytes);
}

function parseConnectMessage(buffer) {

    var message = {};
    message.type = (buffer.readUInt8(0) & 16) >> 4;
    message.headers = {};
    message.headers.fixed = {};
    message.headers.fixed.remainingLength = parseRemainingLength(buffer);
    return message;
}

describe('Parsing a Connect Message', function() {

    function message() {
        var messageBuffer = new Buffer(0);

        function add(buffer) {
            messageBuffer = Buffer.concat([messageBuffer, buffer]);
        }

        return {
            withMessageType: function(type) {
                var buffer = new Buffer(1);
                buffer.writeUInt8(type << 4, 0);
                add(buffer);
                return this;
            },
            withRemainingLength: function(value) {
                var buffer = new Buffer(services.remainingLength.encode(value));
                add(buffer);
                return this;
            },
            buffer: function() {
                return messageBuffer;
            }
        };
    }

    var subject;

    beforeEach(function() {
        subject = message()
            .withMessageType(constants.messageTypes.CONNECT);
    });

    it('parses the message type', function() {
        var message = parseConnectMessage(subject.buffer());
        assert.equal(message.type, constants.messageTypes.CONNECT);
    });

    describe('parsing the remaining length', function() {

        it('parses when the remaining length is the one byte upper limit', function() {
            var remainingLength = services.remainingLength.upperLimit(1);
            var buffer = subject.withRemainingLength(remainingLength).buffer();
            var message = parseConnectMessage(buffer);
            var headers = message.headers;
            assert.equal(headers.fixed.remainingLength, remainingLength);
        });

    });

});

