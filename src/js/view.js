import Vue from 'vue';

import { machine, maze, environment } from "./rl.js";
import { setKeyboardActionCallback } from "./controls.js";
import { lightbox } from './lightbox.js';
import { Texts } from "./language.js";
import { LevelMaps, Levels } from './level';

import { MapView } from './map.js';
import { renderEquation } from './equation.js';

import { tile } from './tile.js';
import {createColorScaleReference} from './color-scale-display';

import './map.js';
import './editor';
import './navigation';

const TileSize = 80;

const MapContainerDivId = 'map_container';

export const StateMgr = {
  init: {
    onEnterState: function () {
      lightbox.popup(Texts.intro, ["next"]).then((r) => this.gotoLevel("stateAction"));
    }
  },
  stateAction: {
    components: ["global"],
    onEnterState: function () {
      this.navigation.playground = () => this.gotoLevel("global");
      this.views.fog = false;
      mapView.loadLevel(Levels.StateAction);
      lightbox.popup(Texts.stateAction, ["next"])
        .then( () => this.gotoLevel("goal") );
    }
  },
  goal: {
    components: ["global"],
    onEnterState: function () {
      machine.reset_machine();
      this.navigation.playground = () => this.gotoLevel("global");
      this.views.fog = true;
      mapView.loadLevel(Levels.Goal);
      lightbox.popup(Texts.goal, ["next"])
        .then( () => this.gotoLevel("bestWay") );
    }
  },
  bestWay: {
    components: ["global", "score"],
    onEnterState: function () {
      machine.reset_machine();
      this.views.fog = false;
      this.navigation.playground = () => this.gotoLevel("global");
      mapView.loadLevel(Levels.BestWay);
      lightbox.popup(Texts.bestway, ["next"])
        .then( () => this.gotoLevel("local") );
    }
  },
  local: {
    components: ["global", "score"],
    navigation: {
      "reset robot": () => machine.reset_machine(),
    },
    onEnterState: function () {
      machine.reset_machine();
      this.views.fog = true;
      this.navigation.playground = () => this.gotoLevel("global");
      mapView.loadLevel(LevelMaps[0]);
      lightbox.popup(Texts.localIntro, ["next"])
        .then( () => this.gotoLevel("global") );
    },
  },
  global: {
    components: ["global", "sliders", "plot", "training","evaluation", "score", "editor"],
    training: {
      "Train 1 episode": () => machine.train(1),
      "Train 20 episodes": () => machine.train(20),
      "Unlearn all": () => machine.reset_machine(),
      "Evaluate Robot": () => {
        const evaluation = machine.evaluate(100);
        console.log("Robot Evaluation: " + evaluation);
      }
    },
    evaluation: {
      "Do 1 step": () => {
        machine.learning = false;
        machine.auto_step();
        machine.learning = true;
      },
      "Do 1 greedy step": () => {
        machine.learning = false;
        machine.greedy_step();
        machine.learning = true;
      },
    },
    onEnterState: function () {
      machine.reset_machine();
      this.views.fog = false;
      mapView.loadLevel(LevelMaps[1]);
      lightbox.popup(Texts.globalIntro, []);
    },
  }
};

var editor = {
  tile_types: Object.keys(tile),
  current_type: 'regular',
  enabled: false
};

var infoViews = {
  qvalue: false,
  greedy: false,
  fog: false
};

var app = new Vue({
  el: '#app',
  data: {
    machine: machine,
    views: infoViews,
    width: 0,
    height: 0,
    components: [],
    evaluation: {},
    training: {},
    levels: Object.keys(StateMgr),
    currentLevel: null,
    editor: editor
  },

  created() {
    machine.setNewEpisodeCallback(this.onNewEpisode);
    renderEquation(machine);
    this.gotoLevel('init');
  },

  destroyed() { },

  computed: {
    raw_map_data: {
      get: function() {
        return environment.getRawMapData();
      },
      set: function(rawMapData) {
        environment.setRawMapData(rawMapData);
        mapView.redrawMap();
      }
    },
    score: function() {
      return machine.score;
    },
  },
  methods: {
    switchEditor: function() {
      this.editor.enabled = !this.editor.enabled;
      mapView.setEditorMode(this.editor.enabled);
    },

    setTileType: function(tileType) {
      this.editor.current_type = tileType;
    },

    onEnterState: function(){},

    onLeaveState: function(){},

    isActive: function(what){
      return this.components.indexOf(what) >= 0;
    },

    isCurrentLevel: function(level) {
      return this.currentLevel == level;
    },

    nextLevel: function() {
      const levelIndex = this.levels.indexOf(this.currentLevel);
      if (levelIndex < this.levels.length - 1)
        this.gotoLevel(this.levels[levelIndex + 1]);
    },
    prevLevel: function() {
      const levelIndex = this.levels.indexOf(this.currentLevel);
      if (levelIndex > 0)
        this.gotoLevel(this.levels[levelIndex - 1]);
    },

    gotoLevel: function(levelName) {
      this.onLeaveState();
      this.components = [];
      this.navigation = {};
      Object.assign(this, StateMgr[levelName]);
      this.currentLevel = levelName;
      this.onEnterState();
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
  }
})

function onCellTouch(coord) {
  if (!editor.enabled)
    return;
  
  environment.setCell(coord, tile[editor.current_type]);
  mapView.redrawMap();
  app.raw_map_data = environment.getRawMapData();
}

const mapView = new MapView(MapContainerDivId, machine, maze, environment, TileSize, infoViews, onCellTouch);

setKeyboardActionCallback( action => machine.attemptStep(machine.state, action) );

createColorScaleReference();
