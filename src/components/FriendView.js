import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
} from 'react-native';
import { ListItem, Subheader } from 'react-native-material-ui';
import { Dimensions } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

export default class FriendView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      runs: []
    };
  }

  componentDidMount() {
    // this.getRunsData();
    let userId = this.props.friend.fb_id;
    return fetch('https://www.racewithfriends.tk:8000/users/' + userId + '/runs', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    .then((response) => {
      this.setState({
        runs: JSON.parse(response._bodyInit)
      });
    })
    .catch((error) => {
      console.error(error);
    });
  }

  render() {
    return (

      <View style={styles.container}>
        <Image
          style={styles.pic}
          // style={styles.container}
          source={{uri: this.props.friend.pic}}
        />
        <Text style={styles.name} >{this.props.friend.fullname}</Text>
        <Subheader text={this.props.friend.fullname.split(' ')[0] + "'s Runs"}/>

        <ScrollView>
        {
          this.state.runs.map((run) => {
            return (
            <View>
              <ListItem
                key={run.id}
                divider
                centerElement={{
                  primaryText: run.name,
                  secondaryText: run.created,
                }}
                onPress={() => {}}
              />
              </View>
            );
          })
        }
        </ScrollView>

      </View>

    );
  }
}

const styles = StyleSheet.create({
  pic: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  name: {
    flexDirection: 'column',
    textAlign: 'center',
    alignItems: 'center'
  },
  container: {
    marginBottom: 56,
    flex: 1,
    width: Dimensions.get('window').width
  },
  runs: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
  }
});

