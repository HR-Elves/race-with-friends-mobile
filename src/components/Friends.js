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
              <FriendsList friends={this.state.friends} onFriendSelect={this.onFriendSelect.bind(this)}/> 
            </View>           
          }
          {this.state.displayState === 'selected' && 
            <View style={styles.center} >
              <FriendView friend={this.state.selectedFriend} />
            </View>
          }       
        </View>
      </ThemeProvider>
    );
  }
}