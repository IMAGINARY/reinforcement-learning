import { tile } from "./tile";
import { dir, dirToMovement } from './dir'
import { areEqual } from './coord';

export class Maze {
  constructor(levelMap, rewardsMap) {
    this.map = levelMap;
    this.rewardsMap = rewardsMap;
    this.height = levelMap.length;
    this.width = levelMap[0].length;
    this.generateCoordinates();

    this.startPosition = this.getCoordsWithType(tile.start)[0];
    this.endPositions = this.getCoordsWithType(tile.end);
    this.allStates = new Array(this.height * this.height).map( (value, index) => index);
  }

  generateCoordinates() {
    this.allCoordinates = [];
    for (var y = 0 ; y < this.height ; y++)
      for (var x = 0 ; x < this.width ; x++)
        this.allCoordinates.push({ x: x, y: y});
  }
  
  getTileType(pos) {
    if (this.isInside(pos)) {
      return this.map[pos.y][pos.x];
    }
    return null;
  }

  isEndState(coord) {
    return this.endPositions.some( c => areEqual(c, coord) );
  }

  isInside(coord) {
    return coord.x >= 0 && coord.x < this.width && coord.y >= 0 && coord.y < this.height;
  }

  isTransitable(coord) {
    return this.isInside(coord) && this.getTileType(coord) != tile.wall;
  }

  getCoordsWithType(type) {
    return this.allCoordinates.filter( coord => this.map[coord.y][coord.x] == type );
  }

  canMove(from, dir) {
    const movement = dirToMovement(dir);
    const dest = { x: from.x + movement.x, y: from.y + movement.y };
    return this.isTransitable(dest);
  }

  getActionsForStateFunction() {
    const maze = this;
    return function(state) {
      const coord = maze.state2position(state);
      var cellActions = [];
      if (maze.isTransitable(coord)) {
        [dir.UP, dir.DOWN, dir.RIGHT, dir.LEFT].forEach( dir => {
          if (maze.canMove(coord, dir))
            cellActions.push(dir);
        });
      }
      return cellActions;
    }
  }

  getTransitionFunction() {
    const thisMaze = this;
    return function (state, action) {
      switch (action) {
        case dir.UP:
          return state - thisMaze.width;
        case dir.RIGHT:
          return state + 1;
        case dir.DOWN:
          return state + thisMaze.width;
        case dir.LEFT:
          return state - 1;
      }
    };
  }

  state2position(state) {
    return {
      x: (state % this.width),
      y: Math.floor(state / this.width),
    }
  };

  position2state(coord) {
    return coord.x + coord.y * this.width;
  };

  getRewardFunction() {
    const maze = this;
    return function(state) {
      const position = maze.state2position(state);
      return maze.rewardsMap[maze.map[position.y][position.x]];
    };
  }

}
