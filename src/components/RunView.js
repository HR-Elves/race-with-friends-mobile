import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions
} from 'react-native';

import MapView from 'react-native-maps';

import MapUtils from '../utils/mapUtils.js';

export default class RunView extends Component {
  constructor(props) {
    super(props);
    this.polyLineCoordinates = MapUtils.getPolyLineFromRun(this.props.run);
    this.latLongBoundaries = MapUtils.getLatLongBoundaries(this.props.run);
  }

  render() {
    const styles = StyleSheet.create({
      container: {
        flex: 1,
      },
    });

    return (
     <MapView
        style={{
          width: Dimensions.get('window').width,
          height: Dimensions.get('window').height,
        }}
        initialRegion={{
          latitude: this.latLongBoundaries.latitudeCenter,
          longitude: this.latLongBoundaries.longitudeCenter,
          latitudeDelta: this.latLongBoundaries.latitudeDelta * 1.5,
          longitudeDelta: this.latLongBoundaries.longitudeDelta * 1.5,
        }}
      >
        <MapView.Polyline
          coordinates={this.polyLineCoordinates}
          strokeWidth={5}
          strokeColor={'#f00'}
        />
      </MapView>
    );
  }
}