import { dir } from './dir';
import { tile } from './tile';

export class Environment {
  constructor(maze, rewardsMap) {
    this.setMaze(maze);
    this.setRewards(rewardsMap);
  }

  setMaze(maze) {
    this.maze = maze;
    this.startState = this.position2state(this.maze.startPosition);
    this.endState = this.maze.hasEndPosition() ? this.position2state(this.maze.endPosition) : undefined;
  }

  isEndState(state) {
    return state == this.endState;
  }

  setRewards(rewardsMap) {
    this.rewardsMap = rewardsMap;
  }

  state2position(state) {
    return {
      x: (state % this.maze.width),
      y: Math.floor(state / this.maze.width),
    };
  }
  
  position2state(coord) {
    return coord.x + coord.y * this.maze.width;
  }
  
  reward(state) {
    const position = this.state2position(state);
    return this.rewardsMap[this.maze.map[position.y][position.x]];
  }

  actions(state) {
    const coord = this.state2position(state);
    var cellActions = [];
    if (this.maze.isTransitable(coord)) {
      [dir.UP, dir.DOWN, dir.RIGHT, dir.LEFT].forEach(dir => {
        if (this.maze.canMove(coord, dir))
          cellActions.push(dir);
      });
    }
    return cellActions;
  }

  transition(state, action) {
    switch (action) {
      case dir.UP:
        return state - this.maze.width;
      case dir.RIGHT:
        return state + 1;
      case dir.DOWN:
        return state + this.maze.width;
      case dir.LEFT:
        return state - 1;
    }
  }

  getRawMapData() {
    return JSON.stringify(this.maze.map);
  }

  setRawMapData(rawMapData) {
    try {
      const newMap = JSON.parse(rawMapData);
      this.maze.setLevelMap(newMap);
      this.setMaze(this.maze);
    } catch (e) {
      // Ignore on purpose
    }   
  }

  setCell(coord, type) {
    const currentType = this.maze.getTileType(coord);

    // 'critical' tiles cannot be overriden, only placed somewhere else
    if (currentType == tile.start || currentType == tile.end)
      return;

    // when setting a cell to a 'critical' type, make sure to clean up the previous occurence
    if (type == tile.start)
      this.maze.setTileType(this.maze.startPosition, tile.regular);
    else if (type == tile.end)
      this.maze.setTileType(this.maze.endPosition, tile.regular);
    else {
      if (type == currentType)
        type = tile.regular;
    }

    this.maze.setTileType(coord, type);
    this.setMaze(this.maze);
  }

  switchTile(coord, switchType) {
    if (type == tile.end || type == tile.start)
      return;
    if (type == switchType)
      this.maze.setTileType(coord, tile.regular);
    else
      this.maze.setTileType(coord, switchType);
  }
}
