import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions
} from 'react-native';

import { COLOR, ThemeProvider, ListItem, Subheader } from 'react-native-material-ui';
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
      promptVisible: false
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
        console.error(error);
      });
  }

  // getFriends(callback) {
  //   let results = [];
  //   results[0] = {
  //     "fb_id": "1",
  //     "fullname": "Otto von Racerstein",
  //   };
  //   results[1] = {
  //     "fb_id": "2",
  //     "fullname": "Runny McRunnerson",
  //   };
  //   callback(results);
  // } 

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
        console.error(error);
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
      promptVisible: true
    });
  }

  onSubmit(message) {
    // do POST to server
    this.setState({
      promptVisible: false,
      displayState: 'challengeSubmitted'
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
              <Subheader text='Choose a run as a challenge for your friends!' />
              <RunsList runs={this.state.runs} onRunSelect={this.onRunSelect.bind(this)}/>
            </View>
          }
          {this.state.displayState === 'selectFriends' &&
            <View style={styles.container}>
              <View style={styles.list}>
                <Subheader text={`Choose friends to challenge with ${this.state.selectedRun.name}!`} />
                <FriendsList friends={this.state.friends} onFriendSelect={this.onFriendSelect.bind(this)}/>         
              </View>
              <View>
                <Icon.Button 
                  name="flash-on" 
                  size={45}
                  backgroundColor="red"
                  borderRadius={15} 
                  onPress={this.onChallengeButtonPressed.bind(this)}
                > 
                  Issue Challenge!
                </Icon.Button> 
              </View>
            </View>
          }
          {this.state.displayState === 'challengeSubmitted' &&
            <View style={styles.center}>
              <Text>Your challenge has been issued to your friends!</Text>
            </View>            
          }
          <Prompt
            title='Write a message for your friends!'
            placeholder={'Here\'s a challenge for you!'}
            defaultValue=''
            visible={ this.state.promptVisible }
            onCancel={ () => this.setState({
              promptVisible: false,
            }) }
            onSubmit={ (message) => {
              this.onSubmit(message); 
            }}
            submitText='Challenge!'
            cancelText='Cancel'
          />
        </View>
      </ThemeProvider>
    );
  }
}