import Vue from 'vue';
import Konva from 'konva';

import { maze, tile, machine } from "./rl.js";
import { hexToRgb, rgbToHex } from './color-utils';

export const TileStrokeColor = "#DDDDDD";
const TileFogColor = "#303030";

function asyncLoadImage(imagesrc, setFunction) {
  const image = new window.Image();
  image.src = imagesrc;
  image.onload = () => {
    setFunction(image);
  }
}

function occludedByFog(state) {
  return machine.fogOfWar && !isNextToRobot(state);
}

function isNextToRobot(index) {
  return index == machine.state - 1 || index == machine.state || index == machine.state + 1 ||
         index == machine.state - maze.width || index == machine.state + maze.width;
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
    this.machine.setStateChangeCallback((oldState, newState) => this.onStateChange(oldState, newState));
    this.machine.setResetCallback( () => this.onReset());

    this.stage = new Konva.Stage({
      container: containerId,
      width: tileSize * maze.width,
      height: tileSize * maze.height
    });

    this.createMazeLayer(maze);
    this.createObjectsLayer();
    this.createQLayer(maze);
  }
  
  createMazeLayer(maze) {
    this.mapLayer = new Konva.Layer();
    this.mapTiles = [maze.height];
    for (var y = 0 ; y < maze.height ; y++) {
      this.mapTiles[y] = [maze.width];
      for (var x = 0 ; x < maze.width ; x++) {
        const rect = new Konva.Rect({
          x: x * this.TileSize,
          y: y * this.TileSize,
          width: this.TileSize,
          height: this.TileSize,
          fill: maze.isTransitable({ x: x, y: y}) ? '#FFFFFF' : '#101010'
        });
        this.mapTiles[y][x] = rect;
        this.mapLayer.add(rect);
      }
    }
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
  
  createQLayer(maze) {
    this.qLayer = new Konva.Layer();
    this.resetQTexts();
    this.stage.add(this.qLayer);
  }

  resetQTexts() {
    this.qTexts = createMatrixFromMaze(maze);
    maze.allCoordinates.forEach( coord => {
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
  }

  onReset() {
    this.resetQTexts();
    this.qLayer.draw();
  }

  onStateChange(oldState, newState) {
    this.updateQValue(oldState);
    this.setRobotPosition(this.maze.state2position(newState));
  }

  updateQValue(state) {
    const coord = this.maze.state2position(state);
    this.qTexts[coord.y][coord.x].text('Q: ' + this.machine.qTable.getMaxValue(state).toFixed(2));
    this.qLayer.draw();
  }

  setRobotPosition(coord) {
    console.log("robot position: " + this.robot.x() + ", " + this.robot.y());
    this.robot.x(coord.x * this.TileSize);
    this.robot.y(coord.y * this.TileSize);
    console.log("robot position: " + this.robot.x() + ", " + this.robot.y());
    this.objectsLayer.draw();
  }
}

export var MapBase = Vue.component('MapBase', {
  props: ['machine', 'maze', 'config'],
  data: function () {
    return {
      robot_image: null,
      energy_image: null,
    }
  },
  created() {
    asyncLoadImage("img/robot.png", this.setRobotImage);
    asyncLoadImage("img/station.png", this.setStationImage);
  },
  computed: {
    main_config: function(){
      return {
        offset: {
          x: -(this.config.width-this.base_size*this.maze.width)/2,
          y: -(this.config.height-this.base_size*this.maze.height)/2,
        }
      }
    },
    robot_config: function() {
      return {
        height: this.base_size,
        width: this.base_size,
        x: this.center,
        y: this.center,
        image: this.robot_image,
        offset:{
          x: this.base_size/2,
          y: this.base_size/2,
        }
      }
    },
    energy_config: function() {
      return {
        height: this.base_size,
        width: this.base_size,
        offset: {
          x: this.base_size/2,
          y: this.base_size/2
        },
        image: this.energy_image,
      }
    },
    strokeW: function() {
      return this.base_size / 50;
    },
    base_size: function() {
      return Math.min(this.config.height/this.maze.height, this.config.width/this.maze.width);
    },
  },
  methods: {
    setRobotImage: function(image) {
      this.robot_image = image;
    },
    setStationImage: function(image) {
      this.energy_image = image;
    },

    get_tile_type: function(state) {
      var pos = this.maze.state2position(state);
      return maze.getTileType(pos);
    },

    get_field_config: function(state) {
      var pos = this.maze.state2position(state);
      return {
        x: this.base_size * pos.x+this.base_size/2,
        y: this.base_size * pos.y+this.base_size/2,
      }
    },
    get_tile_config: function(t_type, index) {
      return {
        width: this.base_size,
        height: this.base_size,
        stroke: TileStrokeColor,
        strokeWidth: this.strokeW,
        offset: {
          x: this.base_size/2,
          y: this.base_size/2,
        },
        opacity: 1,
        fill: occludedByFog(index) ? TileFogColor : getTileColor(t_type)
      }
    },
    get_tile_value_config: function(index) {
      return {
        width: this.base_size,
        height: this.base_size,
        offset: {
          x: this.base_size/2 + 4,
          y: this.base_size/2 + 4,
        },
        opacity: ValueVisualizer.opacity(index),
        fill: ValueVisualizer.fillColor(index)
      }
    }
  }
});

function getTileColor(type) {
  switch (type) {
    case tile.regular:
      return '#ffffff';
    case tile.end:
      return '#0eb500';
    case tile.start:
      return '#ff0008';
    case tile.dangerous:
      return '#FF7B17';
    case tile.wall:
      return '#000000';
  }
}


Vue.component('rl-map', {
  extends: MapBase,
  computed: {
    robot_config: function() {
      return {
        height: this.base_size,
        width: this.base_size,
        x: this.base_size * this.machine.state.x,
        y: this.base_size * this.machine.state.y,
        image: this.robot_image,
      }
    },
  },
  template:
  `<v-stage ref="stage" :config="config">
    <v-layer ref="map_layer" :config="main_config">
      <v-group ref="map_group">
        <v-group :key="'tile'+idx" v-for="(t_type, idx) in maze.map.flat()" :config="get_field_config(idx)">
          <v-rect :config="get_tile_config(t_type, idx)"></v-rect>
          <v-rect :config="get_tile_value_config(idx)" v-if="machine.show_qvalue_info"></v-rect>
          <v-image :config="energy_config" v-if="t_type==8"></v-image>
        </v-group>
        <v-image :config="robot_config"></v-image>
      </v-group>
    </v-layer>
  </v-stage>`
})
