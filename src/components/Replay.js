
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  // Button,
} from 'react-native';

import { Vibration, Dimensions } from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import { ThemeProvider, Toolbar, Button, Subheader, Card } from 'react-native-material-ui';
import uiTheme from './uiTheme.js';

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

// const myRuns = {
//   'James Market St': james,
//   'Nick Market St': nick,
// };

let myRuns;
let challenges;

const raceTypes = {
  Presets: presets,
  'My Runs': myRuns,
  Challenges: challenges
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
      },
      replayState: "paused"
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

    this.getRuns((responseJSON) => {
      let newRuns = {};
      responseJSON.forEach((run) => {
        newRuns[run.name] = run.data;
      });
      raceTypes['My Runs'] = newRuns;
    });

    Tts.addEventListener('tts-finish', (event) => {
      // console.warn('tts-finish: ', event);
      if (speechQueue.size() > 0) {
        Tts.speak(speechQueue.dequeue());
      }
    });
    Tts.addEventListener('tts-cancel', (event) => console.warn('tts-cancel: ', event));
  }

  onLocationUpdate(racerLoc, race, racer) {
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
    }, racer ? racer : false);

    if (this.state.playersSwapped) {
      newRaceStatus.distanceRemaining += newRaceStatus.distanceToOpponent;
    }

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
      newState.progress.totalDist = racer[racer.length - 1].distanceTotal;
    }
    this.setState(newState);

    if (newRaceStatus.challengeDone) {
      // console.warn('current: ', newRaceStatus);
      if (newRaceStatus.distanceToOpponent < 0) { // Opponent Won

        if (typeof this.state.opponentSetup.challenge.message === 'object') {
          this.waitAndSpeak(this.state.opponentSetup.challenge.message.opponentWon);
        } else {
          if (this.state.playersSwapped) {
            this.waitAndSpeak(`Wow: The player beat the opponent by
              ${Math.round(newRaceStatus.distanceToOpponent * -1)} meters.`);
          } else {
            this.waitAndSpeak(`Wow: The opponent beat the player by
              ${Math.round(newRaceStatus.distanceToOpponent * -1)} meters.`);
          }
        }
        if (this.state.playersSwapped) {
          newState.progress.playerWon = true;
        } else {
          newState.progress.opponentWon = true;
        }
        this.setState(newState);
      } else if (newRaceStatus.distanceToOpponent > 0) { // Player Won

        if (typeof this.state.playerSetup.challenge.message === 'object') {
          this.waitAndSpeak(this.state.playerSetup.challenge.message.playerWon);
        } else {
          if (this.state.playersSwapped) {
            this.waitAndSpeak(`Incredible, the opponent beat the player by
              ${Math.round(newRaceStatus.distanceToOpponent)} meters.`);
          } else {
            // console.warn('playersSwapped: ', this.state.playersSwapped);
            this.waitAndSpeak(`Incredible, the player beat the opponent by
              ${Math.round(newRaceStatus.distanceToOpponent)} meters.`);
          }
        }

        if (this.state.playersSwapped) {
          newState.progress.opponentWon = true;
        } else {
          newState.progress.playerWon = true;
        }
        this.setState(newState);
      } else {
        this.waitAndSpeak('The player and the opponent tied!');
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
        this.onLocationUpdate(nextRacerLoc, race, racer);
      }).bind(this), nextRacerLoc.timeDelta);
    }
  }

  getChallenges(callback) {
    fetch('https://www.racewithfriends.tk:8000/challenges?opponent=' + this.props.userId, {
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

  getRuns(callback) {
    fetch('https://www.racewithfriends.tk:8000/users/' + this.props.userId + '/runs',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
      .then((response) => {
        return response.json();
      })
      .then((responseJson) => {
        callback(responseJson);
      })
      .catch((error) => {
        console.error(error);
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
    this.setState({
      replayState: 'playing'
    });

    let player = this.state.playerSetup.player;
    let opponent = this.state.opponentSetup.opponent;
    let racer;
    let racerLoc;
    let race;

    if (this.state.playersSwapped || player[player.length - 1].timeTotal > opponent[opponent.length - 1].timeTotal) {
    // If the player's total time is greater than that of the opponent,
      racerLoc = opponent[this.racerIndex];
      racer = opponent;
      race = player;
      this.setState({ playersSwapped: true }, () => {
        // console.warn(this.state.playersSwapped);
        this.setTimeoutID = setTimeout((() => {
          this.onLocationUpdate(racerLoc, race,
            racer[racer.length - 1].distanceTotal > race[race.length - 1].distanceTotal ? race : racer
          );
        }).bind(this), racerLoc.timeDelta);
      });
      // use the opponent instead for deriving the current racer location.
    } else {
    // otherwise use player to derive the current racer location.
      racerLoc = player[this.racerIndex];
      racer = player;
      race = opponent;
      this.setState({ playersSwapped: false }, () => {
        // console.warn(this.state.playersSwapped);
        this.setTimeoutID = setTimeout((() => {
          this.onLocationUpdate(racerLoc, race,
            racer[racer.length - 1].distanceTotal > race[race.length - 1].distanceTotal ? race : racer
          );
        }).bind(this), racerLoc.timeDelta);
      });
    }

    if (typeof this.state.playerSetup.challenge.message === 'object') {
      this.waitAndSpeak(this.state.playerSetup.challenge.message.raceStart);
    } else {
      this.waitAndSpeak('The race has begun!');
    }
  }

  onPause() {
    this.setState({
      replayState: 'paused'
    });
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
    this.setState(newState);
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
        backgroundColor: '#EAEAEA',
      },
      list: {
        marginTop: 60,
        marginBottom: 56,
        flex: 1,
        width: Dimensions.get('window').width
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

    function customRenderRow(rowData, rowID, hightlighted) {
      return (
          <View>
            <Text style={{color: '#000000', fontSize: 16, paddingLeft: 15, paddingRight: 50, paddingTop: 10, paddingBottom: 20}}>
              {`${rowData}`}
            </Text>
          </View>
      )
    }

    return (
      <ThemeProvider uiTheme={uiTheme}>
        <View style={styles.container}>
          <View style={[styles.list, {paddingTop: 10}]}>
            <Card>
              <Subheader text="Select Racers" />
              <View style={{paddingLeft: 20, paddingBottom: 20}}>
                <ModalDropdown
                  options={['Presets', 'My Runs', 'Challenges']}
                  onSelect={this.onPickPlayerType.bind(this)}
                  defaultValue='Presets'
                  textStyle={{color: '#000000', fontSize: 25}}
                  dropdownStyle={{paddingTop: 10, paddingBottom: 10, marginLeft: 10}}
                  renderRow={customRenderRow}
                  renderSeparator={()=>''}
                />
                <ModalDropdown
                  options={this.state.playerSetup.options}
                  onSelect={this.onPickPlayer.bind(this)}
                  textStyle={{color: '#000000', fontSize: 20}}
                  dropdownStyle={{paddingTop: 10, paddingBottom: 10, marginLeft: 10}}
                  renderRow={customRenderRow}
                  renderSeparator={()=>''}
                  defaultValue='worldRecordRaceWalk100m'
                />
                <Text style={{
                  fontSize: 20,
                  paddingTop: 5
                }}>  - VS -  </Text>
                <ModalDropdown
                  options={['Presets', 'My Runs', 'Challenges']}
                  onSelect={this.onPickOpponentType.bind(this)}
                  textStyle={{color: '#000000', fontSize: 25}}
                  dropdownStyle={{paddingTop: 10, paddingBottom: 10, marginLeft: 10}}
                  renderRow={customRenderRow}
                  renderSeparator={()=>''}
                  defaultValue='Presets'
                />
                <ModalDropdown
                  options={this.state.opponentSetup.options}
                  onSelect={this.onPickOpponent.bind(this)}
                  textStyle={{color: '#000000', fontSize: 20}}
                  dropdownStyle={{paddingTop: 10, paddingBottom: 20, marginLeft: 10}}
                  renderRow={customRenderRow}
                  renderSeparator={()=>''}
                  defaultValue='worldRecordRaceWalk100m'
                />
              </View>
            </Card>
            <Card>
              <View>
                <Subheader text="Progress Replay" />
                <View style={{paddingLeft: 20, paddingBottom: 20}}>
                  <RaceStatus
                    status={this.state.raceStatus}
                    playerName={'Player'}
                    opponentName={'Opponent'}
                    playersSwapped={this.state.playersSwapped}
                  />
                  <RaceProgress progress={this.state.progress} />
                </View>
              </View>
            </Card>
          </View>
          <Button style={{container:{width: Dimensions.get('window').width}}} raised primary text="Reset" onPress={this.onReset.bind(this)} />
          {this.state.replayState === "playing" &&
            <Button style={{container:{width: Dimensions.get('window').width}}} raised primary text="Pause" onPress={this.onPause.bind(this)} />
          }
          {this.state.replayState === "paused" &&
            <Button style={{container:{width: Dimensions.get('window').width}}} raised accent text="Play" onPress={this.onPlay.bind(this)} />
          }
        </View>
      </ThemeProvider>
    );
  }
}
