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
  Button,
  AsyncStorage
} from 'react-native';
import {Vibration} from 'react-native';

import _ from 'lodash';

import BackgroundGeolocation from 'react-native-background-geolocation';
import Auth0Lock from 'react-native-lock';
import facebookKey from './config/facebook-app-key';

export default class RaceWithFriends extends Component {

  constructor(props) {
    super(props);
    this.state = {
      recording: false,
      history: [],
      distanceTravelled: 0,
      profile: '',
      token: ''
    };

    this.onLocationUpdate = this.onLocationUpdate.bind(this);
    this.processLocation = this.processLocation.bind(this);
    this.beginGPSTracking = this.beginGPSTracking.bind(this);
  }

  componentWillMount() {
    // if (!this.state.token) {
    // var lock = new Auth0Lock(facebookKey);
    // lock.show({}, (err, profile, token) => {
    //   if (err) {
    //     console.log(err);
    //     return;
    //   } else {
    //     // Authentication worked!
    //     this.setState({
    //       profile: profile,
    //       token: token
    //     });
    //     console.log('Logged in with Auth0!', profile);
    //     console.log('%%%%%', token);
    //   }
    //   this.beginGPSTracking();
    // });
    // } else {
    this.beginGPSTracking();

    // var history = [];
    // AsyncStorage.setItem('history', JSON.stringify(history), () => {});

    // }
    // BackgroundGeolocation.changePace(true);
    // setInterval(() => {
    //   BackgroundGeolocation.changePace(true);
    // }, 1000);
  }

  beginGPSTracking() {
    // Now configure the plugin.
    BackgroundGeolocation.configure({
      // Geolocation Options
      desiredAccuracy: 0,
      locationUpdateInterval: 1000,
      fastestLocationUpdateInterval: 500,
      stationaryRadius: 1,
      disableElasticity: true,
      desiredOdometerAccuracy: 0,
      // Activity Recognition Options
      stopTimeout: 60, // Minutes
      disableMotionActivityUpdates: true,
      // HTTP / SQLite Persistence Options
      url: 'https://salty-stream-73177.herokuapp.com/',
      method: 'POST',
      autoSync: false, // POST each location immediately to server
      // Application config
      debug: false, // debug sounds & notifications
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: true, // Allow the background-service to continue tracking when user closes the app.
      startOnBoot: false, // Auto start tracking when device is powered-up.
      heartbeatInterval: 1,
      preventSuspend: true,
      // pausesLocationUpdatesAutomatically: false,
    }, function(state) {
      console.log('- BackgroundGeolocation is configured and ready: ', state.enabled);

      if (!state.enabled) {
        BackgroundGeolocation.start(function() {
          console.log('- Start success');
        });
      }
    });
    // BackgroundGeolocation.changePace(true);
  }

  onLocationUpdate(location) {
    let pattern = [0];
    Vibration.vibrate(pattern);

    // var distanceChange = this.processLocation(location);
    this.state.history.push(this.processLocation(location, this.state.history));
    this.setState({
      history: this.state.history
    });

    console.log('~~~', JSON.stringify(location));
    // console.log('~~~', JSON.stringify(location.location));
    // AsyncStorage.getItem('history', (error, history) => {
    //   history = JSON.parse(history);
    //   history.push(this.processLocation(location, history));
    //   console.log( '============>', history.length);
    //   history = JSON.stringify(history);
    //   AsyncStorage.setItem('history', history, () => {});
    // });

    // setInterval(() => {
    //   BackgroundGeolocation.changePace(true);
    // });
    // BackgroundGeolocation.changePace(true);
    // history.push(distanceChange);
    // console.log('===============>', history);
    // fetch('https://peaceful-dawn-56737.herokuapp.com/ping', {
    //   method: 'POST',
    //   headers: {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(distanceChange)
    // });

    // this.setState({
    //   history: history
    // });
    // this.sendLocations();
  }

  // Helper function for finding the distance between two points on a map (in meters).
  // This function takes into account the curvature of the earth for accuracy.
  // Typical error is up to 0.3%.
  findDistance(lat1, lon1, lat2, lon2) {
    const toRad = (num) => { return num * Math.PI / 180; };

    var R = 6371e3; // metres
    var φ1 = toRad(lat1);
    var φ2 = toRad(lat2);
    var Δφ = toRad(lat2 - lat1);
    var Δλ = toRad(lon2 - lon1);

    var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    var d = R * c;
    return d;
  }

  processLocation(location, history) {
    if (location.location) { //Sometimes location object comes as {location: {coords:{}}} or {coords:{}}
      location = location.location;
    }
    var previousCoordinate = history[history.length - 1];
    var distance;
    console.log('~~~', location);
    // if (location.coords) {
    //   return undefined;
    // }
    if (previousCoordinate) {
      // calculate the distance traveled from the previous coordinate
      var lat1 = previousCoordinate.lat;
      var lon1 = previousCoordinate.long;
      var lat2 = location.coords.latitude;
      var lon2 = location.coords.longitude;
      distance = this.findDistance(lat1, lon1, lat2, lon2);
    } else {
      distance = 0;
    }


    var newLocation = {
      lat: location.coords.latitude,
      long: location.coords.longitude,
      distance: distance,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy,
      alt: location.coords.altitude
    };

    return newLocation;
  }

  onRecord() {
    // this.setState({
    //   recording: true
    // });
    // This handler fires whenever bgGeo receives a location update.
    BackgroundGeolocation.on('location', this.onLocationUpdate);
    // This handler fires when movement states changes (stationary->moving; moving->stationary)
    BackgroundGeolocation.on('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.on('heartbeat', this.onLocationUpdate);
    BackgroundGeolocation.changePace(true);

  }

  onStopRecord() {
    // this.setState({
    //   recording: false
    // });

    // Remove BackgroundGeolocation listeners
    BackgroundGeolocation.un('location', this.onLocationUpdate);
    BackgroundGeolocation.un('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.un('heartbeat', this.onLocationUpdate);

    var distance = this.state.history.reduce((accum, current) => {
      return accum + current.distance;
    }, 0);

    this.setState({
      distanceTravelled: distance
    });

    fetch('https://peaceful-dawn-56737.herokuapp.com/runs', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.state.history)
    });

    // AsyncStorage.getItem('history', (error, history) => {
    //   fetch('https://peaceful-dawn-56737.herokuapp.com/runs', {
    //     method: 'POST',
    //     headers: {
    //       'Accept': 'application/json',
    //       'Content-Type': 'application/json',
    //     },
    //     body: history
    //   });
    // });
  }

  clearHistory() {
    this.setState({
      history: [],
      distanceTravelled: 0,
    });
  }

  render() {

    // const history = history.map((location) => {
    //   return (<Text>{JSON.stringify(location)}</Text>)
    // });
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

    var displayLastFive = this.state.history.slice(-5).map((location) => {
      return (
        <Text>
          {`Distance: ${location.distance}, Timestamp: ${location.timestamp}`}
        </Text>
      );
    });

    return (
      <View style={styles.container}>
        <Text>
          Version 1.3
        </Text>
        <Button
          onPress={this.onRecord.bind(this)}
          title="Record"
          color='red'
        />
        <Button
          onPress={this.onStopRecord.bind(this)}
          title="Stop"
          color='blue'
        />
        <Button
          onPress={this.clearHistory.bind(this)}
          title="Clear"
          color='green'
        />
        <Text>
          {`Distance Traveled: ${this.state.distanceTravelled}`}
        </Text>
        {displayLastFive}
      <Text>Welcome: {this.state.profile.name}</Text>
      </View>
    );
  }
}

AppRegistry.registerComponent('RaceWithFriends', () => RaceWithFriends);