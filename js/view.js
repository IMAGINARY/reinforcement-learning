Vue.component('line-chart', {
  extends: VueChartJs.Line,
  mixins: [VueChartJs.mixins.reactiveProp],
  props: ['options'],
  // mixins: [VueChartJs.mixins.reactiveData],
  // props: ['options','labels', 'datasets'],
  // watch: {
  //   'labels': function(new_val) {
  //     this.chartData = {
  //       'labels': new_val,
  //       'datasets': this.datasets};
  //   },
  //   'datasets': {
  //     deep:true,
  //     handler: function(new_val) {
  //       this.chartData = {
  //         'labels': this.labels,
  //         'datasets': new_val};
  //     }
  //   }
  // },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },

})

var palette = ['#d2000d', '#d30512', '#d40a17', '#d50f1c', '#d61420', '#d71a25', '#d71f2a', '#d8242f', '#d92934', '#da2e39', '#db333d', '#dc3842', '#dd3d47', '#de424c', '#df4751', '#e04d56', '#e0525a', '#e1575f', '#e25c64', '#e36169', '#e4666e', '#e56b73', '#e67077', '#e7757c', '#e87a81', '#e98086', '#e9858b', '#ea8a90', '#eb8f95', '#ec9499', '#ed999e', '#ee9ea3', '#efa3a8', '#f0a8ad', '#f1adb2', '#f2b3b6', '#f2b8bb', '#f3bdc0', '#f4c2c5', '#f5c7ca', '#f6cccf', '#f7d1d3', '#f8d6d8', '#f9dbdd', '#fae0e2', '#fbe6e7', '#fbebec', '#fcf0f0', '#fdf5f5', '#fefafa', '#ffffff', '#fafcfa', '#f5f9f5', '#f0f6f0', '#ebf3ec', '#e6f1e7', '#e1eee2', '#dcebdd', '#d7e8d8', '#d3e5d3', '#cee2cf', '#c9dfca', '#c4dcc5', '#bfd9c0', '#bad6bb', '#b5d4b6', '#b0d1b2', '#abcead', '#a6cba8', '#a1c8a3', '#9cc59e', '#97c299', '#92bf95', '#8dbc90', '#88b98b', '#84b786', '#7fb481', '#7ab17c', '#75ae77', '#70ab73', '#6ba86e', '#66a569', '#61a264', '#5c9f5f', '#579c5a', '#529a56', '#4d9751', '#48944c', '#439147', '#3e8e42', '#398b3d', '#348839', '#308534', '#2b822f', '#267f2a', '#217d25', '#1c7a20', '#17771c', '#127417', '#0d7112', '#086e0d']

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

app = new Vue({
  el: '#app',
  components: {
    VueSlider: window['vue-slider-component']
  },
  data: {
    width: 0,
    height: 0,
    q_table: machine.q_table,
    maze: maze,
    state: {
      x: 0,
      y: 0
    },
    state_tween: new TimelineLite(),
    score: machine.score,
    score_history: machine.score_history,
    labels: [],
    learning_rate: machine.lr,
    discount_factor: machine.df,
    epsilon: machine.epsilon,
    slider_config: {
      min: 0,
      max: 1,
      duration: 0,
      interval: 0.01,
      tooltip: 'none'
    }
  },
  created() {
    // Resize handler
    window.addEventListener('resize', this.handleResize)
    this.handleResize();
    // State wrapper
    var s = machine.state;
    var $this = this;
    this.state = this.s2p(s);
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
    // Score wrapper
    var s = machine.score;
    var $this = this;
    this.score = s;
    Object.defineProperty(machine, 'score', {
      get: function() {
        return this._score
      },
      set: function(ne) {
        this._score = ne;
        $this.score = ne
      }
    });
    machine.score = s;
    // Score history wrapper
    var s = machine.score_history;
    var $this = this;
    this.score_history = s;
    Object.defineProperty(machine, 'score_history', {
      get: function() {
        return this._score_history
      },
      set: function(ne) {
        this._score_history = ne;
        $this.score_history = ne
      }
    });
    machine.score_history = s;
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  computed: {
    datacollection: function() {
      return {
        labels: Array.from(Array(this.score_history.length).keys()),
        datasets: [{
            label: 'Data One',
            backgroundColor: 'rgb(0,0,0,0)',
            data: this.score_history,//.simpleSMA(Math.round(50)),
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
    stage_config: function() {
      return {
        width: this.width,
        height: this.height,
      }
    },
    mini_map_config: function() {
      return {
        x: this.width / 2 - (this.base_size * (this.maze.width) / 2),
        y: this.height / 2 - (this.base_size * (this.maze.height) / 2),
        scale: {
          x: 1,
          y: 1
        }
      }
    },
    local_layer: function() {
      return {
        x: this.width / 2,
        y: this.height / 2,
        scale: {
          x: 2,
          y: 2
        }
      }
    },
    map_config: function() {
      return {
        x: this.base_size * (this.maze.width - this.state.x),
        y: this.base_size * (this.maze.height - this.state.y),
        offset: {
          x: this.base_size * this.maze.width + this.base_size / 2,
          y: this.base_size * this.maze.height + this.base_size / 2,
        }
      }
    },
    agent_config: function() {
      return {
        sides: 5,
        radius: this.base_size / 3,
        fill: '#00D2FF',
        stroke: 'black',
        strokeWidth: this.strokeW,
        offset: {
          x: -this.base_size / 2,
          y: -this.base_size / 2
        },
        x: this.base_size * this.state.x,
        y: this.base_size * this.state.y,
      }
    },
    base_size: function() {
      return Math.min(this.stage_config.height * 0.8 / this.maze.height, this.stage_config.width * 0.5 / this.maze.width);
    },
    strokeW: function() {
      return this.base_size / 50;
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
      return {min:min,max:max};
    }
  },
  methods: {
    s2p: function(state) {
      return {
        x: (state % this.maze.width),
        y: Math.floor(state / this.maze.width),
      }
    },
    p2s: function(x, y) {
      return x + y * this.maze.width;
    },
    handleResize: function() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    },
    handleState: function(s) {
      if (!machine.running) {
        this.state_tween.to(this.state, 0.2, {
          x: this.s2p(s).x,
          y: this.s2p(s).y
        });
      } else {
        this.state = this.s2p(s);
      }
      // this.hidden_state = s;
    },
    get_grid_line_config: function(idx, y = false) {
      var offset = this.strokeW / 2;
      if (y) {
        var points = [-offset, Math.round(idx * this.base_size), this.base_size * this.maze.width + offset, Math.round(idx * this.base_size)];
      } else {
        var points = [Math.round(idx * this.base_size), -offset, Math.round(idx * this.base_size), this.base_size * this.maze.height + offset];
      }
      return {
        points: points,
        stroke: '#ddd',
        strokeWidth: this.strokeW,
      }
    },
    get_tile_type: function(state) {
      var pos = this.s2p(state);
      if (pos.y > maze.height) {
        return null;
      } else if (pos.x > maze.width) {
        return null;
      } else {
        return maze.map[pos.y][pos.x];
      }
    },
    in_plus: function(pos1, pos2) {
      if (Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y) < 2) {
        return true;
      }
      return false;
    },
    get_field_config: function(state) {
      var pos = this.s2p(state);
      return {
        x: this.base_size * pos.x+this.base_size/2,
        y: this.base_size * pos.y+this.base_size/2,
      }
    },
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
      var norma_value = value>0?(value+1000)/(2000):(value+30)/60;
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
          // context.moveTo(0, 0);
          // context.lineTo($this.base_size / 2, $this.base_size / 2);
          // context.lineTo($this.base_size / 2, -$this.base_size / 2);
          // context.lineTo(0, 0);
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
    get_tile_config: function(i, t_type, local = false) {
      var pos = this.s2p(i);
      var over = {};

      // not in plus
      if (local) {
        if (!this.in_plus(this.s2p(i), {
            x: Math.round(this.state.x),
            y: Math.round(this.state.y)
          })) {
          over = {
            opacity: 0,
            fill: "#eee"
          };
        } else if (i != this.p2s(Math.round(this.state.x), Math.round(this.state.y))) {
          over = {
            opacity: 1,
            fill: "#eee"
          };
        }
      }
      const layout = {
        x: this.base_size * pos.x,
        y: this.base_size * pos.y,
        width: this.base_size,
        height: this.base_size,
        stroke: '#ddd',
        strokeWidth: this.strokeW,
      };
      switch (t_type) {
        case tile.regular:
          return {
            ...layout,
            fill: '#fff',
            opacity: 1,
            ...over,
          }
        case tile.end:
          return {
            ...layout,
            fill: '#0eb500',
            opacity: 1,
            ...over,
          }
        case tile.start:
          return {
            ...layout,
            fill: '#ff0008',
            opacity: 1,
            ...over,
          }
        case tile.dangerous:
          return {
            ...layout,
            fill: '#FF7B17',
            opacity: 1,
            ...over,
          }
        case tile.wall:
          return {
            ...layout,
            fill: '#000000',
            opacity: 1,
            ...over,
          }
      }
    }
  },
  watch: {
    learning_rate: function(new_val) {
      machine.lr = new_val;
      render_latex();
    },
    discount_factor: function(new_val) {
      machine.df = new_val;
      render_latex();
    },
    epsilon: function(new_val) {
      machine.epsilon = new_val;
    }
  }
})

function render_latex() {
  // (1-lr) * Q[state, action] + lr * (reward + gamma * np.max(Q[new_state, :])
  katex.render(`Q(s,a)\\leftarrow${(1-machine.lr).toFixed(2)}Q(s,a)+${machine.lr.toFixed(2)}(reward + ${machine.df.toFixed(2)}\\max_{a'}(Q(s_{new}, a'))`, document.getElementById('formula'),{displayMode: true,});
}
render_latex();
