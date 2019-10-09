app = new Vue({
  el: '#app',
  data: {
    width: 0,
    height: 0,
    q_table: machine.q_table,
    maze: maze,
    state: {x:0,y:0},
    state_tween: new TimelineLite(),
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
  },
  destroyed() {
    window.removeEventListener('resize', this.handleResize)
  },
  computed: {
    stage_config: function () {
      return {
        width: this.width,
        height: this.height,
      }
    },
    mini_map_config: function () {
      return {
        // x: this.stage_config.width * 0.5 - (Math.round(maze.width * this.base_size)/2),
        // y: this.stage_config.height * 0.5 - (Math.round(maze.height * this.base_size)/2),
        x:this.width-(Math.round(maze.width * this.base_size)*0.2)-30,
        y:30,
        scale:{
          x: 0.2,
          y: 0.2
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
      }
    },
    base_size: function () {
        return Math.min(this.stage_config.height * 0.9 / this.maze.height,  this.stage_config.width * 0.6 / this.maze.width);
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
    get_agent_config: function () {
      return{
        ...this.agent_config,
        x: this.base_size*this.state.x,
        y: this.base_size*this.state.y,
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
      }
    }
  },
})
