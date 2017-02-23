import {findDistanceToOpponent, processLocation, getRaceStatus} from '../src/utils/raceUtils.js';

describe('findDistanceToOpponent', () => {
  const currentLoc = {
    distanceTotal: 16,  
    timeTotal: 7000           
  };
  const raceObj = [];
  
  it('should return distance to opponent', () => {
    raceObj[0] = {
      distanceTotal: 20,  
      timeTotal: 7000           
    };
    expect(findDistanceToOpponent(currentLoc, raceObj, 0)).toBe(-4);
  });

  it('should interpolate distance to opponent when data points aren\'t synchronized', () => {
    raceObj[0] = {
      distanceTotal: 10,  
      timeTotal: 5000      
    };
    raceObj[1] = {
      distanceTotal: 20,
      timeTotal: 10000
    };
    expect(findDistanceToOpponent(currentLoc, raceObj, 1)).toBe(2);
  });

  it('should return a valid distance at start of race even when data points aren\'t synchronized', () => {
    raceObj[0] = {
      distanceTotal: 10,  
      timeTotal: 5000      
    };
    expect(typeof(findDistanceToOpponent(currentLoc, raceObj, 0)) === 'number').toBe(true);
  });  

});

describe('getRaceStatus', () => {
  const currentLoc = {
    distanceTotal: 16,  
    timeTotal: 7000           
  };
  const raceObj = [{
    distanceTotal: 15,
    timeTotal: 7000
  }];
  const prevRaceStatus = {
    distanceToOpponent: -1,    // if positive, user is ahead of opponent; if negative, user is behind opponent
    passedOpponent: false,
    passedByOpponent: false,
    distanceRemaining: raceObj[raceObj.length - 1].distanceTotal,
    challengeDone: false,
    neckAndNeck: true,
    lastRaceIndexChecked: 0
  }

  it('should determine when player passes opponent', () => {
    let newRaceStatus = getRaceStatus(currentLoc, raceObj, prevRaceStatus);
    expect(newRaceStatus.passedOpponent).toBe(true);
  }); 

  it('should determine when race is over', () => {
    let newRaceStatus = getRaceStatus(currentLoc, raceObj, prevRaceStatus);
    expect(newRaceStatus.challengeDone).toBe(true);
  });  

});