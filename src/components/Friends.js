import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions
} from 'react-native';

import { COLOR, ThemeProvider, ListItem, Subheader } from 'react-native-material-ui';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BottomNavigation, { Tab } from 'react-native-material-bottom-navigation';

import FriendsList from './FriendsList';
import FriendView from './FriendView';
import FindFriend from './FindFriend';

export default class Friends extends Component {
  constructor(props) {
    super(props);
    this.state = {
      friends: [],
      displayState: 'list',
      selectedFriend: null,
      currentTab: 0,
    };
  }

  componentDidMount() {
    this.getFriends((result) => {
      this.setState ({
        friends: result
      });
    });
  }

  getFriends(callback) {
    let userId = this.props.userId;
    fetch('https://racewithfriends.tk:8000/friends/all/' + userId,
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
    fetch('https://racewithfriends.tk:8000/addfriend/', {
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

  onTabChange(newTabIndex) {
    this.setState({
      currentTab: newTabIndex
    });
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
        alignItems: 'center',
        backgroundColor: '#F5FCFF'
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
          {this.state.currentTab === 0 &&
            <View style={styles.listContent}>
              <FriendsList
                searchable={true}
                friends={this.state.friends}
                onFriendSelect={this.onFriendSelect.bind(this)}
                onButtonPress={this.onButtonPress.bind(this)}
              />
            </View>
          }
          {this.state.currentTab === 1 &&
            <View style={styles.listContent} >
              <FindFriend
                onAddFriend={this.onAddFriend.bind(this)}
              />
            </View>
          }
          {this.state.displayState === 'selected' &&
            <View style={styles.center} >
              <FriendView friend={this.state.selectedFriend} />
            </View>
          }
            <BottomNavigation
              labelColor="white"
              rippleColor="white"
              style={{ height: 56, elevation: 8, position: 'absolute', left: 0, bottom: 0, right: 0 }}
              onTabChange={this.onTabChange.bind(this)}
            >
            <Tab
              barBackgroundColor="#00796B"
              label="My Friends"
              icon={<Icon size={24} color="white" name="directions-run" />}
            />
            <Tab
              barBackgroundColor="#37474F"
              label="Find Friends"
              icon={<Icon size={24} color="white" name="show-chart" />}
            />
          </BottomNavigation>
        </View>
      </ThemeProvider>
    );
  }
}