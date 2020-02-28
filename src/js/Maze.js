import { tile } from "./tile";
import { dirToMovement } from './dir'
import { areEqual } from './coord';

export class Maze {
  constructor(levelMap) {
    this.setLevelMap(levelMap);
  }

  setLevelMap(levelMap) {
    this.map = levelMap;
    this.height = levelMap.length;
    this.width = levelMap[0].length;
    this.generateCoordinates();
    this.startPosition = this.getCoordsWithType(tile.start)[0];
    this.endPositions = this.getCoordsWithType(tile.end);
  }

  generateCoordinates() {
    this.allCoordinates = [];
    for (var y = 0 ; y < this.height ; y++)
      for (var x = 0 ; x < this.width ; x++)
        this.allCoordinates.push({ x: x, y: y });
  }
  
  getTileType(pos) {
    if (this.isInside(pos)) {
      return this.map[pos.y][pos.x];
    }
    return null;
  }

  isEndPosition(coord) {
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
}
