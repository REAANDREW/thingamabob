'use strict';

function Specs() {
    //console.log('After:', this.World);

    this.Given(/^I am a thingamabob client on port (\d*)$/, function(port, callback) {
        this.createClient(port, callback);
    });

    this.Given(/^a thingamabob server on port (\d*)$/, function(port, callback) {
        this.createServer(port, callback);
    });

    this.When(/^I send a CONNECT message$/, function(callback) {
        this.Client.connect(this.Server.host, this.Server.port, callback);
    });

    this.Then(/^I receive a CONACK reply$/, function(callback) {
        var client = this.Client;
        setTimeout(function() {
            client.messages.should.have.lengthOf(1);
            client.messages[0].msgType.should.eql('CONACK');
            callback();
        }, 50);
    });
}


module.exports = Specs;
