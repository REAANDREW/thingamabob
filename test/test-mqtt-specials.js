var assert = require('assert');

var constraints = {
    maxMessageLength : 268435455
};

function encodeRemainingLength(value) {

    if(value > constraints.maxMessageLength){
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
            assert.throws(function(){
                encodeRemainingLength(128*128*128*128);
            }, /max message length exceeded/);
        });
    });

});
