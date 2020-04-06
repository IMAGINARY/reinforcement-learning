import { Maze } from "./maze";
import { tile } from './tile';
import { Environment } from "./environment";
import { CallBack } from "./callback";

const StepState = {
  Continue: 1,
  End: 2
};
Object.freeze(StepState);

export const FinalState = {
  ReachedEnd: 1,
  OutOfSteps: 2
};

Object.freeze(FinalState);

function pickRandom(array) {
    return array[array.length * Math.random() << 0];
};

class QTable {
  constructor(learningParams) {
    this.params = learningParams;

    this.lastQUpdate =  {
      state : 0,
      action: '',
      newState: 0,
      currentValue: 0,
      reward: 0,
      maxQ: 0,
      newQ: 0
    };;
    /*
    Array implicitely state-indexed, where each element is a Map of action/values

    state 1:
      action 1: Q-value for action 1 taken in state 1
      action 2: Q-value for action 2 taken in state 1
    state 2:
      action 1: Q-value for action 1 taken in state 1
      action 2: Q-value for action 2 taken in state 2
      action 3: Q-value for action 3 taken in state 3
    */
    this.reset();
  }

  // Returns the Map of action/values corresponding to the state
  // Might be an empty Map
  // Modifying this returned map WILL modify the stored values
  getStateActionValues(state) {
    return (state in this.stateAction) ? this.stateAction[state] : (this.stateAction[state] = new Map());
  }

  // Returns an array of actions, NO values
  // Modifying this array will NOT change the stored values
  getStateActions(state) {
    return (state in this.stateAction) ? Array.from(this.stateAction[state].keys()) : [];
  }

  // if state/action combination not known, returns 0
  getCurrentValue(state, action) {
    const actionValues = this.getStateActionValues(state);
    return (action in actionValues) ? actionValues.get(action) : 0;
  }

  // returns an { action: value: } object
  // If no actions are known for this state, action will be undefined
  getMaxActionValue(state) {
    const actionValues = this.getStateActionValues(state);
    const actions = this.getStateActions(state);
    if (actions.length == 0)
      return { action: undefined, value: 0 };

    var bestAction = actions[0];
    var bestValue = actionValues.get(bestAction);
    actions.forEach( action => {
      const value = actionValues.get(action);
      if (value > bestValue) {
        bestAction = action;
        bestValue = value;
      }
    });
    return { action: bestAction, value: bestValue };
  }

  getMaxValue(state) {
    return this.getMaxActionValue(state).value;
  }

  getBestAction(state) {
    return this.getMaxActionValue(state).action;
  }

  updateQBounds(qValue) {
    if (qValue < this.qBounds.min)
      this.qBounds.min = qValue;
    if (qValue > this.qBounds.max)
      this.qBounds.max = qValue;
  }

  updateStateAction(state, action, newValue) {
    const stateArray = this.getStateActionValues(state);
    stateArray.set(action, newValue);
    this.updateQBounds(newValue);
  }

  update(state, action, newState, reward) {
    const currentValue = this.getCurrentValue(state, action);
    const maxQ = this.getMaxValue(newState);

    const newQ = (1 - this.params.learningRate) * currentValue + this.params.learningRate * (reward + this.params.discountFactor * maxQ);

    this.lastQUpdate = {
      state : state,
      action: action,
      newState: newState,
      currentValue: currentValue,
      reward: reward,
      maxQ: maxQ,
      newQ: newQ
    };
    this.updateStateAction(state, action, newQ);

    return newState;
  }

  reset() {
    this.stateAction = [];
    // arbitrary starting values, but which should help start with a reasonable color gradient
    // when visualizing all q values
    this.qBounds = { min: 0, max: 0 };
  }

  getStateValues() {
    return Object.keys(this.stateAction).map( state => this.getMaxValue(state) );
  }

  normalizedQValue(state) {
    const qValue = this.getMaxValue(state);
    return (qValue - this.qBounds.min) / (this.qBounds.max - this.qBounds.min);
  }
}

export class RL_machine {
  constructor(environment,
              start_score,
              end_score,
              learningParameters) {

    this.params = learningParameters;

    this.accumulated = 0;

    this.environment = environment;

    this.start_score = start_score;
    this.end_score = end_score;

    this.stateChange = new CallBack();
    this.onReset = new CallBack();
    this.onEpisodeEnd = new CallBack();
    this.onEpisodeStart = new CallBack();
    this.onRunStart = new CallBack();
    this.onRunEnd = new CallBack();

    this.qTable = new QTable(this.params);

    this.learning = true;

    this.reset_machine();
  }

  setResetCallback(resetCallback) {
    this.onReset.set(resetCallback);
  }

  setStateChangeCallback(stateChangeCallback) {
    this.stateChange.set(stateChangeCallback);
  }

  setEpisodeEndCallback(onEpisodeEnd){
    this.onEpisodeEnd = onEpisodeEnd;
  }
  setEpisodeStartCallback(onEpisodeStart){
    this.onEpisodeStart = onEpisodeStart;
  }

  reset_machine(){
    this.qTable.reset();
    this.episode = 0;
    this.accumulated = 0;
    this.batchRunning = false;
    this.resetEpisode();
    this.onReset.call();
  }

  resetEpisode() {
    this.state = this.environment.startState;
    this.score = this.start_score;
    this.accumulated = 0;
    this.onEpisodeStart.call();
  }

  endEpisode(reason = FinalState.OutOfSteps) {
    if (!this.batchRunning && this.onEpisodeEnd) {
      this.onEpisodeEnd(reason).then((p) => this.resetEpisode());
    } else {
      this.resetEpisode();
    }
  }

  randomAction(state) {
    return pickRandom(this.environment.actions(state));
  }

  auto_step() {
    return (Math.random() < this.params.epsilon) ? this.random_step() : this.greedy_step();
  }

  random_step() {
    return this.step(this.randomAction(this.state));
  }

  greedy_step() {
    var bestAction = this.qTable.getBestAction(this.state);
    if (bestAction == undefined) 
      bestAction = this.randomAction(this.state);

    return this.step(bestAction);
  }

  attemptStep(state, dir) {
    const actions = this.environment.actions(state);
    if (actions.includes(dir))
      this.step(dir);
  }

  step(action) {
    const newState = this.environment.transition(this.state, action);
    const reward = this.environment.reward(newState);
    if (this.learning)
      this.qTable.update(this.state, action, newState, reward);

    this.setState(newState);
    this.score += this.environment.reward(this.state);
    this.accumulated += reward;

    // add_new_step_callback
    if (this.environment.isEndState(this.state)) {
      this.endEpisode(FinalState.ReachedEnd);
      return StepState.End;
    }
    if (this.score <= this.end_score){
      this.endEpisode(FinalState.OutOfSteps);
      return StepState.End;
    }
    return StepState.Continue;
  }

  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.stateChange.call(oldState, newState);
  }

  getGreedyPath(startOfPath) {
    var states = [];
    var state = startOfPath;
    do {
      states.push(state);
      const action = this.qTable.getBestAction(state);
      if (action == undefined)
        break;
      state = this.environment.transition(state, action);
    }  while (state != undefined && !(states.includes(state)) && !this.environment.isEndState(state));
    return states;
  }

  train(episodes, maxSteps = 1000) {
    this.runEpisodes(episodes, maxSteps, true);
  }

  evaluate(episodes, maxSteps = 1000) {
    this.runEpisodes(episodes, maxSteps, false);
  }

  runEpisodes(numEpisodes = 1, maxSteps = 1000, learning = true) {
    const oldLearning = this.learning;
    this.learning = learning;
    this.batchRunning = true;
    this.onRunStart.call();
    for (var i = 0; i < numEpisodes; i++)
      this.runEpisode(maxSteps);

    this.batchRunning = false;
    this.learning = oldLearning;
    this.onRunEnd.call();
  }

  runEpisode(maxSteps = 1000) {
    this.resetEpisode();
    do {
      //
    } while (this.auto_step() == StepState.Continue && maxSteps-- > 0);
  }

  normalizedValue(state) {
    const max = this.qTable.qBounds.max;
    const min = this.qTable.qBounds.min;
    const value = this.qTable.getMaxValue(state);
    if (max == min)
      return 0.5;
    return (value - min) / (max - min);
  }
}

export const RewardsMap = {
  [tile.regular]:-1,
  [tile.dangerous]:-10,
  [tile.end]:50,
  [tile.start]:-1
};

const InitialLearningRate = 0.75;
const InitialDiscountFactor = 0.8;
const InitialEpsilon = 0.2;

export var maze = new Maze();

export const environment = new Environment(maze, RewardsMap);

export var learningParameters = {
    learningRate: InitialLearningRate,
    discountFactor: InitialDiscountFactor,
    epsilon: InitialEpsilon
};

export var machine = new RL_machine(environment, 50, 0, learningParameters);
