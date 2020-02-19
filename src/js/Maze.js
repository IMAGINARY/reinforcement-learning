import { tile, dir, reward } from "./rl";

export class Maze {
  constructor(map, reward_map) {
    this.map = map;
    this.height = map.length;
    this.width = map[0].length;
    this.start_state = this.get_states(tile.start)[0];
    this.end_states = this.get_states(tile.end);
    this.actions = this.get_actions();
    this.transactions = this.get_transactions();
    this.rewards = this.get_rewards(reward_map);
  }
  getTileType(pos) {
    if (this.isInside(pos)) {
      return this.map[pos.y][pos.x];
    }
    return null;
  }
  isInside(coord) {
    return coord.x <= this.width && coord.y <= this.height;
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

  get_actions() {
    var actions = [];
    for (let idy = 0; idy < this.map.length; idy++) {
      for (let idx = 0; idx < this.map[0].length; idx++) {
        var action = [];
        if (this.map[idy][idx] == tile.wall) {
          actions.push(action);
          continue;
        }
        if (idy != 0) {
          if (this.map[idy - 1][idx] != tile.wall) {
            action.push(dir.UP);
          }
        }
        if (idy != this.map.length - 1) {
          if (this.map[idy + 1][idx] != tile.wall) {
            action.push(dir.DOWN);
          }
        }
        if (idx != 0) {
          if (this.map[idy][idx - 1] != tile.wall) {
            action.push(dir.LEFT);
          }
        }
        if (idx != this.map[0].length - 1) {
          if (this.map[idy][idx + 1] != tile.wall) {
            action.push(dir.RIGHT);
          }
        }
        actions.push(action);
      }
    }
    return actions;
  }
  get_transactions() {
    return function (state, action) {
      switch (action) {
        case dir.UP:
          return state - this.width;
        case dir.RIGHT:
          return state + 1;
        case dir.DOWN:
          return state + this.width;
        case dir.LEFT:
          return state - 1;
      }
    }.bind(this);
  }
  get_rewards(rewards) {
    rewards = [];
    for (let idy = 0; idy < this.map.length; idy++) {
      for (let idx = 0; idx < this.map[0].length; idx++) {
        rewards.push(reward[this.map[idy][idx]]);
      }
    }
    return rewards;
  }
}
