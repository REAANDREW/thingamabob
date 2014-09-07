'use strict';

var net = require('net');

function MessageFactory(options) {

    var _ = require('lodash');
    var constants = require('../lib/constants');
    options = options || {};
    if (!options.parsers) {
        options.parsers = require('./packets').parsers;
    }

    function parseMessageType(inputBuffer) {
        var firstByte = inputBuffer.readUInt8(0);
        var fourBitTransformation = ((firstByte & 0xf0) >> 4);
        return fourBitTransformation;
    }

    function parse(buffer, callback) {
        var code = parseMessageType(buffer);
        //TODO: should probably check if the code is 0 or 15 and do the
        //      Reserved Control Packet Type error
        //      This would then make the next error handler be for a value
        //      outside the allowed range i.e <0 OR >15
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
    var packets = require('./packets');
    var eventEmitter = new events.EventEmitter();
    var localEvents = new events.EventEmitter();
    var messageFactory = options.messageFactory || new MessageFactory();

    function handleConnection(connection) {
        connection.on('data', function(data) {
            eventEmitter.emit('data', data.toString());
            console.log('SERVER => data received:', data);
            messageFactory.parse(data, function(error, msg) {
                localEvents.emit(msg.payload.typeName, msg, connection);
                eventEmitter.emit(msg.payload.typeName, msg, connection.remoteAddress, connection.remotePort);
            });
        });
    }

    localEvents.on('CONNECT', function(msg, connection) {
        connection.write(packets.connack.message().buffer(), 'UTF-8', function(){
            console.log('CONNACK sent');
        });
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

function ThingamabobClient(options) {

    var client = new net.Socket();
    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    var messageFactory = options.messageFactory || new MessageFactory();

    client.on('error', console.error);

    client.on('data', function(data) {
        console.log('CLIENT => data received:', data);
        messageFactory.parse(data, function(error, msg) {
            eventEmitter.emit(msg.payload.typeName, msg);
        });
        eventEmitter.emit('data', data);
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
