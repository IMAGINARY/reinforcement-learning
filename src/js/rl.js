import { Maze } from "./maze";
import { levelMap } from './level';

const StepState = {
  Continue: 1,
  End: 2
};


function keyMax(obj) {
  return Object.entries(obj).reduce((r, a) => (a[1] > r[1] ? a : r),[0,Number.MIN_SAFE_INTEGER])[0];
}

function pickRandom(array) {
    return array[array.length * Math.random() << 0];
};

class QTable {
  constructor(actions_per_state, transactions, rewards, learningRate, discountFactor) {
    this.learningRate = learningRate;
    this.discountFactor = discountFactor;
    this.transactions = transactions;
    this.rewards = rewards;
    this.stateAction = actions_per_state.map( (c) => c.reduce((o,n) => {o[n]=0; return o},{}));
  }
  
  getAllActions(state) {
    return Object.keys(this.stateAction[state]);
  }

  getRandomAction(state) {
    return pickRandom(this.getAllActions(state));
  }

  getMaxActionValue(state) {
    const actions = this.getAllActions(state);
    const actionValues = this.stateAction[state];
    var bestAction = actions[0];
    actions.forEach( action => {
      if (actionValues[action] > actionValues[bestAction]) {
        bestAction = action;
      }
    });
    return { action: bestAction, value: actionValues[bestAction] };
  }

  getMaxValue(state) {
    return this.getMaxActionValue(state).value;
  }

  getBestAction(state) {
    return this.getMaxActionValue(state).action;
  }

  update(state, action){
    let newState = this.transactions(state, action);
    const newQ = (1 - this.learningRate) * this.stateAction[state][action] +
                     this.learningRate * (this.rewards[newState] +
                     this.discountFactor * this.getMaxValue(newState));

    this.stateAction[state][action] = newQ;
    return newState;
  }

  reset() {
    for (var q in this.stateAction){
      for (var key in this.stateAction[q]){
        this.stateAction[q][key] = 0;
      }
    }
  }

  getStateValues() {
    return Object.keys(this.stateAction).map( state => this.getMaxValue(state) );
  }
}

export class RL_machine {
  constructor(actions_per_state,
              transactions,
              rewards,
              start_state,
              end_states,
              start_score,
              end_score,
              learning_rate,
              discount_factor,
              epsilon=0) {
    this.lr = learning_rate;
    this.df = discount_factor;
    this.rewards = rewards;
    this.start_state = start_state;
    this.start_score = start_score;
    this.end_score = end_score;
    this.end_states = end_states;
    this.epsilon = epsilon;
    this.fogOfWar = false;
    this.qTable = new QTable(actions_per_state, transactions, rewards, learning_rate, discount_factor);
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

  auto_step() {
    return (Math.random() < this.epsilon) ? this.random_step() : this.greedy_step();
  }

  random_step() {
    return this.step(this.qTable.getRandomAction(this.state));
  }

  greedy_step() {
    return this.step(this.qTable.getBestAction(this.state));
  }

  attemptStep(state, dir) {
    const actions = this.qTable.getAllActions(state);
    if (actions.includes(dir))
      this.step(dir);
  }

  step(action) {
    this.state = this.qTable.update(this.state, action);
    this.score += this.rewards[this.state];

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

export const reward = {[tile.regular]:-1,[tile.dangerous]:-100,[tile.end]:1000,[tile.start]:-1};
export var maze = new Maze(levelMap, reward);

var learning_rate = 0.75;
var discount_factor = 0.8;

export var machine = new RL_machine(maze.actions, maze.transactions, maze.rewards,  maze.start_state, maze.end_states, 50, 0, learning_rate, discount_factor, 0.2);
