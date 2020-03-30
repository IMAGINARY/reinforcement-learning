import Konva from 'konva';

import { tile } from './tile';
import { maze  } from "./rl.js";
import { dir, dirToMovement } from './dir';
import { areEqual, areAdjacent } from './coord';
import { getQColor } from './color-utils';

export const TileStrokeColor = "#DDDDDD";
const TileFogColor = "#404040";
const TransitableColor = "#F0F0F0";
const WallColor = "#101010";
const MainYellow = "#FFEC02";
const MainViolet = "#8F1A81";
const DangerousColor = "#665F25";
const Magenta = "#FF00FF";


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
    this.QuarterTile = this.TileSize/4;
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
  
  loadLevel(levelMap) {
    this.maze.setLevelMap(levelMap);
    this.setMaze(maze);
    this.environment.setMaze(maze);
    this.machine.resetState();
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
    this.createObjectsLayer();
    this.createFogLayer();

    this.updateMoveButtons(this.environment.startState);
    this.updateFog();
    this.updateVisibilities();

    this.objectsLayer.draw();
  }

  update(coord) {
    this.mapTiles[coord.y][coord.x].fill(this.getTileColor(coord));
    this.mapLayer.draw();
  }

  redrawMap() {
    this.maze.allCoordinates.forEach( coord => {
      this.mapTiles[coord.y][coord.x].fill(this.getTileColor(coord));
    });
    if (this.maze.hasEndPosition())
      this.placeImageOverTile(this.station, this.maze.endPosition);
    this.mapLayer.draw();
  }

  updateVisibilities() {
    const editing = this.editorMode;
    const running = this.machine.batchRunning;
    this.objectsLayer.visible(!editing);
    this.qLayer.visible(this.infoViews.qvalue && !editing && !running);
    this.greedyTilesLayer.visible(this.infoViews.greedy && !editing && !running);
    this.fogLayer.visible(this.infoViews.fog && !editing);

    this.objectsLayer.draw();
    this.qLayer.draw();
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
    return areAdjacent(robotPosition, coord) || areEqual(robotPosition, coord);
  }

  isEndPosition(coord) {
    return this.maze.isEndPosition(coord);
  }

  getTileColor(coord) {
    switch (this.maze.getTileType(coord)) {
      case tile.start: return MainYellow;
      case tile.end: return MainViolet;
      case tile.regular: return TransitableColor;
      case tile.wall: return WallColor;
      case tile.dangerous: return DangerousColor;
      default: return Magenta;
    }
  }

  tilePos(coord) {
    return {
      x: coord.x * this.TileSize,
      y: coord.y * this.TileSize
    }
  };

  placeImageOverTile(image, coord) {
    image.x(coord.x * this.TileSize);
    image.y(coord.y * this.TileSize);
  }

  tileRect(coord) {
    return {
      ...this.tilePos(coord),
      width: this.TileSize,
      height: this.TileSize,
    };
  }

  createTileRect(coord, props) {
    return new Konva.Rect({
      ...this.tileRect(coord),
      ...props
    });
  }

  createGreedyLayer() {
    const ArrowProperties = {
      strokeWidth: 5,
      lineCap: 'round',
      lineJoin: 'round'
    };

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

  updateGreedy(oldState) {
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
    
    this.maze.allCoordinates.forEach( coord  => {
      const state = this.environment.position2state(coord);
      this.greedyTiles[coord.y][coord.x].stroke(
          (path.includes(state)) ? MainViolet : MainYellow
          );
    });
   this.greedyTilesLayer.draw();
  }

  createMazeLayer() {
    this.mapLayer = new Konva.Layer();
    this.mapTiles = createMatrixFromMaze(this.maze);
    this.maze.allCoordinates.forEach( coord => {
      const rect = this.createTileRect(coord, {
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
    if (this.maze.hasEndPosition()) {
      this.station = this.createImageAtTile("img/station.png", this.maze.endPosition);
      this.objectsLayer.add(this.station);
    }
    this.objectsLayer.add(this.robot);

    this.buttonsGroup = new Konva.Group();
    const create = (rotation, action, position) => {
      const button = new Konva.Image(
      { ...position,
        image: null,
        visible: true,
        width: this.HalfTile,
        height: this.HalfTile,
        rotation: rotation,
        offset: { x: this.QuarterTile, y: this.QuarterTile }
       } );
       button.on('mousedown tap', () => this.machine.attemptStep(this.machine.state, action) );
      return button;
    };
    this.moveButtons = {
      up: create(0, dir.UP, {x: this.HalfTile, y: -this.QuarterTile}),
      right: create(90, dir.RIGHT, {x: this.TileSize + this.QuarterTile, y: this.HalfTile}),
      down: create(180, dir.DOWN, {x: this.HalfTile, y: this.TileSize + this.QuarterTile}),
      left: create(270, dir.LEFT, {x: - this.QuarterTile, y: this.HalfTile}),
    };
    asyncLoadImage("img/arrow_button.png", image => {
      Object.keys(this.moveButtons).forEach( button => {
        this.moveButtons[button].image(image);
        this.buttonsGroup.add(this.moveButtons[button]);
      } )
      this.objectsLayer.batchDraw();
    });
    this.buttonsGroup.setAttrs(this.tilePos(this.maze.startPosition));
    this.objectsLayer.add(this.buttonsGroup);

    this.stage.add(this.objectsLayer);
    this.objectsLayer.batchDraw();
  }

  createQLayer() {
    var tooltip = new Konva.Text({
      text: '',
      fontFamily: 'Calibri',
      fontSize: 14,
      padding: 5,
      textFill: 'white',
      fill: 'magenta',
      visible: false
    });

    this.qLayer = new Konva.Layer({
      opacity: 0.5
    });
    this.qValues = createMatrixFromMaze(this.maze);
    this.maze.allCoordinates.forEach( coord => {
      const tilePos = this.tilePos(coord);
      const qv = new Konva.Rect({
        x: tilePos.x + this.QuarterTile,
        y: tilePos.y + this.QuarterTile,
        width: this.HalfTile,
        height: this.HalfTile,
        fill: WallColor,
        visible: false,
      });
      qv.on('mousemove', () => {
        const mousePos = this.stage.getPointerPosition();
        tooltip.show();
        tooltip.position({
          x: mousePos.x + 5,
          y: mousePos.y + 5
        });
        const state = this.environment.position2state(coord);
        const text = "q @ " + JSON.stringify(coord) + ": " + this.machine.qTable.getMaxValue(state).toFixed(4) +
                    "\nnormalized: " + this.machine.qTable.normalizedQValue(state).toFixed(4) +
                    "\nbest action: " + this.machine.qTable.getBestAction(state) +
                    "\ncolor: " + this.colorForQValue(state)
                    ;
        tooltip.text(text);
        this.qLayer.batchDraw();
      });
      qv.on('mouseout', () => {
        tooltip.hide();
        this.qLayer.draw();
      });
      
      this.qLayer.add(qv);
      this.qValues[coord.y][coord.x] = qv;
    });
    this.qLayer.add(tooltip);
    this.stage.add(this.qLayer);
  }

  createFogLayer() {
    this.fogLayer = new Konva.Layer();
    this.fogTiles = createMatrixFromMaze(maze);
    this.maze.allCoordinates.forEach( coord => {
      const fog = this.createTileRect(coord, {
        fill: TileFogColor
      });
      this.fogTiles[coord.y][coord.x] = fog;
      this.fogLayer.add(fog);
      fog.on('mousedown tap', () => this.onCellTouch(coord) );
    });
    this.stage.add(this.fogLayer);
  }

  resetGreedy() {
    this.greedyTilesLayer.getChildren().forEach( child => {
      child.visible(false);
    });
  }

  resetQLayer() {
    this.qLayer.getChildren().forEach( child => {
      child.visible(false);
    });
  }

  onReset() {
    this.resetGreedy();
    this.resetQLayer();
    this.greedyTilesLayer.draw();
    this.qLayer.draw();
    this.updateFog();
  }

  onStateChange(oldState, newState) {
    this.updateQValue(oldState);
    this.updateGreedy(oldState);
    this.setRobotPosition(this.environment.state2position(newState));
    this.updateMoveButtons(newState);
    this.updateFog();
    this.objectsLayer.draw();
  }

  updateFog() {
    this.maze.allCoordinates.forEach( coord => {
      this.fogTiles[coord.y][coord.x].visible( !this.visibleInFog(coord) );
    });
    this.fogLayer.draw();
  }

  colorForQValue(state) {
    var qValue = Math.pow(this.machine.qTable.normalizedQValue(state), 1/4);
    return getQColor(qValue);
  }
  
  updateQValue(state) {
    const coord = this.environment.state2position(state);
    this.qValues[coord.y][coord.x].visible(true);
    this.qValues[coord.y][coord.x].fill(this.colorForQValue(state));
    this.qLayer.draw();
  }

  updateMoveButtons(state) {
    const actions = this.environment.actions(state);
    const coord = this.environment.state2position(state);
    this.buttonsGroup.setAttrs(this.tilePos(coord));
    this.moveButtons.up.visible(actions.includes(dir.UP));
    this.moveButtons.right.visible(actions.includes(dir.RIGHT));
    this.moveButtons.down.visible(actions.includes(dir.DOWN));
    this.moveButtons.left.visible(actions.includes(dir.LEFT));
    this.buttonsGroup.draw();
  }

  setRobotPosition(coord) {
    this.robot.x(coord.x * this.TileSize);
    this.robot.y(coord.y * this.TileSize);
  }
}
