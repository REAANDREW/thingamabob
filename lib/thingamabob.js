'use strict';

var net = require('net');

function MessageFactory() {
    function parse(buffer) {
        return {
            type: 'CONNECT',
            data: buffer.toString
        };
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
    var messageFactory = new MessageFactory();

    function handleConnection(connection) {
        connection.on('data', function(data) {
            eventEmitter.emit('data', data.toString());
            console.log('data received:', data.toString());
            var msg = messageFactory.parse(data);
            localEvents.emit(msg.type, msg, connection);
            eventEmitter.emit(msg.type, msg, connection.remoteAddress, connection.remotePort);
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
            console.log('listening on', options.host, options.port);
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
        console.log('data received:', data.toString());
        //TODO: parse response message and raise appropriate event
        eventEmitter.emit('data', data.toString());
    });

    function connect(host, port, callback) {
        client.connect(port, host, function() {
            client.write('CONNECT msg here...');
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
    createClient: createClient
};
