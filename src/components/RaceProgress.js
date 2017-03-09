import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions
} from 'react-native';
import ProgressBar from 'react-native-progress/Bar';

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
          <Text style={{fontWeight: 'bold'}}>{'Player Progress'}</Text>
          <ProgressBar
            animated={true}
            color='#00796B' // dark green
            borderColor='#00796B' // dark green
            width={Dimensions.get('window').width * 0.65}
            height={Dimensions.get('window').height * 0.05}
            progress={playerProgress}
          />
          {progress.playerWon && <Text>Player Won!</Text>}
        </View>
        <View style={styles.progressView}>
          <Text style={{fontWeight: 'bold'}}>{'Opponent Progress'}</Text>
          <ProgressBar
            animated={true}
            color='#37474F' // gray
            borderColor='#37474F' // gray
            width={Dimensions.get('window').width * 0.65}
            height={Dimensions.get('window').height * 0.05}
            progress={opponentProgress}
          />
          {progress.opponentWon && <Text>Opponent Won!</Text>}
        </View>
      </View>
    );
  }
}