'use strict';

var should = require('should');
var constants = require('../lib/constants');
var services = require('../lib/services');
var packets = require('../lib/packets');

var TCPPORT = 8124;

function startTCP(callback) {
    var net = require('net');
    var connect = packets.connect;

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
    var connect = packets.connect;

    var subject, tcpServer;

    before(function(done) {
        tcpServer = startTCP(done);
    });

    after(function(done) {
        tcpServer.close(done);
    });

    beforeEach(function() {
        subject = connect.message()
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

describe('Parsing a ConnAck Message', function() {
    var connect = packets.connack;

    var subject;

    beforeEach(function() {
        subject = connect.message()
            .withMessageType(constants.messageTypes.CONNACK);
    });

    it('parses the message type', function() {
        var message = connect.parsePacket(subject.buffer());
        message.payload.type.should.eql(constants.messageTypes.CONNACK);
    });

    describe.skip('parsing the remaining length', function() {
        function assertRemainingLength(number) {
            var remainingLength = services.remainingLength.upperLimit(number);
            console.log('remainingLength', remainingLength.toString(2));
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

    describe.skip('parsing the variable header', function() {
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
});
