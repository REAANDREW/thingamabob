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

function defaultConnectMessage(){
    var message = {};
    message.type = constants.messageTypes.CONNECT;
    message.headers = {};
    message.headers.fixed = {};
    message.headers.variable = {};
    message.headers.variable.protocol = {};
    message.payload = {};
    message.payload.client = {};
    return message;
}

function parseConnectPacket(buffer) {
    var  message = defaultConnectMessage();
    message.type = (buffer.readUInt8(0) & 16) >> 4;
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
    index += 1;

    var connectFlags = parseConnectFlags(buffer, index);
    message.headers.variable.connectFlags = connectFlags;
    index += 1;

    var keepAlive = buffer.readUInt16BE(index);
    message.headers.variable.keepAlive = keepAlive;
    index += 2;

    var clientIdentifier = decodeMqttUtfString(buffer, index);
    message.payload.client.id = clientIdentifier.value;
    index += clientIdentifier.totalByteCount;

    return okResult(message);
}

var TCPPORT = 8124;

function startTCP(callback) {
    var net = require('net');

    var server = net.createServer(function(socket) {

        socket.on('data', function(chunk) {
            var message = parseConnectPacket(chunk);
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

function parseConnectFlags(buffer, offset) {
    var word = buffer.readUInt8(offset);
    var returnObj = {};
    returnObj.reserved = (word & 1) === 1;
    returnObj.cleanSession = (word & 2) === 2;
    returnObj.willFlag = (word & 4) === 4;
    returnObj.willQos = (word & 24) >> 3;
    returnObj.willRetain = (word & 32) === 32;
    returnObj.passwordFlag = (word & 64) === 64;
    returnObj.usernameFlag = (word & 128) === 128;
    return returnObj;
}

describe('Parsing CONNECT flags', function() {

    function createFlagsBuffer(word) {
        var buffer = new Buffer(1);
        buffer.writeUInt8(word, 0);
        return buffer;
    }
    it('parses true for reserved', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(1), 0);
        connectFlags.reserved.should.eql(true);
    });

    it('parses true for clean session', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(2), 0);
        connectFlags.cleanSession.should.eql(true);
    });

    it('parses true for will flag', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(4), 0);
        connectFlags.willFlag.should.eql(true);
    });

    it('parses AT_MOST_ONCE for will qos', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(0), 0);
        connectFlags.willQos.should.eql(constants.qualityOfService.AT_MOST_ONCE);
    });

    it('parses AT_LEAST_ONCE for will qos', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(8), 0);
        connectFlags.willQos.should.eql(constants.qualityOfService.AT_LEAST_ONCE);
    });

    it('parses EXACTLY_ONCE for will qos', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(16), 0);
        connectFlags.willQos.should.eql(constants.qualityOfService.EXACTLY_ONCE);
    });

    it('parses RESERVED for will qos', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(24), 0);
        connectFlags.willQos.should.eql(constants.qualityOfService.RESERVED);
    });

    it('parses true for will retain', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(32), 0);
        connectFlags.willRetain.should.eql(true);
    });

    it('parses true for password flag', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(64), 0);
        connectFlags.passwordFlag.should.eql(true);
    });

    it('parses true for username flag', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(128), 0);
        connectFlags.usernameFlag.should.eql(true);
    });

    it('parse returns defaults', function() {
        var connectFlags = parseConnectFlags(createFlagsBuffer(0), 0);
        connectFlags.should.eql({
            reserved: false,
            cleanSession: false,
            willFlag: false,
            willQos: constants.qualityOfService.AT_MOST_ONCE,
            willRetain: false,
            passwordFlag: false,
            usernameFlag: false
        });
    });
});

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
        var buffers = new Array(7);

        var self = {
            withMessageType: withMessageType,
            withRemainingLength: withRemainingLength,
            withProtocolName: withProtocolName,
            withProtocolVersion: withProtocolVersion,
            withConnectFlags: withConnectFlags,
            withKeepAlive: withKeepAlive,
            withClientIdentifier: withClientIdentifier,
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

        function withConnectFlags(flags) {
            var flagsWord = 0;
            var buffer = new Buffer(1);

            function flip(word, value, confirm) {
                if (confirm) {
                    return word | value;
                } else {
                    return word;
                }
            }
            flagsWord = flip(flagsWord, 1, flags.reserved);
            flagsWord = flip(flagsWord, 2, flags.cleanSession);
            flagsWord = flip(flagsWord, 4, flags.willFlag);
            flagsWord = (flags.willQos << 3) | flagsWord;
            flagsWord = flip(flagsWord, 32, flags.willRetain);
            flagsWord = flip(flagsWord, 64, flags.passwordFlag);
            flagsWord = flip(flagsWord, 128, flags.usernameFlag);
            buffer.writeUInt8(flagsWord, 0);
            buffers[4] = buffer;
            return self;
        }

        function withKeepAlive(value) {
            var buffer = new Buffer(2);
            buffer.writeUInt16BE(value, 0);
            buffers[5] = buffer;
            return self;
        }

        function withClientIdentifier(value) {
            var encodedValue = encodeMqttUtfString(value);
            buffers[6] = encodedValue;
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
                .withProtocolVersion(constants.protocol.version)
                .withConnectFlags({})
                .withKeepAlive(60)
                .withClientIdentifier('clientABC');
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
                .withProtocolVersion(4)
                .withConnectFlags({
                    reserved: true,
                    cleanSession: true,
                    willFlag: true,
                    willQos: constants.qualityOfService.AT_MOST_ONCE,
                    willRetain: true,
                    passwordFlag: true,
                    usernameFlag: true
                })
                .withKeepAlive(60);
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

        describe('parses the CONNECT flags', function() {
            /* There are tests that the parseConnectFlags defaults its values
             * if not set.  So only checking for truthy here.  I think this has it covered
             * */
            beforeEach(function(done) {
                var self = this;
                subject = subject;
                parseConnectMessage(subject.buffer(), function(err, message) {
                    var headers = message.headers;
                    self.connectFlags = headers.variable.connectFlags;
                    done();
                });
            });

            it('parses the reserved flag as true', function() {
                this.connectFlags.reserved.should.eql(true);
            });

            it('parses the clean session flag as true', function() {
                this.connectFlags.cleanSession.should.eql(true);
            });

            it('parses the will flag as true', function() {
                this.connectFlags.willFlag.should.eql(true);
            });

            it('parses the will qos as AT_MOST_ONCE', function() {
                subject = subject.withConnectFlags({
                    willQos: constants.qualityOfService.AT_MOST_ONCE
                });
                this.connectFlags.willQos.should.eql(constants.qualityOfService.AT_MOST_ONCE);
            });

            it('parses the will qos as AT_LEAST_ONCE', function(done) {
                subject = subject.withConnectFlags({
                    willQos: constants.qualityOfService.AT_LEAST_ONCE
                });
                parseConnectMessage(subject.buffer(), function(err, message) {
                    var headers = message.headers;
                    var connectFlags = headers.variable.connectFlags;
                    connectFlags.willQos.should.eql(constants.qualityOfService.AT_LEAST_ONCE);
                    done();
                });
            });

            it('parses the will qos as EXACTLY_ONCE', function(done) {
                subject = subject.withConnectFlags({
                    willQos: constants.qualityOfService.EXACTLY_ONCE
                });
                parseConnectMessage(subject.buffer(), function(err, message) {
                    var headers = message.headers;
                    var connectFlags = headers.variable.connectFlags;
                    connectFlags.willQos.should.eql(constants.qualityOfService.EXACTLY_ONCE);
                    done();
                });
            });

            it('parses the will qos as RESERVED', function(done) {
                subject = subject.withConnectFlags({
                    willQos: constants.qualityOfService.RESERVED
                });
                parseConnectMessage(subject.buffer(), function(err, message) {
                    var headers = message.headers;
                    var connectFlags = headers.variable.connectFlags;
                    connectFlags.willQos.should.eql(constants.qualityOfService.RESERVED);
                    done();
                });
            });

            it('parses the will retain as true', function() {
                this.connectFlags.willRetain.should.eql(true);
            });

            it('parses the password flag as true', function() {
                this.connectFlags.passwordFlag.should.eql(true);
            });

            it('parses the username flag as true', function() {
                this.connectFlags.usernameFlag.should.eql(true);
            });
        });

        it('parses the keep alive', function(done) {
            parseConnectMessage(subject.buffer(), function(err, message) {
                var headers = message.headers;
                headers.variable.keepAlive.should.eql(60);
                done();
            });
        });
    });

    describe('parsing the client identifier', function() {

        it('parses', function(done) {
            var expectedIdentifier = 'someIdentifier';
            subject = subject.withClientIdentifier(expectedIdentifier);

            parseConnectMessage(subject.buffer(), function(err, message) {
                message.payload.client.id.should.eql(expectedIdentifier);
                done();
            });
        });

    });

});
