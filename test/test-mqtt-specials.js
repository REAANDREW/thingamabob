var assert = require('assert');
var services = require('../lib/services');

describe('MQTT Special Functions', function() {

    var oneByteUpperLimit = 128 - 1;
    var twoByteUpperLimit = 128 * 128 - 1;
    var threeByteUpperLimit = 128 * 128 * 128 - 1;
    var fourByteUpperLimit = 128 * 128 * 128 * 128 - 1;

    describe('Encoding remaining length', function() {

        function expectEncoding(value, expectedValues) {
            var result = services.encodeRemainingLength(value);
            assert.equal(result.length, expectedValues.length);
            for (var i = 0; i < expectedValues.length; i++) {
                assert.equal(result.readUInt8(i), expectedValues[i]);
            }
        }

        it('encoding up to one byte upper limit returns a 1 byte Buffer', function() {
            expectEncoding(oneByteUpperLimit, [0x7F]);
        });

        it('encoding up to two byte upper limit returns a 2 byte Buffer', function() {
            expectEncoding(twoByteUpperLimit, [0xFF, 0x7F]);
        });

        it('encoding up to three byte upper limit returns a 3 byte Buffer', function() {
            expectEncoding(threeByteUpperLimit, [0xFF, 0xFF, 0x7F]);
        });

        it('encoding up to four byte upper limit returns a 4 byte Buffer', function() {
            expectEncoding(fourByteUpperLimit, [0xFF, 0xFF, 0xFF, 0x7F]);
        });

        it('encoding a number greater than four byte upper limit throws an error', function() {
            var error = services.encodeRemainingLength(fourByteUpperLimit + 1);
            assert.equal(error.message, 'max message length exceeded');
        });
    });

    describe('Decoding remaining length', function() {


        function expectDecoding(value, expectedValue) {
            var buffer = new Buffer(value.length);
            for (var i = 0; i < value.length; i++) {
                buffer.writeUInt8(value[i], i);
            }
            var result = services.decodeRemainingLength(buffer);
            assert.equal(result, expectedValue);
        }

        it('decodes 0x7F as one byte upper limit', function() {
            expectDecoding([0x7F], oneByteUpperLimit);
        });

        it('decodes 0xFF 0x7F as two byte upper limit', function() {
            expectDecoding([0xFF, 0x7F], twoByteUpperLimit);
        });

        it('decodes 0xFF 0xFF 0x7F as three byte upper limit', function() {
            expectDecoding([0xFF, 0xFF, 0x7F], threeByteUpperLimit);
        });

        it('decodes 0xFF 0xFF 0xFF 0x7F as four byte upper limit', function() {
            expectDecoding([0xFF, 0xFF, 0xFF, 0x7F], fourByteUpperLimit);
        });

        it('decoding a buffer greater than the four byte upper limit throws an error', function() {
            var error = services.decodeRemainingLength(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]))
            assert.equal(error.message, 'malformed remaining length');
        });

        it('remainingLengthByteCount returns 1', function() {
            assert.equal(1, services.remainingLengthByteCount(oneByteUpperLimit));
        });

        it('remainLengthByteCount returns 2', function() {
            assert.equal(2, services.remainingLengthByteCount(twoByteUpperLimit));
        });

        it('remainingLengthByteCount returns 2', function() {
            assert.equal(3, services.remainingLengthByteCount(threeByteUpperLimit));
        });

        it('remainingLengthByteCount returns 4', function() {
            assert.equal(4, services.remainingLengthByteCount(fourByteUpperLimit));
        });

        it('remainingLengthByteCount returns error when number is greater than fourByteUpperLimit', function() {
            assert.ok(services.remainingLengthByteCount(fourByteUpperLimit + 1) instanceof Error);
        });
    });

});
