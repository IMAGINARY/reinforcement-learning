import Vue from 'vue';
import VueChartJs from 'vue-chartjs';
import { TimelineLite } from "gsap";

import { machine, maze } from "./rl.js";
import { setKeyboardActionCallback } from "./controls.js";
import { StateMgr } from './state-manager.js';
import { lightbox } from './lightbox.js';

import { MapView } from './map.js';
import { renderEquation } from './equation.js';

import './map.js';

const TileSize = 80;

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

function makeMachineReactive(vueInstance, machine){
  // Score wrapper
  var score = machine.score;
  vueInstance.machine.score = score;
  Object.defineProperty(machine, 'score', {
    get: function() {
      return this._score
    },
    set: function(newScore) {
      this._score = newScore;
      vueInstance.machine.score = newScore
    }
  });
  machine.score = score;

  // Score history wrapper
  var scoreHistory = machine.score_history;
  vueInstance.machine.score_history = scoreHistory;
  Object.defineProperty(machine, 'score_history', {
    get: function() {
      return this._score_history
    },
    set: function(newScoreHistory) {
      this._score_history = newScoreHistory;
      vueInstance.machine.score_history = newScoreHistory
    }
  });
  machine.score_history = scoreHistory;

  // State wrapper
  var state = machine.state;
  vueInstance.machine.state = vueInstance.maze.state2position(state);
  Object.defineProperty(machine, 'state', {
    get: function() {
      return this._state
    },
    set: function(ne) {
      this._state = ne;
      vueInstance.handleState(this._state);
    }
  });
  machine.state = state;

  vueInstance.machine.object.setNewEpisodeCallback(vueInstance.onNewEpisode);
}

var app = new Vue({
  el: '#app',
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
    },
    views: {
      qvalue: false,
      greedy: false,
      fog: false
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
    renderEquation(machine);
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

    handleState: function(state) {
      if (!this.machine.object.running) {
        this.machine.state_tween.to(this.machine.state, 0.2, this.maze.state2position(state));
      } else {
        this.machine.state = this.maze.state2position(state);
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
      machine.lr = parseFloat(new_val);
      renderEquation(machine);
    },
    'machine.discount_factor': function(new_val) {
      machine.df = parseFloat(new_val);
      renderEquation(machine);
    },
    'machine.epsilon': function(new_val) {
      machine.epsilon = parseFloat(new_val);
    },
    'views.qvalue':function(newValue) {
      mapView.setQValuesVisible(newValue);
    },
    'views.greedy':function(newValue) {
      mapView.setGreedyVisible(newValue);
    },
    'views.fog':function(newValue) {
      mapView.setFogVisible(newValue);
    },
    state: function(state){
      this.onLeaveState();
      Object.assign(this, StateMgr[state]);
      this.onEnterState();
    },
  }
})

const mapView = new MapView('map_container', machine, maze, TileSize);

setKeyboardActionCallback( action => machine.attemptStep(machine.state, action) );

