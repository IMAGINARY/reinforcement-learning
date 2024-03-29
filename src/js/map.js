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
const NotVisitedColor = "#D0D0D0";
const MainYellow = "#FFEC02";
const MainViolet = "#8F1A81";
const DangerousColor = "#665F25";
const Magenta = "#FF00FF";

const MaxWidth = 900;
const MaxHeight = 900;
const TileSize = 80;
const HalfTile = TileSize/2;
const QuarterTile = TileSize/4;

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
  constructor(containerId, machine, maze, environment, infoViews, onCellTouch) {
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
      width: MaxWidth,
      height: MaxHeight
    });

    this.setMaze(maze);
    setInterval( () => this.redraw(), 100 );
  }

  redraw() {
    if (this.machine.batchRunning)
      return

    this.mapLayer.draw();
    this.objectsLayer.draw();
    this.qLayer.draw();
    this.greedyTilesLayer.draw();
    this.fogLayer.draw();
    this.debugLayer.draw();
  }

  loadLevel(levelMap) {
    this.maze.setLevelMap(levelMap);
    this.setMaze(maze);
    this.environment.setMaze(maze);
    this.machine.resetEpisode();
  }

  setEditorMode(editorMode) {
    this.editorMode = editorMode;
    if (!editorMode)
      this.updateQValueVisibilities();
    this.updateVisibilities();
  }

  setMaze(maze) {
    this.maze = maze;
    if (this.stage.hasChildren())
      this.stage.destroyChildren();

    this.stage.offset({ x: ((TileSize * maze.width) - MaxWidth)/2,
                        y: ((TileSize * maze.height) - MaxHeight)/2});
    this.createMazeLayer();
    this.createQLayer();
    this.createGreedyLayer();
    this.createObjectsLayer();
    this.createFogLayer();
    this.createDebugLayer();

    this.updateMoveButtons(this.environment.startState);
    this.updateFog();
    this.updateVisibilities();
    this.updateDebug();
  }

  fadeOutRobot(duration = 1000) {
    return new Promise( (resolve) => {
      this.robot.opacity(1);
      var anim = new Konva.Animation((frame) => {
        if (frame.time >= duration) {
          this.robot.opacity(0);
          anim.stop();
          resolve();
        }

        this.robot.opacity(1 - (frame.time / duration));
      }, this.objectsLayer);
      anim.start();
    });
  }

  redrawMap() {
    this.maze.allCoordinates.forEach( coord => {
      this.mapTiles[coord.y][coord.x].fill(this.getTileColor(coord));
    });
    if (this.maze.hasEndPosition())
      this.placeImageOverTile(this.station, this.maze.endPosition);
  }

  updateVisibilities() {
    const editing = this.editorMode;
    const running = this.machine.batchRunning;
    this.objectsLayer.visible(!editing);
    this.qLayer.visible(this.infoViews.qvalue && !editing && !running);
    this.greedyTilesLayer.visible(this.infoViews.greedy && !editing && !running);
    this.fogLayer.visible(this.infoViews.fog && !editing);
    this.debugLayer.visible(this.infoViews.debug && !editing);

    this.redrawMap();
  }

  setButtonsVisible(visible) {
    this.buttonsGroup.visible(visible);
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
    this.station.visible(!visible);
    this.updateVisibilities();
  }

  setDebugVisible(visible) {
    this.infoViews.debug = visible;
    this.updateVisibilities();
  }

  visibleInFog(coord) {
    const robotPosition = this.environment.state2position(this.machine.state);
    return areAdjacent(robotPosition, coord) || areEqual(robotPosition, coord);
  }

  isEndPosition(coord) {
    return this.maze.isEndPosition(coord);
  }

  getTileColor(coord, ignoreFog = false) {
    switch (this.maze.getTileType(coord)) {
      case tile.start: return MainYellow;
      case tile.end: return (this.infoViews.fog && !ignoreFog) ? TransitableColor : MainViolet;
      case tile.regular: return TransitableColor;
      case tile.wall: return WallColor;
      case tile.dangerous: return (this.infoViews.fog && !ignoreFog) ? TransitableColor : DangerousColor;
      default: return Magenta;
    }
  }

  tilePos(coord) {
    return {
      x: coord.x * TileSize,
      y: coord.y * TileSize
    }
  };

  placeImageOverTile(image, coord) {
    image.x(coord.x * TileSize);
    image.y(coord.y * TileSize);
  }

  tileRect(coord) {
    return {
      ...this.tilePos(coord),
      width: TileSize,
      height: TileSize,
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
        [HalfTile, HalfTile, HalfTile + arrowDirection.x*HalfTile, HalfTile + arrowDirection.y*HalfTile]);
    }
    this.greedyTiles[oldCoord.y][oldCoord.x].visible(hasBestAction);
    this.recalculateGreedy();
  }

  recalculateGreedy() {
    const path = this.machine.getGreedyPath(this.machine.state);

    if (path.lenght < 2)
      return;

    this.maze.allCoordinates.forEach( coord  => {
      const state = this.environment.position2state(coord);
      this.greedyTiles[coord.y][coord.x].stroke(
          (path.includes(state)) ? MainViolet : MainYellow
          );
    });
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
        width: HalfTile,
        height: HalfTile,
        rotation: rotation,
        offset: { x: QuarterTile, y: QuarterTile }
       } );
       button.on('mousedown tap', () => this.machine.attemptStep(this.machine.state, action) );
      return button;
    };
    this.moveButtons = {
      up: create(0, dir.UP, {x: HalfTile, y: -QuarterTile}),
      right: create(90, dir.RIGHT, {x: TileSize + QuarterTile, y: HalfTile}),
      down: create(180, dir.DOWN, {x: HalfTile, y: TileSize + QuarterTile}),
      left: create(270, dir.LEFT, {x: - QuarterTile, y: HalfTile}),
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
    this.qLayer = new Konva.Layer({
      opacity: 0.5
    });
    this.qValues = createMatrixFromMaze(this.maze);
    this.maze.allCoordinates.forEach( coord => {
      const tilePos = this.tilePos(coord);
      const tileParams = {
        x: tilePos.x + QuarterTile,
        y: tilePos.y + QuarterTile,
        width: HalfTile,
        height: HalfTile};
      const qv = new Konva.Rect({
        ...tileParams,
        fill: NotVisitedColor,
        visible: this.maze.isTransitable(coord),
      });
      this.qLayer.add(qv);
      this.qValues[coord.y][coord.x] = qv;
    });
    this.stage.add(this.qLayer);
  }

  updateQValueVisibilities() {
    this.maze.allCoordinates.forEach( coord => {
      this.qValues[coord.y][coord.x].visible(this.maze.isTransitable(coord));
    });
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
    this.fogLayer.visible(false);
    this.stage.add(this.fogLayer);
  }

  createDebugLayer() {
    this.debugLayer = new Konva.Layer({
      listening: false
    });
    this.debugTiles = createMatrixFromMaze(maze);
    this.maze.allCoordinates.forEach( coord => {
      const label = new Konva.Text({
        width: TileSize,
        height: TileSize,
        x: coord.x * TileSize,
        y: coord.y * TileSize,
        fontSize: 14,
        align: 'center',
        verticalAlign: 'middle',
        stroke: '#000000',
      });
      this.debugTiles[coord.y][coord.x] = label;
      this.debugLayer.add(label);
    });
    this.debugLayer.visible(false);
    this.stage.add(this.debugLayer);
  }

  resetGreedy() {
    this.greedyTilesLayer.getChildren().forEach( child => {
      child.visible(false);
    });
  }

  resetQLayer() {
    this.maze.allCoordinates.forEach( coord => {
      this.qValues[coord.y][coord.x].visible(false);
    });
  }

  resetDebugLayer() {
    this.updateDebug();
  }

  onReset() {
    this.resetGreedy();
    this.resetQLayer();
    this.resetDebugLayer();
    this.updateFog();
  }

  onStateChange(oldState, newState) {
    this.updateQValue(oldState);
    this.updateDebugTile(oldState);
    this.updateGreedy(oldState);
    this.update(newState);
    if (this.infoViews.reward) {
      this.showReward(this.environment.state2position(newState), this.machine.qTable.lastQUpdate.reward);
    }

    // a bit hacky... this makes dangerous and end tiles visible under fog only if the robot is on them
    const oldCoord = this.environment.state2position(oldState);
    this.mapTiles[oldCoord.y][oldCoord.x].fill(this.getTileColor(oldCoord));
    const coord = this.environment.state2position(newState);
    this.mapTiles[coord.y][coord.x].fill(this.getTileColor(coord, true));
  }

  update(currentState) {
    this.setRobotPosition(this.environment.state2position(currentState));
    this.updateMoveButtons(currentState);
    this.updateFog();
    this.redraw();
  }

  updateFog() {
    this.maze.allCoordinates.forEach( coord => {
      this.fogTiles[coord.y][coord.x].visible( !this.visibleInFog(coord) );
    });
  }

  updateDebug() {
    this.maze.allCoordinates.forEach( coord => {
      const state = this.environment.position2state(coord);
      var qValue = this.machine.qTable.getMaxValue(state);
      this.debugTiles[coord.y][coord.x].text(qValue);
    });
  }

  updateDebugTile(state) {
    const coord = this.environment.state2position(state);
    var qValue = this.machine.qTable.getMaxValue(state);
    this.debugTiles[coord.y][coord.x].text(qValue.toPrecision(3));
  }

  colorForQValue(state) {
    var qValue = Math.pow(this.machine.qTable.normalizedQValue(state), 1/4);
    return getQColor(qValue);
  }

  updateQValue(state) {
    const coord = this.environment.state2position(state);
    this.qValues[coord.y][coord.x].visible(true);
    this.qValues[coord.y][coord.x].fill(this.colorForQValue(state));
  }

  updateMoveButtons(state) {
    const actions = this.environment.actions(state);
    const coord = this.environment.state2position(state);
    this.buttonsGroup.setAttrs(this.tilePos(coord));
    this.moveButtons.up.visible(actions.includes(dir.UP));
    this.moveButtons.right.visible(actions.includes(dir.RIGHT));
    this.moveButtons.down.visible(actions.includes(dir.DOWN));
    this.moveButtons.left.visible(actions.includes(dir.LEFT));
  }

  setRobotPosition(coord) {
    this.robot.x(coord.x * TileSize);
    this.robot.y(coord.y * TileSize);
    this.recalculateGreedy();
  }

  showReward(coord, reward) {
    if (this.machine.batchRunning)
      return;

    const pos = this.tilePos(coord);

    const group = new Konva.Group();
    const rect = new Konva.Rect({
      x: pos.x + QuarterTile,
      y: pos.y + QuarterTile,
      width: HalfTile,
      height: HalfTile,
      fill: MainViolet,
    });
    const text = new Konva.Text({
      x: pos.x + HalfTile,
      y: pos.y + HalfTile,
      offset: { x: QuarterTile, y: QuarterTile },
      text: "" + reward,
      fontFamily: 'Calibri',
      fontSize: 30,
      padding: 5,
      fill: 'white',
      visible: true
    });
    group.add(rect);
    group.add(text);
    this.objectsLayer.add(group);

    const tween = new Konva.Tween({
      node: group,
      duration: 1.25,
      opacity: 0,
      width: TileSize,
      height: TileSize,
      onFinish: () => {
        group.destroy();
      }
    });
    tween.play();
  }
}
