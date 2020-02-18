import Vue from 'vue';
import VueChartJs from 'vue-chartjs';
import VueKonva from 'vue-konva'
import katex from 'katex';
import { TimelineLite } from "gsap";
//import VueSlider from 'vue-slider-component'

import { machine, maze, tile, dir } from "./rl.js";
import { key_callback } from "./controls.js";
import { StateMgr } from './state-manager.js';
import { lightbox } from './lightbox.js';
import { MapBase, TileStrokeColor } from './map.js';

document.addEventListener('keydown', key_callback);

Vue.use(VueKonva);
//Vue.use(VueSlider);

// ----------------------------------------------------------------------------
// -------------------------------- Plot --------------------------------------
// ----------------------------------------------------------------------------

Array.prototype.simpleSMA = function(N) {
  return this.map(
    function(el, index, _arr) {
      return _arr.filter(
          function(x2, i2) {
            return i2 <= index && i2 > index - N;
          })
        .reduce(
          function(last, current, index, arr) {
            return (current / arr.length + last);
          }, 0);
    });
};

Array.prototype.max = function() {
  return this.map(
    function(el, index, _arr) {
      return _arr.filter(
          function(x2, i2) {
            return i2 <= index;
          })
        .reduce(
          function(last, current) {
            return last > current ? last : current;
          }, -1000000000);
    });
};

Vue.component('line-chart', {
  extends: VueChartJs.Line,
  mixins: [VueChartJs.mixins.reactiveProp],
  props: ['options'],
  mounted() {
    this.renderChart(this.chartData, this.options);
  },

})

// ----------------------------------------------------------------------------
// -------------------------------- Local -------------------------------------
// ----------------------------------------------------------------------------

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
    id_to_dir: function(id){
      switch (id) {
        case 0:
          return dir.UP;
        case 1:
          return dir.RIGHT;
        case 2:
          return dir.DOWN;
        case 3:
          return dir.LEFT;
        default:
          return undefined;
      }
    },

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

Vue.component('navi-gation',  {
  props: ["options"],
  template: `
  <nav class="navi">
    <button v-for="(item, key) in options" v-on:click="item">{{ key }}</button>
  </nav>`
});


// ----------------------------------------------------------------------------
// -------------------------------- Main --------------------------------------
// ----------------------------------------------------------------------------

function makeMachineReactive(th, machine){
  var $this = th;

  $this.machine.state2position = function(state) {
    return {
      x: (state % $this.maze.width),
      y: Math.floor(state / $this.maze.width),
    }
  };
  $this.machine.position2state = function(x, y) {
    return x + y * $this.maze.width;
  };

  // Score wrapper
  var s = machine.score;
  $this.machine.score = s;
  Object.defineProperty(machine, 'score', {
    get: function() {
      return this._score
    },
    set: function(ne) {
      this._score = ne;
      $this.machine.score = ne
    }
  });
  machine.score = s;

  // Score history wrapper
  var s = machine.score_history;
  $this.machine.score_history = s;
  Object.defineProperty(machine, 'score_history', {
    get: function() {
      return this._score_history
    },
    set: function(ne) {
      this._score_history = ne;
      $this.machine.score_history = ne
    }
  });
  machine.score_history = s;

  // State wrapper
  var s = machine.state;
  $this.machine.state = $this.machine.state2position(s);
  Object.defineProperty(machine, 'state', {
    get: function() {
      return this._state
    },
    set: function(ne) {
      this._state = ne;
      $this.handleState(this._state);
    }
  });
  machine.state = s;

  $this.machine.object.setCallback($this.onNewEpisode);
}

var app = new Vue({
  el: '#app',
  components: {
    VueSlider: window['vue-slider-component'],
  },
  data: {
    state: null,
    maze: maze,
    machine: {
      object: machine,
      q_table: machine.q_table,
      state: {
        x:0,
        y:0,
      },
      state_tween: new TimelineLite(),
      learning_rate: machine.lr,
      discount_factor: machine.df,
      epsilon: machine.epsilon,
      score: machine.score,
      score_history: machine.score_history,
      state2position: null,
      position2state: null,
    },
    width: 0,
    height: 0,
    components: [],
    navigation: {},
  },
  created() {
    // Resize handler
    window.addEventListener('resize', this.handleResize)
    this.handleResize();

    makeMachineReactive(this, machine);
    this.state = "init";
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  computed: {
    stage_config: function() {
      return {
        x: 0,
        y: 0,
        width: this.width*0.5,
        height: this.height*0.8,
      }
    },
    slider_config: function(){
        return {
          min: 0,
          max: 1,
          duration: 0,
          interval: 0.01,
          tooltip: 'none'
        }
    },
    datacollection: function() {
      return {
        labels: Array.from(Array(this.machine.score_history.length).keys()),
        datasets: [{
            label: 'Data One',
            backgroundColor: 'rgb(0,0,0,0)',
            data: this.machine.score_history,//.simpleSMA(Math.round(50)),
            fill: false,
            borderColor: 'rgb(255, 159, 64)',
            pointRadius: 1,
          },
          // {
          //   label: 'Data One',
          //   backgroundColor: 'rgb(0,0,0,0)',
          //   data: this.score_history.max(),
          //   fill: false,
          //   borderColor: 'rgb(64, 159, 255)',
          //   pointRadius: 1,
          // },
        ]
      }
    },
    plot_options: function() {
      var $this = this;
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
            // type: 'linear',
            ticks: {
              maxTicksLimit: 8,
              maxRotation: 0,
            }
          }]
        },
        legend: {
          display: false
        }
      }
    },
  },
  methods: {
    onEnterState: function(){},

    onLeaveState: function(){},

    handleState: function(s) {
      if (!this.machine.object.running) {
        this.machine.state_tween.to(this.machine.state, 0.2, {
          x: this.machine.state2position(s).x,
          y: this.machine.state2position(s).y
        });
      } else {
        this.machine.state = this.machine.state2position(s);
      }
    },

    handleResize: function() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    },

    isActive: function(what){
      return this.components.indexOf(what) >= 0;
    },

    changeState: function(state){
      this.components = [];
      this.navigation = {};
      this.onEnterState = function(){};
      this.onLeaveState = function(){};
      this.state = state;
    },

    onNewEpisode: function(result){
      var text;
      if (result == "failed"){
        text = "Out of battery. The robot will be reset.";
      } else if (result == "success"){
        text = "You reached the goal. The robot will be reset.";
      }
      return lightbox.popup(text, ["ok"]);
    }
  },
  watch: {
    'machine.learning_rate': function(new_val) {
      machine.lr = new_val;
      renderLatex();
    },
    'machine.discount_factor': function(new_val) {
      machine.df = new_val;
      renderLatex();
    },
    'machine.epsilon': function(new_val) {
      machine.epsilon = new_val;
    },
    state: function(state){
      this.onLeaveState();
      Object.assign(this, StateMgr[state]);
      this.onEnterState();
    },
  }
})

function renderLatex() {
  // (1-lr) * Q[state, action] + lr * (reward + gamma * np.max(Q[new_state, :])
  const expression = `Q(s,a)\\leftarrow${(1-machine.lr).toFixed(2)}Q(s,a)+${machine.lr.toFixed(2)}(reward + ${machine.df.toFixed(2)}\\max_{a'}(Q(s_{new}, a'))`;
  const baseNode = document.getElementById('formula');
  katex.render(expression, baseNode, { displayMode: true } );
}
renderLatex();
