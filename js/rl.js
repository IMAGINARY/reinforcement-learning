class RL_machine {
  constructor(actions_per_state,
              transactions,
              rewards,
              start_state,
              end_states,
              end_score,
              learning_rate,
              discount_factor,
              epsilon=0) {
    this.q_table = actions_per_state.map((c) => c.reduce((o,n) => {o[n]=0; return o},{}));
    this.transactions = transactions;
    this.rewards = rewards;
    this.lr = learning_rate;
    this.df = discount_factor;
    this.state = start_state;
    this.start_state = start_state;
    this.end_score = end_score;
    this.end_states = end_states;
    this.episode = 0;
    this.epsilon = epsilon;
    this.score = 0;
  }
  reset_machine(){
    this.q_table = this.q_table.map((c) => c.map((a) => a.fill(0)));
    this.episode = 0;
    this.state = this.start_state;
  }
  new_episode(){
    // add_new_episode_callback
    this.episode++;
    this.state = this.start_state;
    this.score = 0;
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
    if (this.end_states.indexOf(this.state) >= 0 || this.score < this.end_score){
      this.new_episode();
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
    for (var i = 0; i < episodes; i++) {
      for (var j = 0; j < max_steps_per_episode; j++) {
        if (this.auto_step() != 1) {
          break;
        }
      }
      this.new_episode();
    }
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
const tile = {
  regular: 0,
  start: 1,
  end: 2,
  dangerous: 4,
};

const dir = {
  UP: "UP",
  RIGHT: "RIGHT",
  DOWN: "DOWN",
  LEFT: "LEFT",
};

class Maze {
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
      var y_actions = [];
      if (idy != 0){
        y_actions.push(dir.UP);
      }
      if (idy != this.map.length-1){
        y_actions.push(dir.DOWN);
      }
      for (let idx=0; idx<this.map[0].length; idx++){
        var x_actions = [];
        if (idx != 0){
          x_actions.push(dir.LEFT);
        }
        if (idx != this.map[0].length-1){
          x_actions.push(dir.RIGHT);
        }
        actions.push([...y_actions,...x_actions]);
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

const reward = {[tile.regular]:-1,[tile.dangerous]:-1000,[tile.end]:1000,[tile.start]:-1};
var maze = new Maze(map, reward);

var learning_rate = 1;
var discount_factor = 1;

var machine = new RL_machine(maze.actions, maze.transactions, maze.rewards,  maze.start_state, maze.end_states, -999, learning_rate, discount_factor, 0.5);
