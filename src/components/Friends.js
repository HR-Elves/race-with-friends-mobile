import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  Dimensions
} from 'react-native';

import { COLOR, ThemeProvider, ListItem, Subheader } from 'react-native-material-ui';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

  getFriends(callback) {
    let results = [];
    results[0] = {
      "fb_id": "1",
      "fullname": "Otto von Racerstein",
    };
    results[1] = {
      "fb_id": "2",
      "fullname": "Runny McRunnerson",
    };
    callback(results);
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
            <ScrollView style={styles.listContent}>
            {
              this.state.friends.map((friend) => {
               return (
                  <ListItem
                    key={friend.fb_id}
                    divider
                    leftElement={<Icon size={20} color="black" name="tag-faces" />}
                    centerElement={friend.fullname}
                    rightElement={<Image 
                      source={require('../../assets/images/green-check-mark.png')} 
                      style={{width: 20, height: 20}}
                    />} 
                    onPress={() => { this.onFriendSelect(friend); }}               
                  />
                );
              })
            } 
            </ScrollView>
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