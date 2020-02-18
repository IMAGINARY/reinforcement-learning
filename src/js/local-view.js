import Vue from 'vue';

import { tile, dir } from "./rl.js";
import { MapBase, TileStrokeColor, arrowIndexToDirection } from './map.js';

Vue.component('rl-local', {
  extends: MapBase,
  computed: {
    main_config: function(){
      return {
        offset: {
          x: -(this.config.width-this.base_size*3)/2,
          y: -(this.config.height-this.base_size*3)/2,
        }
      }
    },
    local_config: function() {
      return {
        x: -(this.machine.state.x)*this.base_size,
        y: -(this.machine.state.y)*this.base_size,
        offset: {
          x: -this.base_size,
          y: -this.base_size,
        }
      }
    },
    base_size: function() {
      return Math.min(this.config.height/3, this.config.width/3);
    },
    center: function() {
      return 3*this.base_size / 2;
    },
    local_area: function() {
      const x = Math.round(this.machine.state.x);
      const y = Math.round(this.machine.state.y);
      let arr = [[x,y-1],[x+1,y],[x,y+1],[x-1,y],[x,y]];
      return arr.filter((p) => p[0] < this.maze.width && p[1] < this.maze.height &&
                               p[0] >= 0 && p[1] >= 0)
                .map((p) => [this.maze.map[p[1]][p[0]], p[1]*this.maze.width+p[0]]);
    },
  },
  methods: {
    end: function(pos){
      return this.maze.get_states(tile.end).indexOf(pos) >= 0;
    },
    id_to_dir: arrowIndexToDirection,

    handleMouseEnter(e) {
      const stage = e.target.getStage();
      stage.container().style.cursor = "pointer";
    },

    handleMouseLeave(e) {
      const stage = e.target.getStage();
      stage.container().style.cursor = "default";
    },

    get_local_tile_config: function(index, t_type) {
      const state = this.machine.position2state(Math.round(this.machine.state.x), Math.round(this.machine.state.y));
      var over = {};

      if (index != state && t_type != tile.wall) {
        over = {
          width: this.base_size,
          height: this.base_size,
          stroke: TileStrokeColor,
          strokeWidth: this.strokeW,
          offset: {
            x: this.base_size/2,
            y: this.base_size/2,
          },
          opacity: 1,
          fill: "#eeeeee",
        }
      }
      return over;
    },
  },
  template:
  `<v-stage ref="stage" :config="config">
    <v-layer ref="map_layer" :config="main_config">
      <v-group ref="map_group" :config="local_config">
        <v-group :key="pair[1]" v-for="(pair, idx) in local_area" :config="get_field_config(pair[1])">
          <v-rect :config="get_tile_config(pair[0])"></v-rect>
          <v-image :config="energy_config" v-if="end(pair[1])"></v-image>
          <v-rect :config="get_local_tile_config(pair[1], pair[0])" @click="id_to_dir(idx) && machine.object.step(id_to_dir(idx))" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave"></v-rect>
        </v-group>
      </v-group>
      <v-image :config="robot_config"></v-image>
    </v-layer>
  </v-stage>`
})
