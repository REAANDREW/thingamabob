var messageTypes = {
  RESERVED: 0,
  CONNECT: 1,
  CONNACK : 2,
  PUBLISH : 3,
  PUBACK : 4,
  PUBREC : 5,
  PUBREL : 6,
  PUBCOMP : 7,
  SUBSCRIBE : 8,
  SUBACK : 9,
  UNSUBSCRIBE : 10,
  UNSUBACK : 11,
  PINGREQ : 12,
  PINGRESP : 13,
  DISCONNECT : 14
};

var qualityOfService = {
  AT_MOST_ONCE : 0,
  AT_LEAST_ONCE : 1,
  EXACTLY_ONCE : 2
};

module.exports = {
  messageTypes : messageTypes,
  qualityOfService : qualityOfService
}
