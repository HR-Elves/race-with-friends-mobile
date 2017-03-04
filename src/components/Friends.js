import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions
} from 'react-native';

import { COLOR, ThemeProvider, ListItem, Subheader } from 'react-native-material-ui';
import Icon from 'react-native-vector-icons/MaterialIcons';

import FriendsList from './FriendsList';
import FriendView from './FriendView';
import FindFriend from './FindFriend';

export default class Friends extends Component {
  constructor(props) {
    super(props);
    this.state = {
      friends: [],
      displayState: 'list',
      selectedFriend: null
    };
  }

  componentWillMount() {
    this.getFriends((result) => {
      this.setState ({
        friends: result
      });
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
        console.log('######',responseJson)
        callback(responseJson);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  onFriendSelect(friend) {
    this.setState({
      displayState: 'selected',
      selectedFriend: friend
    });
  }

  onButtonPress() {
    this.setState({
      displayState: 'searchForFriends'
    })
  }

  onAddFriend(fb_id) {
    fetch('https://www.racewithfriends.tk:8000/addfriend/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.props.userId,
        friendId: fb_id
      })
    })
    .then((response) => {
      console.log('#####', response)
      this.getFriends((results) => {
        this.setState({
          displayState: 'list',
          friends: results
        })
      });
    })
    .catch((error) => {
      console.error(error);
    })
  }

  render() {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
        width: Dimensions.get('window').width
      },
      listContent: {
        marginTop: 60
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
            },
        },
    };

    return (
      <ThemeProvider uiTheme={uiTheme}>
        <View style={styles.container}>
          {this.state.displayState === 'list' &&
            <View style={styles.listContent}>
              <FriendsList
                searchable={true}
                friends={this.state.friends}
                onFriendSelect={this.onFriendSelect.bind(this)}
                onButtonPress={this.onButtonPress.bind(this)}
              />
            </View>
          }
          {this.state.displayState === 'selected' &&
            <View style={styles.center} >
              <FriendView friend={this.state.selectedFriend} />
            </View>
          }
          {this.state.displayState === 'searchForFriends' &&
            <View style={styles.listContent} >
              <FindFriend
                onAddFriend={this.onAddFriend.bind(this)}
              />
            </View>
          }
        </View>
      </ThemeProvider>
    );
  }
}