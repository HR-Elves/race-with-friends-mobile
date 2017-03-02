import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image
} from 'react-native';

import {ListItem} from 'react-native-material-ui';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default class Challenge extends Component {
  constructor(props) {
    super(props);
  }

  render() {   
    return (
      <ScrollView>
      {
        this.props.friends.map((friend) => {
         return (
            <ListItem
              key={friend.fb_id}
              divider
              leftElement={<Icon size={20} color="black" name="tag-faces" />}
              centerElement={friend.fullname}
              rightElement={friend.selected ?
                <Image 
                  source={require('../../assets/images/green-check-mark.png')} 
                  style={{width: 20, height: 20}}
                />
                : <Text></Text>}
              onPress={() => {this.props.onFriendSelect(friend);}}               
            />
          );
        })
      } 
      </ScrollView>
    );
  }
}