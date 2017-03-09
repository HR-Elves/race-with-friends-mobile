
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  ProgressViewIOS,
  Modal,
  TouchableHighlight,
  Image,
  Dimensions
} from 'react-native';
import {Vibration} from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import Prompt from 'react-native-prompt';
import ModalDropdown from 'react-native-modal-dropdown';
import Tts from 'react-native-tts';
import _ from 'lodash';

import {findDistance, processLocation, getRaceStatus} from '../utils/raceUtils.js';
import RaceProgress from './RaceProgress';
import RaceStatus from './RaceStatus';
import PostRace from './PostRace';
import LiveRaceLobbyView from './LiveRaceLobbyView.js';

import usain from '../../assets/presetChallenges/UsainBolt100m';
import walk from '../../assets/presetChallenges/worldRecordRaceWalk100m';
import james from '../../assets/presetChallenges/MarketSt3';
import nick from '../../assets/presetChallenges/MarketSt4';
import hare from '../../assets/presetChallenges/hareFromFable';

import { ThemeProvider, COLOR } from 'react-native-material-ui';
import { ActionButton, Avatar, Card, ListItem, Subheader, Toolbar} from 'react-native-material-ui';
import { Button as MaterialButton } from 'react-native-material-ui';
import CommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';

import uiTheme from './uiTheme.js';

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
  Live: 'live',
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

export default class Race extends Component {

  constructor(props) {
    super(props);
    this.state = {
      history: [],
      chartData: [],
      raceStatus: null,
      promptVisible: false,
      raceName: null,
      raceDescription: null,
      progress: {
        playerDist: 0,
        opponentDist: 0,
        totalDist: walk[walk.length - 1].distanceTotal,
        playerWon: false,
        opponentWon: false
      },
      showSetupRace: true, //Render the race setup
      raceSetup: {
        raceType: 'Presets',
        oppOptions: Object.keys(presets),
        opponent: walk,
        challenge: walk
      }
      // raceTabOn: false,
    };
    this.setTimeoutID = null;
    this.onLocationUpdate = this.onLocationUpdate.bind(this);
    this.beginGPSTracking = this.beginGPSTracking.bind(this);
  }

  componentWillMount() {
    this.beginGPSTracking();
    // console.warn('====== this.props at willMount = ', JSON.stringify(this.props.userId));
    this.getChallenges((responseJSON) => {
      // console.warn(JSON.stringify(responseJSON));
      let newChallenges = {};
      responseJSON.forEach((challenge) => {
        newChallenges[challenge.name] = challenge;
      });
      raceTypes['Challenges']  = newChallenges;
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

  componentDidMount() {
    // Speech.supportedVoices()
    // .then(locales => {
    //   console.error(locales); // ["ar-SA", "en-ZA", "nl-BE", "en-AU", "th-TH", ...]
    // });

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
    let newRaceStatus = getRaceStatus(currentLoc, this.state.raceSetup.opponent, this.state.raceStatus);

    if (newRaceStatus.passedOpponent) {
      this.waitAndSpeak('You just passed your opponent!');
    }
    if (newRaceStatus.distanceToOpponent > 0) {
      let pattern = [0];
      Vibration.vibrate(pattern);
    }

    let newState = this.state;
    newState.history.push(currentLoc);
    newState.raceStatus = newRaceStatus;
    newState.progress.playerDist = currentLoc.distanceTotal;
    newState.progress.opponentDist = currentLoc.distanceTotal - newRaceStatus.distanceToOpponent;
    newState.chartData.push({time: location.timeTotal, distanceToOpponent: newRaceStatus.distanceToOpponent});
    this.setState(newState);

    if (!newRaceStatus.challengeDone) {
      this.setTimeoutID = setTimeout((() => {
        BackgroundGeolocation.getCurrentPosition.call(this, (location, taskId) => {
          this.onLocationUpdate(location);
        });
      }).bind(this), 10000);
    } else { // challenge done
      // console.warn('last newRaceStatus', newRaceStatus);
      if (newRaceStatus.distanceToOpponent > 0) {
        // console.warn('we won!');
        if (typeof this.state.raceSetup.challenge.message === 'object') {
          this.waitAndSpeak(this.state.raceSetup.challenge.message.playerWon);
        } else {
          this.waitAndSpeak(`Congratulations, you beat your opponent by ${Math.round(newRaceStatus.distanceToOpponent)} meters.`);
        }
      } else if (newRaceStatus.distanceToOpponent < 0) {
        if (typeof this.state.raceSetup.challenge.message === 'object') {
          this.waitAndSpeak(this.state.raceSetup.challenge.message.opponentWon);
        } else {
          this.waitAndSpeak(`I'm Sorry to report that your opponent beat you by ${Math.round(newRaceStatus.distanceToOpponent * -1)} meters.`);
        }
      } else {
        this.waitAndSpeak('Wow, you and your opponent tied!');
      }
      BackgroundGeolocation.un('location', this.onLocationUpdate);
      BackgroundGeolocation.un('motionchange', this.onLocationUpdate);
      BackgroundGeolocation.un('heartbeat', this.onLocationUpdate);
    }
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
      // console.warn('res.id =>', responseJSON.id);
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

    if (typeof this.state.raceSetup.challenge.message === 'object') {
      this.waitAndSpeak(this.state.raceSetup.challenge.message.raceStart);
    } else {
      this.waitAndSpeak('oh mer gherd, we are now recording!');
    }
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
    clearInterval(this.setTimeoutID);

    BackgroundGeolocation.un('location', this.onLocationUpdate);
    BackgroundGeolocation.un('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.un('heartbeat', this.onLocationUpdate);

    let newState = this.state;
    newState.history = [];
    newState.raceStatus = null;
    newState.progress.playerDist = 0;
    newState.progress.opponentDist = 0;
    newState.progress.playerWon = false;
    newState.progress.opponentWon = false;
    this.setState(newState);
  }

  showSetupRace(visible) {
    this.setState({
      showSetupRace: visible
    });
  }

  onPickRaceType(key, value) {
    const newState = {};
    newState.raceSetup = this.state.raceSetup;
    newState.raceSetup.raceType = value;
    // console.warn('challenges = ', challenges);
    newState.raceSetup.oppOptions = Object.keys(raceTypes[value]);

    this.setState(newState);
  }

  onPickOpponent(key, value) {
    const newState = {};
    newState.raceSetup = this.state.raceSetup;
    newState.raceSetup.opponent = raceTypes[this.state.raceSetup.raceType][value];
    newState.raceSetup.challenge = raceTypes[this.state.raceSetup.raceType][value];


    // console.error(JSON.stringify(newState));
    this.setState(newState, () => {
      if (newState.raceSetup.opponent.run_id) {
        let runId = newState.raceSetup.opponent.run_id;
        fetch('https://www.racewithfriends.tk:8000/runs/' + runId, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }).then((response) => {
          return response.json();
        }).then((responseJson) => {
          const nextState = {};
          nextState.raceSetup = this.state.raceSetup;
          nextState.raceSetup.opponent = responseJson.data;

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
            // console.warn('Updated State! ', nextState.raceSetup.challenge.message);
          });
        }).catch((error) => {
          console.error('onPickOpponent error: ', error);
        });
      }
    });
    // console.error('newState: ', newState.raceSetup.opponent.run_id);
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
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#EAEAEA',
      },
      buttons: {
        // flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        flexDirection: 'row',
        marginTop: 20
      },
      fullwidthView: {
        width: Dimensions.get('window').width,
      },
      centerText: {
        textAlign: 'center',
        fontSize: 17
      },
      center: {
        alignItems: 'center',
        justifyContent: 'center'
      },
      bigText: {
        fontSize: 20
      },
      dropdownLabel: {
        fontSize: 17,
        color: '#00695C'
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
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#EAEAEA',
          marginTop: 50
        }}>
          {!this.state.showSetupRace &&
            <View style={styles.container}>
                <RaceProgress progress={this.state.progress} />
                <RaceStatus
                  status={this.state.raceStatus}
                  playerName={'Player'}
                  opponentName={'Opponent'}
                />
                <View style={styles.buttons}>
                  <Icon.Button
                    name="play-circle-outline"
                    size={25}
                    backgroundColor='#004D40'
                    borderRadius={5}
                    onPress={this.onRecord.bind(this)}
                  >
                    Start
                  </Icon.Button>
                  <Icon.Button
                    name="pause-circle-outline"
                    size={25}
                    backgroundColor='#26A69A'
                    borderRadius={5}
                    onPress={this.onStopRecord.bind(this)}
                  >
                    Stop
                  </Icon.Button>
                  <Icon.Button
                    name="clear"
                    size={25}
                    backgroundColor='#80CBC4'
                    borderRadius={5}
                    onPress={this.clearHistory.bind(this)}
                  >
                    Reset
                  </Icon.Button>
              </View>
            </View>}
          {this.state.showSetupRace && this.state.raceSetup.raceType !== 'Live' &&
            <View style={styles.container}>
              <View style={styles.fullwidthView}>
                <Subheader text='Setup Race' />
                <Card style={{marginLeft: 20, marginRight: 20}} >
                  <View style={styles.center}>
                    <Text></Text>
                    <Avatar icon='directions-run' />
                    <Text style={styles.bigText}>Race Selction</Text>
                  </View>
                  <ListItem
                      centerElement={<Text style={styles.centerText}>Select a race type:</Text>}
                  />
                  <ModalDropdown
                    options={['Presets', 'My Runs', 'Challenges', 'Live']}
                    onSelect={this.onPickRaceType.bind(this)}
                    style={styles.center}
                    dropdownStyle={{paddingTop: 10, paddingBottom: 10, marginLeft: 0}} 
                    renderRow={customRenderRow}
                    renderSeparator={()=>''}                    
                    textStyle={styles.dropdownLabel}
                    defaultValue='Presets'
                  />
                  <ListItem
                      centerElement={<Text style={styles.centerText}>Select an opponent:</Text>}
                  />
                  <ModalDropdown
                    options={this.state.raceSetup.oppOptions}
                    onSelect={this.onPickOpponent.bind(this)}
                    style={styles.center}
                    dropdownStyle={{paddingTop: 10, paddingBottom: 10, marginLeft: 0}} 
                    renderRow={customRenderRow}
                    renderSeparator={()=>''}                    
                    textStyle={styles.dropdownLabel}
                    defaultValue='worldRecordRaceWalk100m'
                  />
                  <Text></Text>
                  <Text></Text>
                </Card>
                <Card style={{marginLeft: 20, marginRight: 20}}>
                  <View style={styles.center}>
                    <Text></Text>
                    <Avatar icon='show-chart' />
                    <Text style={styles.bigText}>Race Details</Text>
                    <Text style={{fontSize: 17}}>{`Name: ${this.state.raceSetup.challenge.name ? this.state.raceSetup.challenge.name : 'Preset'}`}</Text>
                    <Text style={{fontSize: 17}}>{`Description: ${this.state.raceSetup.challenge.description ? this.state.raceSetup.challenge.description : 'Preset'}`}</Text>
                    <Text style={{fontSize: 17}}>{`Total Distance: ${Math.round(this.state.raceSetup.challenge.distanceTotal ? this.state.raceSetup.challenge.distanceTotal : this.state.raceSetup.challenge[this.state.raceSetup.challenge.length - 1].distanceTotal)} meters`}</Text>
                    <Text style={{fontSize: 17}}>{`Total Time: ${Math.round((this.state.raceSetup.challenge.timeTotal ? this.state.raceSetup.challenge.timeTotal : this.state.raceSetup.challenge[this.state.raceSetup.challenge.length - 1].timeTotal) / 1000)} seconds`}</Text>
                    <Text></Text>
                    <Text></Text>
                  </View>
                </Card>

                <MaterialButton raised accent text="Race!" onPress={() => {
                    this.showSetupRace(!this.state.showSetupRace);
                  }} />
              </View>
            </View>}
          {/* Conditional rendering of the "Live Race" lobby when users select Live Race as the option */}
            {this.state.raceSetup.raceType  === 'Live' &&
              <LiveRaceLobbyView userID={this.props.userId}/>
            }
          {<Prompt
            title="Please name your race."
            placeholder="Race Name"
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
            submitText='Publish Run'
            cancelText={'Don\'t Publish'}
          />}
        </View>
      </ThemeProvider>
    );
  }
}

              // {this.state.raceStatus && this.state.raceStatus.challengeDone &&
              //   <PostRace data={this.state.chartData}/>
              // }
