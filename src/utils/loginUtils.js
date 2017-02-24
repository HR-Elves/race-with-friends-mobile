import {AsyncStorage} from 'react-native';
import Auth0Lock from 'react-native-lock';
import facebookKey from '../../config/facebook-app-key';
// import validToken from '../../assets/validToken.json';

//TODO: Back end currently only taking name and id
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

  ).then(response => {
    console.log('loginUtils -> verifyProfile', response);
  })
}

export function saveProfileAndToken(profile, token) {
  AsyncStorage.setItem('profile', JSON.stringify(profile), (err, success) => {
    if (err) {
      console.log('loginUtils -> saveProfileAndToken -> profile', err);
    } else {
      verifyProfile(profile);
      AsyncStorage.setItem('token', JSON.stringify(token), (err, success) => {
        if (err) {
          console.log('loginUtils -> saveProfileAndToken -> token: ', err)
        } else {
          return;
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
      saveProfileAndToken(profile, token);
    }
  });
}
//TODO: difference between invalid and expired tokens
export function verifyToken(token, callback) {
  fetch('http://localhost:5000/auth/' + token).then(response => { // change url
    var isValid = JSON.parse(response._bodyInit)
    if (!isValid) {
      loginUser(); //if token is expired or inValid redirect to login
    } else if (response.isExpired) { // Currently not handling difference between invalid and expired token
      loginUser();
    } else if (isValid) {
      callback(); //if token is valid app opens
    }
  })
}


// function to see if user info exists in AsyncStorage
export function checkStorage(callback) {
  AsyncStorage.getItem('token', (err, token) => {
    if (err) {
      console.log('loginUtils -> checkStorage -> error: ', err);
      loginUser();
    } else {
      token = JSON.parse(token);
      verifyToken(token, callback);
    }
  })
}


export function logOutUser() {
  var items = ['token', 'profile'];
  AsyncStorage.multiRemove(items, (err) => {
    if (err) {
      console.log('loginUtils -> logOutUser -> remove token', err);
    } else {
      console.log('Profile Removed');
      loginUser();
    }
  });
}