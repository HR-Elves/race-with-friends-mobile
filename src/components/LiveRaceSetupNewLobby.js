import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { View, Text, TextInput } from 'react-native';

import { ThemeProvider, COLOR } from 'react-native-material-ui';
import { Avatar, Card, ListItem, Button} from 'react-native-material-ui';

import uiTheme from './uiTheme.js';
import FriendsPicker from './FriendsPicker.js'

// Development local server
// const SERVER = 'http://127.0.0.1:5002';


const SERVER = 'https://racewithfriends.tk:8000'

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
});

export default class LiveRaceNewLobby extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showFriendsPicker: false,
      participants: []
    };
  }

  createRace = () => {
    console.log('CreateRace Called to:', SERVER + '/' + this.props.userID + '/liveraces');

    fetch(SERVER + '/users/' + this.props.userID + '/liveraces', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: this.raceName,
        description: this.raceDescription,
        length: this.raceDistance,
        opponentIDs: this.state.participants.map((participant) => participant.fb_id)
      })
    })
    .then((response) => response.json())
    .then((responseAsJSON) => {
      this.props.onNewRaceCreated(responseAsJSON);
    })
    .catch((error) => {
      console.log('createRace invoked: FETCH ERROR: ', error);
      this.props.onNewRaceCreated();
    });

  }

  handlePickNewRaceParticipants = (participantList) => {
    this.setState({
      showFriendsPicker: false,
      participants: participantList
    });
  }

  render() {
    let participantsText = "";
    if (this.state.participants) {
      for (let i = 0; i < this.state.participants.length; i++) {
        participantsText += (i !== 0 ? ', ' : '') + this.state.participants[i].fullname;
      }
    }

    return (
      <ThemeProvider uiTheme={uiTheme}>
        <View style={styles.container}>
          {(this.state && this.state.showFriendsPicker) ? <FriendsPicker onSubmit={this.handlePickNewRaceParticipants}/> : <Text></Text>}
          {this.state && !this.state.showFriendsPicker && 
            <Card>
              <Text style={[styles.textContainer, {paddingTop: 20}]}>
                <Text style={{paddingTop: 16, fontWeight: 'bold', fontSize: 24}}>
                  Setup New Live Race
                </Text>
              </Text>

              <View style={{width: Dimensions.get('window').width - 20}} >
                <Text style={styles.textContainer}>
                  Live Race Name:
                </Text>
                <TextInput style={styles.textInputContainer} placeholder="Race Name" returnKeyType="next" onChangeText={(text) => this.raceName = text}/>
                <Text style={styles.textContainer}>
                  Race Distance:
                </Text>
                <TextInput
                  style={styles.textInputContainer}
                  placeholder="Race Distance"
                  keyboardType="numeric"
                  returnKeyType="next"
                  onChangeText={(text) => {
                    this.raceDistance = text
                    // this.props.setLiveRaceLength(text);
                  }
                }/>
                <Text style={styles.textContainer}>
                  Race Description:
                </Text>
                <TextInput style={styles.textInputContainer} placeholder="Race Description" returnKeyType="next" onChangeText={(text) => this.raceDescription = text}/>
                <Text style={styles.textContainer}>
                  Race Participants:
                </Text>
                <Text style={styles.textContainer}>
                  {participantsText}
                </Text>
                <Button raised primary text="Pick Participants" onPress={() => this.setState({showFriendsPicker: true})}/>
                <Button raised primary text="Create Race" onPress={this.createRace} />
              </View>
            </Card>
          }
        </View>
      </ThemeProvider>
    )
  }
}