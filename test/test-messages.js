'use strict';

var assert = require('assert');
var types = require('../lib/types');
var constants = require('../lib/constants');
var services = require('../lib/services');

var shared = {
    behavesLikeMqttMessage: function(messageType) {
        it('has protocol version set', function() {
            var headers = this.message.headers;
            var variableHeader = headers.variable;
            assert.equal(variableHeader.protocol.version, constants.protocol.version);
        });

        it('has protocol name set', function() {
            var headers = this.message.headers;
            var variableHeader = headers.variable;
            assert.equal(variableHeader.protocol.name, constants.protocol.name);
        });

        it('has message type set', function() {
            var headers = this.message.headers;
            assert.equal(headers.fixed.messageType, messageType);
        });
    }
}

function parse(buffer) {
    var message = new types.ConnectMessage();
    message.type = (buffer.readUInt8(0) & 16) >> 4;
    message.headers = {};
    message.headers.fixed = {};
    return message;
}

describe('Parsing a Connect Message', function() {

    before(function() {
        this.buffer = new Buffer(0);
    });

    it('parses the message type', function() {
        var buffer = new Buffer(1);
        buffer.writeUInt8(constants.messageTypes.CONNECT << 4, 0);
        this.buffer = Buffer.concat([this.buffer, buffer]);
        var message = parse(this.buffer);
        assert.equal(message.type, constants.messageTypes.CONNECT);
    });

    describe('parsing the remaining length', function() {

        it('parses when the remaining length is the one byte upper limit', function() {
            var remainingLength = services.remainingLength.upperLimit(1);
            var buffer = new Buffer(services.remainingLength.encode(remainingLength));
            this.buffer = Buffer.concat([this.buffer, buffer]);
            var message = parse(this.buffer);
            var headers = message.headers;
            assert.equal(headers.fixed.remainingLength, remainingLength);
        });

    });

});

describe('Connect Message', function() {

    beforeEach(function() {
        this.message = new types.ConnectMessage();
        var headers = this.message.headers;
        this.variableHeader = headers.variable;
        this.connectFlags = this.variableHeader.connectFlags;
    });

    describe('defaults', function() {
        it('the keepalive to 60 seconds', function() {
            assert.equal(this.variableHeader.keepAlive, 60);
        });

        it('the clean session to 0', function() {
            assert.equal(this.connectFlags.cleanSession, 0);
        });

        it('the will flag to 0', function() {
            assert.equal(this.connectFlags.will, 0);
        });

        it('the will qos flag to 0', function() {
            assert.equal(this.connectFlags.willQos, 0);
        });

        it('the will retain flag to 0', function() {
            assert.equal(this.connectFlags.willRetain, 0);
        });

        it('the username flag to 0', function() {
            assert.equal(this.connectFlags.username, 0);
        });

        it('the password flag to 0', function() {
            assert.equal(this.connectFlags.password, 0);
        });

        shared.behavesLikeMqttMessage(constants.messageTypes.CONNECT);
    });

});
