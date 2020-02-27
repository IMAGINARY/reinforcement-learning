import Konva from 'konva';

import { maze, machine } from "./rl.js";
import { dir, dirToMovement } from './dir';
import { rgbToHex } from './color-utils';

export const TileStrokeColor = "#DDDDDD";
const TileFogColor = "#404040";
const TransitableColor = "#F0F0F0";
const WallColor = "#101010";
const MainYellow = "#FFEC02";
const MainViolet = "#8F1A81";

function asyncLoadImage(imagesrc, setFunction) {
  const image = new window.Image();
  image.src = imagesrc;
  image.onload = () => {
    setFunction(image);
  }
}

const ValueVisualizer = {
  fillColor(state) {
    const color = rgbToHex(255, machine.normalizedValue(state), 255);
    return color;
  },
  opacity(state) {
    return (occludedByFog(state) || !maze.isTransitable(maze.state2position(state))) ? 0 : 0.25;
  }
}

function createMatrixFromMaze(maze) {
  var matrix = [];
  for (var y = 0 ; y < maze.height ; y++)
    matrix[y] = new Array(maze.width);
  return matrix;
}

export class MapView {
  constructor(containerId, machine, maze, tileSize) {
    this.TileSize = tileSize;
    this.HalfTile = this.TileSize/2;
    this.maze = maze;
    this.machine = machine;
    this.fogEnabled = false;
    this.machine.setStateChangeCallback((oldState, newState) => this.onStateChange(oldState, newState));
    this.machine.setResetCallback( () => this.onReset());

    this.stage = new Konva.Stage({
      container: containerId,
      width: tileSize * maze.width,
      height: tileSize * maze.height
    });

    this.createMazeLayer();
    this.createObjectsLayer();
    this.createQLayer();
    this.createGreedyLayer();
  }

  setQValuesVisible(visible) {
    this.qLayer.visible(visible);
    if (visible)
      this.qLayer.draw();
  }

  setGreedyVisible(visible) {
    this.greedyPathLayer.visible(visible);
    this.greedyTilesLayer.visible(visible);
    if (visible) {
      this.greedyPathLayer.draw();
      this.greedyTilesLayer.draw();
    }
  }

  setFogVisible(visible) {
    this.fogEnabled = visible;
  }
  
  occludedByFog(coord) {
    return this.fogEnabled && !this.isNextToRobot(coord);
  }

  isNextToRobot(coord) {
    const robotPosition = this.maze.state2position(this.machine.state);
    return (robotPosition.x == coord.x && (robotPosition.y == coord.y + 1 || robotPosition.y == coord.y - 1)) ||
           (robotPosition.y == coord.y && (robotPosition.x == coord.x + 1 || robotPosition.x == coord.x - 1)) ||
           (robotPosition.x == coord.x && robotPosition.y == coord.y);
  }

  getTileColor(coord) {
    return this.occludedByFog(coord) ? TileFogColor : 
           this.maze.isTransitable({ x: coord.x, y: coord.y}) ? TransitableColor : WallColor;
  }

  tilePos(coord) {
    return {
      x: coord.x * this.TileSize,
      y: coord.y * this.TileSize
    }
  };

  createGreedyLayer() {
    const ArrowProperties = {
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round'
    };

    this.greedyPathLayer = new Konva.Layer();
    this.greedyPath = new Konva.Line({
      ...ArrowProperties,
      stroke: MainViolet,
    });
    this.greedyPathLayer.add(this.greedyPath);
    this.greedyPathLayer.visible(false);
    this.stage.add(this.greedyPathLayer);

    this.greedyTilesLayer = new Konva.Layer();
    this.greedyTiles = createMatrixFromMaze(this.maze);
    maze.allCoordinates.forEach( coord => {
      this.greedyTiles[coord.y][coord.x] = new Konva.Arrow({
        ...this.tilePos(coord),
        ...ArrowProperties,
        stroke: MainYellow,
        visible: false
      });
      this.greedyTilesLayer.add(this.greedyTiles[coord.y][coord.x]);
    });
    this.greedyTilesLayer.visible(false);
    this.stage.add(this.greedyTilesLayer);
  }

  updateGreedyPath(oldState) {
    const oldCoord = this.maze.state2position(oldState);
    const bestAction = this.machine.qTable.getBestAction(oldState);
    const hasBestAction = bestAction != undefined;
    if (hasBestAction) {
      const arrowDirection = dirToMovement(bestAction);
      this.greedyTiles[oldCoord.y][oldCoord.x].points(
        [this.HalfTile, this.HalfTile, this.HalfTile + arrowDirection.x*this.HalfTile, this.HalfTile + arrowDirection.y*this.HalfTile]);
    }
    this.greedyTiles[oldCoord.y][oldCoord.x].visible(hasBestAction);

    const path = this.machine.getGreedyPath();
    if (path.lenght < 2)
      return;
    
    var lineCoordinates = [];
    path.map( state => this.maze.state2position(state) ).forEach( coord => {
      lineCoordinates.push(coord.x * this.TileSize + (this.TileSize/2));
      lineCoordinates.push(coord.y * this.TileSize + (this.TileSize/2));
    });
    this.greedyPath.points(lineCoordinates);
    this.greedyTilesLayer.draw();
    this.greedyPathLayer.draw();
  }

  createMazeLayer() {
    this.mapLayer = new Konva.Layer();
    this.mapTiles = createMatrixFromMaze(this.maze);
    this.maze.allCoordinates.forEach( coord => {
      const rect = new Konva.Rect({
        ...this.tilePos(coord),
        width: this.TileSize,
        height: this.TileSize,
        fill: this.getTileColor(coord)
      });
      this.mapTiles[coord.y][coord.x] = rect;
      this.mapLayer.add(rect);
    });
    this.stage.add(this.mapLayer);
  }

  createImageAtTile(imageSource, coord) {
    const thisImage = new Konva.Image({
      ...this.tilePos(coord),
      image: null,
      width: this.TileSize,
      height: this.TileSize
    });
    asyncLoadImage(imageSource, image => {
      thisImage.image(image);
      this.objectsLayer.draw();
    });
    return thisImage;
  }

  createObjectsLayer() {
    this.objectsLayer = new Konva.Layer();
    this.robot = this.createImageAtTile("img/robot.png", this.maze.state2position(this.maze.start_state));
    this.station = this.createImageAtTile("img/station.png", this.maze.state2position(this.maze.end_states[0]));
    this.objectsLayer.add(this.robot);
    this.objectsLayer.add(this.station);
    this.objectsLayer.batchDraw();
    this.stage.add(this.objectsLayer);
  }
  
  createQLayer() {
    this.qLayer = new Konva.Layer();
    this.qTexts = createMatrixFromMaze(this.maze);
    this.maze.allCoordinates.forEach( coord => {
      this.qTexts[coord.y][coord.x] = new Konva.Text({
        text: '',
        x: coord.x * this.TileSize + 5,
        y: coord.y * this.TileSize + 5,
        width: this.TileSize,
        height: this.TileSize,
        color: 'black'
      });
      this.qLayer.add(this.qTexts[coord.y][coord.x]);
    });
    this.qLayer.visible(false);
    this.stage.add(this.qLayer);
  }

  resetQTexts() {
    this.qLayer.getChildren().forEach( child => {
      child.text("");
    });
  }

  resetGreedy() {
    this.greedyTilesLayer.getChildren().forEach( child => {
      child.visible(false);
    });
    this.greedyPath.points([]);
  }

  onReset() {
    this.resetQTexts();
    this.resetGreedy();
    this.greedyTilesLayer.draw();
    this.greedyPathLayer.draw();
    this.qLayer.draw();
  }

  onStateChange(oldState, newState) {
    this.updateQValue(oldState);
    this.updateGreedyPath(oldState);
    this.setRobotPosition(this.maze.state2position(newState));
    if (this.fogEnabled)
      this.updateFog();
  }

  updateFog() {
    this.maze.allCoordinates.forEach( coord => {
      this.mapTiles[coord.y][coord.x].fill( this.getTileColor(coord) );
    });
    this.mapLayer.draw();
  }

  updateQValue(state) {
    const coord = this.maze.state2position(state);
    this.qTexts[coord.y][coord.x].text('Q: ' + this.machine.qTable.getMaxValue(state).toFixed(2));
    this.qLayer.draw();
  }

  setRobotPosition(coord) {
    this.robot.x(coord.x * this.TileSize);
    this.robot.y(coord.y * this.TileSize);
    this.objectsLayer.draw();
  }
}
