
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Button,
  Navigator,
  ListView,
  TouchableOpacity,
  Image
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
import Friends from './src/components/Friends';
import Challenge from './src/components/Challenge';

import {findDistance, processLocation, getRaceStatus} from './src/utils/raceUtils';
import race from './assets/presetChallenges/standardWalk.json';
import {checkStorage, logOutUser, loginUser, authorizeUser} from './src/utils/loginUtils.js';

let _emitter = new EventEmitter();

export default class RaceWithFriends extends Component {

  constructor(props) {
    super(props);
    this.state = {
      profile: '',
      userId: ''
    };
  }

  componentWillMount() {
    loginUser((err, profile) => {
      if (err) {
        console.log('componentWillMount -> authorizeUser Error', err);
      } else {
        this.setState({
          profile: profile,
          userId: profile.identities[0].userId
        }, (() => {
          this._navigator.push(this.navigate('Race'));
          console.log('===== this.state.userId', this.state.userId);
          console.log('===== this.state.profile', this.state.profile);
        }).bind(this));
      }
    });
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
      'My Runs': {
        title: 'My Runs',
        id: 'My Runs'
      },
      'Replay': {
        title: 'Replay',
        id: 'Replay'
      },
      'Challenge': {
        title: 'Challenge',
        id: 'Challenge'
      },
      'Friends': {
        title: 'Friends',
        id: 'Friends'
      }
    };
    return componentMap[scene];
  }

  _renderScene(route, navigator) {
    if (route.id === 'Race') {
      return ( <Race userId={this.state.userId}/> );
    } else if (route.id === 'My Runs') {
      return ( <StatsView userId={this.state.userId}/> );
    } else if (route.id === 'Replay') {
      return ( <Replay /> );
    } else if (route.id === 'Challenge') {
      return ( <Challenge userId={this.state.userId}/> );
    } else if (route.id === 'Friends') {
      return ( <Friends userId={this.state.userId}/> );
    } else {
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5FCFF',
        }}>
          <Image source={require('./assets/images/StickmanRunning.gif')} />
        </View>
      );
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

    const NavigationBarRouteMapper = {
      LeftButton(route, navigator, index, navState) {
        return (
          <TouchableOpacity
            // style={styles.navBarLeftButton}
            onPress={() => { _emitter.emit('openMenu'); }}>
            <Icon name='menu' size={25} color={/*Black*/'#000000'} />
          </TouchableOpacity>
        );
      },

      RightButton(route, navigator, index, navState) {
        return (
          <TouchableOpacity /*style={styles.navBarRightButton}*/>
            <Icon name='more-vert' size={25} color={/*Black*/'#000000'} />
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
            id: '',
            title: ''
          }}
          renderScene={(route, navigator) => this._renderScene(route, navigator)}
          navigationBar={<Navigator.NavigationBar
            routeMapper={NavigationBarRouteMapper}/>
          }/>
      </Drawer>
    );
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
      dataSource: this.state.dataSource.cloneWithRows(['Race', 'My Runs', 'Replay', 'Challenge', 'Friends'])
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

AppRegistry.registerComponent('RaceWithFriends', () => RaceWithFriends);