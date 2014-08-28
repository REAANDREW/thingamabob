Feature: Publish and Subscribe
    As a thingamabob client 
    I want to connect to a server
    So that I can publish and subscribe to messages

    Scenario: Connecting to a server
        Given an address of a thingamabob server
          And a thingamabob client
         When I send a CONNECT message
         Then I receive a CONACK reply
