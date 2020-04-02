import Vue from 'vue';

import { machine, maze, environment } from "./rl.js";
import { setKeyboardActionCallback } from "./controls.js";
import { Levels } from './level';

import { MapView } from './map.js';
import { renderEquation } from './equation.js';

import { tile } from './tile.js';
import {createColorScaleReference} from './color-scale-display';

import './map.js';
import './editor';
import './navigation';

const TileSize = 80;
const MapContainerDivId = 'map_container';

var infoBox = {
  title: '',
  text: '',
  currentState: '',
  currentActions: '',
  currentReward: '',
  accumulated: 0
};

var editor = {
  tile_types: Object.keys(tile),
  current_type: 'regular',
  enabled: false
};

var infoViews = {
  qvalue: false,
  greedy: false,
  fog: false,
  reward: false,
  accumulated: false
};

var app = new Vue({
  el: '#app',
  data: {
    machine: machine,
    views: infoViews,
    infoBox: infoBox,
    controls: [],
    width: 0,
    height: 0,
    components: [],
    evaluation: {},
    training: {},
    levels: Object.keys(Levels),
    currentLevel: null,
    editor: editor,
    message: {
      text: null,
      action: () => {}
    }
  },

  created() {
    machine.setEpisodeEndCallback(this.onEpisodeEnd);
    machine.setEpisodeStartCallback(this.forceRefresh);
    renderEquation(machine);
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

    isActive: function(what){
      return this.components != null && this.components.indexOf(what) >= 0;
    },

    showControl: function(name) {
      return this.controls != null && this.controls.includes(name);
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
      const levelData = Levels[levelName];

      this.infoBox = levelData.infoBox;
      this.components = levelData.components;
      this.training = levelData.training;
      this.currentLevel = levelName;
      this.controls = levelData.controls;

      this.machine.reset_machine();
      if (levelData.levelMap != null)
        mapView.loadLevel(levelData.levelMap);

      this.views.fog = levelData.hasFog != undefined && levelData.hasFog;
      this.views.reward = this.infoBox.showReward != undefined && this.infoBox.showReward;
      this.views.accumulated = this.infoBox.showAccumulated != undefined && this.infoBox.showAccumulated;
      this.infoBox.accumulated = 0;
      this.forceRefresh();
    },

    forceRefresh: function() {
      mapView.update(machine.state);
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
      machine.df = parsFloat(new_val);
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
      this.infoBox.currentReward = machine.qTable.lastQUpdate.reward;
      this.infoBox.accumulated = machine.accumulated.toFixed(2);
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

app.gotoLevel('letsMove');

setKeyboardActionCallback( action => machine.attemptStep(machine.state, action) );

createColorScaleReference();
