'use strict';
require('should');

function WrappedServer(options) {
    var thingamabob = require('../../lib/thingamabob');

    var self = {};

    var server = thingamabob.createServer(options);

    self.listen = function(callback) {
        return server.listen(callback);
    };
    self.close = function(callback) {
        return server.close(callback);
    };

    //TODO: actually wrap the server with test stuffs
    self.host = '127.0.0.1';
    self.port = options.port;

    return Object.freeze(self);
}

function WrappedClient(options) {
    var thingamabob = require('../../lib/thingamabob');

    var self = {};

    var client = thingamabob.createClient(options);
    self.connect = function(host, port, callback) {
        console.log('connecting to:', host, port);
        return client.connect(host, port, function(){
            console.log('connected');
            callback();
        });
    };
    self.messages = [{
        msgType: 'CONACK'
    }];
    return self;
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
                host: '127.0.0.1',
                port: port,
            });
            this.Server.listen(callback);
        };

        callback();
    };
}

module.exports = WorldConstructor;
