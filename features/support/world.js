'use strict';
require('should');

function WrappedServer(options) {
    var url = require('url');
    var thingamabob = require('../../lib/thingamabob');

    var server = thingamabob.createServer(options);
    //TODO: actually wrap the server with test stuffs
    server.url = url.format({
        protocol: 'tcp',
        hostname: 'localhost',
        port: options.port,
        slashes: true
    });
    return server;
}

function WrappedClient(options) {
    var thingamabob = require('../../lib/thingamabob');

    var client = thingamabob.createClient(options);
        client.port = options.port;
        client.connect = function connect(url, callback) {
            console.log('connecting to:', url);
            callback();
        };
        client.messages = [{
            msgType: 'CONACK'
        }];
    return client;
}

function WorldConstructor() {

    this.World = function World(callback) {

        this.createClient = function CreateClient(port, callback) {
            this.Client = new WrappedClient({
                port: port,
            });
            callback();
        };

        this.createServer = function CreateServer(port, callback) {
            this.Server = new WrappedServer({
                port: port,
            });
            callback();
        };

        callback();
    };
}

module.exports = WorldConstructor;
