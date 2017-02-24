import {AsyncStorage} from 'react-native';
import Auth0Lock from 'react-native-lock';
import facebookKey from '../../config/facebook-app-key';
import validToken from '../../assets/validToken.json';

//TODO: BE currently only taking name and id
export function verifyProfile(profile) {
  var nameAndId = {
    'fb_id': profile.identities.userId,
    'fullname': profile.identities.name
  };
  fetch('http://localhost:5000/users/', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nameAndId)
  }

  ).then(response => { // change url
    console.log('loginUtils -> verifyProfile', response);
  })
}

export function saveProfileAndToken(profile, token, callback) {
  AsyncStorage.setItem('profile', JSON.stringify(profile), (err, success) => {
    if (err) {
      console.log('loginUtils -> saveProfileAndToken -> profile', err);
    } else {
      verifyProfile(profile);
      AsyncStorage.setItem('token', JSON.stringify(token), (err, success) => {
        if (err) {
          console.log('loginUtils -> saveProfileAndToken -> token: ', err)
        } else {
          // console.log('loginUtils -> saveProfileAndToken -> token: ', success)
          // callback();
        }
      })
    }
  })
}

export function loginUser() {
  var lock = new Auth0Lock(facebookKey);

  lock.show({}, (err, profile, token) => {
    if (err) {
      console.log('loginUtils -> loginUser', err);
    } else {
      // console.log('loginUtils -> loginUser -> profile', profile);
      console.log('loginUtils -> loginUser -> token', token);
      saveProfileAndToken(profile, token);
    }
  });
}
//TODO difference between invalid and expired tokens
export function verifyToken(token, callback) {
  fetch('http://localhost:5000/auth/' + token).then(response => { // change url
    // console.log('loginUtils -> verifyToken', response);
    res = JSON.parse(response._bodyInit)
    if (!res.isValid) {
      loginUser()
    } else if (response.isExpired) { //Currently not handling difference between invalid and expired token
      //need function to handle refresh token
      loginUser()
    } else if (res.isValid) {
      //if token is good app opens
      callback();
    }
  })
}


// function to see if user info exists in AsyncStorage
export function checkStorage(callback) {
  AsyncStorage.getItem('token', (err, token) => {
    if (err) {
      console.log('loginUtils -> checkStorage -> error: ', err);
      loginUser()
    } else {
      token = JSON.parse(token);
      console.log('loginUtils -> checkStorage -> token: ', token.idToken);
      verifyToken(token, callback);
    }
  })
}


export function logOutUser() {
  console.log('loginUtils -> logOutUser -> ');
  var token = ['token']
  var profile = ['profile']
  AsyncStorage.removeItem(JSON.stringify(token), (success, err) => {
    if (err) {
      console.log('loginUtils -> logOutUser -> remove token', err);
    }
    console.log('loginUtils -> logOutUser -> remove token -> success');
    AsyncStorage.removeItem(JSON.stringify(profile), (success, err) => {
      if (err) {
        console.log('loginUtils -> logOutUser -> remove profile', err);
      }
      console.log('loginUtils -> logOutUser -> remove profile -> success');
      loginUser();
    });
    // loginUser();
  });
}