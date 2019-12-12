// ----------------------------------------------------------------------------
// ------------------------------- Utils --------------------------------------
// ----------------------------------------------------------------------------

function defer() {
  var res, rej;

  var promise = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });

  promise.resolve = res;
  promise.reject = rej;

  return promise;
}

// ----------------------------------------------------------------------------
// -------------------------------- Plot --------------------------------------
// ----------------------------------------------------------------------------

Array.prototype.simpleSMA = function(N) {
  return this.map(
    function(el, index, _arr) {
      return _arr.filter(
          function(x2, i2) {
            return i2 <= index && i2 > index - N;
          })
        .reduce(
          function(last, current, index, arr) {
            return (current / arr.length + last);
          }, 0);
    });
};

Array.prototype.max = function() {
  return this.map(
    function(el, index, _arr) {
      return _arr.filter(
          function(x2, i2) {
            return i2 <= index;
          })
        .reduce(
          function(last, current) {
            return last > current ? last : current;
          }, -1000000000);
    });
};

Vue.component('line-chart', {
  extends: VueChartJs.Line,
  mixins: [VueChartJs.mixins.reactiveProp],
  props: ['options'],
  mounted() {
    this.renderChart(this.chartData, this.options);
  },

})

// ----------------------------------------------------------------------------
// --------------------------------- Map --------------------------------------
// ----------------------------------------------------------------------------

var MapBase = Vue.component('MapBase', {
  props: ['machine', 'maze', 'config'],
  data: function () {
    return {
      robot_image: null,
      energy_image: null,
    }
  },
  created() {
    var $this = this;
    const robot_image = new window.Image();
    robot_image.src = "img/robot.png";
    robot_image.onload = () => {
      $this.robot_image = robot_image;
    };
    const energy_image = new window.Image();
    energy_image.src = "img/station.png";
    energy_image.onload = () => {
      $this.energy_image = energy_image;
    };
  },
  computed: {
    main_config: function(){
      return {
        offset: {
          x: -(this.config.width-this.base_size*this.maze.width)/2,
          y: -(this.config.height-this.base_size*this.maze.height)/2,
        }
      }
    },
    robot_config: function() {
      return {
        height: this.base_size,
        width: this.base_size,
        x: this.center,
        y: this.center,
        image: this.robot_image,
        offset:{
          x: this.base_size/2,
          y: this.base_size/2,
        }
      }
    },
    energy_config: function() {
      return {
        height: this.base_size,
        width: this.base_size,
        offset: {
          x: this.base_size/2,
          y: this.base_size/2
        },
        image: this.energy_image,
      }
    },
    strokeW: function() {
      return this.base_size / 50;
    },
    base_size: function() {
      return Math.min(this.config.height/this.maze.height, this.config.width/this.maze.width);
    },
  },
  methods: {
    get_tile_type: function(state) {
      var pos = this.machine.s2p(state);
      if (pos.y > maze.height) {
        return null;
      } else if (pos.x > maze.width) {
        return null;
      } else {
        return maze.map[pos.y][pos.x];
      }
    },
    get_field_config: function(state) {
      var pos = this.machine.s2p(state);
      return {
        x: this.base_size * pos.x+this.base_size/2,
        y: this.base_size * pos.y+this.base_size/2,
      }
    },
    get_tile_config: function(t_type) {
      const layout = {
        width: this.base_size,
        height: this.base_size,
        stroke: '#ddd',
        strokeWidth: this.strokeW,
        offset: {
          x: this.base_size/2,
          y: this.base_size/2,
        }
      };
      switch (t_type) {
        case tile.regular:
          return {
            ...layout,
            fill: '#fff',
            opacity: 1,
          }
        case tile.end:
          return {
            ...layout,
            fill: '#0eb500',
            opacity: 1,
          }
        case tile.start:
          return {
            ...layout,
            fill: '#ff0008',
            opacity: 1,
          }
        case tile.dangerous:
          return {
            ...layout,
            fill: '#FF7B17',
            opacity: 1,
          }
        case tile.wall:
          return {
            ...layout,
            fill: '#000000',
            opacity: 1,
          }
      }
    },
  },
})

//-----------------------------------------------------------------------------

var palette = ['#d2000d', '#d30512', '#d40a17', '#d50f1c', '#d61420', '#d71a25', '#d71f2a', '#d8242f', '#d92934', '#da2e39', '#db333d', '#dc3842', '#dd3d47', '#de424c', '#df4751', '#e04d56', '#e0525a', '#e1575f', '#e25c64', '#e36169', '#e4666e', '#e56b73', '#e67077', '#e7757c', '#e87a81', '#e98086', '#e9858b', '#ea8a90', '#eb8f95', '#ec9499', '#ed999e', '#ee9ea3', '#efa3a8', '#f0a8ad', '#f1adb2', '#f2b3b6', '#f2b8bb', '#f3bdc0', '#f4c2c5', '#f5c7ca', '#f6cccf', '#f7d1d3', '#f8d6d8', '#f9dbdd', '#fae0e2', '#fbe6e7', '#fbebec', '#fcf0f0', '#fdf5f5', '#fefafa', '#ffffff', '#fafcfa', '#f5f9f5', '#f0f6f0', '#ebf3ec', '#e6f1e7', '#e1eee2', '#dcebdd', '#d7e8d8', '#d3e5d3', '#cee2cf', '#c9dfca', '#c4dcc5', '#bfd9c0', '#bad6bb', '#b5d4b6', '#b0d1b2', '#abcead', '#a6cba8', '#a1c8a3', '#9cc59e', '#97c299', '#92bf95', '#8dbc90', '#88b98b', '#84b786', '#7fb481', '#7ab17c', '#75ae77', '#70ab73', '#6ba86e', '#66a569', '#61a264', '#5c9f5f', '#579c5a', '#529a56', '#4d9751', '#48944c', '#439147', '#3e8e42', '#398b3d', '#348839', '#308534', '#2b822f', '#267f2a', '#217d25', '#1c7a20', '#17771c', '#127417', '#0d7112', '#086e0d']


Vue.component('rl-map', {
  extends: MapBase,
  computed: {
    robot_config: function() {
      return {
        height: this.base_size,
        width: this.base_size,
        x: this.base_size * this.machine.state.x,
        y: this.base_size * this.machine.state.y,
        image: this.robot_image,
      }
    },
    extreme_q_values: function(){
      var max = -10*30;
      var min = 10*30;
      for (field in this.q_table) {
        for (key in this.q_table[field]){
          if (this.q_table[field][key]<min){
            min = this.q_table[field][key];
          } else if (this.q_table[field][key]>max){
            max = this.q_table[field][key];
          }
        }
      }
      return {min: min, max: max};
    }
  },
  methods: {
    get_q_text_config: function (val, i) {
      var off, key;
      switch (i) {
        case 1:
          off = {
            align: "center",
            verticalAlign: "top",
          };
          key = dir.UP;
          break;
        case 2:
          off = {
            align: "right",
            verticalAlign: "middle",
          };
          key = dir.RIGHT;
          break;
        case 3:
          off = {
            align: "center",
            verticalAlign: "bottom",
          };
          key = dir.DOWN;
          break;
        case 4:
          off = {
            align: "left",
            verticalAlign: "middle",
          };
          key = dir.LEFT;
          break;
      }
      if (val[key] === undefined) {
        return {}
      }
      return {
        fontSize: this.base_size/7,
        fontFamily: 'Calibri',
        fill: 'black',
        text: +val[key].toPrecision(3)+'',
        width: this.base_size-20,
        height: this.base_size-34,
        ...off,
        offset: {
          x: (this.base_size-20)/2,
          y: (this.base_size-34)/2,
        }
      }
    },
    get_triangle_config: function(value, d) {
      var rot = 0;
      switch (d) {
        case dir.UP:
          rot = -90;
          break;
        case dir.RIGHT:
          rot = 0;
          break;
        case dir.DOWN:
          rot = 90;
          break;
        case dir.LEFT:
          rot = 180;
          break;
      }
      var $this = this;
      var norma_value = value>0 ? (value+1000)/(2000) : (value+30)/60;
      return {
        sceneFunc: function(context, shape) {
          context.beginPath();
          var width = $this.base_size / 5;
          var arrow_w = $this.base_size / 2;
          var stumpf = $this.base_size / 6;
          var arrow_l = $this.base_size / 5;
          context.moveTo($this.base_size/2-stumpf-arrow_l, width/2);
          context.lineTo($this.base_size/2-stumpf, width/2);
          context.lineTo($this.base_size/2-stumpf, arrow_w/2);
          context.lineTo($this.base_size/2-2, 0);
          context.lineTo($this.base_size/2-stumpf, -arrow_w/2);
          context.lineTo($this.base_size/2-stumpf, -width/2);
          context.lineTo($this.base_size/2-stumpf-arrow_l, -width/2);
          context.lineTo($this.base_size/2-stumpf-arrow_l, width/2);
          context.closePath();
          // (!) Konva specific method, it is very important
          context.fillStrokeShape(shape);
        },
        fill: palette[Math.round(norma_value*100)],
        stroke: 'black',
        strokeWidth: 1,
        rotation: rot,
      }
    },
  },
  template:
  `<v-stage ref="stage" :config="config">
    <v-layer ref="map_layer" :config="main_config">
      <v-group ref="map_group">
        <v-group :key="'tile'+idx" v-for="(t_type, idx) in maze.map.flat()" :config="get_field_config(idx)">
          <v-rect :config="get_tile_config(t_type)"></v-rect>
          <v-image :config="energy_config" v-if="t_type==8"></v-image>
        </v-group>
        <v-group :key="'qgroup'+idx" v-for="(action, idx) in machine.q_table" :config="get_field_config(idx)">
          <v-shape :key="'qvalshape'+idx+key" v-for="(value, key) in action" :config="get_triangle_config(value, key)"></v-shape>
          <v-text :key="'qval'+idx+i" v-for="i in 4" :config="get_q_text_config(action,i)"></v-text>
        </v-group>
        <v-image :config="robot_config"></v-image>
      </v-group>
    </v-layer>
  </v-stage>`
})

// ----------------------------------------------------------------------------
// -------------------------------- Local -------------------------------------
// ----------------------------------------------------------------------------

Vue.component('rl-local', {
  extends: MapBase,
  computed: {
    main_config: function(){
      return {
        offset: {
          x: -(this.config.width-this.base_size*3)/2,
          y: -(this.config.height-this.base_size*3)/2,
        }
      }
    },
    local_config: function() {
      return {
        x: -(this.machine.state.x)*this.base_size,
        y: -(this.machine.state.y)*this.base_size,
        offset: {
          x: -this.base_size,
          y: -this.base_size,
        }
      }
    },
    base_size: function() {
      return Math.min(this.config.height/3, this.config.width/3);
    },
    center: function() {
      return 3*this.base_size / 2;
    },
    local_area: function() {
      const x = Math.round(this.machine.state.x);
      const y = Math.round(this.machine.state.y);
      let arr = [[x,y-1],[x+1,y],[x,y+1],[x-1,y],[x,y]];
      return arr.filter((p) => p[0] < this.maze.width && p[1] < this.maze.height &&
                               p[0] >= 0 && p[1] >= 0)
                .map((p) => [this.maze.map[p[1]][p[0]], p[1]*this.maze.width+p[0]]);
    },
  },
  methods: {
    end: function(pos){
      return this.maze.get_states(tile.end).indexOf(pos) >= 0;
    },
    id_to_dir: function(id){
      switch (id) {
        case 0:
          return dir.UP;
        case 1:
          return dir.RIGHT;
        case 2:
          return dir.DOWN;
        case 3:
          return dir.LEFT;
        default:
          return undefined;
      }
    },
    handleMouseEnter(e) {
      const stage = e.target.getStage();
      stage.container().style.cursor = "pointer";
    },
    handleMouseLeave(e) {
      const stage = e.target.getStage();
      stage.container().style.cursor = "default";
    },
    get_local_tile_config: function(i, t_type) {
      // var pos = this.s2p(i);
      // in plus
      var over = {};

      if (i != this.machine.p2s(Math.round(this.machine.state.x), Math.round(this.machine.state.y)) &&
          t_type != tile.wall) {
        over = {
          width: this.base_size,
          height: this.base_size,
          stroke: '#ddd',
          strokeWidth: this.strokeW,
          offset: {
            x: this.base_size/2,
            y: this.base_size/2,
          },
          opacity: 1,
          fill: "#eee",
        }
      }
      return over;
    },
  },
  template:
  `<v-stage ref="stage" :config="config">
    <v-layer ref="map_layer" :config="main_config">
      <v-group ref="map_group" :config="local_config">
        <v-group :key="pair[1]" v-for="(pair, idx) in local_area" :config="get_field_config(pair[1])">
          <v-rect :config="get_tile_config(pair[0])"></v-rect>
          <v-image :config="energy_config" v-if="end(pair[1])"></v-image>
          <v-rect :config="get_local_tile_config(pair[1], pair[0])" @click="id_to_dir(idx) && machine.object.step(id_to_dir(idx))" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave"></v-rect>
        </v-group>
      </v-group>
      <v-image :config="robot_config"></v-image>
    </v-layer>
  </v-stage>`
})

Vue.component('navi-gation',  {
  props: ["options"],
  template: `
  <nav class="navi">
    <button v-for="(item, key) in options" v-on:click="item">{{ key }}</button>
  </nav>`
});

// ----------------------------------------------------------------------------
// ------------------------------ lightbox ------------------------------------
// ----------------------------------------------------------------------------

var light_box = {
  data: {
    content: "",
    options: [],
    active: false,
  },
  methods:{
    close: function(){
      this.active = false;
    },
    popup: function(content, options){
      this.content = content;
      var answer = defer();
      var $this = this;
      this.options = options.reduce((old, opt) => {
          old[opt] = function(){
            $this.active = false;
            answer.resolve(opt);
          }
          return old
      }, {});
      this.active = true;
      return answer;
    }
  },
  template: `
  <div class="lightbox" v-bind:class="{ active: active }">{{ content }}
    <div class="options">
      <button :key="key" v-for="(item, key) in options" v-on:click="item">{{ key }}</button>
    </div>
  </div>`
}

const PopupLibrary = {
  install(Vue, options = {}) {
    const root = new Vue(light_box)

    // Mount root Vue instance on new div element added to body
    root.$mount(document.body.appendChild(document.createElement('div')))

    Vue.prototype.$lightbox = root;
  }
}

window.Vue.use(PopupLibrary)

// ----------------------------------------------------------------------------
// -------------------------------- Main --------------------------------------
// ----------------------------------------------------------------------------

function makeMachineReactive(th, machine){
  var $this = th;

  $this.machine.s2p = function(state) {
    return {
      x: (state % $this.maze.width),
      y: Math.floor(state / $this.maze.width),
    }
  };
  $this.machine.p2s = function(x, y) {
    return x + y * $this.maze.width;
  };

  // Score wrapper
  var s = machine.score;
  $this.machine.score = s;
  Object.defineProperty(machine, 'score', {
    get: function() {
      return this._score
    },
    set: function(ne) {
      this._score = ne;
      $this.machine.score = ne
    }
  });
  machine.score = s;

  // Score history wrapper
  var s = machine.score_history;
  $this.machine.score_history = s;
  Object.defineProperty(machine, 'score_history', {
    get: function() {
      return this._score_history
    },
    set: function(ne) {
      this._score_history = ne;
      $this.machine.score_history = ne
    }
  });
  machine.score_history = s;

  // State wrapper
  var s = machine.state;
  $this.machine.state = $this.machine.s2p(s);
  Object.defineProperty(machine, 'state', {
    get: function() {
      return this._state
    },
    set: function(ne) {
      this._state = ne;
      $this.handleState(this._state);
    }
  });
  machine.state = s;

  $this.machine.object.setCallback($this.onNewEpisode);
}

app = new Vue({
  el: '#app',
  components: {
    VueSlider: window['vue-slider-component'],
  },
  data: {
    state: null,
    maze: maze,
    machine: {
      object: machine,
      q_table: machine.q_table,
      state: {
        x:0,
        y:0,
      },
      state_tween: new TimelineLite(),
      learning_rate: machine.lr,
      discount_factor: machine.df,
      epsilon: machine.epsilon,
      score: machine.score,
      score_history: machine.score_history,
      s2p: null,
      p2s: null,
    },
    width: 0,
    height: 0,
    components: [],
    navigation: {},
  },
  created() {
    // Resize handler
    window.addEventListener('resize', this.handleResize)
    this.handleResize();

    makeMachineReactive(this, machine);
    this.state = "init";
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  computed: {
    stage_config: function() {
      return {
        x: 0,
        y: 0,
        width: this.width*0.5,
        height: this.height*0.8,
      }
    },
    slider_config: function(){
        return {
          min: 0,
          max: 1,
          duration: 0,
          interval: 0.01,
          tooltip: 'none'
        }
    },
    datacollection: function() {
      return {
        labels: Array.from(Array(this.machine.score_history.length).keys()),
        datasets: [{
            label: 'Data One',
            backgroundColor: 'rgb(0,0,0,0)',
            data: this.machine.score_history,//.simpleSMA(Math.round(50)),
            fill: false,
            borderColor: 'rgb(255, 159, 64)',
            pointRadius: 1,
          },
          // {
          //   label: 'Data One',
          //   backgroundColor: 'rgb(0,0,0,0)',
          //   data: this.score_history.max(),
          //   fill: false,
          //   borderColor: 'rgb(64, 159, 255)',
          //   pointRadius: 1,
          // },
        ]
      }
    },
    plot_options: function() {
      var $this = this;
      return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
            // type: 'linear',
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
    onEnterState: function(){},
    onLeaveState: function(){},
    handleState: function(s) {
      if (!this.machine.object.running) {
        this.machine.state_tween.to(this.machine.state, 0.2, {
          x: this.machine.s2p(s).x,
          y: this.machine.s2p(s).y
        });
      } else {
        this.machine.state = this.machine.s2p(s);
      }
    },
    handleResize: function() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    },
    isActive: function(what){
      return this.components.indexOf(what) >= 0;
    },
    changeState: function(state){
      this.components = [];
      this.navigation = {};
      this.onEnterState = function(){};
      this.onLeaveState = function(){};
      this.state = state;
    },
    onNewEpisode: function(result){
      var text;
      if (result == "failed"){
        text = "Out of battery. The robot will be resetted.";
      } else if (result == "success"){
        text = "You reached the goal. The robot will be resetted.";
      }
      return this.$lightbox.popup(text, ["ok"]);
    }
  },
  watch: {
    'machine.learning_rate': function(new_val) {
      machine.lr = new_val;
      renderLatex();
    },
    'machine.discount_factor': function(new_val) {
      machine.df = new_val;
      renderLatex();
    },
    'machine.epsilon': function(new_val) {
      machine.epsilon = new_val;
    },
    state: function(state){
      this.onLeaveState();
      Object.assign(this, StateMgr[state]);
      this.onEnterState();
    },
  }
})

function renderLatex() {
  // (1-lr) * Q[state, action] + lr * (reward + gamma * np.max(Q[new_state, :])
  katex.render(`Q(s,a)\\leftarrow${(1-machine.lr).toFixed(2)}Q(s,a)+${machine.lr.toFixed(2)}(reward + ${machine.df.toFixed(2)}\\max_{a'}(Q(s_{new}, a'))`, document.getElementById('formula'),{displayMode: true,});
}
renderLatex();



// ----------------------------------------------------------------------------
// ------------------------------ StateMgr ------------------------------------
// ----------------------------------------------------------------------------

var StateMgr = {
  init: {
    onEnterState: function () {
      var lightText = `Reinforcement learning (RL) is an area of machine learning concerned with how software agents ought to take actions in an environment so as to maximize some notion of cumulative reward. Reinforcement learning is one of three basic machine learning paradigms, alongside supervised learning and unsupervised learning. (wikipedia)
      This exhibit explains how a robot can learn to navigate through a maze in order to reach its destination, before running out of power. At first the robot knows nothing, and learns from each new action (movement) and state (location reached). Slowly it starts to develop an understanding of the maze that will allow it to reach the charging station before it runs out of power. Eventually, it should learn to avoid any detour and reach the charging station in the optimal number of steps.`
      this.$lightbox.popup(lightText, ["next"]).then((r) => this.changeState("local"));
    },
  },
  local: {
    components: ["local", "navi", "score"],
    navigation: {
      "reset robot": () => machine.reset_machine(),
      "continue": null,
    },
    onEnterState: function () {
      this.navigation.continue = () => this.changeState("global");
      var lightText = "But there is a problem! The robot cannot see the whole maze, it only knows where it is and in which direction it can move. Can you reach the charging station in those conditions? Use the arrows to move";
      this.$lightbox.popup(lightText, ["next"]);
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
      var lightText = `As a human, you keep track of where you are and how you got there without thinking, which helps you think about what actions you should take next to reach your destination. And you can also just look around! How can then the robot 'think' of the maze, to know which action is the best at every moment? And how can it learn that? It must somehow keep track of where it is, and remember how good or bad was each action at each place in the maze, try new things, and update it's "mental image" of what was a good decision and what not.

      Reinforcement Learning uses the concept of a "Q-function", which keeps track of how "good" it expects it to be to take a specific action 'a' from a specific location 's'. This is written as Q(s, a). It also uses a "policy", which determines the best action to take in a given state, and is written as π(s). The robot must learn those functions while it navigates the maze. With each step, the functions are modified by a little bit, until eventually they give it the best strategy to solve the maze.`;
      this.$lightbox.popup(lightText, ["continue"]);
    },
  }
};
