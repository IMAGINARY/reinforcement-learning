import Konva from 'konva';

import { maze, } from "./rl.js";
import { dirToMovement } from './dir';
import { areEqual, areAdjacent } from './coord';

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

function createMatrixFromMaze(maze) {
  var matrix = [];
  for (var y = 0 ; y < maze.height ; y++)
    matrix[y] = new Array(maze.width);
  return matrix;
}

export class MapView {
  constructor(containerId, machine, maze, environment, tileSize, infoViews, onCellTouch) {
    this.TileSize = tileSize;
    this.HalfTile = this.TileSize/2;
    this.machine = machine;
    this.environment = environment;
    this.machine.setStateChangeCallback((oldState, newState) => this.onStateChange(oldState, newState));
    this.machine.setResetCallback( () => this.onReset());
    this.machine.onRunStart.set( () => this.updateVisibilities() );
    this.machine.onRunEnd.set( () => this.updateVisibilities() );
    this.onCellTouch = onCellTouch;
    this.editorMode = machine.editorMode;
    this.infoViews = infoViews;

    this.stage = new Konva.Stage({
      container: containerId,
      width: 0,
      height: 0
    });

    this.setMaze(maze);
  }

  setEditorMode(editorMode) {
    this.editorMode = editorMode;
    this.updateVisibilities();
  }

  setMaze(maze) {
    this.maze = maze;
    if (this.stage.hasChildren())
      this.stage.destroyChildren();

    this.stage.width(this.TileSize * maze.width);
    this.stage.height(this.TileSize * maze.height);

    this.createMazeLayer();
    this.createQLayer();
    this.createGreedyLayer();
    this.createFogLayer();
    this.createObjectsLayer();
    this.updateFog();
    this.updateVisibilities();
  }

  redrawMap() {
    this.maze.allCoordinates.forEach( coord => {
      this.mapTiles[coord.y][coord.x].fill(this.getTileColor(coord));
    });
    this.mapLayer.draw();
  }

  updateVisibilities() {
    this.objectsLayer.visible(!this.editorMode);
    this.qLayer.visible(this.infoViews.qvalue && !this.editorMode && !this.machine.running);
    this.greedyPathLayer.visible(this.infoViews.greedy && !this.editorMode && !this.machine.running);
    this.greedyTilesLayer.visible(this.infoViews.greedy && !this.editorMode && !this.machine.running);
    this.fogLayer.visible(this.infoViews.fog && !this.editorMode);

    this.objectsLayer.draw();
    this.qLayer.draw();
    this.greedyPathLayer.draw();
    this.greedyTilesLayer.draw();
    this.fogLayer.draw();
  }

  setQValuesVisible(visible) {
    this.infoViews.qvalue = visible;
    this.updateVisibilities();
  }

  setGreedyVisible(visible) {
    this.infoViews.greedy = visible;
    this.updateVisibilities();
  }

  setFogVisible(visible) {
    this.infoViews.fog = visible;
    this.updateVisibilities();
  }
  
  visibleInFog(coord) {
    const robotPosition = this.environment.state2position(this.machine.state);
    return areAdjacent(robotPosition, coord) || areEqual(robotPosition, coord) || this.isEndPosition(coord);
  }

  isEndPosition(coord) {
    return this.maze.isEndPosition(coord);
  }

  getTileColor(coord) {
    return this.maze.isTransitable({ x: coord.x, y: coord.y}) ? TransitableColor : WallColor;
  }

  tilePos(coord) {
    return {
      x: coord.x * this.TileSize,
      y: coord.y * this.TileSize
    }
  };

  tileRect(coord) {
    return {
      ...this.tilePos(coord),
      width: this.TileSize,
      height: this.TileSize,
    };
  }

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
    this.stage.add(this.greedyTilesLayer);
  }

  updateGreedyPath(oldState) {
    const oldCoord = this.environment.state2position(oldState);
    const bestAction = this.machine.qTable.getBestAction(oldState);
    const hasBestAction = bestAction != undefined;
    if (hasBestAction) {
      const arrowDirection = dirToMovement(bestAction);
      this.greedyTiles[oldCoord.y][oldCoord.x].points(
        [this.HalfTile, this.HalfTile, this.HalfTile + arrowDirection.x*this.HalfTile, this.HalfTile + arrowDirection.y*this.HalfTile]);
    }
    this.greedyTiles[oldCoord.y][oldCoord.x].visible(hasBestAction);

    const path = this.machine.getGreedyPath(this.environment.startState);
    if (path.lenght < 2)
      return;
    
    var lineCoordinates = [];
    path.map( state => this.environment.state2position(state) ).forEach( coord => {
      lineCoordinates.push(coord.x * this.TileSize + this.HalfTile);
      lineCoordinates.push(coord.y * this.TileSize + this.HalfTile);
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
        ...this.tileRect(coord),
        fill: this.getTileColor(coord)
      });
      rect.on('mousedown tap', () => this.onCellTouch(coord) );
      this.mapTiles[coord.y][coord.x] = rect;
      this.mapLayer.add(rect);
    });
    this.stage.add(this.mapLayer);
  }

  createImageAtTile(imageSource, coord) {
    const thisImage = new Konva.Image({
      ...this.tileRect(coord),
      image: null,
    });
    asyncLoadImage(imageSource, image => {
      thisImage.image(image);
      this.objectsLayer.draw();
    });
    return thisImage;
  }

  createObjectsLayer() {
    this.objectsLayer = new Konva.Layer();
    this.robot = this.createImageAtTile("img/robot.png", this.maze.startPosition);
    this.station = this.createImageAtTile("img/station.png", this.maze.endPositions[0]);
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

  createFogLayer() {
    this.fogLayer = new Konva.Layer();
    this.fogTiles = createMatrixFromMaze(maze);
    this.maze.allCoordinates.forEach( coord => {
      const fog = new Konva.Rect({
        ...this.tileRect(coord),
        fill: TileFogColor
      });
      this.fogTiles[coord.y][coord.x] = fog;
      this.fogLayer.add(fog);
      fog.on('mousedown tap', () => this.onCellTouch(coord) );
    });
    this.stage.add(this.fogLayer);
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
    this.updateFog();
  }

  onStateChange(oldState, newState) {
    this.updateQValue(oldState);
    this.updateGreedyPath(oldState);
    this.setRobotPosition(this.environment.state2position(newState));
    this.updateFog();
  }

  updateFog() {
    this.maze.allCoordinates.forEach( coord => {
      this.fogTiles[coord.y][coord.x].visible( !this.visibleInFog(coord) );
    });
    this.fogLayer.draw();
  }

  updateQValue(state) {
    const coord = this.environment.state2position(state);
    this.qTexts[coord.y][coord.x].text('Q: ' + this.machine.qTable.getMaxValue(state).toFixed(2));
    this.qLayer.draw();
  }

  setRobotPosition(coord) {
    this.robot.x(coord.x * this.TileSize);
    this.robot.y(coord.y * this.TileSize);
    this.objectsLayer.draw();
  }
}
