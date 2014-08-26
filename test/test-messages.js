'use strict';

var should = require('should');
var constants = require('../lib/constants');
var services = require('../lib/services');
var packets = require('../lib/packets');
var connect = packets.connect;

var TCPPORT = 8124;

function startTCP(callback) {
    var net = require('net');

    var server = net.createServer(function(socket) {

        socket.on('data', function(chunk) {
            var message = connect.parsePacket(chunk);
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

describe('Parsing a Connect Message', function() {

    function message() {
        var buffers = new Array(7);
        var payloadBuffers = [
            new Buffer(0),
            new Buffer(0),
            new Buffer(0),
            new Buffer(0)
        ];
        var connectFlags;

        var self = {
            withMessageType: withMessageType,
            withRemainingLength: withRemainingLength,
            withProtocolName: withProtocolName,
            withProtocolVersion: withProtocolVersion,
            withConnectFlags: withConnectFlags,
            withKeepAlive: withKeepAlive,
            withClientIdentifier: withClientIdentifier,
            withWillTopic: withWillTopic,
            withWillMessage: withWillMessage,
            withUsername: withUsername,
            withPassword: withPassword,
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
            var encodedValue = services.strings.encode(value);
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
            connectFlags = flags;
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
            var encodedValue = services.strings.encode(value);
            buffers[6] = encodedValue;
            return self;
        }

        function withWillTopic(value) {
            var encodedValue = services.strings.encode(value);
            payloadBuffers[0] = encodedValue;
            return self;
        }

        function withWillMessage(value) {
            var encodedValue = services.strings.encode(value);
            payloadBuffers[1] = encodedValue;
            return self;
        }

        function withUsername(value) {
            var encodedValue = services.strings.encode(value);
            payloadBuffers[2] = encodedValue;
            return self;
        }

        function withPassword(value) {
            var encodedValue = services.strings.encode(value);
            payloadBuffers[3] = encodedValue;
            return self;
        }

        function buffer() {
            // jshint maxcomplexity:5
            var index;
            var messageBuffer = new Buffer(0);
            for (index = 0; index < buffers.length; index++) {
                messageBuffer = Buffer.concat([messageBuffer, buffers[index]]);
            }

            if (connectFlags.willFlag) {
                messageBuffer = Buffer.concat([messageBuffer, payloadBuffers[0], payloadBuffers[1]]);
            }

            if (connectFlags.usernameFlag) {
                messageBuffer = Buffer.concat([messageBuffer, payloadBuffers[2]]);
            }

            if (connectFlags.passwordFlag) {
                messageBuffer = Buffer.concat([messageBuffer, payloadBuffers[3]]);
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
                .withClientIdentifier('clientABC')
                .withWillTopic('topicABC')
                .withWillMessage('messageABC')
                .withUsername('')
                .withPassword('');
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
                err.should.eql(constants.errorCodes.connect.malformedRemainingLength);
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

    describe('parsing the will', function() {

        var expectedTopic, expectedMessage;

        beforeEach(function() {
            expectedTopic = 'someTopic';
            expectedMessage = 'someMessage';
            subject = subject.withConnectFlags({
                willFlag: true
            }).withWillTopic(expectedTopic)
                .withWillMessage(expectedMessage);
        });

        it('parses the will topic', function(done) {
            parseConnectMessage(subject.buffer(), function(err, message) {
                message.payload.will.topic.should.eql(expectedTopic);
                done();
            });
        });

        it('parses the will message', function(done) {
            parseConnectMessage(subject.buffer(), function(err, message) {
                message.payload.will.message.should.eql(expectedMessage);
                done();
            });
        });
    });

    describe('parsing the username', function() {

        it('parses', function(done) {
            var expectedUsername = 'foobar';

            subject = subject.withConnectFlags({
                usernameFlag: true
            }).withUsername(expectedUsername);

            parseConnectMessage(subject.buffer(), function(err, message) {
                message.payload.username.should.eql(expectedUsername);
                done();
            });
        });

    });

    describe('parsing the password', function() {

        it('parses', function(done) {
            var expectedPassword = 'barfoo';

            subject = subject.withConnectFlags({
                passwordFlag: true
            }).withPassword(expectedPassword);

            parseConnectMessage(subject.buffer(), function(err, message) {
                message.payload.password.should.eql(expectedPassword);
                done();
            });
        });
    });

});
