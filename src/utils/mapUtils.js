export default class MapUtils {

  static getPolyLineFromRun(run) {
    let coordinates = [];
    run.data.forEach((location) => { 
      let latLng = {
        latitude: location.lat,
        longitude: location.long
      }
      coordinates.push(latLng);
    })
    return coordinates;
  }

  static getLatLongBoundaries(run) {
    let minLat = run.data[0].lat;
    let maxLat = run.data[0].lat;
    let minLong = run.data[0].long;
    let maxLong = run.data[0].long;
    run.data.forEach((location) => {
      minLat = Math.min(minLat, location.lat);
      maxLat = Math.max(maxLat, location.lat);
      minLong = Math.min(minLong, location.long);
      maxLong = Math.max(maxLong, location.long);
    });
    return {
      latitudeDelta: maxLat - minLat,
      longitudeDelta: maxLong - minLong,
      latitudeCenter: (maxLat + minLat) / 2,
      longitudeCenter: (maxLong + minLong) / 2
    };
  }  

}