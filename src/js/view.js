import Vue from 'vue';
import VueChartJs from 'vue-chartjs';
import VueKonva from 'vue-konva'
import katex from 'katex';
import { TimelineLite } from "gsap";
//import VueSlider from 'vue-slider-component'

import { machine, maze, tile, dir } from "./rl.js";
import { key_callback } from "./controls.js";
import { defer } from './utils.js';
import { StateMgr } from './state-manager.js';

document.addEventListener('keydown', key_callback);


const PopupLibrary = {
  install(Vue, options = {}) {
    const root = new Vue(light_box)

    // Mount root Vue instance on new div element added to body
    root.$mount(document.body.appendChild(document.createElement('div')))

    Vue.prototype.$lightbox = root;
  }
}

Vue.use(PopupLibrary);
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
// --------------------------------- Map --------------------------------------
// ----------------------------------------------------------------------------

const TileStrokeColor = "#DDDDDD";

var MapBase = Vue.component('MapBase', {
  props: ['machine', 'maze', 'config'],
  data: function () {
    return {
      robot_image: null,
      energy_image: null,
    }
  },
  created() {
    var $this = this;
    const robot_image = new window.Image();
    robot_image.src = "img/robot.png";
    robot_image.onload = () => {
      $this.robot_image = robot_image;
    };
    const energy_image = new window.Image();
    energy_image.src = "img/station.png";
    energy_image.onload = () => {
      $this.energy_image = energy_image;
    };
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
    get_tile_type: function(state) {
      var pos = this.machine.state2position(state);
      if (pos.y > maze.height) {
        return null;
      } else if (pos.x > maze.width) {
        return null;
      } else {
        return maze.map[pos.y][pos.x];
      }
    },
    get_field_config: function(state) {
      var pos = this.machine.state2position(state);
      return {
        x: this.base_size * pos.x+this.base_size/2,
        y: this.base_size * pos.y+this.base_size/2,
      }
    },
    get_tile_config: function(t_type) {
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
        fill: getTileColor(t_type)
      };
    },
  },
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

function dir2Rotation(direction) {
  switch (direction) {
    case dir.UP: return -90;
    case dir.DOWN: return 90;
    case dir.LEFT: return 180;
    case dir.RIGHT: return 0;
    default: return 0;
  }
}

function arrowIndexToDirection(index) {
  const directions = [undefined, dir.UP, dir.RIGHT, dir.DOWN, dir.LEFT];
  return directions[index];
}

// 1: top, 2: right, 3: down, 4: left
const KonvaArrowTextAlignment = [
  {},
  { align: "center", verticalAlign: "top" },
  { align: "right", verticalAlign: "middle" },
  { align: "center", verticalAlign: "bottom" },
  { align: "left", verticalAlign: "middle" }
];

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
    extreme_q_values: function(){
      var max = -10*30;
      var min = 10*30;
      for (field in this.q_table) {
        for (key in this.q_table[field]){
          if (this.q_table[field][key]<min){
            min = this.q_table[field][key];
          } else if (this.q_table[field][key]>max){
            max = this.q_table[field][key];
          }
        }
      }
      return {min: min, max: max};
    }
  },
  methods: {
    get_q_text_config: function (val, arrowIndex) {
      const alignment = KonvaArrowTextAlignment[arrowIndex];
      var key = arrowIndexToDirection(arrowIndex);
      if (val[key] === undefined) {
        return {}
      }
      return {
        fontSize: this.base_size/7,
        fontFamily: 'Calibri',
        fill: 'black',
        text: +val[key].toPrecision(3)+'',
        width: this.base_size-20,
        height: this.base_size-34,
        ...alignment,
        offset: {
          x: (this.base_size-20)/2,
          y: (this.base_size-34)/2,
        }
      }
    },

    get_triangle_config: function(value, direction) {
      var $this = this;

      return {
        sceneFunc: function(context, shape) {
          context.beginPath();
          var width = $this.base_size / 5;
          var arrow_w = $this.base_size / 2;
          var stumpf = $this.base_size / 6;
          var arrow_l = $this.base_size / 5;
          context.moveTo($this.base_size/2-stumpf-arrow_l, width/2);
          context.lineTo($this.base_size/2-stumpf, width/2);
          context.lineTo($this.base_size/2-stumpf, arrow_w/2);
          context.lineTo($this.base_size/2-2, 0);
          context.lineTo($this.base_size/2-stumpf, -arrow_w/2);
          context.lineTo($this.base_size/2-stumpf, -width/2);
          context.lineTo($this.base_size/2-stumpf-arrow_l, -width/2);
          context.lineTo($this.base_size/2-stumpf-arrow_l, width/2);
          context.closePath();
          // (!) Konva specific method, it is very important
          context.fillStrokeShape(shape);
        },
        fill: arrowFillColor(value),
        stroke: 'black',
        strokeWidth: 1,
        rotation: dir2Rotation(direction),
      }
    },
  },
  template:
  `<v-stage ref="stage" :config="config">
    <v-layer ref="map_layer" :config="main_config">
      <v-group ref="map_group">
        <v-group :key="'tile'+idx" v-for="(t_type, idx) in maze.map.flat()" :config="get_field_config(idx)">
          <v-rect :config="get_tile_config(t_type)"></v-rect>
          <v-image :config="energy_config" v-if="t_type==8"></v-image>
        </v-group>
        <v-group :key="'qgroup'+idx" v-for="(action, idx) in machine.q_table" :config="get_field_config(idx)">
          <v-shape :key="'qvalshape'+idx+key" v-for="(value, key) in action" :config="get_triangle_config(value, key)"></v-shape>
          <v-text :key="'qval'+idx+i" v-for="i in 4" :config="get_q_text_config(action,i)"></v-text>
        </v-group>
        <v-image :config="robot_config"></v-image>
      </v-group>
    </v-layer>
  </v-stage>`
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
// ------------------------------ lightbox ------------------------------------
// ----------------------------------------------------------------------------

var light_box = {
  data: {
    content: "",
    options: [],
    active: false,
  },
  methods:{
    close: function(){
      this.active = false;
    },
    popup: function(content, options){
      this.content = content;
      var answer = defer();
      var $this = this;
      this.options = options.reduce((old, opt) => {
          old[opt] = function(){
            $this.active = false;
            answer.resolve(opt);
          }
          return old
      }, {});
      this.active = true;
      return answer;
    }
  },
  template: `
  <div class="lightbox" v-bind:class="{ active: active }">{{ content }}
    <div class="options">
      <button :key="key" v-for="(item, key) in options" v-on:click="item">{{ key }}</button>
    </div>
  </div>`
}


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
      return this.$lightbox.popup(text, ["ok"]);
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
/*
function renderLatex() {
  // (1-lr) * Q[state, action] + lr * (reward + gamma * np.max(Q[new_state, :])
  const expression = `Q(s,a)\\leftarrow${(1-machine.lr).toFixed(2)}Q(s,a)+${machine.lr.toFixed(2)}(reward + ${machine.df.toFixed(2)}\\max_{a'}(Q(s_{new}, a'))`;
  const baseNode = document.getElementById('formula');
  katex.render(expression, baseNode, { displayMode: true } );
}
renderLatex();
*/