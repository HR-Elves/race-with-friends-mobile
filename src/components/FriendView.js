import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
} from 'react-native';
import { ListItem, Subheader } from 'react-native-material-ui';
import { Dimensions } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

export default class FriendView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      runs: []
    };
  }

  getRunsData() {
    // let userId = this.props.friend.fb_id;
    // fetch('https://www.racewithfriends.tk:8000/users/' + userId + '/runs',
    //   {
    //     method: 'GET',
    //     headers: {
    //       'Accept': 'application/json',
    //       'Content-Type': 'application/json',
    //     }
    //   })
    //   .then((response) => {
    //     console.log('$$$$', response);
    //     this.setState({runs: response})
    //   })
    //   .catch((error) => {
    //     console.error(error);
    // });
  }

  componentDidMount() {
    // this.getRunsData();
    let userId = this.props.friend.fb_id;
    return fetch('https://www.racewithfriends.tk:8000/users/' + userId + '/runs',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })
      .then((response) => {
        console.log('######', response);
        this.setState({runs: JSON.parse(response._bodyInit)}, (err, success) => {
          if (err) {
            console.log('errrrrr', err)
          } else {
            console.log('sweet success', success)
            console.log('#####', this.state.runs)
          }
        })
        console.log('this.state.runs', this.state.runs)
      })
      .catch((error) => {
        console.error(error);
    });
  }

  render() {
    return (

      <View style={styles.container}>
        <Image
          style={styles.pic}
          // style={styles.container}
          source={{uri: this.props.friend.pic}}
        />
        <Text style={styles.name} >{this.props.friend.fullname}</Text>
        <Subheader text="My Runs" />

        <ScrollView>
        {
          this.state.runs.map((run) => {
           return (
            <View>
              <ListItem
                key={run.id}
                divider
                centerElement={{
                  primaryText: run.name,
                  secondaryText: run.created,
                }}
                onPress={() => {}}
              />
              </View>
            );
          })
        }
        </ScrollView>

      </View>

    );
  }
}

const styles = StyleSheet.create({
  pic:{
    // marginTop:50,
    width:150,
    height: 150,
    // paddingBottom:10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex:1    //Step 1
  },
  name:{
    // color:'#fff',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex:1
  },
  container: {
    marginTop: 60,
    marginBottom: 56,
    flex: 1,
    width: Dimensions.get('window').width
  },
  runs:{
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight:'bold',
    flex:1               //Step 3
  }
});

