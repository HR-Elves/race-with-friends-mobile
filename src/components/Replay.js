/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';
import {Vibration} from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import _ from 'lodash';

import {findDistance, processLocation, getRaceStatus} from '../utils/raceUtils.js';
import player from '../../assets/presetChallenges/UsainBolt100m.json';
import race from '../../assets/presetChallenges/worldRecordRaceWalk100m.json';
import RaceProgress from './RaceProgress';

export default class Replay extends Component {

  constructor(props) {
    super(props);
    this.state = {
      history: [],
      raceStatus: null,
      progress: {
        playerDist: 0,
        opponentDist: 0,
        totalDist: race[race.length - 1].distanceTotal,
        playerWon: false,
        opponentWon: false
      }
    };
    this.playerIndex = 0;
    this.setTimeoutID = null;
    this.onLocationUpdate = this.onLocationUpdate.bind(this);
  }

  componentWillMount() {
    this.initializeBgGeo();
  }

  initializeBgGeo() {
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
    console.log('~~~ calling onLocation ~~~ ', this.setTimeoutID);
    let newRaceStatus = getRaceStatus(location, race, this.state.raceStatus);
    if (newRaceStatus.passedOpponent) {
      BackgroundGeolocation.playSound(1001);
    }
    if (newRaceStatus.distanceToOpponent > 0) {
      let pattern = [0];
      Vibration.vibrate(pattern);
    }

    this.state.history.push(location);
    this.setState({
      history: this.state.history,
      raceStatus: newRaceStatus,
      progress: {
        playerDist: location.distanceTotal,
        opponentDist: location.distanceTotal - newRaceStatus.distanceToOpponent,
        totalDist: race[race.length - 1].distanceTotal,
        playerWon: false,
        opponentWon: false
      }
    });

    console.log('~~~', JSON.stringify(location));

    this.playerIndex++;
    let newLocation = player[this.playerIndex];

    if (newRaceStatus.challengeDone) {
      if (newRaceStatus.distanceToOpponent <= 0) {
        this.setState({
          progress: {
            playerDist: location.distanceTotal,
            opponentDist: location.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: race[race.length - 1].distanceTotal,
            playerWon: false,
            opponentWon: true
          }
        });
      } else if (newRaceStatus.distanceToOpponent > 0) {
        this.setState({
          progress: {
            playerDist: location.distanceTotal,
            opponentDist: location.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: race[race.length - 1].distanceTotal,
            playerWon: true,
            opponentWon: false
          }
        });
      }
    } else {
      this.setTimeoutID = setTimeout((() => {
        this.onLocationUpdate(newLocation);
      }).bind(this), newLocation.timeDelta);
      console.log('~~~ setting ~~~', this.setTimeoutID);
    }
  }

  onPlay() {
    let location = player[this.playerIndex];
    this.setTimeoutID = setTimeout((() => {
      this.onLocationUpdate(location);
    }).bind(this), location.timeDelta);
    console.log('~~~ setting ~~~', this.setTimeoutID);
  }

  onPause() {
    console.log('~~~ clearing ~~~ ', this.setTimeoutID);
    clearTimeout(this.setTimeoutID);
  }

  onReset() {
    this.onPause();
    this.setState({
      history: [],
      raceStatus: null,
      progress: {
        playerDist: 0,
        opponentDist: 0,
        totalDist: race[race.length - 1].distanceTotal,
        playerWon: false,
        opponentWon: false
      }
    });
    this.playerIndex = 0;
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
          Version 1.4 Replay.js
        </Text>
        <Button
          onPress={this.onPlay.bind(this)}
          title='Play'
          color='red'
        />
        <Button
          onPress={this.onPause.bind(this)}
          title='Pause'
          color='blue'
        />
        <Button
          onPress={this.onReset.bind(this)}
          title='Reset'
          color='green'
        />
        <Text>{`Distance to opponent: ${distanceToOpponent}`}</Text>
        <Text>{`Distance remaining: ${distanceRemaining}`}</Text>
        <RaceProgress progress={this.state.progress} />
      </View>
    );
  }
}