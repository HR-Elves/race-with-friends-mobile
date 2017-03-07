
import React, { Component, PropTypes } from 'react';
import {
  AppRegistry,
  AsyncStorage,
  Button,
  Image,
  ListView,
  Navigator,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import Drawer from 'react-native-drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EventEmitter } from 'fbemitter';
import _ from 'lodash';
import { COLOR, ThemeProvider, ListItem } from 'react-native-material-ui';

import Race from './src/components/Race';
import Replay from './src/components/Replay';
import StatsView from './src/components/StatsView';
import Friends from './src/components/Friends';
import Challenge from './src/components/Challenge';

import {findDistance, processLocation, getRaceStatus} from './src/utils/raceUtils';
import race from './assets/presetChallenges/standardWalk.json';
import {checkAuth, loginUser, saveUserInDb} from './src/utils/loginUtils.js';


let _emitter = new EventEmitter();

export default class RaceWithFriends extends Component {

  constructor(props) {
    super(props);
    this.state = {
      profile: '',
      userId: '',
      pic: '',
      token: '',
      isLoggedIn: false
    };

    this.logOutUser = this.logOutUser.bind(this);

  }

  componentDidMount() {
    checkAuth((err, success) => {
      if (err) {
        loginUser((err, success) => {
          if (!err) {
            this.getProfile();
          }
        });
      } else {
        this.getProfile();
      }
    });

    _emitter.addListener('openMenu', () => {
      this._drawer.open();
    });

    // _emitter.addListener('back', () => {
    //   this._navigator.pop();
    // });
  }

  getProfile() {
    AsyncStorage.getItem('profile', (err, profile) => {
      if (err) {
        console.log('getProfile -> getItem', err);
      } else {
        saveUserInDb();
        profile = JSON.parse(profile);
        this.setState({
          profile: profile,
          userId: profile.identities[0].userId,
          pic: profile.extraInfo.picture_large,
          isLoggedIn: true
        }, (() => {
          this._navigator.push(this.navigate('Race'));
          console.log('===== this.state.userId', this.state.userId);
          console.log('===== this.state.profile', this.state.profile);
        }).bind(this));
      }
    });
  }


  logOutUser() {
    var items = ['token', 'profile'];
    AsyncStorage.multiRemove(items, (err) => {
      if (err) {
        console.log('loginUtils -> logOutUser -> remove token', err);
      } else {
        console.log('Profile Removed');

        var that = this;
        this.setState({isLoggedIn: false}, () => {
          checkAuth((err, success) => {
            if (err) {
              loginUser((err, success) => {
                if (!err) {
                  that.getProfile();
                }
              })
            } else {
              that.getProfile();
            }
          });
        });
      }
    });
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
      return ( <Replay userId={this.state.userId}/> );
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
          backgroundColor: '#F5FCFF'
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
      }
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
          <TouchableOpacity /*style={styles.navBarRightButton}*/
            // onPress={() => { _emitter.emit('openMenu'); }}
            >
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
        content={<RaceDashboard
          profile={this.state.profile}
          logout={this.logOutUser}
          navigate={((route) => {
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

    const uiTheme = {
      palette: {
        primaryColor: COLOR.green500
      }
    };

    return (
      <ThemeProvider uiTheme={uiTheme} >
        <ListItem
          divider
          onPress={()=> this._onItemSelect(item)}
          centerElement={<Text >{item}</Text>}
        />
      </ThemeProvider>
    );
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
    const styles = StyleSheet.create({
      container: {
        // marginTop: 20,
        flex: 1,
        backgroundColor: '#F5FCFF',
        width: 275,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      },
      text: {
        marginTop: 20
      },
      image: {
        marginTop: 25,
        width: 275,
        height: 275,
      },
      //this is where to affect list of pages
      listContent: {
        backgroundColor: '#F5FCFF',
        // marginTop: 20,
        top: 20,
        padding: 10,
        width: 275
      },
      button: {
        marginBottom: 15
      }
    })


    return (

      <View style={styles.container}>
        <View>
          {this.props.profile ? <Image style={styles.image} source={{uri: this.props.profile.extraInfo.picture_large}}/> : <Text></Text>}
        </View>

        <View>
          {this.props.profile ? <Text style={styles.text}>{'Welcome ' + this.props.profile.name.split(' ')[0] + '!'}</Text> : <Text></Text>}
        </View>

        <ListView
          style={styles.listContent}
          dataSource={this.state.dataSource}
          renderRow={((item) => this._renderMenuItem(item)).bind(this)}
        />
        <Button
          style={styles.button}
          onPress={() => {
            this.props.logout();
          }}
          title="Sign Out"
          color="#841584"
        />
      </View>
    );
  }
}

AppRegistry.registerComponent('RaceWithFriends', () => RaceWithFriends);