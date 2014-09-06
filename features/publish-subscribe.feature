Feature: Publish and Subscribe
    As a thingamabob client 
    I want to connect to a server
    So that I can publish and subscribe to messages

    Scenario: Connecting to a server
        Given I am a thingamabob client on port 19756
          And a thingamabob server on port 99756
         When I send a CONNECT message
         Then I receive a CONACK reply
