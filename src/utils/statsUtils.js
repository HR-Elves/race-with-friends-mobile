export default class StatsUtils {

  // returns result in meters
  static getDistanceCovered(runs) {
    let distanceCovered = 0;
    runs.forEach((run) => {
      let runDistance = run.data[run.data.length - 1].distanceTotal;
      distanceCovered += runDistance;
    });
    return Math.round(distanceCovered);
  }

  // returns result in milliseconds
  static getTotalRunTime(runs) {
    let totalRunTime = 0;
    runs.forEach((run) => {
      let runTime = run.data[run.data.length - 1].timeTotal;
      totalRunTime += runTime;
    });
    return totalRunTime;    
  }

  // returns result in meters / second
  static getAverageSpeed(runs) {
    let distanceCovered = StatsUtils.getDistanceCovered(runs); // meters
    let totalRunTime = StatsUtils.getTotalRunTime(runs) / 1000; // convert milliseconds to seconds
    return Math.round((distanceCovered / totalRunTime) * 10) / 10; // round to one decimal place
  }

  // returns result in meters / second
  static getMaxSpeed(runs) {
    let max = runs.reduce((accum, run) => {
      return Math.max(getMaxSpeedForRun(run.data), accum);
    }, 0);

    max *= 1000; // convert meters/millisecond to meters/second
    return Math.round(max * 10) / 10; // round to one decimal place

    function getMaxSpeedForRun(run) {
      return run.reduce((accum, location) => {
        let speed = location.timeDelta ? location.distanceDelta / location.timeDelta : 0;
        return Math.max(speed, accum);
      }, 0);  
    }
  }

}