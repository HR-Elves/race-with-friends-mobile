import React, {PropTypes, Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image
} from 'react-native';

import {ListItem, Button} from 'react-native-material-ui';

export default class FriendsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: '',
      text: '',
      searchable: true
    };
  }

  render() {
    const styles = StyleSheet.create({
      search: {
        flexDirection: 'row'
      },
      name: {
        // padding: 72
        textAlign: 'left'
      },
      empty: {
        marginRight: 50
      }
    });

    return (
      <ScrollView>
      {
        this.props.friends.map((friend) => {
          return (
            <ListItem
              key={friend.fb_id}
              divider
              leftElement={
                <Image
                  style={{width: 46, height: 46, borderRadius: 23}}
                  source={{uri: friend.pic}}
                />}
              centerElement={<Text style={styles.name}>{friend.fullname}</Text>}
              rightElement={friend.selected ?
                <Image
                  source={require('../../assets/images/green-check-mark.png')}
                  style={{width: 20, height: 20}}
                />
                : <Text style={styles.empty}></Text>}
              onPress={() => { this.props.onFriendSelect(friend); }}
            />
          );
        })
      }
      </ScrollView>
    );
  }
}