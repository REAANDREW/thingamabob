'use strict';

var net = require('net');

var constants = require('./constants');
var handlers = require('./handlers');
var parsers = require('./parsers');

var messageTypes = constants.messageTypes;

function ThingamabobServer(options) {

  var connectionTimeout = options.connectionTimeout;
  var fixedHeaderParser = new parsers.FixedHeaderParser();
  var handlerMappings = {};
  var server;

  (function initialize() {
    handlerMappings[messageTypes.CONNECT] = new handlers.ConnectMessageHandler();
  })();

  function handleConnection(connection) {
    var t = setTimeout(function() {
      connection.end();
    }, connectionTimeout);
    connection.on('data', function(data) {
      clearTimeout(t);
      var fixedHeader = fixedHeaderParser.parse(data);
      var args = {
        connection: connection,
        data: data,
        fixedHeader: fixedHeader
      };
      var handler = handlerMappings[fixedHeader.messageType];
      if (handler === null || handler === undefined) {
        connection.end();
      } else {
        handler.handle(args);
      }
    });
  }

  function listen(host, port, callback) {
    server = net.createServer(handleConnection);
    server.listen(port, host, callback);
  }

  function close(callback) {
    server.close(callback);
  }

  return Object.freeze({
    listen: listen,
    close: close
  });

}

function createServer(options) {
  return new ThingamabobServer(options);
}

module.exports = {
  createServer: createServer
};
