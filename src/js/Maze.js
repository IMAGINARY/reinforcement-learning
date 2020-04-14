import { tile } from "./tile";
import { dirToMovement } from './dir'
import { areEqual } from './coord';

function cloneMatrix(matrix) {
  var newMatrix = [];
  for (var i = 0; i < matrix.length; i++)
    newMatrix[i] = matrix[i].slice();

  return newMatrix;
}

const NullMap = [[2]];

export class Maze {
  constructor(levelMap = NullMap) {
    this.setLevelMap(levelMap);
  }

  setLevelMap(levelMap) {
    this.map = cloneMatrix(levelMap);
    this.height = levelMap.length;
    this.width = levelMap[0].length;
    this.generateCoordinates();
    this.updateStartAndEnd();
  }

  clear() {
    this.allCoordinates.forEach( coord => {
      const type = this.map[coord.y][coord.x];
      if (type != tile.start && type != tile.end)
        this.map[coord.y][coord.x] = tile.regular;
    });
  }

  updateStartAndEnd() {
    this.startPosition = this.findFirstWithType(tile.start);
    this.endPosition = this.findFirstWithType(tile.end);
  }

  generateCoordinates() {
    this.allCoordinates = [];
    for (var y = 0 ; y < this.height ; y++)
      for (var x = 0 ; x < this.width ; x++)
        this.allCoordinates.push({ x: x, y: y });
  }
  
  setTileType(coord, type) {
    if (!this.isInside(coord))
      return;

    this.map[coord.y][coord.x] = type;
    if (type == tile.end || type == tile.start)
      this.updateStartAndEnd();
  }

  getTileType(pos) {
    return this.isInside(pos) ? this.map[pos.y][pos.x] : null;
  }

  isEndPosition(coord) {
    return areEqual(this.endPosition, coord);
  }

  isStartPosition(coord) {
    return areEqual(this.startPosition, coord);
  }

  hasEndPosition() {
    return this.endPosition != undefined;
  }

  isInside(coord) {
    return coord.x >= 0 && coord.x < this.width && coord.y >= 0 && coord.y < this.height;
  }

  isTransitable(coord) {
    const type = this.getTileType(coord);
    return type != null && type != tile.wall;
  }

  getCoordsWithType(type) {
    return this.allCoordinates.filter( coord => this.map[coord.y][coord.x] == type );
  }

  findFirstWithType(type) {
    return this.allCoordinates.find( coord => this.map[coord.y][coord.x] == type );
  }

  canMove(from, dir) {
    const movement = dirToMovement(dir);
    const dest = { x: from.x + movement.x, y: from.y + movement.y };
    return this.isTransitable(dest);
  }
}
