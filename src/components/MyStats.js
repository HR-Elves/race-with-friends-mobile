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

export default class MyStats extends Component {
  constructor(props) {
    super(props);
    this.state = ({
      runs: []
    });
  }

  componentWillMount() {
    this.getRunsData((result) => {     
      this.distanceCovered = this.getDistanceCovered(result); 
      this.totalRunTime = this.getTotalRunTime(result); 
      this.setState ({
        runs: result
      });
    });    
  }

  // returns result in meters
  getDistanceCovered(runs) {
    let distanceCovered = 0;
    runs.forEach((run) => {
      let runDistance = run.data[run.data.length - 1].distanceTotal;
      distanceCovered += runDistance;
    });
    return Math.round(distanceCovered);
  }

  // returns result in minutes
  getTotalRunTime(runs) {
    let totalRunTime = 0;
    runs.forEach((run) => {
      let runTime = run.data[run.data.length - 1].timeTotal;
      totalRunTime += runTime;
    });
    return Math.round((totalRunTime / 1000) / 60);    
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
        <ScrollView>
          <ListItem
            key={'Total Runs'}
            divider
            leftElement={<Icon size={20} color="black" name="directions-run" />}
            centerElement={{
              primaryText: `Total Runs: ${this.state.runs.length}`
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
        </ScrollView>
      </View>
    );
  }
}


