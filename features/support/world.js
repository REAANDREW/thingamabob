'use strict';

function WorldConstructor() {
    var url = require('url');

    this.World = function World(callback) {

        this.createClient = function CreateClient(port, callback) {
            this.Client = Object.freeze({
                port: port,
                connect: function(url, callback) {
                    console.log('connecting to:', url);
                    callback();
                }
            });
            callback();
        };

        this.createServer = function CreateServer(port, callback) {
            this.Server = Object.freeze({
                port: port,
                url: url.format({
                    protocol: 'tcp',
                    hostname: 'localhost',
                    port: port,
                    slashes: true
                })
            });
            callback();
        };

        callback();
    };
}

module.exports = WorldConstructor;
