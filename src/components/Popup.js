import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput
} from 'react-native';

import {Dialog, DialogDefaultActions} from 'react-native-material-ui';

export default class Popup extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <View>
        <Dialog>
          <Dialog.Title><Text>Add Friend!</Text></Dialog.Title>
          <Dialog.Content>
            <Text>
              Would you like to add user as a friend?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <DialogDefaultActions
              actions={['Dismiss', 'Add!']}
              onActionPress={() => { this.props.addFriend(this.props.user); }}
            />
          </Dialog.Actions>
        </Dialog>
      </View>
    );
  }
}

// props:
// user={user.fb_id}
// addFriend={this.props.onAddFriend}