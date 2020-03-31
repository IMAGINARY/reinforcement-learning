import Vue from 'vue';

import { machine, maze, environment } from "./rl.js";
import { setKeyboardActionCallback } from "./controls.js";
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
    onEnterState: function () {},
    infoBox: {
      title: 'Welcome!',
      text: Texts.intro
    }
  },
  stateAction: {
    components: ["global"],
    onEnterState: function () {
      this.views.fog = false;
      mapView.loadLevel(Levels.StateAction);
    },
    infoBox: {
      title: 'State-Action',
      text: Texts.stateAction,
      showState: true,
      showActions: true,
      currentState: '',
      currentActions: ''
    }
  },
  goal: {
    components: ["global"],
    onEnterState: function () {
      this.views.fog = true;
      mapView.loadLevel(Levels.Goal);
    },
    infoBox: {
      title: 'Goals',
      text: Texts.goal
    }
  },
  bestWay: {
    components: ["global", "score"],
    onEnterState: function () {
      this.views.fog = false;
      mapView.loadLevel(Levels.BestWay);
    },
    infoBox: {
      title: 'Best path',
      text: Texts.bestway
    }
  },
  local: {
    components: ["global", "score"],
    navigation: {
      "reset robot": () => machine.reset_machine(),
    },
    onEnterState: function () {
      this.views.fog = true;
      mapView.loadLevel(LevelMaps[0]);
    },
    infoBox: {
      title: 'Incomplete knowledge',
      text: Texts.localIntro
    }
  },
  global: {
    components: ["global", "sliders", "plot", "training","evaluation", "score", "editor"],
    training: {
      "Train 1 episode": () => machine.train(1),
      "Train 20 episodes": () => machine.train(20),
      "Unlearn all": () => machine.reset_machine(),
      "Evaluate Robot": () => {
        const evaluation = machine.evaluate(100);
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
      this.views.fog = false;
      mapView.loadLevel(LevelMaps[1]);
    },
    infoBox: {
      title: 'Learning',
      text: Texts.globalIntro
    }
  }
};

var infoBox = {
  title: '',
  text: '',
  currentState: '',
  currentActions: ''
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
    infoBox: infoBox,
    width: 0,
    height: 0,
    components: [],
    evaluation: {},
    training: {},
    levels: Object.keys(StateMgr),
    currentLevel: null,
    editor: editor,
    message: {
      text: null,
      action: () => {}
    }
  },

  created() {
    machine.setEpisodeEndCallback(this.onEpisodeEnd);
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
      this.machine.reset_machine();
      this.onEnterState();
    },

    setInfoBox(title, text) {
      this.infoBox.title = title;
      this.infoBox.text = text;
    },

    onEpisodeEnd: function(result){
      var text;
      if (result == "failed"){
        text = "Out of battery. The robot will be reset.";
      } else if (result == "success"){
        text = "You reached the goal. The robot will be reset.";
      }
      return new Promise( (resolve) => {
        this.showMessage(text, resolve);
      });
    },

    showMessage(messageText, buttonAction) {
      this.message.text = messageText;
      this.message.action = () => {
        this.message.text = null;
        this.message.action = () => {};
        buttonAction();
      }
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
    'machine.state':function(newState) {
      const coord = environment.state2position(newState);
      this.infoBox.currentState = `(${coord.x + 1}, ${coord.y + 1})`;
      this.infoBox.currentActions = environment.actions(newState).join(', ');
      mapView.redrawMap();
    }
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
