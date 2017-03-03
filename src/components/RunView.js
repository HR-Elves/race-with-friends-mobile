import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
        <Text>{this.props.run.name}</Text>
      </View>
    );
  }
}