
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';
import {Vibration} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import BackgroundGeolocation from 'react-native-background-geolocation';
import _ from 'lodash';

import {findDistance, processLocation, getRaceStatus} from '../utils/raceUtils.js';
import RaceProgress from './RaceProgress';
import RaceStatus from './RaceStatus';

import usain from '../../assets/presetChallenges/UsainBolt100m';
import walk from '../../assets/presetChallenges/worldRecordRaceWalk100m';
import james from '../../assets/presetChallenges/MarketSt3';
import nick from '../../assets/presetChallenges/MarketSt4';
import hare from '../../assets/presetChallenges/hareFromFable';

const presets = {
  'Usain Bolt': usain,
  worldRecordRaceWalk100m: walk,
  hare100m: hare
};

const myRuns = {
  'James Market St': james,
  'Nick Market St': nick,
};

let challenges;

const raceTypes = {
  Presets: presets,
  'My Runs': myRuns,
  Challenges: challenges,
  Live: 'Under Construction',
};

export default class Replay extends Component {

  constructor(props) {
    super(props);
    this.state = {
      history: [],
      raceStatus: null,
      progress: {
        playerDist: 0,
        opponentDist: 0,
        totalDist: 100,
        playerWon: false,
        opponentWon: false
      },
      playerSetup: {
        runnerType: 'Presets',
        options: Object.keys(presets),
        player: walk
      },
      opponentSetup: {
        runnerType: 'Presets',
        options: Object.keys(presets),
        opponent: walk
      }
      // picked: {
      //   player: 'James Market St',
      //   opponent: 'Nick Market St'
      // }
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
    let newRaceStatus = getRaceStatus(location, this.state.opponentSetup.opponent, this.state.raceStatus);
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
        totalDist: this.state.opponentSetup.opponent[this.state.opponentSetup.opponent.length - 1].distanceTotal,
        playerWon: false,
        opponentWon: false
      }
    });

    console.log('~~~', JSON.stringify(location));

    this.playerIndex++;
    let newLocation = this.state.playerSetup.player[this.playerIndex];

    if (newRaceStatus.challengeDone) {
      if (newRaceStatus.distanceToOpponent <= 0) {
        this.setState({
          progress: {
            playerDist: location.distanceTotal,
            opponentDist: location.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: this.state.opponentSetup.opponent[this.state.opponentSetup.opponent.length - 1].distanceTotal,
            playerWon: false,
            opponentWon: true
          }
        });
      } else if (newRaceStatus.distanceToOpponent > 0) {
        this.setState({
          progress: {
            playerDist: location.distanceTotal,
            opponentDist: location.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: this.state.opponentSetup.opponent[this.state.opponentSetup.opponent.length - 1].distanceTotal,
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
    let location = this.state.playerSetup.player[this.playerIndex];
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
        totalDist: this.state.opponentSetup.opponent[this.state.opponentSetup.opponent.length - 1].distanceTotal,
        playerWon: false,
        opponentWon: false
      }
    });
    this.playerIndex = 0;
  }

  onPickPlayerType(key, value) {
    const newState = {};
    newState.playerSetup = this.state.playerSetup;
    newState.playerSetup.runnerType = value;
    newState.playerSetup.options = Object.keys(raceTypes[value]);
    this.setState(newState, () => {
      // console.warn('newState loaded!');
    });
  }

  onPickPlayer(key, value) {
    const newState = {};
    newState.playerSetup = this.state.playerSetup;
    newState.playerSetup.player = raceTypes[this.state.playerSetup.runnerType][value];
    this.setState(newState, () => {
      console.warn('newState.playerSetup = ', newState.playerSetup);
    });
  }

  onPickOpponentType(key, value) {
    const newState = {};
    newState.opponentSetup = this.state.opponentSetup;
    newState.opponentSetup.runnerType = value;
    newState.opponentSetup.options = Object.keys(raceTypes[value]);
    this.setState(newState, () => {
      // console.warn('newState loaded!');
    });
  }

  onPickOpponent(key, value) {
    const newState = {};
    newState.opponentSetup = this.state.opponentSetup;
    newState.opponentSetup.opponent = raceTypes[this.state.opponentSetup.runnerType][value];
    this.setState(newState, () => {
      console.warn('newState.opponentSetup = ', newState.opponentSetup);
    });
  }
  // onPickPlayer(index, value) {
  //   console.log('*****', index, value);
  //   const newState = {};
  //   newState.picked = this.state.picked;
  //   newState.picked.player = value;
  //   player = ghosts[value];
  //   this.setState(newState);
  // }

  // onPickOpponent(key, value) {
  //   const newState = {};
  //   newState.picked = this.state.picked;
  //   newState.picked.opponent = value;
  //   race = ghosts[value];
  //   this.setState(newState);
  // }

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
      buttons: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        flexDirection: 'row'
      },
      dropdown: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        flexDirection: 'row'
      }
    });

    return (
      <View style={styles.container}>
        <Text style={{marginBottom: 0, marginTop: 50}}>Select Racers:</Text>
        <View style={styles.dropdown}>
          <ModalDropdown
            options={['Presets', 'My Runs', 'Challenges']}
            onSelect={this.onPickPlayerType.bind(this)}
            textStyle={{fontSize: 18}}
            defaultValue='Presets'
            // style={{marginTop: 25}}
          />
          <Text style={{fontSize: 18, marginRight: 10}}>:</Text>
          <ModalDropdown
            options={this.state.playerSetup.options}
            onSelect={this.onPickPlayer.bind(this)}
            textStyle={{fontSize: 24}}
            defaultValue='worldRecordRaceWalk100m'
            // style={{marginTop: 25}}
          />
        </View>
        <Text style={{
          fontSize: 20,
          // marginTop: 10,
          // marginBottom: 10
        }}>VS</Text>
        <View style={styles.dropdown}>
          <ModalDropdown
            options={['Presets', 'My Runs', 'Challenges']}
            onSelect={this.onPickOpponentType.bind(this)}
            textStyle={{fontSize: 18}}
            defaultValue='Presets'
            // style={{marginTop: 25}}
          />
          <Text style={{fontSize: 18, marginRight: 10}}>:</Text>
          <ModalDropdown
            options={this.state.opponentSetup.options}
            onSelect={this.onPickOpponent.bind(this)}
            textStyle={{fontSize: 24}}
            defaultValue='worldRecordRaceWalk100m'
            // style={{marginTop: 25}}
          />
        </View>
        <RaceStatus
          status={this.state.raceStatus}
          playerName={'Player'}
          opponentName={'Opponent'}
        />
        <RaceProgress progress={this.state.progress} />
        <View style={styles.buttons}>
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
        </View>
      </View>
    );
  }
}
