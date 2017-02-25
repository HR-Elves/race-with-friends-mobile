import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';

export default class RaceStatus extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let distanceToOpponent = this.props.status ? this.props.status.distanceToOpponent : 0;
    let relativeToOpponent = distanceToOpponent >= 0 ? 'ahead of' : 'behind';
    distanceToOpponent = Math.round(Math.abs(distanceToOpponent));
    let distanceRemaining = this.props.status ? Math.round(this.props.status.distanceRemaining) : null;
    let statusVerb = 'is';
    if(this.props.status && this.props.status.challengeDone) {
      statusVerb = 'finished';
    }

    return (
      <View>
        <Text>{`${this.props.playerName} ${statusVerb} ${distanceToOpponent} meters ${relativeToOpponent} ${this.props.opponentName}`}</Text>
        {distanceRemaining !== null ? <Text>{`Distance remaining: ${distanceRemaining} meters`}</Text> : <Text></Text>}
      </View>
    );
  }
}