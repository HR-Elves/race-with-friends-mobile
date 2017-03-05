import {AsyncStorage} from 'react-native';
import Auth0Lock from 'react-native-lock';
import facebookKey from '../../config/facebook-app-key';

export function checkAuth(callback) {
  AsyncStorage.getItem('token', (err, token) => {
    if (err || !token) {
      console.log('authorizeUser err', err)
      callback('err', null)
    } else {
      token = JSON.parse(token);
      console.log('Get Token Success', token)
      verifyToken(token.idToken, callback);
    }
  })
}

export function verifyToken(token, callback) {
  fetch('http://127.0.0.1:4000/auth/' + token).then(response => { // change url
    console.log('server responding to auth check', response.status)
    if (response.status !== 200) {
      callback('Token Not Valid', null);
    } else {
      callback(null, 'success');
    }
  }).catch(err => {
    console.log('loginUtils -> verifyToken -> error', err);
    callback('err', null);
  })
}

export function loginUser(callback) {
  var lock = new Auth0Lock(facebookKey);
  lock.show({}, (err, profile, token) => {
    if (err) {
      console.log('loginUtils -> loginUser -> Error', err);
    } else {
      saveProfileAndToken(profile, token, callback);
    }
  });
}

export function saveProfileAndToken(profile, token, callback) {
  AsyncStorage.setItem('profile', JSON.stringify(profile), (err, success) => {
    if (err) {
      console.log('loginUtils -> saveProfileAndToken -> profile Error', err);
    } else {
      console.log('saveProfileAndToken -> set Profile', profile);
      AsyncStorage.setItem('token', JSON.stringify(token), (err, success) => {
        if (err) {
          console.log('loginUtils -> saveProfileAndToken -> token Error: ', err);
        } else {
          console.log('Profile Saved');
          callback(null, 'Profile Saved');
        }
      })
    }
  })
}

// export function saveUserInDb(callback) {
//   AsyncStorage.getItem('profile', (err, profile) => {
//     if (err) {
//       console.log('saveUserInDb -> getItem', err);
//     } else {
//       fetch('https://racewithfriends.tk/endpoint/', {
//         method: 'POST',
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           fb_id: profile.identities[0].userId,
//           fullname: profile.name,
//           pic: profile.picture
//         })
//       })
//     }
//   })
// }

// export function logOutUser(callback) {
//   var items = ['token', 'profile'];
//   AsyncStorage.multiRemove(items, (err) => {
//     if (err) {
//       console.log('loginUtils -> logOutUser -> remove token', err);
//     } else {
//       console.log('Profile Removed');
//       this.setState({isLoggedIn: false})
//     }
//   });
// }
