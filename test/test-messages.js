'use strict';

var assert = require('assert');
var types = require('../lib/types');
var constants = require('../lib/constants');

var shared = {
  behavesLikeMqttMessage: function(messageType) {
    it('has protocol version set', function() {
      var headers = this.message.headers;
      var variableHeader = headers.variable;
      assert.equal(variableHeader.protocol.version, constants.protocol.version);
    });

    it('has protocol name set', function() {
      var headers = this.message.headers;
      var variableHeader = headers.variable;
      assert.equal(variableHeader.protocol.name, constants.protocol.name);
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
    var headers = this.message.headers;
    this.variableHeader = headers.variable;
    this.connectFlags = this.variableHeader.connectFlags;
  });

  describe('defaults', function() {

    it('the keepalive to 60 seconds', function() {
      assert.equal(this.variableHeader.keepAlive, 60);
    });

    it('the clean session to 0', function() {
      assert.equal(this.connectFlags.cleanSession, 0);
    });

    it('the will flag to 0', function() {
      assert.equal(this.connectFlags.will, 0);
    });

    it('the will qos to 0', function(){
      assert.equal(this.connectFlags.willQos, 0);
    });

    it('the will retain to 0', function(){
      assert.equal(this.connectFlags.willRetain, 0);
    });

    shared.behavesLikeMqttMessage(constants.messageTypes.CONNECT);
  });

});
