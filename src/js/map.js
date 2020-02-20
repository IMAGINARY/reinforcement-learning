import Vue from 'vue';

import { maze, tile, machine } from "./rl.js";

export const TileStrokeColor = "#DDDDDD";
const TileFogColor = "#303030";

function asyncLoadImage(imagesrc, setFunction) {
  const image = new window.Image();
  image.src = imagesrc;
  image.onload = () => {
    setFunction(image);
  }
}

function isNextToRobot(index) {
  return index == machine.state - 1 || index == machine.state || index == machine.state + 1 ||
         index == machine.state - maze.width || index == machine.state + maze.width;
}

const ValueVisualizer = {
  fillColor(state) {
    const type = maze.getTileType(maze.state2position(state));
    return ((machine.fogOfWar && !isNextToRobot(state)) ? TileFogColor : getTileColor(type))
  },
  opacity(state) {
    return 0.25;
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
        fill: (machine.fogOfWar && !isNextToRobot(index)) ? TileFogColor : getTileColor(t_type)
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

//-----------------------------------------------------------------------------


const arrowPalette = ['#d2000d', '#d30512', '#d40a17', '#d50f1c', '#d61420', '#d71a25', '#d71f2a', '#d8242f', '#d92934', '#da2e39', '#db333d', '#dc3842', '#dd3d47', '#de424c', '#df4751', '#e04d56', '#e0525a', '#e1575f', '#e25c64', '#e36169', '#e4666e', '#e56b73', '#e67077', '#e7757c', '#e87a81', '#e98086', '#e9858b', '#ea8a90', '#eb8f95', '#ec9499', '#ed999e', '#ee9ea3', '#efa3a8', '#f0a8ad', '#f1adb2', '#f2b3b6', '#f2b8bb', '#f3bdc0', '#f4c2c5', '#f5c7ca', '#f6cccf', '#f7d1d3', '#f8d6d8', '#f9dbdd', '#fae0e2', '#fbe6e7', '#fbebec', '#fcf0f0', '#fdf5f5', '#fefafa', '#ffffff', '#fafcfa', '#f5f9f5', '#f0f6f0', '#ebf3ec', '#e6f1e7', '#e1eee2', '#dcebdd', '#d7e8d8', '#d3e5d3', '#cee2cf', '#c9dfca', '#c4dcc5', '#bfd9c0', '#bad6bb', '#b5d4b6', '#b0d1b2', '#abcead', '#a6cba8', '#a1c8a3', '#9cc59e', '#97c299', '#92bf95', '#8dbc90', '#88b98b', '#84b786', '#7fb481', '#7ab17c', '#75ae77', '#70ab73', '#6ba86e', '#66a569', '#61a264', '#5c9f5f', '#579c5a', '#529a56', '#4d9751', '#48944c', '#439147', '#3e8e42', '#398b3d', '#348839', '#308534', '#2b822f', '#267f2a', '#217d25', '#1c7a20', '#17771c', '#127417', '#0d7112', '#086e0d']
function arrowFillColor(value) {
  var normalized_value = (value > 0) ? (value+1000)/(2000) : (value+30)/60;
  return arrowPalette[Math.round(normalized_value*100)];
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
          <v-rect :config="get_tile_value_config(idx)"></v-rect>
          <v-image :config="energy_config" v-if="t_type==8"></v-image>
        </v-group>
        <v-image :config="robot_config"></v-image>
      </v-group>
    </v-layer>
  </v-stage>`
})
