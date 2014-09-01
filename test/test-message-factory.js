'use strict';
var _ = require('lodash');
var deride = require('deride');

// temp implementation
function MessageFactory(options) {

    function parse(buffer) {
        var parser = options.parsers.CONNECT;
        return parser.parsePacket(buffer);
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

            it('reads the fixed header and calls the ' + test.type + ' Packet Parser', function() {
                factory.parse(test.msg);
                parsers[test.type.toUpperCase()].expect.parsePacket.called.once();
            });
        });
    });

    describe('handles invalid messages', function() {
        it('returns an error for a forbidden (0) type');
        it('returns an error for a forbidden (15) type');
    });
});
