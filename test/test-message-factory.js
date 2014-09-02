'use strict';
/*jshint expr: true*/

var _ = require('lodash');
var should = require('should');
var deride = require('deride');

// temp implementation
function MessageFactory(options) {

    var constants = require('../lib/constants');

    function parseMessageType(inputBuffer) {
        var firstByte = inputBuffer.readUInt8(0);
        var fourBitTransformation = ((firstByte & 0xf0) >> 4);
        return fourBitTransformation;
    }

    function parse(buffer, callback) {
        var code = parseMessageType(buffer);
        var type = _.findKey(constants.messageTypes, function(val) {
            return val === code;
        });
        if (type === undefined) {
            callback(new Error('Reserved Control Packet Type', code), null);
            return;
        }
        var parser = options.parsers[type];
        if (parser === undefined) {
            callback(new Error('No parser for type', code, type), null);
            return;
        }

        callback(null, parser.parsePacket(buffer));
    }

    return Object.freeze({
        parse: parse
    });
}

describe('MessageFactory', function() {

    //var MessageFactory = require('../lib/thingamabob').MessageFactory;

    var tests = [{
        type: 'Connect',
        msg: (function() {
            var input = new Buffer(5);
            input.writeUInt8(16, 0);
            return input;
        })(),
    }, {
        type: 'ConnAck',
        msg: (function() {
            var input = new Buffer(5);
            input.writeUInt8(32, 0);
            return input;
        })(),
    }];

    var parsers = {};
    _.each(tests, function(testCase) {
        parsers[testCase.type.toUpperCase()] = (function() {
            var parser = deride.stub(['parsePacket', 'message']);
            parser.setup.parsePacket.toReturn({
                type: testCase.type.toUpperCase(),
            });
            return parser;
        })();
    });

    _.forEach(tests, function(test) {
        describe('for a ' + test.type.toUpperCase() + ' message', function() {

            var factory;

            beforeEach(function() {
                factory = new MessageFactory({
                    parsers: parsers
                });
            });

            it('reads the fixed header and calls the ' + test.type + ' Packet Parser', function(done) {
                factory.parse(test.msg, function() {
                    parsers[test.type.toUpperCase()].expect.parsePacket.called.once();
                    done();
                });
            });
        });
    });

    describe('handles invalid messages', function() {
        var factory, input;

        beforeEach(function() {
            factory = new MessageFactory({
                parsers: {}
            });
            input = new Buffer(5);
        });

        it('returns an error for a forbidden (0) type', function(done) {
            input.writeUInt8(0, 0);
            factory.parse(input, function(error, msg) {
                should(error).not.be.null;
                should(msg).be.null;
                error.should.have.property('message', 'Reserved Control Packet Type');
                done();
            });
        });

        it('returns an error for a forbidden (15) type', function(done) {
            input.writeUInt8(128 + 64 + 32 + 16, 0);
            factory.parse(input, function(error, msg) {
                should(error).not.be.null;
                should(msg).be.null;
                error.should.have.property('message', 'Reserved Control Packet Type');
                done();
            });
        });
    });
});
