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
  mounted () {
    this.renderChart(this.chartData, this.options);
  },

})

Array.prototype.simpleSMA=function(N) {
return this.map(
  function(el,index, _arr) {
      return _arr.filter(
      function(x2,i2) {
        return i2 <= index && i2 > index - N;
        })
      .reduce(
      function(last, current,index, arr){
        return (current/arr.length + last);
      },0);
      });
};

Array.prototype.max=function() {
return this.map(
  function(el,index, _arr) {
      return _arr.filter(
      function(x2,i2) {
        return i2 <= index;
        })
      .reduce(
      function(last, current){
        return last > current ? last:current;
      },-1000000000);
      });
};

app = new Vue({
  el: '#app',
  data: {
    width: 0,
    height: 0,
    q_table: machine.q_table,
    maze: maze,
    state: {x:0,y:0},
    state_tween: new TimelineLite(),
    score: machine.score,
    score_history: machine.score_history,
    labels: [],
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
      get: function() { return this._state },
      set: function(ne) { this._state=ne; $this.handleState(this._state); }
    });
    machine.state = s;
    // Score wrapper
    var s = machine.score;
    var $this = this;
    this.score = s;
    Object.defineProperty(machine, 'score', {
      get: function() { return this._score },
      set: function(ne) { this._score=ne; $this.score=ne}
    });
    machine.score = s;
    // Score history wrapper
    var s = machine.score_history;
    var $this = this;
    this.score_history = s;
    Object.defineProperty(machine, 'score_history', {
      get: function() { return this._score_history },
      set: function(ne) { this._score_history=ne; $this.score_history=ne}
    });
    machine.score_history = s;
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  computed: {
    datacollection: function () {
      return {
        labels: Array.from(Array(this.score_history.length).keys()),
        datasets: [
          {
            label: 'Data One',
            backgroundColor: 'rgb(0,0,0,0)',
            data: this.score_history.simpleSMA(Math.round(50)),
            fill: false,
            borderColor: 'rgb(255, 159, 64)',
            pointRadius: 1,
          },
          {
            label: 'Data One',
            backgroundColor: 'rgb(0,0,0,0)',
            data: this.score_history.max(),
            fill: false,
            borderColor: 'rgb(64, 159, 255)',
            pointRadius: 1,
          },
        ]
      }
    },
    stage_config: function () {
      return {
        width: this.width,
        height: this.height,
      }
    },
    mini_map_config: function () {
      return {
        x:this.width/2-(this.base_size*(this.maze.width)/2),
        y:this.height/2-(this.base_size*(this.maze.height)/2),
        scale:{
          x: 1,
          y: 1
        }
      }
    },
    local_layer: function () {
      return {
        x: this.width/2,
        y: this.height/2,
        scale:{
          x: 2,
          y: 2
        }
      }
    },
    map_config: function () {
      return {
        x: this.base_size*(this.maze.width-this.state.x),
        y: this.base_size*(this.maze.height-this.state.y),
        offset: {
          x: this.base_size*this.maze.width+this.base_size/2,
          y: this.base_size*this.maze.height+this.base_size/2,
        }
      }
    },
    agent_config: function () {
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
        x: this.base_size*this.state.x,
        y: this.base_size*this.state.y,
      }
    },
    base_size: function () {
        return Math.min(this.stage_config.height * 0.8 / this.maze.height,  this.stage_config.width * 0.5 / this.maze.width);
    },
    strokeW: function () {
      return this.base_size / 50;
    },
  },
  methods: {
    s2p: function(state){
      return {
        x: (state%this.maze.width),
        y: Math.floor(state/this.maze.width),
      }
    },
    p2s: function(x,y){
      return x+y*this.maze.width;
    },
    handleResize: function() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    },
    handleState: function(s) {
      if (!machine.running){
        this.state_tween.to(this.state, 0.2, { x: this.s2p(s).x, y: this.s2p(s).y });
      } else {
        this.state = this.s2p(s);
      }
      // this.hidden_state = s;
    },
    get_grid_line_config: function (idx, y=false) {
      var offset = this.strokeW/2;
      if (y){
        var points = [-offset, Math.round(idx * this.base_size), this.base_size * this.maze.width + offset,Math.round(idx * this.base_size)];
      } else {
        var points = [Math.round(idx * this.base_size), -offset, Math.round(idx * this.base_size), this.base_size * this.maze.height + offset];
      }
      return {
        points: points,
        stroke: '#ddd',
        strokeWidth: this.strokeW,
      }
    },
    get_tile_type: function (state){
      var pos = this.s2p(state);
      if (pos.y > maze.height){
        return null;
      } else if (pos.x > maze.width){
        return null;
      } else {
        return maze.map[pos.y][pos.x];
      }
    },
    in_plus: function (pos1, pos2) {
      if (Math.abs(pos1.x-pos2.x) + Math.abs(pos1.y-pos2.y) < 2) {
        return true;
      }
      return false;
    },
    get_tile_config: function (i, t_type, local=false) {
      var pos = this.s2p(i);
      var over = {};

      // not in plus
      if (local) {
        if (!this.in_plus(this.s2p(i),{x:Math.round(this.state.x),y:Math.round(this.state.y)})) {
          over = {
            opacity: 0,
            fill: "#eee"
          };
        } else if (i != this.p2s(Math.round(this.state.x),Math.round(this.state.y))) {
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
})
