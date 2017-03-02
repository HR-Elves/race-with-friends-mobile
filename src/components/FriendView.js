import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

export default class FriendView extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
    });

    return (
      <View>
        <Text>{this.props.friend.fullname}</Text>
      </View>
    );
  }
}