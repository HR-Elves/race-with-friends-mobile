import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions
} from 'react-native';

import { ListItem, Subheader } from 'react-native-material-ui';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import StatsUtils from '../utils/statsUtils';

export default class MyStats extends Component {
  constructor(props) {
    super(props);
    this.distanceCovered = StatsUtils.getDistanceCovered(this.props.runs); 
    this.totalRunTime = Math.round((StatsUtils.getTotalRunTime(this.props.runs) / 1000) / 60); // convert milliseconds to minutes
    this.averageSpeed = StatsUtils.getAverageSpeed(this.props.runs); 
    this.maxSpeed = StatsUtils.getMaxSpeed(this.props.runs);    
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
        <ScrollView>
          <ListItem
            key={'Total Runs'}
            divider
            leftElement={<Icon size={20} color="black" name="directions-run" />}
            centerElement={{
              primaryText: `Total Runs: ${this.props.runs.length}`
            }}
          />
          <ListItem
            key={'Total Distance Covered'}
            divider
            leftElement={<CommunityIcon size={20} color="black" name="road-variant" />}
            centerElement={{
              primaryText: `Total Distance: ${this.distanceCovered} meters`
            }}
          />
          <ListItem
            key={'Total Run Time'}
            divider
            leftElement={<Icon size={20} color="black" name="access-time" />}
            centerElement={{
              primaryText: `Total Run Time: ${this.totalRunTime} minutes`
            }}
          />
          <ListItem
            key={'Average Speed'}
            divider
            leftElement={<Icon size={20} color="black" name="show-chart" />}
            centerElement={{
              primaryText: `Average Speed: ${this.averageSpeed} meters / second`
            }}
          />
          <ListItem
            key={'Max Speed'}
            divider
            leftElement={<Icon size={20} color="black" name="show-chart" />}
            centerElement={{
              primaryText: `Max Speed: ${this.maxSpeed} meters / second`
            }}
          />
        </ScrollView>
      </View>
    );
  }
}


