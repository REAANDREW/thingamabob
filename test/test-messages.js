'use strict';

var assert = require('assert');
var types = require('../lib/types');
var constants = require('../lib/constants');

var shared = {
  behavesLikeMqttMessage: function(messageType) {
    it('has protocol version set', function() {
      var headers = this.message.headers;
      var variableHeader = headers.variable;
      assert.equal(variableHeader.protocolVersion, constants.PROTOCOL_VERSION);
    });

    it('has message type set', function() {
      var headers = this.message.headers;
      assert.equal(headers.fixed.messageType, messageType);
    });
  }
}

describe('Connect Message', function() {

  before(function() {
    this.message = new types.ConnectMessage();
  });

  it('defaults the keepalive to 1 minute', function() {
    var headers = this.message.headers;
    var variableHeader = headers.variable;
    assert.equal(variableHeader.keepAlive, 60);
  });

  shared.behavesLikeMqttMessage(constants.messageTypes.CONNECT);

});
