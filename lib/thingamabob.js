'use strict';

function ThingamabobServer() {

}

function createServer(options) {
  return new ThingamabobServer(options);
}

module.exports = {
  createServer: createServer
};
