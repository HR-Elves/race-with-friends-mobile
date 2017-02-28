import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ListView
} from 'react-native';

import james from '../../assets/presetChallenges/MarketSt3';
import nick from '../../assets/presetChallenges/MarketSt4';

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
    let results = [];
    results[0] = 
      {
        id: 0,
        userid: 1234567890,
        Created: 'createdAtDate',
        name: 'James Market St',
        description: '100m dash on Market St',
        length: james[james.length-1].distanceTotal,
        duration: james[james.length-1].timeTotal,
        data: james
      };
    results[1] = 
       {
        id: 1,
        userid: 1234567890,
        Created: 'createdAtDate',
        name: 'Nick Market St',
        description: '100m dash on Market St',
        length: nick[nick.length-1].distanceTotal,
        duration: nick[nick.length-1].timeTotal,
        data: nick
      };     
    callback(results);
  }

  render() {
    const styles = StyleSheet.create({
       container: {
        flex: 1
      },
    });

    return (
      <View>
        <Text>Hello?</Text>
        <Text>{this.state.runs.length}</Text>
        {
          this.state.runs.map((run) => {
            return (<Text>{run.name}</Text>);
          })
        }
      </View>
    );
  }
}