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
  View, 
  Button
} from 'react-native';
import {Vibration} from 'react-native';

import _ from 'lodash';

import BackgroundGeolocation from "react-native-background-geolocation";

export default class RaceWithFriends extends Component {

  constructor(props) {
    super(props);
    this.state = {
      recording: false,
      history: []
    };

    this.onLocationUpdate = _.debounce(this.onLocationUpdate.bind(this), 1000);
    this.processLocation = this.processLocation.bind(this);
  }

  componentWillMount() {
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
      debug: true, // <-- enable for debug sounds & notifications
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,   // <-- Allow the background-service to continue tracking when user closes the app.
      startOnBoot: true,        // <-- Auto start tracking when device is powered-up.
      // HTTP / SQLite config
      // url: 'https://requestb.in/13lbwi81',
      url: 'https://salty-stream-73177.herokuapp.com/',
      autoSync: false,         // <-- POST each location immediately to server
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
    BackgroundGeolocation.changePace(true);
  }

  onLocationUpdate(location) {
    let pattern = [0];
    Vibration.vibrate(pattern);
    BackgroundGeolocation.changePace(true);
    this.state.history.push(this.processLocation(location));
    this.setState({
      history: this.state.history 
    });
    // this.sendLocations();
  }

  // Helper function for finding the distance between two points on a map (in meters).
  // This function takes into account the curvature of the earth for accuracy.
  // Typical error is up to 0.3%.
  findDistance(lat1, lon1, lat2, lon2) {
      const toRad = (num) => { return num * Math.PI / 180};  

      var R = 6371e3; // metres
      var φ1 = toRad(lat1);
      var φ2 = toRad(lat2);
      var Δφ = toRad(lat2-lat1);
      var Δλ = toRad(lon2-lon1);

      var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      var d = R * c;
      return d;
  }

  processLocation(location) {
    var previousCoordinate = this.state.history[this.state.history.length - 1];
    var distance;
    if(previousCoordinate) {
      // calculate the distance traveled from the previous coordinate
      var lat1 = previousCoordinate.lat;
      var lon1 = previousCoordinate.long;
      var lat2 = location.coords.latitude;
      var lon2 = location.coords.longitude;
      distance = this.findDistance(lat1, lon1, lat2, lon2);
    } else {
      distance = 0;
    }

    console.log('~~~~~~~~~~~~~~~~~~~~', location);

    var locationHistory = {
      lat: location.coords.latitude,
      long: location.coords.longitude,
      distance: distance,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy,
      alt: location.coords.altitude
    }

    return locationHistory;
  }

  onRecord() {
    this.setState({
      recording: true
    });
    // This handler fires whenever bgGeo receives a location update.
    BackgroundGeolocation.on('location', this.onLocationUpdate);
    // This handler fires when movement states changes (stationary->moving; moving->stationary)
    BackgroundGeolocation.on('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.on('heartbeat', this.onLocationUpdate);
  }

  onStopRecord() {
    this.setState({
      recording: false
    });
    // Remove BackgroundGeolocation listeners
    BackgroundGeolocation.un('location', this.onLocation);
    BackgroundGeolocation.un('motionchange', this.onMotionChange);
    BackgroundGeolocation.un('heartbeat', this.onHeartBeat);
  }

  render() {

    const history = this.state.history.map((location) => {
      return (<Text>{JSON.stringify(location)}</Text>)
    });

    return (
      <View style={styles.container}>
        <Button
          onPress={this.onRecord.bind(this)}
          title="Record"
          color='red'
        />
        <Button
          onPress={this.onStopRecord.bind(this)}
          title="Stop"
          color='yellow'
        />
        {history}
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
      debug: true, // <-- enable for debug sounds & notifications
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
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
