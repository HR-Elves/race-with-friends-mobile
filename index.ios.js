/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Button,
  Navigator
} from 'react-native';
import {Vibration} from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import Auth0Lock from 'react-native-lock';
import _ from 'lodash';

import Race from './src/components/Race';
import Replay from './src/components/Replay';


import {findDistance, processLocation, getRaceStatus} from './src/utils/raceUtils';
import race from './assets/presetChallenges/standardWalk.json';
import {checkStorage, logOutUser} from './src/utils/loginUtils.js';

export default class RaceWithFriends extends Component {

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    // logOutUser()
    checkStorage((err, success) => {
      if (err) {
        console.log('componentWillMount -> checkStorage', err);
      } else {
        return;
      }
    });
  }

  render() {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
      },
      welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
      },
      instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
      },
    });

    const routes = [
      {id: 'Dashboard'},
      {id: 'Race'},
      {id: 'Replay'}
    ];

    return (

      <Navigator
        initialRoute={routes[0]}
        renderScene={(route, navigator) => {
          return (
            <View style={styles.container}>
              {route.id === 'Dashboard' && <RaceDashboard navigator={navigator} />}
              {route.id === 'Race' && <Race />}
              {route.id === 'Replay' && <Replay />}
            </View>
          );
        }}
      />

    );
  }
}

class RaceDashboard extends Component {
  constructor(props) {
    super(props);
    this.onButtonPress = this.onButtonPress.bind(this);
  }

  onButtonPress(routeId) {
    this.props.navigator.push({id: routeId});
  }

  render() {
    return (
      <View>
        <Text>Race With Friends Dashboard</Text>
        <Button
          onPress={ () => {this.onButtonPress('Race')} }
          title='New Race'
          color='green'
        />
        <Button
          onPress={ () => {this.onButtonPress('Replay')} }
          title='Replay Race'
          color='blue'
        />
      </View>
    );
  }
}


AppRegistry.registerComponent('RaceWithFriends', () => RaceWithFriends);