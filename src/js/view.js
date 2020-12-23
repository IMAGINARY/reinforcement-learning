import Vue from 'vue';

import { machine, maze, environment, FinalState, defaultLearningParameters } from "./rl.js";
import { setKeyboardActionCallback } from "./controls.js";
import { Levels } from './level';

import { MapView } from './map.js';
import { renderEquation } from './equation.js';

import { tile } from './tile.js';
import {createColorScaleReference} from './color-scale-display';

import './map.js';
import './editor';
import './navigation';
import { Texts } from './language';

import { setButtonTimeout } from './countdown-button';

const MapContainerDivId = 'map_container';

var infoBox = {
  title: '',
  text: '',
  currentState: '',
  currentActions: '',
  currentReward: '',
  accumulated: 0
};

const EditorTypes = {
  "wall": 'Add or Remove Walls',
  "start": 'Start Position',
  "end": 'End Position',
  "dangerous": "Dangerous spot"
};

var editor = {
  tile_types: EditorTypes,
  current_type: 'regular',
  enabled: false
};

var infoViews = {
  qvalue: false,
  greedy: false,
  fog: false,
  reward: false,
  accumulated: false,
  debug: false
};

var app = new Vue({
  el: '#app',
  data: {
    slider: {
      epsilon: 0.5,
      learningRate: 0.5,
      discountFactor: 0.5
    },
    texts: Texts,
    machine: machine,
    views: infoViews,
    infoBox: infoBox,
    controls: [],
    interactive: true,
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
    renderEquation(machine.params);
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
      if (!this.editor.enabled)
        machine.resetEpisode();
    },
    clearMaze: function() {
      maze.clear();
      mapView.redrawMap();
      app.raw_map_data = environment.getRawMapData();
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

      if (levelData.learningParameters)
        this.slider = levelData.learningParameters;
      else
        this.slider = defaultLearningParameters();

      this.machine.reset_machine();
      if (levelData.levelMap != null)
        mapView.loadLevel(levelData.levelMap);


      this.views.fog = levelData.hasFog != undefined && levelData.hasFog;
      this.views.reward = this.infoBox.showReward != undefined && this.infoBox.showReward;
      this.views.accumulated = this.infoBox.showAccumulated != undefined && this.infoBox.showAccumulated;
      this.views.qvalue = this.infoBox.showQValue != undefined && this.infoBox.showQValue;
      this.views.greedy = this.infoBox.showGreedy != undefined && this.infoBox.showGreedy;
      this.infoBox.accumulated = 0;

      this.machine.checkScore = !(levelData.noScore);
      if (levelData.preTrain)
        machine.runEpisodes(levelData.preTrain);

      this.updateInfoBox(this.machine.state);
      this.forceRefresh();
    },

    forceRefresh: function() {
      mapView.updateVisibilities();
      mapView.update(machine.state);
    },

    setInfoBox(title, text) {
      this.infoBox.title = title;
      this.infoBox.text = text;
    },

    onEpisodeEnd: function(result){
      var text;
      if (result == FinalState.OutOfSteps) {
        text = Texts.outOfBattery;
      } else if (result == FinalState.ReachedEnd) {
        text = Texts.goalReached;
      }
      return new Promise( (resolve) => {
        this.interactive = false;
        mapView.setButtonsVisible(false);
        this.showMessage(text, resolve);
      }).then( () => mapView.fadeOutRobot() )
        .then( () => { this.interactive = true;
                       mapView.setButtonsVisible(true); });
    },

    showMessage(messageText, buttonAction) {
      this.message.text = messageText;
      const button = document.getElementById('info-message-button');
      setButtonTimeout(button, Texts.ok, 5000, () => {
        this.message.text = null;
        buttonAction();
      });
    },

    onKeyboardAction(action) {
      if (this.interactive)
        machine.attemptStep(machine.state, action);
    },

    updateInfoBox(state) {
      const coord = environment.state2position(state);
      this.infoBox.currentState = `(${coord.x + 1}, ${coord.y + 1})`;
      this.infoBox.currentActions = environment.actions(state).join(', ');
      this.infoBox.currentReward = machine.qTable.lastQUpdate.reward;
      this.infoBox.accumulated = machine.accumulated.toFixed(2);
    },

    toggleDebug() {
      this.views.debug = !this.views.debug;
    }
  },
  watch: {
    'slider.learningRate': function(new_val) {
      machine.params.learningRate = parseFloat(new_val);
      renderEquation(machine.params);
      clearFocus();
    },
    'slider.discountFactor': function(new_val) {
      machine.params.discountFactor = parseFloat(new_val);
      renderEquation(machine.params);
      clearFocus();
    },
    'slider.epsilon': function(new_val) {
      machine.params.epsilon = parseFloat(new_val);
      clearFocus();
    },
    'views.qvalue':function(newValue) {
      mapView.setQValuesVisible(newValue);
      clearFocus();
    },
    'views.greedy':function(newValue) {
      mapView.setGreedyVisible(newValue);
      clearFocus();
    },
    'views.fog':function(newValue) {
      mapView.setFogVisible(newValue);
      clearFocus();
    },
    'views.debug':function(newValue) {
      mapView.setDebugVisible(newValue);
      clearFocus();
    },
    'machine.state':function(newState) {
      this.updateInfoBox(newState);
    }
  }
})

function clearFocus() {
  document.activeElement.blur();
}

function onCellTouch(coord) {
  if (!editor.enabled)
    return;

  environment.setCell(coord, tile[editor.current_type]);

  mapView.redrawMap();
  app.raw_map_data = environment.getRawMapData();
}

const mapView = new MapView(MapContainerDivId, machine, maze, environment, infoViews, onCellTouch);

app.gotoLevel('letsMove');

document.addEventListener('keydown', (e) => {
  if (e.code === 'KeyD') {
    app.toggleDebug();
  }
});

setKeyboardActionCallback( app.onKeyboardAction );

createColorScaleReference();
