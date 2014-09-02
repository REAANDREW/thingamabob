'use strict';

var connect = require('./connect');
var parsers = {
    'CONNECT': connect
};

module.exports = {
    connect : connect,
    parsers : parsers
};
