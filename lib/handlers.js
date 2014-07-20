'use strict';

var parsers = require('./parsers');
var constants = require('./constants');
var types = require('./types');
var events = require('events');

var INVALID_PROTOCOL_NAME = 'invalid_protocol_name';
var INVALID_PROTOCOL_LEVEL = 'invalid_protocol_level';
var RESERVE_FLAG_SET = 'reserve_flag_set';
var MESSAGE = 'message';

function Process(eventEmitter, delegate, eventName) {
  function invoke(message, connection) {
    var result = delegate(message);
    if (!result) {
      eventEmitter.emit(eventName, message, connection);
    }
    return result;
  }

  return Object.freeze({
    invoke: invoke
  });
}

function ConnectMessageProcessor() {

  var eventEmitter;
  var processes = [];

  (function initialize() {
    eventEmitter = new events.EventEmitter();
    processes.push(new Process(eventEmitter, checkProtocolName, INVALID_PROTOCOL_NAME));
    processes.push(new Process(eventEmitter, checkReserveFlag, RESERVE_FLAG_SET));
    processes.push(new Process(eventEmitter, checkProtocolLevel, INVALID_PROTOCOL_LEVEL));
  })();

  function checkProtocolName(message) {
    return message.protocolName === constants.PROTOCOL_NAME;
  }

  function checkReserveFlag(message) {
    return !message.connectFlags.reserved;
  }

  function checkProtocolLevel(message) {
    return message.protocolLevel === constants.PROTOCOL_VERSION;
  }

  function processMessage(message, connection) {
    for (var i = 0; i < processes.length; i++) {
      var currentProcess = processes[i];
      if (!currentProcess.invoke(message, connection)) {
        return;
      }
    }
    eventEmitter.emit('message', message, connection);
  }

  return Object.freeze({
    on: function(eventName, delegate) {
      eventEmitter.on(eventName, delegate);
    },
    process: processMessage
  });

}

function ConnectMessageHandler() {

  var connectMessageParser = new parsers.ConnectMessageParser();
  var connectMessageProcessor = new ConnectMessageProcessor();

  connectMessageProcessor.on(INVALID_PROTOCOL_NAME,
    function handleInvalidProtocolName(message, connection) {
      connection.end();
    });

  connectMessageProcessor.on(INVALID_PROTOCOL_LEVEL,
    function handleInvalidProtocolLevel(message, connection) {
      var connAck = new types.ConnAckMessage({
        sessionPresent: false,
        returnCode: constants.returnCodes.UNACCEPTABLE_PROTOCOL_LEVEL
      });
      connection.write(connAck.toBuffer());
    });

  connectMessageProcessor.on(RESERVE_FLAG_SET,
    function handleReserveFlagSet(message, connection) {
      connection.end();
    });

  connectMessageProcessor.on(MESSAGE,
    function handleValidMessage(message, connection) {
      var connAck = new types.ConnAckMessage({
        sessionPresent: false,
        returnCode: constants.returnCodes.CONNECTION_ACCEPTED
      });
      connection.write(connAck.toBuffer());
    });

  function handle(data, connection) {
    var message = connectMessageParser.parse(data);
    connectMessageProcessor.process(message, connection);
  }

  return Object.freeze({
    handle: handle
  });
}

module.exports = {
  ConnectMessageHandler: ConnectMessageHandler
};
