import {AsyncStorage} from 'react-native';
import Auth0Lock from 'react-native-lock';
import facebookKey from '../../config/facebook-app-key';
// import validToken from '../../assets/validToken.json';

//TODO: Back end currently only taking name and id
// export function verifyProfile(profile, callback) {
//   var nameAndId = {
//     'fb_id': profile.identities[0].userId,
//     'fullname': profile.name
//   };
//   fetch('http://localhost:5000/users', {
//     method: 'POST',
//     headers: {
//       'Accept': 'application/json',
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(nameAndId)
//   }).then(response => {
//     console.log('loginUtils -> verifyProfile ', response);
//     callback(null, profile)
//   }).catch(err => {
//     console.log('loginUtils -> verifyProfile error', err)
//     callback(profile)
//   })
// }

// export function saveProfileAndToken(profile, token, callback) {
//   AsyncStorage.setItem('profile', JSON.stringify(profile), (err, success) => {
//     if (err) {
//       console.log('loginUtils -> saveProfileAndToken -> profile', err);
//     } else {
//       console.log('saveProfileAndToken -> set Profile', profile)
//       //save userId in state or memory here
//       // verifyProfile(profile);
//       AsyncStorage.setItem('token', JSON.stringify(token), (err, success) => {
//         if (err) {
//           console.log('loginUtils -> saveProfileAndToken -> token: ', err)
//         } else {
//           console.log('loginUtils -> saveProfileAndToken -> token: ', token)
//           verifyProfile(profile, callback)
//         }
//       })
//     }
//   })
// }

// export function loginUser(callback) {
//   var lock = new Auth0Lock(facebookKey);
//   lock.show({}, (err, profile, token) => {
//     if (err) {
//       console.log('loginUtils -> loginUser -> error', err);
//     } else {
//       saveProfileAndToken(profile, token, callback);
//     }
//   });
// }
export function getProfile(callback) {
  AsyncStorage.getItem('profile', (err, profile) => {
    if (err) {
      console.log('getProfile ', err);
      callback(err, null);
    } else {
      callback(null, profile);
    }
  })
}


// //TODO: difference between invalid and expired tokens
export function verifyToken(token, callback) {
  fetch('http://127.0.0.1:5000/auth/' + token).then(response => { // change url
    var isValid = JSON.parse(response._bodyInit);
    console.log('$$$$$$', response._bodyInit);
    if (!isValid) {
      loginUser(callback); //if token is expired or inValid redirect to login
    } else if (response.isExpired) { // Currently not handling difference between invalid and expired token
      loginUser(callback);
    } else if (isValid) {
      getProfile(callback);
      // callback(); //if token is valid app opens
    }
  }).catch(err => {
    console.log('loginUtils -> verifyToken -> error', err);
    loginUser(callback);
  })
}


// // function to see if user info exists in AsyncStorage
// export function checkStorage(callback) {
//   AsyncStorage.getItem('token', (err, token) => {
//     if (err) {
//       console.log('loginUtils -> checkStorage -> error: ', err);
//       loginUser(callback);
//     } else {
//       token = JSON.parse(token);
//       verifyToken(token, callback);
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
//       loginUser(callback);
//     }
//   });
// }


export function authorizeUser(callback) {
  AsyncStorage.getItem('token', (err, token) => {
    if (err) {
      console.log('loginUtils -> authorizeUser -> error: ', err);
      loginUser(callback);
    } else {
      token = JSON.parse(token);
      verifyToken(token, callback);
    }
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
      console.log('loginUtils -> saveProfileAndToken -> profile', err);
    } else {
      console.log('saveProfileAndToken -> set Profile', profile)
      //save userId in state or memory here
      // verifyProfile(profile);
      AsyncStorage.setItem('token', JSON.stringify(token), (err, success) => {
        if (err) {
          console.log('loginUtils -> saveProfileAndToken -> token Error: ', err)
        } else {
          console.log('loginUtils -> saveProfileAndToken -> token Success: ', token)
          callback(null, profile)
          // verifyProfile(profile, callback)
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
      fetch('https://mywebsite.com/endpoint/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fb_id: profile.identities[0].userId,
          fullname: profile.name,
          pic: profile.picture
        })
      })
    }
  })
}
