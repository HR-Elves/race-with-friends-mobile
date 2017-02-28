import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import BottomNavigation, { Tab } from 'react-native-material-bottom-navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default class StatsView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTab: 0
    };
  }

  onTabChange(newTabIndex) {
    this.setState({
      currentTab: newTabIndex
    });
  }

  render() {
    const styles = StyleSheet.create({
       container: {
        flex: 1
      },
      center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
      }
    });

    return (
      <View style={styles.container}>
        <View style={styles.center}>
          {this.state.currentTab === 0 && <Text>My Stats</Text> }
          {this.state.currentTab === 1 && <Text>My Runs</Text> }
        </View>
        <BottomNavigation
          labelColor="white"
          rippleColor="white"
          style={{ height: 56, elevation: 8, position: 'absolute', left: 0, bottom: 0, right: 0 }}
          onTabChange={this.onTabChange.bind(this)}
        >
          <Tab
            barBackgroundColor="#37474F"
            label="My Stats"
            icon={<Icon size={24} color="white" name="show-chart" />}
          />
          <Tab
            barBackgroundColor="#00796B"
            label="My Runs"
            icon={<Icon size={24} color="white" name="directions-run" />}
          />
        </BottomNavigation>
      </View>
    );
  }
}