import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ProgressViewIOS
} from 'react-native';

export default class RaceProgress extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const styles = StyleSheet.create({
      progressView: {
        marginTop: 20,
      }
    });
    const progress = this.props.progress;
    let playerProgress = progress.playerDist / progress.totalDist;
    let opponentProgress = progress.opponentDist / progress.totalDist;

    return (
      <View>
        <View style={styles.progressView}>
          <Text>{'\<-------------- Player --------------\>'}</Text>
          <ProgressViewIOS progressTintColor="green" progress={playerProgress} />
          {progress.playerWon && <Text>Player Won!</Text>}
        </View>
        <View style={styles.progressView}>
          <Text>{'\<------------ Opponent ------------\>'}</Text>
          <ProgressViewIOS progressTintColor="red" progress={opponentProgress} />
          {progress.opponentWon && <Text>Opponent Won!</Text>}
        </View>
      </View>
    );
  }
}