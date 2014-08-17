'use strict';

var assert = require('assert');
var constants = require('../lib/constants');
var services = require('../lib/services');

function parseRemainingLength(buffer) {
    var bytes = services.remainingLength.readBytes(buffer);
    return services.remainingLength.decode(bytes);
}


function parse(buffer) {
    var message = {};
    message.type = (buffer.readUInt8(0) & 16) >> 4;
    message.headers = {};
    message.headers.fixed = {};
    message.headers.fixed.remainingLength = parseRemainingLength(buffer);
    return message;
}

var TCPPORT = 8124;

function startTCP(callback) {
    var net = require('net');

    var server = net.createServer(function(socket) {

        console.log("Connection from " + socket.remoteAddress);
        socket.on('data', function(chunk) {
            var message = parse(chunk);
            socket.write(new Buffer(JSON.stringify(message)));
        });

    });

    server.listen(TCPPORT, "localhost", callback);
    return server;
}

function parseProxy(buffer, callback) {
    var net = require('net');
    var client = net.connect({
            port: TCPPORT
        },
        function() {
            console.log('client connected');
            client.write(buffer);
        });
    client.on('data', function(data) {
        console.log(data.toString());
        callback(null, JSON.parse(data.toString()));
        client.end();
    });
}

function parseConnectMessage(buffer, callback) {
    parseProxy(buffer, callback);
}

describe('Parsing a Connect Message', function() {

    function message() {
        var messageBuffer = new Buffer(0);

        function add(buffer) {
            messageBuffer = Buffer.concat([messageBuffer, buffer]);
        }

        return {
            withMessageType: function(type) {
                var buffer = new Buffer(1);
                buffer.writeUInt8(type << 4, 0);
                add(buffer);
                return this;
            },
            withRemainingLength: function(value) {
                var buffer = new Buffer(services.remainingLength.encode(value));
                add(buffer);
                return this;
            },
            buffer: function() {
                return messageBuffer;
            }
        };
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
            assert.equal(message.type, constants.messageTypes.CONNECT);
            done();
        });
    });

    describe('parsing the remaining length', function() {

        function assertRemainingLength(number) {
            var remainingLength = services.remainingLength.upperLimit(number);
            var buffer = subject.withRemainingLength(remainingLength).buffer();
            parseConnectMessage(buffer, function(err, message) {
                var headers = message.headers;
                assert.equal(headers.fixed.remainingLength, remainingLength);
            });
        }
        var lengths = [1, 2, 3, 4];

        lengths.map(function(length) {
            it('parses when the remaining length is the ' + length + ' byte upper limit', function() {
                assertRemainingLength(length);
            });
        });

        it('goes BOOM when the remaining length is 5 or more bytes');

    });

});
