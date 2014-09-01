'use strict';

var net = require('net');

function ThingamabobServer(options) {
    var server;

    function handleConnection(connection) {
        connection.on('data', function(data) {
            console.log('data received:', data.toString());
            connection.write(JSON.stringify({
                msgType: 'CONACK'
            }));
        });
    }

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
        eventEmitter.emit('data', data);
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
