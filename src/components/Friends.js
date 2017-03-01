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

export default class Friends extends Component {
  constructor(props) {
    super(props);
    this.state = {
      friends: []
    }
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
      "id": 4,
      "fb_id": "1",
      "fullname": "Otto von Racerstein",
      "createdAt": "2017-03-01T02:13:10.000Z"
    };
    results[1] = {
      "id": 5,
      "fb_id": "2",
      "fullname": "Runny McRunnerson",
      "createdAt": "2017-03-01T02:13:10.000Z"
    };
    callback(results);
  } 

  render() {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        marginTop: 60,
        backgroundColor: '#F5FCFF',
        width: Dimensions.get('window').width
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
          <Subheader text="My Friends" />
          <ScrollView>
          {
            this.state.friends.map((friend) => {
             return (
                <ListItem
                  key={friend.id}
                  divider
                  leftElement={<Icon size={20} color="black" name="tag-faces" />}
                  centerElement={friend.fullname}
                  onPress={() => {}}               
                />
              );
            })
          } 
          </ScrollView>       
        </View>
      </ThemeProvider>
    );
  }
}