import Konva from 'konva';

import { maze, machine } from "./rl.js";
import { rgbToHex } from './color-utils';

export const TileStrokeColor = "#DDDDDD";
const TileFogColor = "#404040";
const TransitableColor = "#F0F0F0";
const WallColor = "#101010";

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
  }

  setGreedyVisible(visible) {
    this.greedyLayer.visible(visible);
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

  createGreedyLayer() {
    this.greedyLayer = new Konva.Layer();
    this.greedyPath = new Konva.Line({
      stroke: '#F6D080',
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round'
    });
    this.greedyLayer.add(this.greedyPath);
    this.stage.add(this.greedyLayer);
  }

  updateGreedyPath() {
    const path = this.machine.getGreedyPath();
    if (path.lenght < 2)
      return;
    
    var lineCoordinates = [];
    path.map( state => this.maze.state2position(state) ).forEach( coord => {
      lineCoordinates.push(coord.x * this.TileSize + (this.TileSize/2));
      lineCoordinates.push(coord.y * this.TileSize + (this.TileSize/2));
    });
    this.greedyPath.points(lineCoordinates);
    this.greedyLayer.draw();
  }

  createMazeLayer() {
    this.mapLayer = new Konva.Layer();
    this.mapTiles = createMatrixFromMaze(this.maze);
    this.maze.allCoordinates.forEach( coord => {
      const rect = new Konva.Rect({
        x: coord.x * this.TileSize,
        y: coord.y * this.TileSize,
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
      x: coord.x * this.TileSize,
      y: coord.y * this.TileSize,
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
    this.stage.add(this.qLayer);
  }

  resetQTexts() {
    this.qLayer.getChildren().forEach( child => {
      child.text("");
    });
  }

  onReset() {
    this.resetQTexts();
    this.qLayer.draw();
  }

  onStateChange(oldState, newState) {
    this.updateQValue(oldState);
    this.updateGreedyPath();
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
