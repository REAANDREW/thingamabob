'use strict';

function Specs() {
    //console.log('After:', this.World);

    this.Given(/^I am a thingamabob client on port (\d*)$/, function(port, callback) {
        // Write code here that turns the phrase above into concrete actions
        this.createClient(port, callback);
    });

    this.Given(/^a thingamabob server on port (\d*)$/, function(port, callback) {
        // Write code here that turns the phrase above into concrete actions
        this.createServer(port, callback);
    });

    this.When(/^I send a CONNECT message$/, function(callback) {
        // Write code here that turns the phrase above into concrete actions
        console.log('client:', this.Client);
        console.log('server:', this.Server);
        this.Client.connect(this.Server.url, callback);
    });

    this.Then(/^I receive a CONACK reply$/, function(callback) {
        // Write code here that turns the phrase above into concrete actions
        this.Client.messages.should.have.lengthOf(1);
        this.Client.messages[0].msgType.should.eql('CONACK');
        callback.pending();
    });
}


module.exports = Specs;
