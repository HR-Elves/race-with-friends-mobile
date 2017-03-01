import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
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


  // getRunsData(callback) {
  //   let results = [];
  //   results[0] = 
  //     {
  //       id: 0,
  //       userid: 1234567890,
  //       created: 'createdAtDate',
  //       name: 'James Market St',
  //       description: '100m dash on Market St',
  //       length: james[james.length-1].distanceTotal,
  //       duration: james[james.length-1].timeTotal,
  //       data: james
  //     };
  //   results[1] = 
  //      {
  //       id: 1,
  //       userid: 1234567890,
  //       created: 'createdAtDate',
  //       name: 'Nick Market St',
  //       description: '100m dash on Market St',
  //       length: nick[nick.length-1].distanceTotal,
  //       duration: nick[nick.length-1].timeTotal,
  //       data: nick
  //     };     
  //   callback(results);
  // }

  getRunsData(callback) {
    let userId = '1233197366796721';
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
        flex: 1,
        width: Dimensions.get('window').width
      },
      listItem: {
        width: Dimensions.get('window').width
      }
    });

    return (
      <View style={styles.container}>
        <Subheader text="My Runs" />
          {
            this.state.runs.map((run) => {
             return (
                <ListItem
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
      </View>
    );
  }
}


