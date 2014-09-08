'use strict';

describe('1 - Introduction', function() {
    describe('1.1 Organization of MQTT', function() {});
    describe('1.2 Terminology', function() {});
    describe('1.3 Normative references', function() {});
    describe('1.4 Non normative references', function() {});
    describe('1.5 Data representations', function() {
        describe('1.5.1 Bits', function() {});
        describe('1.5.2 Integer data values', function() {});
        describe('1.5.3 UTF-8 encoded strings', function() {});
    });
});
describe('2 - MQTT Control Packet format', function() {
    describe('2.1 Structure of an MQTT Control Packet', function() {});
    describe('2.2 Fixed header', function() {
        describe('2.2.1 MQTT Control Packet type', function() {});
        describe('2.2.2 Flags', function() {});
        describe('2.2.3 Remaining Length', function() {});
    });
    describe('2.3 Variable header', function() {
        describe('2.3.1 Packet Identifier', function() {});
    });
    describe('2.4 Payload', function() {});
});
describe('3 - MQTT Control Packets', function() {
    describe('3.1 CONNECT – Client requests a connection to a Server', function() {
        describe('3.1.1 Fixed header', function() {});
        describe('3.1.2 Variable header', function() {});
        describe('3.1.3 Payload', function() {});
        describe('3.1.4 Response', function() {});
    });
    describe('3.2 CONNACK – Acknowledge connection request', function() {
        describe('3.2.1 Fixed header', function() {});
        describe('3.2.2 Variable header', function() {});
        describe('3.2.3 Payload', function() {});
    });
    describe('3.3 PUBLISH – Publish message', function() {
        describe('3.3.1 Fixed header', function() {});
        describe('3.3.2 Variable header', function() {});
        describe('3.3.3 Payload', function() {});
        describe('3.3.4 Response', function() {});
        describe('3.3.5 Actions', function() {});
    });
    describe('3.4 PUBACK – Publish acknowledgement', function() {
        describe('3.4.1 Fixed header', function() {});
        describe('3.4.2 Variable header', function() {});
        describe('3.4.3 Payload', function() {});
        describe('3.4.4 Actions', function() {});
    });
    describe('3.5 PUBREC – Publish received (QoS 2 publish received, part 1)', function() {
        describe('3.5.1 Fixed header', function() {});
        describe('3.5.2 Variable header', function() {});
        describe('3.5.3 Payload', function() {});
        describe('3.5.4 Actions', function() {});
    });
    describe('3.6 PUBREL – Publish release (QoS 2 publish received, part 2)', function() {
        describe('3.6.1 Fixed header', function() {});
        describe('3.6.2 Variable header', function() {});
        describe('3.6.3 Payload', function() {});
        describe('3.6.4 Actions', function() {});
    });
    describe('3.7 PUBCOMP – Publish complete (QoS 2 publish received, part 3)', function() {
        describe('3.7.1 Fixed header', function() {});
        describe('3.7.2 Variable header', function() {});
        describe('3.7.3 Payload', function() {});
        describe('3.7.4 Actions', function() {});
    });
    describe('3.8 SUBSCRIBE - Subscribe to topics', function() {
        describe('3.8.1 Fixed header', function() {});
        describe('3.8.2 Variable header', function() {});
        describe('3.8.3 Payload', function() {});
        describe('3.8.4 Response', function() {});
    });
    describe('3.9 SUBACK – Subscribe acknowledgement', function() {
        describe('3.9.1 Fixed header', function() {});
        describe('3.9.2 Variable header', function() {});
        describe('3.9.3 Payload', function() {});
    });
    describe('3.10 UNSUBSCRIBE – Unsubscribe from topics', function() {
        describe('3.10.1 Fixed header', function() {});
        describe('3.10.2 Variable header', function() {});
        describe('3.10.3 Payload', function() {});
        describe('3.10.4 Response', function() {});
    });
    describe('3.11 UNSUBACK – Unsubscribe acknowledgement', function() {
        describe('3.11.1 Fixed header', function() {});
        describe('3.11.2 Variable header', function() {});
        describe('3.11.3 Payload', function() {});
    });
    describe('3.12 PINGREQ – PING request', function() {
        describe('3.12.1 Fixed header', function() {});
        describe('3.12.2 Variable header', function() {});
        describe('3.12.3 Payload', function() {});
        describe('3.12.4 Response', function() {});
    });
    describe('3.13 PINGRESP – PING response', function() {
        describe('3.13.1 Fixed header', function() {});
        describe('3.13.2 Variable header', function() {});
        describe('3.13.3 Payload', function() {});
    });
    describe('3.14 DISCONNECT – Disconnect notification', function() {
        describe('3.14.1 Fixed header', function() {});
        describe('3.14.2 Variable header', function() {});
        describe('3.14.3 Payload', function() {});
        describe('3.14.4 Response', function() {});
    });
});
describe('4 - Operational behavior', function() {
    describe('4.1 Storing state', function() {
        describe('4.1.1 Non normative example', function() {});
    });
    describe('4.2 Network Connections', function() {});
    describe('4.3 Quality of Service levels and protocol flows', function() {
        describe('4.3.1 QoS 0: At most once delivery', function() {});
        describe('4.3.2 QoS 1: At least once delivery', function() {});
        describe('4.3.3 QoS 2: Exactly once delivery', function() {});
    });
    describe('4.4 Message delivery retry', function() {});
    describe('4.5 Message receipt', function() {});
    describe('4.6 Message ordering', function() {});
    describe('4.7 Topic Names and Topic Filters', function() {
        describe('4.7.1 Topic wildcards', function() {});
        describe('4.7.2 Topics beginning with $', function() {});
        describe('4.7.3 Topic semantic and usage', function() {});
    });
    describe('4.8 Handling errors', function() {});
});
describe('5 - Security', function() {
    describe('5.1 Introduction', function() {});
    describe('5.2 MQTT solutions: security and certification', function() {});
    describe('5.3 Lightweight cryptography and constrained devices', function() {});
    describe('5.4 Implementation notes', function() {
        describe('5.4.1 Authentication of Clients by the Server', function() {});
        describe('5.4.2 Authorization of Clients by the Server', function() {});
        describe('5.4.3 Authentication of the Server by the Client', function() {});
        describe('5.4.4 Integrity of Application Messages and Control Packets', function() {});
        describe('5.4.5 Privacy of Application Messages and Control Packets', function() {});
        describe('5.4.6 Non-repudiation of message transmission', function() {});
        describe('5.4.7 Detecting compromise of Clients and Servers', function() {});
        describe('5.4.8 Detecting abnormal behaviors', function() {});
        describe('5.4.9 Other security considerations', function() {});
        describe('5.4.10 Use of SOCKS', function() {});
        describe('5.4.11 Security profiles', function() {});
    });
});
describe('6 - Using WebSocket as a network transport', function() {
    describe('6.1 IANA Considerations', function() {});
});
describe('7 - Conformance', function() {
    describe('7.1 Conformance Targets', function() {
        describe('7.1.1 MQTT Server', function() {});
        describe('7.1.2 MQTT Client', function() {});
    });
});
