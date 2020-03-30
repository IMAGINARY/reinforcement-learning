import { dir } from './dir';

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
      this.setMaze(maze);
    } catch (e) {
      // Ignore on purpose
    }   
  }

  setCell(coord, type) {
    this.maze.setTileType(coord, type);
    this.setMaze(this.maze);
  }
}
