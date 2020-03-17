import Vue from 'vue';

import { machine, maze, environment } from "./rl.js";
import { setKeyboardActionCallback } from "./controls.js";
import { lightbox } from './lightbox.js';
import { Texts } from "./language.js";
import { LevelMaps } from './level';

import { MapView } from './map.js';
import { renderEquation } from './equation.js';

import { tile } from './tile.js';

import './map.js';
import './editor';
import './navigation';
import './line-chart';

const TileSize = 80;

export const StateMgr = {
  init: {
    onEnterState: function () {
      this.views.fog = true;
      var lightText = Texts.intro;
      lightbox.popup(lightText, ["next"]).then((r) => this.changeState("local"));
    },
  },
  local: {
    components: ["global", "navi", "score"],
    navigation: {
      "reset robot": () => machine.reset_machine(),
      "continue": null,
    },
    onEnterState: function () {
      this.views.fog = true;
      this.navigation.continue = () => this.changeState("global");
      var lightText = Texts.localIntro;
      lightbox.popup(lightText, ["next"]);
    },
  },
  global: {
    components: ["global", "sliders", "plot", "navi", "score"],
    navigation: {
      "run 1 episode!": () => machine.run(1),
      "run 100 episodes!": () => machine.run(100),
      "auto step!": () => machine.auto_step(),
      "greedy step!": () => machine.greedy_step(),
      "reset machine": () => machine.reset_machine(),
    },
    onEnterState: function () {
      this.views.fog = false;
      maze.setLevelMap(LevelMaps[1]);
      mapView.setMaze(maze);
      environment.setMaze(maze);
      var lightText = Texts.globalIntro;
      lightbox.popup(lightText, ["continue"]);
    },
  }
};

var app = new Vue({
  el: '#app',
  data: {
    appState: null,
    maze: maze,
    machine: machine,
    views: {
      qvalue: false,
      greedy: false,
      fog: false
    },
    width: 0,
    height: 0,
    components: [],
    navigation: {},
    editor: {
      tile_types: Object.keys(tile),
      current_type: 'regular'
    }
  },

  created() {
    machine.setNewEpisodeCallback(this.onNewEpisode);
    this.appState = "init";
    renderEquation(machine);
  },

  destroyed() { },

  computed: {
    score: function() {
      return machine.score;
    },
    datacollection: function() {
      return {
        labels: Array.from(Array(machine.score_history.length).keys()),
        datasets: [{
            label: 'Data One',
            backgroundColor: 'rgb(0,0,0,0)',
            data: machine.score_history,
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
    setTileType: function(tileType) {
      this.editor.current_type = tileType;
      console.log('change current tile to ' + tileType);
    },

    onEnterState: function(){},

    onLeaveState: function(){},

    isActive: function(what){
      return this.components.indexOf(what) >= 0;
    },

    changeState: function(appState){
      this.components = [];
      this.navigation = {};
      this.onEnterState = function(){};
      this.onLeaveState = function(){};
      this.appState = appState;
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
    appState: function(appState){
      this.onLeaveState();
      Object.assign(this, StateMgr[appState]);
      this.onEnterState();
    },
  }
})

const mapView = new MapView('map_container', machine, maze, environment, TileSize);

setKeyboardActionCallback( action => machine.attemptStep(machine.state, action) );

