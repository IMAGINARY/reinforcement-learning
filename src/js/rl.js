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
    this.actions_per_state = actions_per_state;
    this.transactions = transactions;
    this.rewards = rewards;
    this.lr = learning_rate;
    this.df = discount_factor;
    this.start_state = start_state;
    this.start_score = start_score;
    this.end_score = end_score;
    this.end_states = end_states;
    this.epsilon = epsilon;
    this.q_table = this.actions_per_state.map((c) => c.reduce((o,n) => {o[n]=0; return o},{}));
    this.reset_machine();
    this.callback = null;
  }
  setCallback(cb){
    this.callback = cb;
  }
  reset_machine(){
    for (var q in this.q_table){
      for (var key in this.q_table[q]){
        this.q_table[q][key] = 0;
      }
    }
    this.episode = 0;
    this.running = false;
    this.score_history = [];
    this.state = this.start_state;
    this.score = this.start_score;
  }
  new_episode(reason = "failed"){
    const reset = () => {
      this.episode++;
      this.score_history.push(this.score);
      this.state = this.start_state;
      this.score = this.start_score;
    }
    // add_new_episode_callback
    if (!this.running && this.callback) {
      this.callback(reason).then((p) => reset());
    } else {
      reset();
    }
  }
  auto_step(){
    if (Math.random() < this.epsilon){
      return this.step(choose(Object.keys(this.q_table[this.state])));
    } else{
      return this.greedy_step();
    }
  }
  greedy_step(){
    return this.step(keyMax(this.q_table[this.state]));
  }
  step(action){
    this.state = this.update_q_table(this.state, action);
    // add_new_step_callback
    if (this.end_states.indexOf(this.state) >= 0) {
      this.new_episode("success");
      return 2
    }
    if (this.score <= this.end_score){
      this.new_episode("failed");
      return 2
    }
    return 1
  }
  update_q_table(state, action){
    let new_state = this.transactions(state, action);
    this.q_table[state][action] = (1-this.lr)*this.q_table[state][action] + this.lr*(this.rewards[new_state] + this.df*Math.max(...Object.values(this.q_table[new_state])));
    this.score += this.rewards[new_state];
    return new_state;
  }
  run(episodes, max_steps_per_episode=10000){
    this.running = true;
    for (var i = 0; i < episodes; i++) {
      for (var j = 0; j < max_steps_per_episode; j++) {
        if (this.auto_step() != 1) {
          break;
        }
      }
      // this.new_episode();
    }
    this.running = false;
  }
}

function keyMax(obj) {
  return Object.entries(obj).reduce((r, a) => (a[1] > r[1] ? a : r),[0,Number.MIN_SAFE_INTEGER])[0];
}
function argMax(array) {
  return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}
function choose(array) {
    return array[array.length * Math.random() << 0];
};

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

export class Maze {
  constructor(map, reward_map) {
    this.map = map
    this.height = map.length;
    this.width = map[0].length;
    this.start_state = this.get_states(tile.start)[0];
    this.end_states = this.get_states(tile.end);
    this.actions = this.get_actions();
    this.transactions = this.get_transactions();
    this.rewards = this.get_rewards(reward_map);
  }
  get_states(tile) {
    var res = [];
    for (var idy = 0; idy < this.map.length; idy++) {
      for (var idx = 0; idx < this.map[idy].length; idx++) {
        if (this.map[idy][idx] == tile) {
          res.push(idy*this.map[0].length+idx);
        }
      }
    }
    return res;
  }
  get_actions() {
    var actions = [];
    for (let idy=0; idy<this.map.length; idy++){
      for (let idx=0; idx<this.map[0].length; idx++){
        var action = [];
        if (this.map[idy][idx] == tile.wall){
          actions.push(action);
          continue;
        }
        if (idy != 0){
          if(this.map[idy-1][idx] != tile.wall){
            action.push(dir.UP);
          }
        }
        if (idy != this.map.length-1){
          if(this.map[idy+1][idx] != tile.wall){
            action.push(dir.DOWN);
          }
        }
        if (idx != 0){
          if(this.map[idy][idx-1] != tile.wall){
            action.push(dir.LEFT);
          }
        }
        if (idx != this.map[0].length-1){
          if(this.map[idy][idx+1] != tile.wall){
            action.push(dir.RIGHT);
          }
        }
        actions.push(action);
      }
    }
    return actions;
  }
  get_transactions(){
    return function(state, action){
      switch (action) {
        case dir.UP:
          return state-this.width;
        case dir.RIGHT:
          return state+1;
        case dir.DOWN:
          return state+this.width;
        case dir.LEFT:
          return state-1;
      }
    }.bind(this);
  }
  get_rewards(rewards){
    rewards = [];
    for (let idy=0; idy<this.map.length; idy++){
      for (let idx=0; idx<this.map[0].length; idx++){
        rewards.push(reward[this.map[idy][idx]]);
      }
    }
    return rewards;
  }
}

export const reward = {[tile.regular]:-1,[tile.dangerous]:-100,[tile.end]:1000,[tile.start]:-1};
export var maze = new Maze(map, reward);

export var learning_rate = 0.75;
export var discount_factor = 0.8;

export var machine = new RL_machine(maze.actions, maze.transactions, maze.rewards,  maze.start_state, maze.end_states, 50, 0, learning_rate, discount_factor, 0.2);
