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

function occludedByFog(state) {
  return machine.fogOfWar && !isNextToRobot(state);
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
    return (occludedByFog(state) || !maze.isTransitable(maze.state2position(state))) ? 0 : 0.25;
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
          <v-rect :config="get_tile_value_config(idx)"></v-rect>
          <v-image :config="energy_config" v-if="t_type==8"></v-image>
        </v-group>
        <v-image :config="robot_config"></v-image>
      </v-group>
    </v-layer>
  </v-stage>`
})
