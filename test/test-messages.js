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
}

function parseRemainingLength(buffer) {
    var bytes = services.remainingLength.readBytes(buffer);
    return services.remainingLength.decode(bytes);
}

function okResult(payload) {
    return {
        statusCode: 0,
        statusMessage: 'OK',
        payload: payload
    }
}


function parse(buffer) {
    var message = {};
    message.type = (buffer.readUInt8(0) & 16) >> 4;
    message.headers = {};
    message.headers.fixed = {};
    var remainingLengthResult = parseRemainingLength(buffer);
    if (remainingLengthResult instanceof Error) {
        return errorCodes.connect.malformedRemainingLength;
    }
    message.headers.fixed.remainingLength = remainingLengthResult;
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
        var data = JSON.parse(data.toString());
        if (data.statusCode != 0) {
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
        var buffers = new Array(2);

        var self = {
            withMessageType: withMessageType,
            withRemainingLength: withRemainingLength,
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

        function buffer() {
            var messageBuffer = new Buffer(0);
            for(var index = 0; index < buffers.length; index++){
                messageBuffer = Buffer.concat([messageBuffer, buffers[index]]);
            }
            return messageBuffer;
        }

        (function initialize() {
            withMessageType(constants.messageTypes.CONNECT)
                .withRemainingLength(services.remainingLength.upperLimit(1));
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
            parseConnectMessage(buffer, function(err, message) {
                should.exist(err);
                err.should.eql(errorCodes.connect.malformedRemainingLength)
            });
        });

    });

});
