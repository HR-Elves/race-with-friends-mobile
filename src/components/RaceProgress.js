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
  componentDidMount() {
    // console.warn(JSON.stringify(this.props.progress));
  }
  render() {
    const styles = StyleSheet.create({
      progressView: {
        marginTop: 20,
        width: 250
      }
    });
    const progress = this.props.progress;
    let playerProgress = progress.playerDist / progress.totalDist;
    let opponentProgress = progress.opponentDist / progress.totalDist;
    // console.warn('player: ', playerProgress, ' opp: ', opponentProgress, ' total: ', progress.totalDist);
    return (
      <View>
        <View style={styles.progressView}>
          <Text>{'Player'}</Text>
          <ProgressViewIOS
            progressViewStyle='bar'
            progressTintColor="green"
            progress={playerProgress}
          />
          {progress.playerWon && <Text>Player Won!</Text>}
        </View>
        <View style={styles.progressView}>
          <Text>{'Opponent'}</Text>
          <ProgressViewIOS
            progressViewStyle='bar'
            progressTintColor="red"
            progress={opponentProgress}
          />
          {progress.opponentWon && <Text>Opponent Won!</Text>}
        </View>
      </View>
    );
  }
}