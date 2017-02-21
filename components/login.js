// import React, { Component } from 'react';
// import {StyleSheet, Text, View, TouchableHighlight} from 'react-native';

// import config from '../config/config.js';

// class Login extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       view: ''
//     }
//   }

//   componentWillMount() {
//     this.authorizeFB()
//   }

//   authorizeFB() {

//   }

//   getFBProfile() {
//     manager
//     .makeRequest('facebook', '/me')
//     .then(resp => {
//       console.log('Data ->', resp.data);
//     });
//   }


//   render() {
//     return (
//       <View style={styles.container}>
//         <Text>Welcome {config.facebook.resp}</Text>
//       </View>
//     );
//   }

// }

// var styles = StyleSheet.create({
//   container: {
//     justifyContent: 'center',
//     marginTop: 50,
//     padding: 20,
//     backgroundColor: '#ffffff',
//   },
//   title: {
//     fontSize: 30,
//     alignSelf: 'center',
//     marginBottom: 30
//   },
//   buttonText: {
//     fontSize: 18,
//     color: 'white',
//     alignSelf: 'center'
//   },
//   button: {
//     height: 36,
//     backgroundColor: '#48BBEC',
//     borderColor: '#48BBEC',
//     borderWidth: 1,
//     borderRadius: 8,
//     marginBottom: 10,
//     alignSelf: 'stretch',
//     justifyContent: 'center'
//   },
// });

// export default Login;