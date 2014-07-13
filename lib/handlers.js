'use strict';

var parsers = require('./parsers');
var constants = require('./constants');
var types = require('./types');

function ConnectMessageHandler() {

  var connectMessageParser = new parsers.ConnectMessageParser();

  function handle(args) {
    var data = args.data;
    var connection = args.connection;
    var message = connectMessageParser.parse(data);

    if (message.variableHeader.protocolName !== constants.PROTOCOL_NAME) {
      connection.end();
    } else {
      var connAck = new types.ConnAckMessage({
        returnCode : constants.returnCodes.CONNECTION_ACCEPTED
      });
      connection.write(connAck.toBuffer());
    }
  }

  return Object.freeze({
    handle: handle
  });
}

module.exports = {
  ConnectMessageHandler : ConnectMessageHandler
};
