var assert = require('assert');

var constraints = {
    maxMessageLength: 268435455
};

function encodeRemainingLength(value) {

    if (value > constraints.maxMessageLength) {
        throw new Error('max message length exceeded');
    }
    var buffer = new Buffer(0);
    do {
        var digit = value % 128;
        value = parseInt(value / 128);
        if (value > 0) {
            digit = digit | 0xFF;
        }
        var next = new Buffer(1);
        next.writeUInt8(digit, 0);
        buffer = Buffer.concat([buffer, next])
    }
    while (value > 0);
    return buffer;
}

function decodeRemainingLength(buffer) {
    var multiplier = 1;
    var value = 0;
    var index = 0;
    var digit;
    do {
        if (index === buffer.length)
            throw Error('malformed remaining length')
        digit = buffer.readUInt8(index++);
        value += (digit & 127) * multiplier;
        multiplier *= 128;
    }
    while ((digit & 128) !== 0);
    return value;
}

describe('MQTT Special Functions', function() {

    describe('Encoding remaining length', function() {

        function expectEncoding(value, expectedValues) {
            var result = encodeRemainingLength(value);
            assert.equal(result.length, expectedValues.length);
            for (var i = 0; i < expectedValues.length; i++) {
                assert.equal(result.readUInt8(i), expectedValues[i]);
            }
        }

        it('encoding 127 returns a 1 byte Buffer', function() {
            expectEncoding(127, [0x7F]);
        });

        it('encoding 128 x 127 returns a 2 byte Buffer', function() {
            expectEncoding(128 * 127, [0xFF, 0x7F]);
        });

        it('encoding 128 x 128 x 127 returns a 3 byte Buffer', function() {
            expectEncoding(128 * 128 * 127, [0xFF, 0xFF, 0x7F]);
        });

        it('encoding 128 x 128 x 128 x 127 returns a 4 byte Buffer', function() {
            expectEncoding(128 * 128 * 128 * 127, [0xFF, 0xFF, 0xFF, 0x7F]);
        });

        it('encoding a number greater than 128x128x128x127 throws an error', function() {
            assert.throws(function() {
                encodeRemainingLength(128 * 128 * 128 * 128);
            }, /max message length exceeded/);
        });
    });

    describe('Decoding remaining length', function() {

        function expectDecoding(value, expectedValue) {
            var buffer = new Buffer(value.length);
            for (var i = 0; i < value.length; i++) {
                buffer.writeUInt8(value[i], i);
            }
            var result = decodeRemainingLength(buffer);
            assert.equal(result, expectedValue);
        }

        it('decodes 0x7F as one byte upper limit', function() {
            var oneByteUpperLimit = 128 - 1;
            expectDecoding([0x7F], oneByteUpperLimit);
        });

        it('decodes 0xFF 0x7F as two byte upper limit', function() {
            var twoByteUpperLimit = 128 * 128 - 1;
            expectDecoding([0xFF, 0x7F], twoByteUpperLimit);
        });

        it('decodes 0xFF 0xFF 0x7F as three byte upper limit', function() {
            var threeByteUpperLimit = 128 * 128 * 128 - 1;
            expectDecoding([0xFF, 0xFF, 0x7F], threeByteUpperLimit);
        });

        it('decodes 0xFF 0xFF 0xFF 0x7F as four byte upper limit', function(){
            var fourByteUpperLimit = 128*128*128*128-1;
            expectDecoding([0xFF,0xFF,0xFF,0x7F], fourByteUpperLimit);
        });

        it('decoding a buffer greater than the four byte upper limit throws an error', function(){
            assert.throws(function(){
               decodeRemainingLength(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]))
            }, /malformed remaining length/);
        });
    });

});
