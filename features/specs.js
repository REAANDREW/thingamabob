'use strict';

function Specs() {
    //console.log('After:', this.World);

    this.Given(/^a thingamabob client$/, function(callback) {
        // Write code here that turns the phrase above into concrete actions
        callback.pending();
    });

    this.Given(/^an address of a thingamabob server$/, function(callback) {
        // Write code here that turns the phrase above into concrete actions
        callback.pending();
    });

    this.When(/^I send a CONNECT message$/, function(callback) {
        // Write code here that turns the phrase above into concrete actions
        callback.pending();
    });

    this.Then(/^I receive a CONACK reply$/, function(callback) {
        // Write code here that turns the phrase above into concrete actions
        callback.pending();
    });
}


module.exports = Specs;
