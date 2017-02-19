/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';
import {Vibration} from 'react-native';

import BackgroundGeolocation from "react-native-background-geolocation";

export default class RaceWithFriends extends Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>
          Welcome to React Native!
        </Text>
        <Text style={styles.instructions}>
          To get started, edit index.ios.js
        </Text>
        <Text style={styles.instructions}>
          Press Cmd+R to reload,{'\n'}
          Cmd+D or shake for dev menu
        </Text>
        <Text>
          Yay
        </Text>
        <Foo />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});

var Foo = React.createClass({
  componentWillMount() {

    // This handler fires whenever bgGeo receives a location update.
    BackgroundGeolocation.on('location', this.onLocation);

    // This handler fires when movement states changes (stationary->moving; moving->stationary)
    BackgroundGeolocation.on('motionchange', this.onMotionChange);

    BackgroundGeolocation.on('heartbeat', this.onHeartBeat);
      //test:
      /*
        stopTimeout
        changePace
      */
    // Now configure the plugin.
    BackgroundGeolocation.configure({
      // Geolocation Config
      desiredAccuracy: 100,
      stationaryRadius: 1,
      distanceFilter: 1,
      // Activity Recognition
      stopTimeout: 20000000, //in milliseconds
      heartbeatInterval: 1,
      // Application config
      debug: false, // <-- enable for debug sounds & notifications
      logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
      stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
      startOnBoot: true,        // <-- Auto start tracking when device is powered-up.
      // HTTP / SQLite config
      // url: 'https://requestb.in/13lbwi81',
      url: 'https://salty-stream-73177.herokuapp.com/',
      autoSync: true,         // <-- POST each location immediately to server
      params: {               // <-- Optional HTTP params
        "auth_token": "maybe_your_server_authenticates_via_token_YES?"
      }
    }, function(state) {
      console.log("- BackgroundGeolocation is configured and ready: ", state.enabled);

      if (!state.enabled) {
        BackgroundGeolocation.start(function() {
          console.log("- Start success");
        });
      }
    });
    // BackgroundGeolocation.destroyLocations();
    // this.sendLocations();
    BackgroundGeolocation.changePace(true);
    setInterval(() => {
      BackgroundGeolocation.changePace(true);
    }, 1000);
  },

  // You must remove listeners when your component unmounts
  componentWillUnmount() {
    // Remove BackgroundGeolocation listeners
    BackgroundGeolocation.un('location', this.onLocation);
    BackgroundGeolocation.un('motionchange', this.onMotionChange);
    BackgroundGeolocation.un('heartbeat', this.onHeartBeat);
  },

  sendLocations() {
    BackgroundGeolocation.getLocations((locations) => {
      fetch('https://requestb.in/13lbwi81', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(locations)
      });
    });
  },

  onLocation(location) {
    console.log('- [js]location: ', JSON.stringify(location));
    let pattern = [0];
    Vibration.vibrate(pattern);
    BackgroundGeolocation.changePace(true);
    // this.sendLocations();
  },

  onMotionChange(location) {
    console.log('- [js]motionchanged: ', JSON.stringify(location));
    let pattern = [0];
    Vibration.vibrate(pattern);
    BackgroundGeolocation.changePace(true);
    // this.sendLocations();
  },

  onHeartBeat() {
    console.log('- [js]motionchanged: ', JSON.stringify(location));
    let pattern = [0];
    Vibration.vibrate(pattern);
    BackgroundGeolocation.changePace(true);
    // this.sendLocations();
  },

  render() {
    return (<Text>Test</Text>);
  },
});

AppRegistry.registerComponent('RaceWithFriends', () => RaceWithFriends);
