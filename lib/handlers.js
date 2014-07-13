'use strict';

var parsers = require('./parsers');
var constants = require('./constants');

function ConnectMessageHandler() {

  var connectMessageParser = new parsers.ConnectMessageParser();

  function handle(args) {
    var data = args.data;
    var connection = args.connection;
    var message = connectMessageParser.parse(data);

    if (message.variableHeader.protocolName !== constants.PROTOCOL_NAME) {
      connection.end();
    } else {
      var input = new Buffer(9);
      input.writeUInt8(1 | 32, 0);
      input.writeUInt8(2, 1);
      connection.write(input);
    }
  }

  return Object.freeze({
    handle: handle
  });
}

module.exports = {
  ConnectMessageHandler : ConnectMessageHandler
};
