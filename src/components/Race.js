
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  ProgressViewIOS
} from 'react-native';
import {Vibration} from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import Prompt from 'react-native-prompt';
import _ from 'lodash';

import {findDistance, processLocation, getRaceStatus} from '../utils/raceUtils.js';
import race from '../../assets/presetChallenges/standardWalk.json';
import RaceProgress from './RaceProgress';

export default class Race extends Component {

  constructor(props) {
    super(props);
    this.state = {
      history: [],
      raceStatus: null,
      promptVisible: false,
      raceName: null,
      raceDescription: null
    };
    this.setTimeoutID = null;
    this.onLocationUpdate = this.onLocationUpdate.bind(this);
    this.beginGPSTracking = this.beginGPSTracking.bind(this);
  }

  componentWillMount() {
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
      stopDetectionDelay: 60, // Minutes
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
    clearInterval(this.setTimeoutID); //Clear previous setTimeout.

    let currentLoc = processLocation(location, this.state.history);
    let newRaceStatus = getRaceStatus(currentLoc, race, this.state.raceStatus);
    if (newRaceStatus.passedOpponent) {
      BackgroundGeolocation.playSound(1001);
    }
    if (newRaceStatus.distanceToOpponent > 0) {
      let pattern = [0];
      Vibration.vibrate(pattern);
    }

    this.setTimeoutID = setTimeout((() => {
      BackgroundGeolocation.getCurrentPosition.call(this, (location, taskId) => {
        this.onLocationUpdate(location);
      });
    }).bind(this), 10000);

    this.state.history.push(currentLoc);
    this.setState({
      history: this.state.history,
      raceStatus: newRaceStatus
    });

    console.log('~~~', JSON.stringify(location));
  }

  postRun() {
    let body = {
      userid: this.props.userId,
      created: (new Date()).toISOString(),
      name: this.state.raceName,
      description: 'testDescription',
      length: this.state.history[this.state.history.length - 1].distanceTotal,
      duration: this.state.history[this.state.history.length - 1].timeTotal,
      data: this.state.history,
    };

    // fetch('https://peaceful-dawn-56737.herokuapp.com/runs', {
    // fetch('https://requestb.in/1kvpibw1', {
    fetch('https://www.racewithfriends.tk:8000/users/' + this.props.userId + '/runs', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }).then((response) => {
      return response.json();
    }).then((responseJSON) => {
      console.warn('res.id =>', responseJSON.id);
    }).catch((error) => {
      console.error(error);
    });
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
    clearInterval(this.setTimeoutID);

    // Remove BackgroundGeolocation listeners
    BackgroundGeolocation.un('location', this.onLocationUpdate);
    BackgroundGeolocation.un('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.un('heartbeat', this.onLocationUpdate);
    this.setState({
      promptVisible: true
    });
  }

  clearHistory() {
    this.setState({
      history: [],
      raceStatus: null,
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
        {<Prompt
          title="Please name your race."
          placeholder="Race Name"
          defaultValue=""
          visible={ this.state.promptVisible }
          onCancel={ () => this.setState({
            promptVisible: false,
          }) }
          onSubmit={ (value) => {
            // console.error(typeof value);
            this.setState({
              promptVisible: false,
              raceName: value
            }, () => this.postRun());
          }}
          submitText='Save Run'
          cancelText={'Don\'t Save'}
        />}
      </View>
    );
  }
}

// &&
//           <Prompt
//             title="Please give your race a description."
//             placeholder="Race Description"
//             defaultValue=""
//             visible={ this.state.promptVisible }
//             onCancel={ () => this.setState({
//               promptVisible: false,
//             }) }
//             onSubmit={ (value) => this.setState({
//               promptVisible: false,
//               raceDescription: value
//             }) }/>