var assert = require('assert');


function validateRemainingLength(value) {
    var maxMessageLength = 268435455;
    if (value > maxMessageLength) {
        return Error('max message length exceeded');
    }
    return undefined;
}

function existy(value) {
    return value !== null && value !== undefined;
}

function dispatch() {
    var funcs = arguments;

    return function(target) {
        for (var funcIndex in funcs) {
            var func = funcs[funcIndex];
            var ret = func.apply(null, [target]);
            if (existy(ret)) {
                return ret;
            }
        }
        return undefined;
    }
}

function encodeRemainingLength(value) {

    var dispatcher = dispatch(validateRemainingLength, encode);

    return dispatcher(value);

    function encode(value) {
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
}


function decodeRemainingLength(buffer) {
    var multiplier = 1;
    var value = 0;
    var index = 0;
    var digit;
    do {
        if (index === buffer.length)
            return Error('malformed remaining length')
        digit = buffer.readUInt8(index++);
        value += (digit & 127) * multiplier;
        multiplier *= 128;
    }
    while ((digit & 128) !== 0);
    return value;
}

function remainingLengthByteCount(value) {
    var dispatcher = dispatch(validateRemainingLength, count);
    return dispatcher(value);

    function count(value) {
        return Math.ceil(Math.log(value) / Math.log(128));
    }
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
            var error = encodeRemainingLength(128 * 128 * 128 * 128);
            assert.equal(error.message, 'max message length exceeded');
        });
    });

    describe('Decoding remaining length', function() {

        var oneByteUpperLimit = 128 - 1;
        var twoByteUpperLimit = 128 * 128 - 1;
        var threeByteUpperLimit = 128 * 128 * 128 - 1;
        var fourByteUpperLimit = 128 * 128 * 128 * 128 - 1;

        function expectDecoding(value, expectedValue) {
            var buffer = new Buffer(value.length);
            for (var i = 0; i < value.length; i++) {
                buffer.writeUInt8(value[i], i);
            }
            var result = decodeRemainingLength(buffer);
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
            var error = decodeRemainingLength(new Buffer([0xFF, 0xFF, 0xFF, 0xFF]))
            assert.equal(error.message, 'malformed remaining length');
        });

        it('remainingLengthByteCount returns 1', function() {
            assert.equal(1, remainingLengthByteCount(oneByteUpperLimit));
        });

        it('remainLengthByteCount returns 2', function() {
            assert.equal(2, remainingLengthByteCount(twoByteUpperLimit));
        });

        it('remainingLengthByteCount returns 2', function() {
            assert.equal(3, remainingLengthByteCount(threeByteUpperLimit));
        });

        it('remainingLengthByteCount returns 4', function() {
            assert.equal(4, remainingLengthByteCount(fourByteUpperLimit));
        });

        it('remainingLengthByteCount returns error when number is greater than fourByteUpperLimit', function() {
            assert.ok(remainingLengthByteCount(fourByteUpperLimit + 1) instanceof Error);
        });
    });

});
