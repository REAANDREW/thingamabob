var assert = require('assert');

function encodeRemainingLength(value) {

    var buffer = new Buffer(0);
    do {
        var digit = value % 128;
        value = parseInt(value / 128);
        if (value > 0) {
            digit = digit | 0x80;
        }
        var next = new Buffer(1);
        console.log('writing ', digit);
        next.writeUInt8(digit, 0);
        buffer = Buffer.concat([buffer, next])
    }
    while (value > 0);
    return buffer;
}

describe('MQTT Special Functions', function() {

    describe('Encoding remaining length', function() {
        it('encoding 128 returns a 1 byte Buffer', function() {
            var input = 127;
            var result = encodeRemainingLength(input);
            assert.equal(result.length, 1);
            assert.equal(result.readUInt8(0), 127);
        });
    });

});
