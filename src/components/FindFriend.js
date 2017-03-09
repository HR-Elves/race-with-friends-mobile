import React, { Component } from 'react';
import {
  Text,
  View,
  ScrollView,
  Image,
  TextInput
} from 'react-native';

import {Dialog, DialogDefaultActions, ListItem} from 'react-native-material-ui';
import Popup from './Popup';

export default class FindFriend extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: '',
      text: '',
      users: [],
      allUsers: []
    };
  }

  componentDidMount() {
    fetch('https://racewithfriends.tk:8000/users/all')
    .then(response => {
      var users = JSON.parse(response._bodyInit).filter(user => {
        return user.fb_id !== this.props.userId;
      });

      this.setState({
        users: users,
        allUsers: users
      });
    })
    .catch(err => {
      console.warn(err);
    });
  }

  searchForFriend() {
    if (!this.state.text) {
      this.setState({users: this.state.allUsers});
    } else {
      var results = this.state.users.filter(user => {
        return user.fullname.includes(this.state.text);
      });
      this.setState({
        users: results
      });
    }
  }

  render() {

    return (
      <View>
        <TextInput
          style={{height: 40, borderColor: 'gray', borderWidth: 1}}
          onChangeText={(text) => {
            this.setState({text}, this.searchForFriend);
          }}
          value={this.state.text}
          placeholder='search for a friend'
        />

        <ScrollView>
        {
          this.state.users.map((user) => {
            return (
              <ListItem
                key={user.fb_id}
                divider
                leftElement={
                  <Image
                    style={{width: 46, height: 46, borderRadius: 23}}
                    source={{uri: user.pic}}
                  />}
                centerElement={<Text>{user.fullname}</Text>}
                onPress={() => { this.props.onAddFriend(user.fb_id); }}



                // onPress={() => {
                //   return (
                //   <Popup
                //   user={user.fb_id}
                //   addFriend={this.props.onAddFriend}/> )
                // }}
              />
            );
          })
        }
        </ScrollView>
      </View>
    );
  }
}