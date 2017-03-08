import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

import { VictoryChart, VictoryLine, VictoryAxis, VictoryLabel, VictoryTheme } from 'victory-native';

export default class RaceStatus extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 100
      }
    });    

    return (
      <View style={styles.container}>
        <Text>Post Race Summary:</Text>
        <Text>Position Relative To Opponent</Text>
        <VictoryChart>
          <VictoryAxis 
            dependentAxis
            crossAxis
            label='Label' 
          />
          <VictoryAxis 
          />
          <VictoryLine 
            data={this.props.data}
            x={(datum) => datum.time}
            y={(datum) => datum.distanceToOpponent}
            theme={VictoryTheme.material}
            label='position relative to opponent'
          />
         </VictoryChart> 
      </View>
    );
  }
}




