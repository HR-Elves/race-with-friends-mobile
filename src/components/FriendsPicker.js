import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import { ListItem, Subheader, Button, Card } from 'react-native-material-ui';
import { Dimensions } from 'react-native';

import FriendsList from './FriendsList.js'

export default class FriendsPicker extends Component {
  constructor(props) {
    super(props);

    this.state = {
      friends: undefined,
      selectedFriendsList: []
    }
  }

  componentWillMount() {
    this.getFriends((result) => {
      console.log('getFriends returned', result);
      this.setState ({
        friends: result
      });
    });
  }

  getFriends(callback) {
    let userId = this.props.userId;
    userId = '1233197366796721';
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

  handleFriendsSelect = (friend) => {
      console.log('handleFriendsSelect called: selected friend:', friend);

      if (this.state.selectedFriendsList.indexOf(friend) === -1) {
        newSelectedFriendsList = this.state.selectedFriendsList.slice();
        newSelectedFriendsList.push(friend);
        this.setState({
          selectedFriendsList: newSelectedFriendsList
        });
      } else {
        newSelectedFriendsList = this.state.selectedFriendsList.slice();
        newSelectedFriendsList.splice(this.state.selectedFriendsList.indexOf(friend),1);
        this.setState({
          selectedFriendsList: newSelectedFriendsList
        });
      }

  }

  render() {
    let selectedFriendsText = "";
    if (this.state.selectedFriendsList) {
      for (let i = 0; i < this.state.selectedFriendsList.length; i++) {
        selectedFriendsText += (i !== 0 ? ', ' : '') + this.state.selectedFriendsList[i].fullname;
      }
    }

    return (
      <View style={{marginTop: 22, width: Dimensions.get('window').width - 20, height: Dimensions.get('window').height - 20}} >
        <Text style={{paddingTop: 16, fontWeight: 'bold', fontSize: 12}}> Selected Participants: </Text>
        <Text style={{paddingBottom: 16}}> {selectedFriendsText} </Text>
        <View style={{width: Dimensions.get('window').width - 20, height: Dimensions.get('window').height - 200}}>
          {this.state.friends &&
            <FriendsList
              friends={this.state.friends}
              onFriendSelect={this.handleFriendsSelect}
            />
          }
          <Button raised primary text="Submit" onPress={() => this.props.onSubmit(this.state.selectedFriendsList)} />
        </View>
      </View>
    )
  }
}