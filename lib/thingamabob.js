'use strict';

var net = require('net');

function MessageFactory(options) {

    var _ = require('lodash');
    var constants = require('../lib/constants');

    function parseMessageType(inputBuffer) {
        var firstByte = inputBuffer.readUInt8(0);
        var fourBitTransformation = ((firstByte & 0xf0) >> 4);
        return fourBitTransformation;
    }

    function parse(buffer, callback) {
        var code = parseMessageType(buffer);
        var type = _.findKey(constants.messageTypes, function(val) {
            return val === code;
        });
        if (type === undefined) {
            callback(new Error('Reserved Control Packet Type', code), null);
            return;
        }
        var parser = options.parsers[type];
        if (parser === undefined) {
            callback(new Error('No parser for type', code, type), null);
            return;
        }

        callback(null, parser.parsePacket(buffer));
    }

    return Object.freeze({
        parse: parse
    });
}

function ThingamabobServer(options) {
    var server;
    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    var localEvents = new events.EventEmitter();
    var messageFactory;
    if (options.messageFactory) {
        messageFactory = options.messageFactory;
    } else {
        var parsers = require('./packets').parsers;
        messageFactory = new MessageFactory({
            parsers: parsers
        });
    }

    function handleConnection(connection) {
        connection.on('data', function(data) {
            eventEmitter.emit('data', data.toString());
            console.log('SERVER => data received:', data);
            messageFactory.parse(data, function(error, msg) {
                console.log('parsed:', error, msg);
                localEvents.emit(msg.payload.typeName, msg, connection);
                eventEmitter.emit(msg.payload.typeName, msg, connection.remoteAddress, connection.remotePort);
            });
        });
    }

    localEvents.on('CONNECT', function(msg, connection) {
        connection.write(JSON.stringify({
            msgType: 'CONACK'
        }));
    });

    function listen(callback) {
        server = net.createServer(handleConnection);
        server.listen(options.port, options.host, function() {
            console.log('SERVER => listening on', options.host, options.port);
            callback();
        });
    }

    function close(callback) {
        server.close(callback);
    }

    return Object.freeze({
        on: function(eventName, delegate) {
            eventEmitter.on(eventName, delegate);
        },
        listen: listen,
        close: close
    });

}

function ThingamabobClient() {

    var client = new net.Socket();
    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    client.on('error', console.error);

    client.on('data', function(data) {
        console.log('CLIENT => data received:', data.toString());
        //TODO: parse response message and raise appropriate event
        eventEmitter.emit('data', data.toString());
    });

    function connect(host, port, callback) {
        var packets = require('./packets');
        client.connect(port, host, function() {
            client.write(packets.connect.message().buffer());
            callback();
        });
    }

    function close(callback) {
        client.destroy();
        callback();
    }

    return Object.freeze({
        on: function(eventName, delegate) {
            eventEmitter.on(eventName, delegate);
        },
        connect: connect,
        close: close
    });

}

function createServer(options) {
    return new ThingamabobServer(options);
}

function createClient(options) {
    return new ThingamabobClient(options);
}

module.exports = {
    createServer: createServer,
    createClient: createClient,
    MessageFactory: MessageFactory
};
