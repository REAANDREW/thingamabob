'use strict';

module.exports = {
    remainingLength: {
        encode: encodeRemainingLength,
        decode: decodeRemainingLength,
        byteCount: remainingLengthByteCount,
        upperLimit: upperLimit,
        readBytes: readBytes
    }
};

function readBytes(buffer) {
    var index = 0;
    var bytes = [];
    var current;
    while (index < 4 &&
        index < buffer.length - 1 &&
        (current = buffer.readUInt8(index + 1)) & 128 === 128) {
        index++;
        bytes.push(current);
    }
    return new Buffer(bytes);
}

function upperLimit(byteCount) {
    return Math.pow(128, byteCount) - 1;
}

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

function dispatch( /* multiple arguments */ ) {
    var funcs = arguments;
    return function(target) {
        for (var i = 0; i < funcs.length; i++) {
            var func = funcs[i];
            var ret = func.apply(null, [target]);
            if (existy(ret)) {
                return ret;
            }
        }
        return undefined;
    };
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
                digit = digit | 128;
            }

            var next = new Buffer(1);
            next.writeUInt8(digit, 0);
            buffer = Buffer.concat([buffer, next]);
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
        if (index === buffer.length) {
            return Error('malformed remaining length');
        }
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
