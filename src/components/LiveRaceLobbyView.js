import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { View, ScrollView, Text, TextInput } from 'react-native';

import ModalDropdown from 'react-native-modal-dropdown';

import { ThemeProvider, COLOR } from 'react-native-material-ui';
import { Avatar, Card, ListItem, Subheader, Toolbar, Checkbox, Button} from 'react-native-material-ui';
import BackgroundGeolocation from 'react-native-background-geolocation';

import uiTheme from './uiTheme.js';
import LiveRaceSetupNewLobby from './LiveRaceSetupNewLobby.js';
import RaceProgress from './RaceProgress';
import RaceStatus from './RaceStatus';
import {findDistance, processLocation, getRaceStatus} from '../utils/raceUtils.js';
import {getLiveRaceStatus} from '../utils/liveRaceUtils.js';

import usain from '../../assets/presetChallenges/UsainBolt100m';

// Development Server
// const SERVER = 'http://127.0.0.1:5002';
// const SOCKETSERVER = 'ws://127.0.0.1:5002';

const SERVER = 'https://racewithfriends.tk:8000'
const SOCKETSERVER = 'wss://racewithfriends.tk:8000';
let ws;


// Temporary Styles Sheet Manual Definition
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    alignSelf: "stretch",
  },

  textContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
  },

  textInputContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      height: 25,
  },

  statusContainer: {
      flex: 1,
      justifyContent: 'flex-start',
      flexDirection: 'column',
      alignItems: 'flex-start',
      alignSelf: "stretch",
      width: Dimensions.get('window').width,
  },

  fullwidthView: {
    alignSelf: 'flex-end',
    width: Dimensions.get('window').width,
  }
});

export default class LiveRaceLobby extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      availableLobbies: [],
      lobbyConnection: undefined,
      defaultLobbyOption: '<Select Lobby>',
      showSetupNewLobby: false,
      liveRaceDistance: null,
      raceStatus: null,
      history: [], // The user's race history
      opponent: [], // The opponent's race history
      progress: { // Current race progress
        playerDist: 0,
        opponentDist: 0,
        totalDist: null,
        playerWon: false,
        opponentWon: false
      },
      raceStarted: false
    };
    this.setTimeoutID;
    this.onLocationUpdate = this.onLocationUpdate.bind(this);

    // this.props.userID = 'joe';
  }

  componentWillMount() {
    // console.warn = function() {

    // };
    this.getLiveRaces();
    // this.beginGPSTracking();
  }

  componentWillUnmount() {
    // Disconnect from server if any connection exists
    if (this.state.lobbyConnection) {
      this.state.lobbyConnection.close();
    }

    // Turn off Background Geolocation listeners. //
    BackgroundGeolocation.un('location', this.onLocationUpdate);
    BackgroundGeolocation.un('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.un('heartbeat', this.onLocationUpdate);
  }

  getLiveRaces = () => {
    fetch(SERVER + '/liveraces?participantID=' + this.props.userID, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((lobbies) => {
        if (lobbies !== []) {
          this.setState( {
            availableLobbies: lobbies,
            organiser: undefined,
            createdOn: undefined,
            participants: [],
            isReady: false,
            liveRaceDistance: undefined,
            defaultLobbyOption: lobbies[0].toString()
          })
          this.handlePickLobby(lobbies[0]);
        }
      })
      .catch((error) => {
        console.log(error);
        // console.warn(error);
      });
  }


  handleToggleReady = () => {

    // Only toggle readiness if within a lobby
    if (this.state.lobbyConnection) {
      // Toggle User Readiness
      this.setState({
        isReady: !this.state.isReady
      }, () => {
        // Send readiness update to server
        if (this.state.isReady) {
          this.state.lobbyConnection.send(JSON.stringify(['ready']));
          ws.addEventListener('message', (event) => {
            let eventData = JSON.parse(event.data);

            if (eventData[0] === 'position-update') {
              let opponent = this.state.opponent
              opponent.push(eventData[1]);

              this.setState({
                opponent: opponent
              });
            } else if (eventData[0] === 'announcement' && eventData[1] === 'start-race') {
              this.setState({
                raceStarted: true
              }, () => {
                this.handleRacePress();
              })
            }
          });
        } else {
          this.state.lobbyConnection.send(JSON.stringify(['not-ready']));
        }
      });
    } else {
      this.setState({
        isReady: false
      });
    }
  }

  // Handler for when the organiser press the "RACE" button
  handleRacePress = () => {

    this.beginGPSTracking();
    // This handler fires whenever bgGeo receives a location update.
    BackgroundGeolocation.on('location', this.onLocationUpdate);
    // This handler fires when movement states changes (stationary->moving; moving->stationary)
    BackgroundGeolocation.on('motionchange', this.onLocationUpdate);
    BackgroundGeolocation.on('heartbeat', this.onLocationUpdate);
    BackgroundGeolocation.changePace(true);

    if (!this.state.raceStarted) {
      ws.send(JSON.stringify(['announcement', 'start-race']));
    }

    // ws.addEventListener('message', (event) => {
    //     let eventData = JSON.parse(event.data);

    //     if (eventData[0] === 'position-update') {
    //       let opponent = this.state.opponent
    //       opponent.push(eventData[1]);

    //       this.setState({
    //         opponent: opponent
    //       });
    //     }
    // });

    this.setState({
      raceStarted: true,
      // opponent: usain
    })
  }

  handleNewRaceCreated = () => {
    this.setState({
      showSetupNewLobby: false
    });
    this.getLiveRaces();
  }

  handlePickLobby = (pickedLiveRaceID) => {

    console.log('handlePickLobby called: pickedLiveRaceID: ', pickedLiveRaceID);
    if (this.state.availableLobbies[pickedLiveRaceID] === undefined) {
      this.setState({
        showSetupNewLobby: true
      });
      return;
    }

    // Disconnect from existing lobby if connected
    if (this.state.lobbyConnection) {
      this.state.lobbyConnection.close();
    }

    // Connect to lobby

    ws = new WebSocket(SOCKETSERVER + '/liveraces/' + pickedLiveRaceID + '?userid=' + this.props.userID);

    // Connection opened
    ws.addEventListener('open', (event) => {
        console.log('socket opened');
    });

    // Listen for messages
    ws.addEventListener('message', (event) => {
        console.log('Message from server', event.data);
        let eventData = JSON.parse(event.data);

        if (eventData[0] === 'lobbystatus') {
          lobbyData = eventData[1];
          console.log(lobbyData);
          let progress = this.state.progress;
          progress.totalDist = lobbyData.length;
          this.setState({
            name: lobbyData.name,
            description: lobbyData.description,
            liveRaceDistance: lobbyData.length,
            organiser: lobbyData.organiserID,
            participants: lobbyData.participants,
            createdOn: lobbyData.createdOn,
            lobbyConnection: ws,
            progress: progress
          });
        }
    });
    console.log('LiveRaceLobbyView: handlePickLobby invoked');
  }

  areAllParticipantsReady = () => {
    if (!this.state.participants) {
      return false;
    }

    let areAllParticipantsReady = true;
    this.state.participants.forEach(participant => {
      if (participant.isReady === false) {
        areAllParticipantsReady = false;
      }
    });
    return areAllParticipantsReady;
  }

  onLocationUpdate(location) {
    clearInterval(this.setTimeoutID);

    // Bandaid Fix for error at start of live races when no data points are available from the opponent.
    if (this.state.opponent.length === 0) {
      setTimeout(this.onLocationUpdate.bind(this, location), 1000);
      return
    }

    let currentLoc = processLocation(location, this.state.history);
    ws.send(JSON.stringify(['position-update', currentLoc]));

    let newRaceStatus = getLiveRaceStatus(currentLoc, this.state.opponent, this.state.raceStatus, this.state.liveRaceDistance);

    // console.error('newRaceStatus: ', JSON.stringify(newRaceStatus));
    // console.error(JSON.stringify(newRaceStatus))
    // if (this.state.opponent.length >= 2) {
    //   newRaceStatus = getRaceStatus(currentLoc, this.state.opponent, this.state.raceStatus, this.state.liveRaceDistance);
    // }

    const newState = this.state;
    newState.history.push(currentLoc);
    newState.raceStatus = newRaceStatus;
    newState.progress.playerDist = currentLoc.distanceTotal;
    newState.progress.opponentDist = currentLoc.distanceTotal - newRaceStatus.distanceToOpponent;
    // newState.progress.totalDist = newRaceStatus.totalDist;
    // newState.chartData.push({time: location.timeTotal, distanceToOpponent: newRaceStatus.distanceToOpponent});
    this.setState(newState);

    if (!newRaceStatus.challengeDone) {
      this.setTimeoutID = setTimeout((() => {
        BackgroundGeolocation.getCurrentPosition.call(this, (location, taskId) => {
          this.onLocationUpdate(location);
        });
      }).bind(this), 10000);
    } else { // Race complete.

    // console.error(JSON.stringify(newRaceStatus))

      if (newRaceStatus.distanceToOpponent > 0) { // Opponent Won

      } else if (newRaceStatus.distanceToOpponent < 0) { // Player Won

      } else { // Tie!
        // this.waitAndSpeak('Wow, you and your opponent tied!');
      }

      BackgroundGeolocation.un('location', this.onLocationUpdate);
      BackgroundGeolocation.un('motionchange', this.onLocationUpdate);
      BackgroundGeolocation.un('heartbeat', this.onLocationUpdate);
    }
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

  // setLiveRaceLength(distance) {
  //   this.setState({
  //     liveRaceDistance: distance
  //   }, () => {})
  // }

  render() {
    let lobbyOptions = this.state.availableLobbies.slice();
    lobbyOptions.push('<New Lobby>');

    return (
      <ThemeProvider uiTheme={uiTheme}>
        <View style={styles.container}>
          <View style={styles.fullwidthView}>
            <Subheader text="Realtime Live Race" />
          </View>

          {this.state.showSetupNewLobby &&
            <LiveRaceSetupNewLobby
              userID={this.props.userID}
              onNewRaceCreated={this.handleNewRaceCreated}
              // setLiveRaceLength={this.setLiveRaceLength.bind(this)}
            />
          }


          {!this.state.showSetupNewLobby &&
          <View style={styles.container}>
              <Text style={{paddingTop: 16, fontWeight: 'bold', fontSize: 24}}>Selected Lobby</Text>
              <ModalDropdown
                options={lobbyOptions}
                onSelect={this.handlePickLobby}
                textStyle={{fontSize: 24}}
                defaultValue={this.state.defaultLobbyOption}
                // style={{marginBottom: 25}}
              />

            {/* Current Live Race Info */}
            <Card>
                <ListItem
                    leftElement={<Avatar text="MW" />}
                    centerElement={{
                        primaryText: this.state.name || 'N/A',
                        secondaryText: this.state.createdOn || 'N/A'
                    }}       
                />
                <View style={{width: Dimensions.get('window').width - 20}}>
                    <Text style={styles.textContainer}>
                        Distance: {this.state.liveRaceDistance + '\n'}
                        Description: {this.state.description + '\n'}

                    </Text>
                </View>
            </Card>

            {this.state.raceStarted && <RaceProgress progress={this.state.progress} /> }
            {this.state.raceStarted &&
              <RaceStatus
                status={this.state.raceStatus}
                playerName={'Player'}
                opponentName={'Opponent'}
              />
            }

              {/* Participant Ready Status */}
              <View style={styles.statusContainer}>
                <View style={styles.fullwidthView}>
                  {this.state.participants &&
                    <Subheader text="Runners" />
                  }
                  {this.state.participants && this.state.participants.map(participant => {
                    return (
                        <Button
                          key={participant.id}
                          raised
                          disabled={!participant.inLobby}
                          primary={participant.inLobby && participant.isReady}
                          accent={participant.inLobby && !participant.isReady}
                          text={participant.name}
                          />
                    )
                  })}
                </View>
              </View>


              {/* Bottom Race & Ready Button */}
              <View style={styles.fullwidthView}>
                {this.areAllParticipantsReady() &&
                  <Button style={{container:{backgroundColor: "#0000ff"}}} raised primary text="Race!" onPress={this.handleRacePress} />
                }

                {this.state.isReady ?
                  <Button raised primary text="Ready" onPress={this.handleToggleReady} /> :
                  <Button raised accent text="Not Ready" onPress={this.handleToggleReady} />
                }
              </View>
            </View>
          }
          </View>
      </ThemeProvider>
    )
  }
}