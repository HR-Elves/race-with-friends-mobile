
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';
import {Vibration} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import Tts from 'react-native-tts';
import _ from 'lodash';

import {findDistance, processLocation, getRaceStatus} from '../utils/raceUtils.js';
import RaceProgress from './RaceProgress';
import RaceStatus from './RaceStatus';

import usain from '../../assets/presetChallenges/UsainBolt100m';
import walk from '../../assets/presetChallenges/worldRecordRaceWalk100m';
import james from '../../assets/presetChallenges/MarketSt3';
import nick from '../../assets/presetChallenges/MarketSt4';
import hare from '../../assets/presetChallenges/hareFromFable';
import test1 from '../../assets/presetChallenges/test1';
import test2 from '../../assets/presetChallenges/test2';
import test3 from '../../assets/presetChallenges/test3';

const presets = {
  'Usain Bolt': usain,
  worldRecordRaceWalk100m: walk,
  hare100m: hare,
  test1: test1,
  test2: test2,
  test3: test3
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

class SpeechQueue {
  constructor() {
    this.storage = [];
  }
  size() {
    return this.storage.length;
  }
  queue(speech) {
    this.storage.unshift(speech);
  }
  dequeue() {
    return this.storage.pop();
  }
}

let speechQueue = new SpeechQueue();

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
        player: walk,
        challenge: walk
      },
      opponentSetup: {
        runnerType: 'Presets',
        options: Object.keys(presets),
        opponent: walk,
        challenge: walk
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
    this.getChallenges((responseJSON) => {
      // console.warn(JSON.stringify(responseJSON));
      let newChallenges = {};
      responseJSON.forEach((challenge) => {
        newChallenges[challenge.name] = challenge;
      });
      raceTypes['Challenges'] = newChallenges;
      // console.warn('Challenges loaded.');
    });

    Tts.addEventListener('tts-finish', (event) => {
      // console.warn('tts-finish: ', event);
      if (speechQueue.size() > 0) {
        Tts.speak(speechQueue.dequeue());
      }
    });
    Tts.addEventListener('tts-cancel', (event) => console.warn('tts-cancel: ', event));
  }

  onLocationUpdate(location) {
    console.log('~~~ calling onLocation ~~~ ', this.setTimeoutID);
    let newRaceStatus = getRaceStatus(location, this.state.opponentSetup.opponent, this.state.raceStatus);
    if (newRaceStatus.passedOpponent) {
      this.waitAndSpeak('You just passed your opponent! 1 2 3 4  5 6 7 8 9 10 10 10 10 10 10 10 10 10');
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
      // console.warn('newRaceStatus: ', newRaceStatus);
      if (newRaceStatus.distanceToOpponent < 0) { // Opponent Won
        if (typeof this.state.opponentSetup.challenge.message === 'object') {
          this.waitAndSpeak(this.state.opponentSetup.challenge.message.opponentWon);
        } else {
          this.waitAndSpeak(`I'm Sorry to report that your opponent beat you by ${Math.round(newRaceStatus.distanceToOpponent * -1)} meters.`);
        }
        this.setState({
          progress: {
            playerDist: location.distanceTotal,
            opponentDist: location.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: this.state.opponentSetup.opponent[this.state.opponentSetup.opponent.length - 1].distanceTotal,
            playerWon: false,
            opponentWon: true
          }
        });
      } else if (newRaceStatus.distanceToOpponent > 0) { // Player Won
        if (typeof this.state.playerSetup.challenge.message === 'object') {
          this.waitAndSpeak(this.state.playerSetup.challenge.message.playerWon);
        } else {
          this.waitAndSpeak(`Congratulations, you beat your opponent by ${Math.round(newRaceStatus.distanceToOpponent)} meters.`);
        }
        this.setState({
          progress: {
            playerDist: location.distanceTotal,
            opponentDist: location.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: this.state.opponentSetup.opponent[this.state.opponentSetup.opponent.length - 1].distanceTotal,
            playerWon: true,
            opponentWon: false
          }
        });
      } else {
        this.waitAndSpeak('Wow, you and your opponent tied!');
        this.setState({
          progress: {
            playerDist: location.distanceTotal,
            opponentDist: location.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: this.state.opponentSetup.opponent[this.state.opponentSetup.opponent.length - 1].distanceTotal,
            playerWon: false,
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

  getChallenges(callback) {
    // console.warn('userId=', this.props.userId);
    // let userId = this.props.userId;
    fetch('https://www.racewithfriends.tk:8000/challenges?opponent=' + this.props.userId, {
    // fetch('https://www.racewithfriends.tk:8000/challenges?opponent=10210021929398105', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      return response.json();
    }).then((responseJson) => {
      callback(responseJson);
    }).catch((error) => {
      console.error('getChallenges error: ', error);
    });
  }

  getRunByRunId(runId, callback) {
    fetch('https://www.racewithfriends.tk:8000/runs/' + runId, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }).then((response) => {
      return response.json();
    }).then((responseJson) => {
      callback(responseJson);
    }).catch((error) => {
      console.error('getRunByRunId error: ', error);
    });
  }

  onPlay() {
    // console.error(this.playerSetup.player);
    let location = this.state.playerSetup.player[this.playerIndex];
    // console.warn('onPlay, location: ', JSON.stringify(location));
    this.setTimeoutID = setTimeout((() => {
      this.onLocationUpdate(location);
    }).bind(this), location.timeDelta);
    // console.log('~~~ setting ~~~', this.setTimeoutID);
    // console.warn(this.state.playerSetup.challenge.message);
    if (typeof this.state.playerSetup.challenge.message === 'object') {
      this.waitAndSpeak(this.state.playerSetup.challenge.message.raceStart);
    } else {
      this.waitAndSpeak('oh mer gherd, we are now recording!');
    }
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
    newState.playerSetup.challenge = raceTypes[this.state.playerSetup.runnerType][value];
    this.setState(newState, () => {
      // console.warn('newState.playerSetup = ', newState.playerSetup);
      if (newState.playerSetup.player.run_id) {
        let runId = newState.playerSetup.player.run_id;
        this.getRunByRunId(runId, (responseJson) => {
          const nextState = {};
          nextState.playerSetup = this.state.playerSetup;
          nextState.playerSetup.player = responseJson.data;
          let messageParsed;
          try {
            messageParsed = JSON.parse(nextState.playerSetup.challenge.message);
          } catch (error) {
            //Do nothing.
          }

          if (typeof messageParsed === 'object') {
            nextState.playerSetup.challenge.message = messageParsed;
          }
           // console.error(JSON.stringify(nextState));
          this.setState(nextState, () => {
            // console.warn('Updated State!');
          });
        });
      }
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
    newState.opponentSetup.challenge = raceTypes[this.state.opponentSetup.runnerType][value];
    this.setState(newState, () => {
      // console.warn('newState.opponentSetup = ', newState.opponentSetup);
      if (newState.opponentSetup.opponent.run_id) {
        let runId = newState.opponentSetup.opponent.run_id;
        this.getRunByRunId(runId, (responseJson) => {
          const nextState = {};
          nextState.opponentSetup = this.state.opponentSetup;
          nextState.opponentSetup.opponent = responseJson.data;
          // let messageParsed;
          // try {
          //   messageParsed = JSON.parse(nextState.raceSetup.challenge.message);
          // } catch (error) {
          //   //Do nothing.
          // }

          // if (typeof messageParsed === 'object') {
          //   nextState.raceSetup.challenge.message = messageParsed;
          // }
           // console.error(JSON.stringify(nextState));
          this.setState(nextState, () => {
            // console.warn('Updated State!');
          });
        });
      }
    });
  }

  waitAndSpeak(message, voice) {
    if (voice) {
      Tts.setDefaultLanguage(voice);
    }
    speechQueue.queue(message);
    // console.warn('speechQueue: ', speechQueue.storage);
    if (speechQueue.size() > 0) {
      Tts.speak(speechQueue.dequeue());
    }
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
