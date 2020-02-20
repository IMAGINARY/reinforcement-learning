import { tile, dir, reward } from "./rl";

export class Maze {
  constructor(levelMap, rewardsMap) {
    this.map = levelMap;
    this.height = levelMap.length;
    this.width = levelMap[0].length;
    this.start_state = this.get_states(tile.start)[0];
    this.end_states = this.get_states(tile.end);
    this.actions = this.get_actions();
    this.transactions = this.get_transactions();
    this.rewardsMap = rewardsMap;
  }

  getTileType(pos) {
    if (this.isInside(pos)) {
      return this.map[pos.y][pos.x];
    }
    return null;
  }

  isInside(coord) {
    return coord.x >= 0 && coord.x < this.width && coord.y >= 0 && coord.y < this.height;
  }

  isTransitable(coord) {
    return this.isInside(coord) && this.getTileType(coord) != tile.wall;
  }

  get_states(tile) {
    var res = [];
    for (var idy = 0; idy < this.map.length; idy++) {
      for (var idx = 0; idx < this.map[idy].length; idx++) {
        if (this.map[idy][idx] == tile) {
          res.push(idy * this.map[0].length + idx);
        }
      }
    }
    return res;
  }

  dirToDiff(direction) {
    switch (direction) {
      case dir.UP: return { x: 0, y: -1 };
      case dir.DOWN: return { x: 0, y: 1 };
      case dir.LEFT: return { x: -1, y: 0 };
      case dir.RIGHT: return { x: 1, y: 0 };
    }
  }

  canMove(from, dir) {
    const diff = this.dirToDiff(dir);
    const dest = { x: from.x + diff.x, y: from.y + diff.y };
    return this.isTransitable(dest);
  }

  get_actions() {
    var mapActions = [];
    var coord = { x : 0, y: 0 };

    for (coord.y = 0; coord.y < this.map.length; coord.y++) {
      for (coord.x = 0; coord.x < this.map[0].length; coord.x++) {
        var cellActions = [];
        if (this.isTransitable(coord)) {
          [dir.UP, dir.DOWN, dir.RIGHT, dir.LEFT].forEach( dir => {
            if (this.canMove(coord, dir))
              cellActions.push(dir);
          });
        }
        mapActions.push(cellActions);
      }
    }
    return mapActions;
  }

  get_transactions() {
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
