'use strict';

var should = require('should');
var constants = require('../lib/constants');
var services = require('../lib/services');

var errorCodes = {
    connect: {
        malformedRemainingLength: {
            statusCode: 1,
            statusMessage: 'the remaining length should be between 1 and 4 bytes long inclusive'
        }
    }
};

function parseRemainingLength(buffer) {
    var bytes = services.remainingLength.readBytes(buffer);
    return services.remainingLength.decode(bytes);
}

function okResult(payload) {
    return {
        statusCode: 0,
        statusMessage: 'OK',
        payload: payload
    };
}

function parse(buffer) {
    var message = {};
    message.type = (buffer.readUInt8(0) & 16) >> 4;
    message.headers = {};
    message.headers.fixed = {};
    message.headers.variable = {};
    message.headers.variable.protocol = {};
    var remainingLengthResult = parseRemainingLength(buffer);
    if (remainingLengthResult instanceof Error) {
        return errorCodes.connect.malformedRemainingLength;
    }
    message.headers.fixed.remainingLength = remainingLengthResult;

    var index = 1 + services.remainingLength.byteCount(remainingLengthResult);
    var protocolName = decodeMqttUtfString(buffer, index);
    message.headers.variable.protocol.name = protocolName.value;
    index += protocolName.totalByteCount;
    
    var protocolVersion = buffer.readUInt8(index);
    message.headers.variable.protocol.version = protocolVersion;

    return okResult(message);
}

var TCPPORT = 8124;

function startTCP(callback) {
    var net = require('net');

    var server = net.createServer(function(socket) {

        socket.on('data', function(chunk) {
            var message = parse(chunk);
            socket.write(new Buffer(JSON.stringify(message)));
        });

    });

    server.listen(TCPPORT, 'localhost', callback);
    return server;
}

function parseProxy(buffer, callback) {
    var net = require('net');
    var client = net.connect({
            port: TCPPORT
        },
        function() {
            client.write(buffer);
        });
    client.on('data', function(data) {
        data = JSON.parse(data.toString());
        if (data.statusCode !== 0) {
            callback(data, null);
        } else {
            callback(null, data.payload);
        }
        client.end();
    });
}

function parseConnectMessage(buffer, callback) {
    parseProxy(buffer, callback);
}

function decodeMqttUtfString(buffer, offset) {
    var length = buffer.readUInt16BE(offset);
    var start = offset + 2;
    var end = start + length;
    return {
        value: buffer.toString('utf8', start, end),
        byteCount: length,
        totalByteCount: length + 2
    };
}

function encodeMqttUtfString(value) {
    var utf8Buffer = new Buffer(value, 'utf8');
    var lengthBuffer = new Buffer(2);
    lengthBuffer.writeUInt16BE(utf8Buffer.length, 0);
    return Buffer.concat([lengthBuffer, utf8Buffer]);
}

describe('MQTT UTF-8 string', function() {

    it('decoding', function() {
        var utf8Char = [0xE2, 0x82, 0xAC];
        var euro = new Buffer(utf8Char);
        var sizeBuffer = new Buffer(2);
        sizeBuffer.writeUInt16BE(utf8Char.length, 0);
        var mqttUtfBuffer = Buffer.concat([sizeBuffer, new Buffer(utf8Char)]);

        var result = decodeMqttUtfString(mqttUtfBuffer, 0);
        result.value.should.eql(euro.toString('utf8'));
        result.byteCount.should.eql(3);
        result.totalByteCount.should.eql(5);
    });

    it('encoding', function() {
        var utf8Char = [0xE2, 0x82, 0xAC];
        var mqttEncodedStringBuffer = encodeMqttUtfString(new Buffer(utf8Char).toString('utf8'));
        mqttEncodedStringBuffer.readUInt16BE(0).should.eql(3);
        mqttEncodedStringBuffer[2].should.eql(utf8Char[0]);
        mqttEncodedStringBuffer[3].should.eql(utf8Char[1]);
        mqttEncodedStringBuffer[4].should.eql(utf8Char[2]);
    });

});

describe('Parsing a Connect Message', function() {

    function message() {
        var buffers = new Array(4);

        var self = {
            withMessageType: withMessageType,
            withRemainingLength: withRemainingLength,
            withProtocolName: withProtocolName,
            withProtocolVersion: withProtocolVersion,
            buffer: buffer
        };

        function withMessageType(type) {
            var buffer = new Buffer(1);
            buffer.writeUInt8(type << 4, 0);
            buffers[0] = buffer;
            return self;
        }

        function withRemainingLength(value) {
            var buffer = new Buffer(services.remainingLength.encode(value));
            buffers[1] = buffer;
            return self;
        }

        function withProtocolName(value) {
            var encodedValue = encodeMqttUtfString(value);
            buffers[2] = encodedValue;
            return self;
        }

        function withProtocolVersion(value) {
            var buffer = new Buffer(1);
            buffer.writeUInt8(value, 0);
            buffers[3] = buffer;
            return self;
        }

        function buffer() {
            var messageBuffer = new Buffer(0);
            for (var index = 0; index < buffers.length; index++) {
                messageBuffer = Buffer.concat([messageBuffer, buffers[index]]);
            }
            return messageBuffer;
        }

        (function initialize() {
            withMessageType(constants.messageTypes.CONNECT)
                .withRemainingLength(services.remainingLength.upperLimit(1))
                .withProtocolName(constants.protocol.name)
                .withProtocolVersion(constants.protocol.version);
        })();

        return self;
    }

    var subject, tcpServer;

    before(function(done) {
        tcpServer = startTCP(done);
    });

    after(function(done) {
        tcpServer.close(done);
    });

    beforeEach(function() {
        subject = message()
            .withMessageType(constants.messageTypes.CONNECT);
    });

    it('parses the message type', function(done) {
        parseConnectMessage(subject.buffer(), function(err, message) {
            message.type.should.eql(constants.messageTypes.CONNECT);
            done();
        });
    });

    describe('parsing the remaining length', function() {
        function assertRemainingLength(number) {
            var remainingLength = services.remainingLength.upperLimit(number);
            var buffer = subject.withRemainingLength(remainingLength).buffer();
            parseConnectMessage(buffer, function(err, message) {
                var headers = message.headers;
                headers.fixed.remainingLength.should.eql(remainingLength);
            });
        }

        var lengths = [1, 2, 3, 4];

        lengths.map(function(length) {
            it('parses when the remaining length is the ' + length + ' byte upper limit', function() {
                assertRemainingLength(length);
            });
        });

        it('return malformedRemainingLength code when the remaining length is 5 or more bytes', function() {
            var remainingLength = services.remainingLength.upperLimit(5);
            var buffer = subject.withRemainingLength(remainingLength).buffer();
            parseConnectMessage(buffer, function(err) {
                should.exist(err);
                err.should.eql(errorCodes.connect.malformedRemainingLength);
            });
        });
    });

    describe('parsing the variable header', function() {

        beforeEach(function() {
            subject = subject.withProtocolName('MQTT')
                .withProtocolVersion(4);
        });

        it('parses the protocol name', function(done) {
            parseConnectMessage(subject.buffer(), function(err, message) {
                var headers = message.headers;
                headers.variable.protocol.name.should.eql(constants.protocol.name);
                done();
            });
        });

        it('parses the protocol version', function(done) {
            parseConnectMessage(subject.buffer(), function(err, message) {
                var headers = message.headers;
                headers.variable.protocol.version.should.eql(constants.protocol.version);
                done();
            });
        });
    });

});
