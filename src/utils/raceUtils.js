  // Helper function for finding the distance between two points on a map (in meters).
  // This function takes into account the curvature of the earth for accuracy.
  // Typical error is up to 0.3%.
export function findDistance(lat1, lon1, lat2, lon2) {
  const toRad = (num) => { return num * Math.PI / 180; };

  var R = 6371e3; // metres
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
};

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