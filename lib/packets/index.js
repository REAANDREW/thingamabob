'use strict';

var connect = require('./connect');
var connack = require('./connack');
var parsers = {
    'CONNECT': connect,
    'CONNACK': connack
};

module.exports = {
    connect: connect,
    connack: connack,
    parsers: parsers
};
