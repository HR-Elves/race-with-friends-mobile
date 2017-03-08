import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { View, ScrollView, Text, TextInput } from 'react-native';

import ModalDropdown from 'react-native-modal-dropdown';

import { ThemeProvider, COLOR } from 'react-native-material-ui';
import { Avatar, Card, ListItem, Subheader, Toolbar, Checkbox, Button} from 'react-native-material-ui';

import uiTheme from './uiTheme.js';
import LiveRaceSetupNewLobby from './LiveRaceSetupNewLobby.js';

// Development Server
// const SERVER = 'http://127.0.0.1:5002';
// const SOCKETSERVER = 'ws://127.0.0.1:5002';

const SERVER = 'https://racewithfriends.tk:8000'
const SOCKETSERVER = 'wss://racewithfriends.tk:8000';


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
      showSetupNewLobby: false
    };

    // this.props.userID = 'joe';
  }

  componentWillMount() {
    console.warn = function() {

    };
    this.getLiveRaces();
  }

  componentWillUnmount() {
    // Disconnect from server if any connection exists
    if (this.state.lobbyConnection) {
      this.state.lobbyConnection.close();
    }
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
            length: undefined,
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

    let ws = new WebSocket(SOCKETSERVER + '/liveraces/' + pickedLiveRaceID + '?userid=' + this.props.userID);

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
          this.setState({
            name: lobbyData.name,
            description: lobbyData.description,
            length: lobbyData.length,
            organiser: lobbyData.organiserID,
            participants: lobbyData.participants,
            createdOn: lobbyData.createdOn,
            lobbyConnection: ws
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

  render() {
    let lobbyOptions = this.state.availableLobbies.slice();
    lobbyOptions.push('<New Lobby>');

    return (
      <ThemeProvider uiTheme={uiTheme}>
        <View style={styles.container}>

          <View style={styles.fullwidthView}>      
            <Toolbar centerElement="Realtime Live Race" />        
          </View> 

          {this.state.showSetupNewLobby &&
            <LiveRaceSetupNewLobby userID={this.props.userID} onNewRaceCreated={this.handleNewRaceCreated} /> 
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
                        primaryText: this.state.name,
                        secondaryText: this.state.createdOn,
                    }}
                />
                <View style={{width: Dimensions.get('window').width - 20}}>
                    <Text style={styles.textContainer}>
                        Length: {this.state.length + '\n'}
                        Description: {this.state.description + '\n'}

                    </Text>
                </View>
            </Card> 



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