'use strict';

function WorldConstructor() {
    this.World = function World(callback) {
        // setup context stuff here...
        callback();
    };
}

module.exports = WorldConstructor;
