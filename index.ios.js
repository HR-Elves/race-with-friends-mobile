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
  Navigator,
  ListView,
  TouchableOpacity
} from 'react-native';
import {Vibration} from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import Drawer from 'react-native-drawer';
import RNButton from 'react-native-button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EventEmitter } from 'fbemitter';
import _ from 'lodash';

import Race from './src/components/Race';
import Replay from './src/components/Replay';
import StatsView from './src/components/StatsView';

import {findDistance, processLocation, getRaceStatus} from './src/utils/raceUtils';
import race from './assets/presetChallenges/standardWalk.json';
import {checkStorage, logOutUser} from './src/utils/loginUtils.js';

let _emitter = new EventEmitter();

export default class RaceWithFriends extends Component {

  constructor(props) {
    super(props);
    this.state = {
      drawerOpen: false,
      drawerDisabled: false,
    };
  }

  componentWillMount() {
    // logOutUser();
    // checkStorage((err, success) => {
    //   if (err) {
    //     console.log('componentWillMount -> checkStorage', err);
    //   } else {
    //     return;
    //   }
    // });
  }

  componentDidMount() {
    _emitter.addListener('openMenu', () => {
      this._drawer.open();
    });

    // _emitter.addListener('back', () => {
    //   this._navigator.pop();
    // });
  }

  navigate(scene) {
    var componentMap = {
      'Race': {
        title: 'Race',
        id: 'Race'
      },
      'My Stats': {
        title: 'My Stats',
        id: 'My Stats'
      },
      'Replay': {
        title: 'Replay',
        id: 'Replay'
      }
    };
    return componentMap[scene];
  }

  _renderScene(route, navigator) {
    if (route.id === 'Race') {
      return ( <Race navigator={navigator}/> );
    } else if (route.id === 'My Stats') {
      return ( <StatsView navigator={navigator}/> );
    } else if (route.id === 'Replay') {
      return ( <Replay navigator={navigator}/> );
    }
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
    // const routes = [
    //   {id: 'Dashboard'},
    //   {id: 'Race'},
    //   {id: 'Replay'}
    // ];

    return (
      <Drawer
        ref={(ref) => this._drawer = ref}
        type="overlay"
        content={<RaceDashboard navigate={((route) => {
          this._navigator.push(this.navigate(route));
          this._drawer.close();
        }).bind(this)}/>}
        tapToClose={true}
        openDrawerOffset={0.2}
        panCloseMask={0.2}
        closedDrawerOffset={-3}
        styles={{
          drawer: {shadowColor: '#000000', shadowOpacity: 0.8, shadowRadius: 3},
          main: {paddingLeft: 3}
        }}
        tweenHandler={(ratio) => ({main: { opacity: ( 2 - ratio) / 2 }})}>
        <Navigator
        ref={(ref) => this._navigator = ref}
        configureScene={(route) => Navigator.SceneConfigs.FloatFromLeft}
        style={{flex: 1}}
        initialRoute={{
          id: 'Race',
          title: 'Race'
        }}
        renderScene={(route, navigator) => this._renderScene(route, navigator)}
        navigationBar={<Navigator.NavigationBar
          routeMapper={NavigationBarRouteMapper}/>
        }/>
      </Drawer>
    );
    // return (

    //   <Navigator
    //     initialRoute={routes[0]}
    //     renderScene={(route, navigator) => {
    //       return (
    //         <View style={styles.container}>
    //           {route.id === 'Dashboard' && <RaceDashboard navigator={navigator} />}
    //           {route.id === 'Race' && <Race />}
    //           {route.id === 'Replay' && <Replay />}
    //         </View>
    //       );
    //     }}
    //   />

    // );
  }

}

class RaceDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      })
    };
    // this.onButtonPress = this.onButtonPress.bind(this);
  }

  onButtonPress(routeId) {
    this.props.navigator.push({id: routeId});
  }

  _renderMenuItem(item) {
    return (<RNButton
      onPress={()=> this._onItemSelect(item)}>
      {item}
    </RNButton>);
  }

  _onItemSelect(item) {
    this.props.navigate(item);
  }

  componentDidMount() {
    this.setState({
      dataSource: this.state.dataSource.cloneWithRows(['Race', 'My Stats', 'Replay'])
    });
  }

  render() {
    return (
      <ListView
        style={{
          backgroundColor: '#FFF',
          top: 20
        }}
        dataSource={this.state.dataSource}
        renderRow={((item) => this._renderMenuItem(item)).bind(this)}/>
    );
  }

}

const NavigationBarRouteMapper = {
  LeftButton(route, navigator, index, navState) {
    return (
      <TouchableOpacity
        // style={styles.navBarLeftButton}
        onPress={() => { _emitter.emit('openMenu'); }}>
        <Icon name='menu' size={25} color={'Black'} />
      </TouchableOpacity>
    );
  },

  RightButton(route, navigator, index, navState) {
    return (
      <TouchableOpacity /*style={styles.navBarRightButton}*/>
        <Icon name='more-vert' size={25} color={'Black'} />
      </TouchableOpacity>
    );
  },

  Title(route, navigator, index, navState) {
    return (
      <Text /*style={[styles.navBarText, styles.navBarTitleText]}*/>
        {route.title}
      </Text>
    );
  }
};
/*
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
*/
AppRegistry.registerComponent('RaceWithFriends', () => RaceWithFriends);