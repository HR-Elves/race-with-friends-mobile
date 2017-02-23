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
import BackgroundGeolocation from 'react-native-background-geolocation';
import Auth0Lock from 'react-native-lock';
import _ from 'lodash';

import facebookKey from './config/facebook-app-key';
import {findDistance, processLocation, getRaceStatus} from './src/utils/raceUtils.js';
import race from './assets/presetChallenges/slowWalk.json';

export default class RaceWithFriends extends Component {

  constructor(props) {
    super(props);
    this.state = {
      recording: false,
      history: [],
      raceStatus: null,
      profile: '',
      token: ''
    };

    this.onLocationUpdate = this.onLocationUpdate.bind(this);
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
  }

  onLocationUpdate(location) {
    let pattern = [0];
    Vibration.vibrate(pattern);

    let currentLoc = processLocation(location, this.state.history);

    let newRaceStatus = getRaceStatus(currentLoc, race, this.state.raceStatus);

    this.state.history.push(currentLoc);
    this.setState({
      history: this.state.history,
      raceStatus: newRaceStatus
    });

    console.log('~~~', JSON.stringify(location));
  }

  onRecord() {
    // This handler fires whenever bgGeo receives a location update.
    BackgroundGeolocation.on('location', this.onLocationUpdate);
    // This handler fires when movement states changes (stationary->moving; moving->stationary)
    BackgroundGeolocation.on('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.on('heartbeat', this.onLocationUpdate);
    BackgroundGeolocation.changePace(true);
  }

  onStopRecord() {
    // Remove BackgroundGeolocation listeners
    BackgroundGeolocation.un('location', this.onLocationUpdate);
    BackgroundGeolocation.un('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.un('heartbeat', this.onLocationUpdate);

    fetch('https://peaceful-dawn-56737.herokuapp.com/runs', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.state.history)
    });
  }

  clearHistory() {
    this.setState({
      history: [],
    });
  }

  render() {
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

    // var displayLastFive = this.state.history.slice(-5).map((location) => {
    //   return (
    //     <Text>
    //       {`DistanceTotal: ${location.distanceTotal}, TimeTotal: ${location.timeTotal}`}
    //     </Text>
    //   );
    // });

    let distanceToOpponent = this.state.raceStatus ? this.state.raceStatus.distanceToOpponent : 'initializing';
    let distanceRemaining = this.state.raceStatus ? this.state.raceStatus.distanceRemaining : 'initializing';

    return (
      <View style={styles.container}>
        <Text>
          Version 1.4
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
      <Text>{`Distance to opponent: ${distanceToOpponent}`}</Text>
      <Text>{`Distance remaining: ${distanceRemaining}`}</Text>
      <Text>Welcome: {this.state.profile.name}</Text>
      </View>
    );
  }
}

AppRegistry.registerComponent('RaceWithFriends', () => RaceWithFriends);