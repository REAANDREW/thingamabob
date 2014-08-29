'use strict';

function ThingamabobServer() {

}

function ThingamabobClient() {

}

function createServer(options) {
  return new ThingamabobServer(options);
}

function createClient(options) {
  return new ThingamabobClient(options);
}

module.exports = {
  createServer: createServer,
  createClient: createClient
};
