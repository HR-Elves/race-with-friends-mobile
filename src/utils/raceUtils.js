  // Helper function for finding the distance between two points on a map (in meters).
  // This function takes into account the curvature of the earth for accuracy.
  // Typical error is up to 0.3%.
export function findDistance(lat1, lon1, lat2, lon2) {
  const toRad = (num) => { return num * Math.PI / 180; };

  var R = 6371e3; // Radius of Earth in meters
  var φ1 = toRad(lat1);
  var φ2 = toRad(lat2);
  var Δφ = toRad(lat2 - lat1);
  var Δλ = toRad(lon2 - lon1);

  var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  var d = R * c;
  return d;
}

export function processLocation(location, history) {
  if (location.location) { //Sometimes location object comes as {location: {coords:{}}} or {coords:{}}
    location = location.location;
  }
  var previousCoordinate = history[history.length - 1];
  var distanceDelta;
  var distanceTotal;
  var timeDelta;
  var timeTotal;
  console.log('~~~', location);

  if (previousCoordinate) {
    // calculate the distanceDelta traveled from the previous coordinate
    var lat1 = previousCoordinate.lat;
    var lon1 = previousCoordinate.long;
    var lat2 = location.coords.latitude;
    var lon2 = location.coords.longitude;
    distanceDelta = findDistance(lat1, lon1, lat2, lon2);
    distanceTotal = previousCoordinate.distanceTotal + distanceDelta;
    timeDelta = Date.parse(location.timestamp) - Date.parse(previousCoordinate.timestamp);
    timeTotal = previousCoordinate.timeTotal + timeDelta;
  } else {
    distanceDelta = 0;
    distanceTotal = 0;
    timeDelta = 0;
    timeTotal = 0;
  }

  var newLocation = {
    lat: location.coords.latitude,
    long: location.coords.longitude,
    alt: location.coords.altitude,
    accuracy: location.coords.accuracy,
    distanceDelta: distanceDelta,  // meters
    distanceTotal: distanceTotal,  // meters
    timestamp: location.timestamp, // UTC string
    timeDelta: timeDelta,          // milliseconds
    timeTotal: timeTotal           // milliseconds
  };

  return newLocation;
}

export function getRaceStatus(currentLoc, raceObj, prevRaceStatus) {
  if (!prevRaceStatus) {
    return {
      distanceToOpponent: 0,    // if positive, user is ahead of opponent; if negative, user is behind opponent
      passedOpponent: false,
      passedByOpponent: false,
      distanceRemaining: raceObj[raceObj.length - 1].distanceTotal,
      challengeDone: false,
      neckAndNeck: true,
      lastRaceIndexChecked: 0
    };
  } else {
    let oldDistanceToOpponent = prevRaceStatus.distanceToOpponent;
    let currentRaceIndex = findCurrentRaceIndex(currentLoc, raceObj, prevRaceStatus.lastRaceIndexChecked);
    let newDistanceToOpponent = findDistanceToOpponent(currentLoc, raceObj, currentRaceIndex);

    let passedOpponent = false;
    let passedByOpponent = false;
    if (oldDistanceToOpponent < 0 && newDistanceToOpponent > 0) {
      passedOpponent = true;
    } else if (oldDistanceToOpponent > 0 && newDistanceToOpponent < 0) {
      passedByOpponent = true;
    }

    let distanceRemaining = raceObj[raceObj.length - 1].distanceTotal - currentLoc.distanceTotal;
    let challengeDone = (distanceRemaining <= 0) || currentRaceIndex >= raceObj.length - 1;

    return {
      distanceToOpponent: newDistanceToOpponent,
      passedOpponent: passedOpponent,
      passedByOpponent: passedByOpponent,
      distanceRemaining: distanceRemaining,
      challengeDone: challengeDone,
      neckAndNeck: true,
      lastRaceIndexChecked: currentRaceIndex
    };
  }
}

export function findCurrentRaceIndex(currentLoc, raceObj, lastRaceIndexChecked) {
  let index;
  for (index = lastRaceIndexChecked; index < raceObj.length; index++) {
    if (raceObj[index].timeTotal >= currentLoc.timeTotal) {
      break;
    }
  }

  if (index === raceObj.length) {
    console.warn('out of bounds!');
    // out of bounds condition due to opponent finishing race
    index = raceObj.length - 1;
  }

  return index;
}

// Helper function to find the distance between the user and the opponent at a given point in the run
// Arguments:
// currentLoc: an object representing the current location of the user
// raceObj: an array of locations representing the opponent's run
// currentRaceIndex: the point in the recorded run where the time elapsed is closest to the current time elapsed
export function findDistanceToOpponent(currentLoc, raceObj, currentRaceIndex) {
  let index = currentRaceIndex;

  if (raceObj[index].timeTotal === currentLoc.timeTotal) {
    // if the current time perfectly matches a point in the recorded challenge...
    // console.warn('findDistanceToOpponent no interpolation: ', currentLoc, raceObj[index]);
    return currentLoc.distanceTotal - raceObj[index].distanceTotal;
  } else {
    // we don't have a perfect synchronization between the current run and the recorded run,
    // therefore we need to interpolate data points in the recorded run to infer the opponent's exact location
    // at this point in time
    if (!raceObj[index - 1]) { // this condition occurs at the beginning of the race when we only have one data point
                            // therefore we can't interpolate so we'll wait until we have another data point
      return 0;
    } else {
      let p1 = raceObj[index - 1];
      let p2 = raceObj[index];
      let timeBetweenPoints = p2.timeTotal - p1.timeTotal;
      let distanceBetweenPoints = p2.distanceTotal - p1.distanceTotal;
      let timeAfterP1 = currentLoc.timeTotal - p1.timeTotal;
      let opponentDistanceTotal = p1.distanceTotal + (timeAfterP1 / timeBetweenPoints) * (p2.distanceTotal - p1.distanceTotal);
      return currentLoc.distanceTotal - opponentDistanceTotal;
    }
  }
}