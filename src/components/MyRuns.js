import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions
} from 'react-native';

import { Subheader } from 'react-native-material-ui';

import RunsList from './RunsList';
import RunView from './RunView';

export default class MyRuns extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      selectedRun: null,
      displayState: 'list'  // can be 'list' or 'selected'
    });
  }

  onRunSelect(run) {
    this.setState({
      selectedRun: run,
      displayState: 'selected'
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
        {this.state.displayState === 'list' &&
          <View style={{flex: 1}}>
            <Subheader text="My Runs" />
            <RunsList runs={this.props.runs} onRunSelect={this.onRunSelect.bind(this)}/>
          </View>
        }
        {this.state.displayState === 'selected' &&
          <View style={{flex: 1}}>
            <RunView run={this.state.selectedRun} />
          </View>
        }
      </View>
    );
  }
}


