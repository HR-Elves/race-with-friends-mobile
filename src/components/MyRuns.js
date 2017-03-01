import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView
} from 'react-native';

import { Dimensions } from 'react-native';

import james from '../../assets/presetChallenges/MarketSt3';
import nick from '../../assets/presetChallenges/MarketSt4';

import { ListItem, Subheader } from 'react-native-material-ui';

export default class MyRuns extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      runs: []
    });
  }

  componentWillMount() {
    this.getRunsData((result) => {
      this.setState ({
        runs: result
      });
    });
  }

  getRunsData(callback) {
    let userId = this.props.userId;
    fetch('https://www.racewithfriends.tk:8000/users/' + userId + '/runs',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
      .then((response) => {
        return response.json();
      })
      .then((responseJson) => {
        callback(responseJson);
      })
      .catch((error) => {
        console.error(error);
      });
  }


  render() {
    const styles = StyleSheet.create({
      container: {
        marginTop: 60,
        marginBottom: 56,
        flex: 1,
        width: Dimensions.get('window').width
      }
    });

    return (
      <View style={styles.container}>
        <Subheader text="My Runs" />
        <ScrollView>
        {
          this.state.runs.map((run) => {
           return (
              <ListItem
                key={run.id}
                divider
                centerElement={{
                  primaryText: run.name,
                  secondaryText: run.created,
                }}
                onPress={() => {}}
              />
            );
          })
        }
        </ScrollView>
      </View>
    );
  }
}


