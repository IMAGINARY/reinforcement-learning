import { Maze } from "./maze";
import { levelMap } from './level';

const StepState = {
  Continue: 1,
  End: 2
};

function pickRandom(array) {
    return array[array.length * Math.random() << 0];
};

class QTable {
  constructor(learningRate, discountFactor) {
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.qBounds = { min: -Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER };
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
    actions.forEach( action => {
      if (actionValues.get(action) > actionValues.get(bestAction)) {
        bestAction = action;
      }
    });
    return { action: bestAction, value: actionValues.get(bestAction) };
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

    const newQ = (1 - this.learningRate) * currentValue + this.learningRate * (reward + this.discountFactor * maxQ);  
    this.updateStateAction(state, action, newQ);

    return newState;
  }

  reset() {
    this.stateAction = [];
  }

  getStateValues() {
    return Object.keys(this.stateAction).map( state => this.getMaxValue(state) );
  }
}

export class RL_machine {
  constructor(actionsForState,
              transitionFunction,
              rewardFunction,
              start_state,
              end_states,
              start_score,
              end_score,
              learning_rate,
              discount_factor,
              epsilon=0) {
    this.lr = learning_rate;
    this.df = discount_factor;
    this.rewardFunction = rewardFunction;
    this.transitionFunction = transitionFunction;
    this.start_state = start_state;
    this.start_score = start_score;
    this.end_score = end_score;
    this.end_states = end_states;
    this.epsilon = epsilon;
    this.fogOfWar = false;
    this.actionsForState = actionsForState;
    this.qTable = new QTable(learning_rate, discount_factor);
    this.reset_machine();
    this.callback = null;
  }

  setCallback(cb){
    this.callback = cb;
  }

  reset_machine(){
    this.qTable.reset();
    this.episode = 0;
    this.running = false;
    this.score_history = [];
    this.resetState();
  }

  resetState() {
    this.state = this.start_state;
    this.score = this.start_score;
  }

  new_episode(reason = "failed"){
    const reset = () => {
      this.episode++;
      this.score_history.push(this.score);
      this.resetState();
    }
    // add_new_episode_callback
    if (!this.running && this.callback) {
      this.callback(reason).then((p) => reset());
    } else {
      reset();
    }
  }

  randomAction(state) {
    return pickRandom(this.actionsForState(state));
  }

  auto_step() {
    return (Math.random() < this.epsilon) ? this.random_step() : this.greedy_step();
  }

  random_step() {
    return this.step(this.randomAction(this.state));
  }

  greedy_step() {
    const bestAction = this.qTable.getBestAction(this.state) || this.randomAction(this.state);
    return this.step(bestAction);
  }

  attemptStep(state, dir) {
    const actions = this.actionsForState(state);
    if (actions.includes(dir))
      this.step(dir);
  }

  step(action) {
    const newState = this.transitionFunction(this.state, action);
    const reward = this.rewardFunction(newState);
    this.qTable.update(this.state, action, newState, reward);

    this.state = newState;
    this.score += this.rewardFunction(this.state);

    // add_new_step_callback
    if (this.end_states.indexOf(this.state) >= 0) {
      this.new_episode("success");
      return StepState.End;
    }
    if (this.score <= this.end_score){
      this.new_episode("failed");
      return StepState.End;
    }
    return StepState.Continue;
  }

  run(episodes, max_steps_per_episode=10000){
    this.running = true;
    for (var i = 0; i < episodes; i++) {
      for (var j = 0; j < max_steps_per_episode; j++) {
        if (this.auto_step() != StepState.Continue) {
          break;
        }
      }
      this.resetState();
    }
    this.running = false;
  }
}

// ------------------ maze stuff --------------------------------------------
export const tile = {
  regular: 0,
  wall: 1,
  start: 2,
  dangerous: 4,
  end: 8,
};

export const dir = {
  UP: "UP",
  RIGHT: "RIGHT",
  DOWN: "DOWN",
  LEFT: "LEFT",
};

export const RewardsMap = {
  [tile.regular]:-1,
  [tile.dangerous]:-100,
  [tile.end]:1000,
  [tile.start]:-1
};
export var maze = new Maze(levelMap, RewardsMap);

var learning_rate = 0.75;
var discount_factor = 0.8;

const rewardFunction = (state) => {
  const position = maze.state2position(state);
  const tileType = levelMap[position.y][position.x];
  return RewardsMap[tileType];
}

export var machine = new RL_machine(maze.getActionsForStateFunction(),
                            maze.getTransitionFunction(),
                            rewardFunction,
                            maze.start_state,
                            maze.end_states,
                            50,
                            0,
                            learning_rate,
                            discount_factor,
                            0.2);
