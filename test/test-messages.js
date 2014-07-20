'use strict';

var assert = require('assert');
var types = require('../lib/types');

describe('Connect Message', function(){

    it('defaults the keepalive to 1 minute', function(){
        var message = new types.ConnectMessage();
        assert.equal(message.keepAlive, 60);
    });

});
