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

export function saveUserInDb() {
  AsyncStorage.getItem('profile', (err, profile) => {
    if (err) {
      console.log('saveUserInDb -> getItem', err);
    } else {
      profile = JSON.parse(profile);
      fetch('http://127.0.0.1:4000/adduser/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fb_id: profile.identities[0].userId,
          fullname: profile.name,
          pic: profile.extraInfo.picture_large
        })
      }).then(response => {
        console.log(response);
        response = JSON.parse(response._bodyInit);
        if (response.code === 'ER_DUP_ENTRY') {
          console.log('User Already Exists in DB')
          // updateProfilePic(profile.identities[0].userId, profile.extraInfo.picture_large, callback)
        } else {
          console.log('User added to DB');
        }
      }).catch(err => {
        console.log('saveUserInDb error', err)
      })
    }
  })
}

// export function updateProfilePic(userId, picURL, callback) {
//   fetch('https://127.0.0.1:4000/user/profile/', {
//     method: 'POST',
//     headers: {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       fb_id: userId,
//       pic: picURL
//     })
//   }).then(response => {
//     callback(null, 'profile updated');
//   }).catch(err => {
//     callback('err', null);
//   })
// }
