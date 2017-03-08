import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  TextInput,
  Dimensions
} from 'react-native';

import { COLOR, ThemeProvider, ListItem, Subheader, Toolbar, Button , Card} from 'react-native-material-ui';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Prompt from 'react-native-prompt';

import RunsList from './RunsList';
import FriendsList from './FriendsList';

export default class Challenge extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      runs: [],
      friends: [],
      displayState: 'selectRun',  // options are selectRun, selectFriends, and challengeSubmitted
      selectedRun: null,
      messages: {
        raceStart: '',
        playerWon: '',
        opponentWon: ''
      }
    });
  }

  componentWillMount() {
    this.getRuns((runs) => {
      this.getFriends((friends) => {
        this.setState ({
          runs: runs,
          friends: friends
        });
      });
    });
  }

  getRuns(callback) {
    let userId = this.props.userId;
    fetch('https://www.racewithfriends.tk:8000/users/' + userId + '/runs',
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
        console.error('get runs error', error);
      });
  }

  getFriends(callback) {
    let userId = this.props.userId;
    fetch('https://www.racewithfriends.tk:8000/friends/all/' + userId,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      })
      .then((response) => {
        return response.json();
      })
      .then((responseJson) => {
        callback(responseJson);
      })
      .catch((error) => {
        console.error('get friends error', error);
      });
  }

  onRunSelect(run) {
    this.setState({
      selectedRun: run,
      displayState: 'selectFriends'
    });
  }

  onFriendSelect(friend) {
    friend.selected = !friend.selected;
    this.setState({
      friends: this.state.friends
    });
  }

  onChallengeButtonPressed() {
    this.setState({
      displayState: 'newChallengeOptions'
    });
  }

  onSubmit() {
    // determine which friends have been selected to receive the challenge
    let opponents = [];
    this.state.friends.forEach((friend) => {
      if (friend.selected) {
        opponents.push(friend.fb_id);
      }
    });

    let postBody = {
      run_id: this.state.selectedRun.id,
      name: this.state.selectedRun.name,
      description: this.state.selectedRun.description,
      message: JSON.stringify(this.state.messages),
      created_on: (new Date()).toISOString(),
      opponents: opponents
    };

    // do POST to server
    fetch('https://www.racewithfriends.tk:8000/users/' + this.props.userId + '/challenges', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postBody)
    }).then((response) => {
      return response.json();
    }).then((responseJSON) => {
      this.setState({
        displayState: 'challengeSubmitted'
      });
    }).catch((error) => {
      console.error(error);
    });
  }

  onChallengeIssuedGoBack() {
    this.setState({
      displayState: 'selectRun'
    });
  }

  render() {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#F5FCFF'
      },
      list: {
        marginTop: 60,
        marginBottom: 56,
        flex: 1,
        width: Dimensions.get('window').width
      },
      center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      },
      text: {
        paddingLeft: 20,
        paddingBottom: 13,
        height: 30,       
      }
    });

    const uiTheme = {
        palette: {
            primaryColor: COLOR.green500,
        },
        toolbar: {
            container: {
                height: 50,
            }
        }
    };

    return (
      <ThemeProvider uiTheme={uiTheme}>
        <View style={styles.container}>
          {this.state.displayState === 'selectRun' &&
            <View style={styles.list}>
              <Toolbar centerElement="Challenges" />
              <Subheader text='Choose a run as a challenge for your friends!' />
              <RunsList runs={this.state.runs} onRunSelect={this.onRunSelect.bind(this)}/>
            </View>
          }
          {this.state.displayState === 'selectFriends' &&
            <View style={styles.container}>
              <View style={styles.list}>
                <Toolbar centerElement="Challenges" />              
                <Subheader text={`Choose friends to challenge with ${this.state.selectedRun.name}!`} />
                <FriendsList friends={this.state.friends} onFriendSelect={this.onFriendSelect.bind(this) }/>
              </View>
              <Button raised accent text="Challenge" onPress={this.onChallengeButtonPressed.bind(this)} /> 
            </View>
          }
          {this.state.displayState === 'newChallengeOptions' &&
            <View style={styles.container}>
              <View style={styles.list}>            
                <Toolbar centerElement="New Challenge" />
                <Subheader text='Choose your message!' />

                <Text style={styles.text}>When the race starts: </Text>
                <TextInput
                  style={styles.text}
                  onChangeText={(text) => { 
                    let messages = this.state.messages;
                    messages.raceStart = text;
                    this.setState({messages: messages});
                    }
                  }
                  value={this.state.messages.raceStart}
                  maxLength={80}
                  placeholder={'You\'re in for a challenge!'}
                />
                <Text style={styles.text}>When your opponent loses: </Text>
                <TextInput
                  style={styles.text}
                  onChangeText={(text) => { 
                    let messages = this.state.messages;
                    messages.opponentWon = text;
                    this.setState({messages: messages});
                    }
                  }
                  value={this.state.messages.opponentWon}
                  maxLength={80}
                  placeholder={'Better luck next time!'}
                />
                <Text style={styles.text}>When your opponent wins: </Text>
                <TextInput
                  style={styles.text}
                  onChangeText={(text) => { 
                    let messages = this.state.messages;
                    messages.playerWon = text;
                    this.setState({messages: messages});
                    }
                  }
                  value={this.state.messages.playerWon}
                  maxLength={80}
                  placeholder={'I can\'t believe you beat me!'}
                />
                
              </View>
              <Button raised accent text="Issue Challenge" onPress={this.onSubmit.bind(this)} />
            </View>
          }
          {this.state.displayState === 'challengeSubmitted' &&
            <View style={styles.container}>
              <View style={styles.list}>            
                <Toolbar centerElement="Challenge Issued" />
                <Subheader text='Your challenge has been issued to your friends' />
              </View>
              <Button raised primary text="Back" onPress={this.onChallengeIssuedGoBack.bind(this)} />
            </View>
          }          
        </View>
      </ThemeProvider>
    );
  }
}

            // <View style={styles.center}>
            //   <Toolbar centerElement="Challenges" />            
            //   <Text>Your challenge has been issued to your friends!</Text>
            // </View>


          // <Prompt
          //   title='Write a message for your friends!'
          //   placeholder={'Here\'s a challenge for you!'}
          //   defaultValue=''
          //   visible={ this.state.promptVisible }
          //   onCancel={ () => this.setState({
          //     promptVisible: false,
          //   }) }
          //   onSubmit={ (message) => {
          //     this.onSubmit(message);
          //   }}
          //   submitText='Challenge!'
          //   cancelText='Cancel'
          // />