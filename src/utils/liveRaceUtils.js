import {findCurrentRaceIndex, findDistanceToOpponent} from './raceUtils.js';

export function getLiveRaceStatus(currentLoc, raceObj, prevRaceStatus, raceLength) {
  if (!prevRaceStatus) {
    return {
      distanceToOpponent: 0,    // if positive, user is ahead of opponent; if negative, user is behind opponent
      passedOpponent: false,
      passedByOpponent: false,
      distanceRemaining: raceLength,
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

    let distanceRemaining = raceLength - currentLoc.distanceTotal;

    // if (racerObj && racerObj[racerObj.length - 1].distanceTotal < raceObj[raceObj.length - 1].distanceTotal) {
    //   distanceRemaining = racerObj[racerObj.length - 1].distanceTotal - currentLoc.distanceTotal;
    // }

    let challengeDone = (distanceRemaining <= 0) || raceLength - currentLoc.distanceTotal + newDistanceToOpponent <= 0;

    // currentRaceIndex >= raceObj.length - 1;
    // currentLoc.distanceTotal + newDistanceToOpponent >= raceLength;

    // bandaid fix to solve discrepancy in voice reporting and text display
    if (challengeDone && distanceRemaining > 0) {
      newDistanceToOpponent = -distanceRemaining;
    }

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