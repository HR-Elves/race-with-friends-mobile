
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

import {findDistance, processLocation, getRaceStatus, findDistanceToOpponent} from '../utils/raceUtils.js';
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
      playersSwapped: null,
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
    };
    this.racerIndex = 0;
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

  onLocationUpdate(racerLoc, race) {
    // console.warn('onLocation: ', this.state.raceStatus);
    let prevRaceStatus = this.state.raceStatus;
    let distanceToOpponent = findDistanceToOpponent(racerLoc, race, 0);
    let newRaceStatus = getRaceStatus(racerLoc, race, prevRaceStatus ? prevRaceStatus : {
      distanceToOpponent: distanceToOpponent,    // if positive, user is ahead of opponent; if negative, user is behind opponent
      passedOpponent: distanceToOpponent > 0,
      passedByOpponent: distanceToOpponent < 0,
      distanceRemaining: race[race.length - 1].distanceTotal - racerLoc.distanceTotal,
      challengeDone: false,
      neckAndNeck: true,
      lastRaceIndexChecked: 0
    });

    if (newRaceStatus.passedOpponent) {
      this.waitAndSpeak('The player just passed the opponent!');
    }
    if (newRaceStatus.distanceToOpponent > 0) {
      let pattern = [0];
      Vibration.vibrate(pattern);
    }

    const newState = this.state;
    newState.raceStatus = newRaceStatus;
    newState.progress.playerDist = racerLoc.distanceTotal;
    newState.progress.opponentDist = racerLoc.distanceTotal - newRaceStatus.distanceToOpponent;
    newState.progress.totalDist = race[race.length - 1].distanceTotal;
    if (this.state.playersSwapped) {
      newState.progress.playerDist = racerLoc.distanceTotal - newRaceStatus.distanceToOpponent;
      newState.progress.opponentDist = racerLoc.distanceTotal;
      newState.progress.totalDist = race[race.length - 1].distanceTotal;
    }
    this.setState(newState);

    if (newRaceStatus.challengeDone) {
      // console.warn('newRaceStatus: ', newRaceStatus);
      if (newRaceStatus.distanceToOpponent < 0) { // Opponent Won

        if (typeof this.state.opponentSetup.challenge.message === 'object') {
          this.waitAndSpeak(this.state.opponentSetup.challenge.message.opponentWon);
        } else {
          if (this.playersSwapped) {
            this.waitAndSpeak(`Wow: The player beat the opponent by ${Math.round(newRaceStatus.distanceToOpponent * -1)} meters.`);
          } else {
            this.waitAndSpeak(`Wow: The opponent beat the player by ${Math.round(newRaceStatus.distanceToOpponent * -1)} meters.`);
          }
        }
        if (this.playersSwapped) {
          newState.progress.opponentWon = true;
        } else {
          newState.progress.playerWon = true;
        }
        this.setState(newState /*{
          progress: {
            playerDist: racerLoc.distanceTotal,
            opponentDist: racerLoc.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: race[race.length - 1].distanceTotal,
            playerWon: false,
            opponentWon: true
          }
        }*/);
      } else if (newRaceStatus.distanceToOpponent > 0) { // Player Won

        if (typeof this.state.playerSetup.challenge.message === 'object') {
          this.waitAndSpeak(this.state.playerSetup.challenge.message.playerWon);
        } else {
          if (this.state.playersSwapped) {
            this.waitAndSpeak(`Incredible, the opponent beat the player by ${Math.round(newRaceStatus.distanceToOpponent)} meters.`);
          } else {
            console.warn('playersSwapped: ', this.state.playersSwapped);
            this.waitAndSpeak(`Incredible, the player beat the opponent by ${Math.round(newRaceStatus.distanceToOpponent)} meters.`);
          }
        }

        if (this.state.playersSwapped) {
          newState.progress.opponentWon = true;
        } else {
          newState.progress.playerWon = true;
        }
        this.setState(newState /*{
          progress: {
            playerDist: racerLoc.distanceTotal,
            opponentDist: racerLoc.distanceTotal - newRaceStatus.distanceToOpponent,
            totalDist: race[race.length - 1].distanceTotal,
            playerWon: true,
            opponentWon: false
          }
        }*/);
      } else {
        this.waitAndSpeak('Hmmm, the player and the opponent tied!');
        // this.setState({
        //   progress: {
        //     playerDist: racerLoc.distanceTotal,
        //     opponentDist: racerLoc.distanceTotal - newRaceStatus.distanceToOpponent,
        //     totalDist: race[race.length - 1].distanceTotal,
        //     playerWon: false,
        //     opponentWon: false
        //   }
        // });
      }
    } else {
      let nextRacerLoc;
      this.racerIndex++;
      if (this.state.playersSwapped) {
        nextRacerLoc = this.state.opponentSetup.opponent[this.racerIndex];
      } else {
        nextRacerLoc = this.state.playerSetup.player[this.racerIndex];
      }
      this.setTimeoutID = setTimeout((() => {
        this.onLocationUpdate(nextRacerLoc, race);
      }).bind(this), nextRacerLoc.timeDelta);
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

    let player = this.state.playerSetup.player;
    let opponent = this.state.opponentSetup.opponent;
    let racer;
    let race;

    if (this.state.playersSwapped || player[player.length - 1].timeTotal > opponent[opponent.length - 1].timeTotal) {
    // If the player's total time is greater than that of the opponent,
      racer = opponent[this.racerIndex];
      race = player;
      this.setState({ playersSwapped: true }, () => {
        console.warn(this.state.playersSwapped);
        this.setTimeoutID = setTimeout((() => {
          this.onLocationUpdate(racer, race);
        }).bind(this), racer.timeDelta);
      });
      // use the opponent instead for deriving the current racer location.
    } else {
      // otherwise use player to derive the current racer location.
      racer = player[this.racerIndex];
      race = opponent;
      // if (this.state.playersSwapped && this.state.playersSwapped !== null) {
      this.setState({ playersSwapped: false }, () => {
        console.warn(this.state.playersSwapped);
        this.setTimeoutID = setTimeout((() => {
          this.onLocationUpdate(racer, race);
        }).bind(this), racer.timeDelta);
      });
      // }
    }
    // console.warn('onPlay, location: ', JSON.stringify(location));

    // this.setTimeoutID = setTimeout((() => {
    //   this.onLocationUpdate(racer, race);
    // }).bind(this), racer.timeDelta);

    if (typeof this.state.playerSetup.challenge.message === 'object') {
      this.waitAndSpeak(this.state.playerSetup.challenge.message.raceStart);
    } else {
      this.waitAndSpeak('Oh-your-marks, get-set, Oh, they already started!');
    }
  }

  onPause() {
    console.log('~~~ clearing ~~~ ', this.setTimeoutID);
    clearTimeout(this.setTimeoutID);
  }

  onReset() {
    this.onPause();
    const newState = {};
    newState.progress = this.state.progress;
    newState.raceStatus = null;
    newState.playersSwapped = null;
    newState.progress.playerDist = 0;
    newState.progress.opponentDist = 0;
    newState.progress.playerWon = false;
    newState.progress.opponentWon = false;
    this.setState(newState/*{
      history: [],
      raceStatus: null,
      playersSwapped: null,
      progress: {
        playerDist: 0,
        opponentDist: 0,
        totalDist: this.state.opponentSetup.opponent[this.state.opponentSetup.opponent.length - 1].distanceTotal,
        playerWon: false,
        opponentWon: false
      }
    }*/);
    this.racerIndex = 0;
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
          let messageParsed;
          try {
            messageParsed = JSON.parse(nextState.raceSetup.challenge.message);
          } catch (error) {
            //Do nothing.
          }

          if (typeof messageParsed === 'object') {
            nextState.raceSetup.challenge.message = messageParsed;
          }
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
