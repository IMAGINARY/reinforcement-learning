import Vue from 'vue';
import VueChartJs from 'vue-chartjs';
import VueKonva from 'vue-konva'
import katex from 'katex';
import { TimelineLite } from "gsap";
//import VueSlider from 'vue-slider-component'

import { machine, maze } from "./rl.js";
import { key_callback } from "./controls.js";
import { StateMgr } from './state-manager.js';
import { lightbox } from './lightbox.js';
import './local-view.js';

document.addEventListener('keydown', key_callback);

Vue.use(VueKonva);
//Vue.use(VueSlider);

Vue.component('line-chart', {
  extends: VueChartJs.Line,
  mixins: [VueChartJs.mixins.reactiveProp],
  props: ['options'],
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
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
            data: this.machine.score_history,
            fill: false,
            borderColor: 'rgb(255, 159, 64)',
            pointRadius: 1,
          },
        ]
      }
    },
    plot_options: function() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
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
        this.machine.state_tween.to(this.machine.state, 0.2, this.machine.state2position(s));
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
