'use strict';

var assert = require('assert');
var services = require('../lib/services');

function assertEquivalent(obj1, obj2) {
    assert.equal(JSON.stringify(obj1), JSON.stringify(obj2));
}

describe('MQTT Special Functions', function() {

    var oneByteUpperLimit = services.remainingLength.upperLimit(1);
    var twoByteUpperLimit = services.remainingLength.upperLimit(2);
    var threeByteUpperLimit = services.remainingLength.upperLimit(3);
    var fourByteUpperLimit = services.remainingLength.upperLimit(4);

    describe('Encoding remaining length', function() {
        function expectEncoding(value, expectedValues) {
            var result = services.remainingLength.encode(value);
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
            var error = services.remainingLength.encode(fourByteUpperLimit + 1);
            assert.equal(error.message, 'max message length exceeded');
        });
    });

    describe('Decoding remaining length', function() {
        function expectDecoding(value, expectedValue) {
            var buffer = new Buffer(value.length);
            for (var i = 0; i < value.length; i++) {
                buffer.writeUInt8(value[i], i);
            }
            var result = services.remainingLength.decode(buffer);
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
            var error = services.remainingLength.decode(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]));
            assert.equal(error.message, 'malformed remaining length');
        });

        it('remainingLength.byteCount returns 1', function() {
            assert.equal(1, services.remainingLength.byteCount(oneByteUpperLimit));
        });

        it('remainingLength.byteCount returns 2', function() {
            assert.equal(2, services.remainingLength.byteCount(twoByteUpperLimit));
        });

        it('remainingLength.byteCount returns 3', function() {
            assert.equal(3, services.remainingLength.byteCount(threeByteUpperLimit));
        });

        it('remainingLength.byteCount returns 4', function() {
            assert.equal(4, services.remainingLength.byteCount(fourByteUpperLimit));
        });

        it('remainingLength.byteCount returns error when number is greater than fourByteUpperLimit', function() {
            assert.ok(services.remainingLength.byteCount(fourByteUpperLimit + 1) instanceof Error);
        });
    });

    describe('Remaining Length Byte Reader', function() {

        function find(expected) {
            var buffer = new Buffer([0x01].concat(expected));
            var actual = services.remainingLength.readBytes(buffer);
            assertEquivalent(actual, expected);
        }

        it('finds a single byte', function() {
            find([0x7F]);
        });

        it('finds two bytes', function() {
            find([0xFF,0x7F]);
        });

        it('finds three bytes', function(){
            find([0xFF,0xFF,0x7F]);
        });

        it('find four bytes', function(){
            find([0xFF,0xFF,0xFF,0x7F]);
        });

    });
});
