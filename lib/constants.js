'use strict';

var messageTypes = {
    //RESERVED: 0,
    CONNECT: 1,
    CONNACK: 2,
    PUBLISH: 3,
    PUBACK: 4,
    PUBREC: 5,
    PUBREL: 6,
    PUBCOMP: 7,
    SUBSCRIBE: 8,
    SUBACK: 9,
    UNSUBSCRIBE: 10,
    UNSUBACK: 11,
    PINGREQ: 12,
    PINGRESP: 13,
    DISCONNECT: 14
};

var qualityOfService = {
    AT_MOST_ONCE: 0,
    AT_LEAST_ONCE: 1,
    EXACTLY_ONCE: 2,
    RESERVED: 3
};

var errorCodes = {
    connect: {
        malformedRemainingLength: {
            statusCode: 1,
            statusMessage: 'the remaining length should be between 1 and 4 bytes long inclusive'
        }
    }
};

module.exports = {
    messageTypes: messageTypes,
    messageTypeFor: function(code) {
        var _ = require('lodash');

        return _.findKey(messageTypes, function(val) {
            return val === code;
        });
    },
    qualityOfService: qualityOfService,
    errorCodes: errorCodes,
    protocol: {
        name: 'MQTT',
        version: 4
    },
    PROTOCOL_NAME: 'MQTT',
    PROTOCOL_VERSION: 4
};
