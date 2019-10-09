const canvas = document.getElementById("canvas");

var canvas_width = canvas.offsetWidth;
var canvas_height = canvas.offsetHeight;

function sort(array) {
  return array.sort(function(a, b) {
    return a - b;
  })
}

const grid_line = {
  stroke: '#ddd',
}

// first we need to create a stage
var stage = new Konva.Stage({
  container: canvas,
});

var agent;
var map_layer = new Konva.Layer();
var map_group = new Konva.Group();
var grid_group = new Konva.Group();
var tile_group = new Konva.Group();
var agent_group = new Konva.Group();

var padding;

map_layer.add(map_group);
stage.add(map_layer);

function init_stage() {
  stage.width(canvas_width);
  stage.height(canvas_height);
  map_group.width(stage.width() * 0.6);
  map_group.height(stage.height() * 0.9);
  map_group.setX(stage.width() * 0.2);
  map_group.setY(stage.height() / 2 - (stage.height() * 0.45));
}

function draw_agent(state) {
  // cleanup
  agent_group.remove();
  agent_group = new Konva.Group();

  agent = {
    "konva": new Konva.RegularPolygon({
      offset: {
        x: -padding / 2,
        y: -padding / 2
      },
      sides: 5,
      radius: padding / 3,
      fill: '#00D2FF',
      stroke: 'black',
      strokeWidth: padding / 50
    }),
    "target_x": undefined,
    "target_y": undefined,
    "todos": [],
    "_padding": padding,
    set padding(pad){
      this._padding = pad;
      this.konva.offset({x: -padding / 2, y: -padding / 2});
      this.konva.radius(padding / 3);
      this.konva.strokeWidth(padding / 50);
    },
    get x() {
      return Math.floor(this.konva.getX() / this._padding);
    },
    set x(pos) {
      // this.target_x = sort([0, pos, map[0].length - 1])[1] * this._padding;
      this.konva.setX(sort([0, pos, map[0].length - 1])[1] * this._padding);
      map_layer.draw();
    },
    get y() {
      return Math.floor(this.konva.getY() / this._padding);
    },
    set y(pos) {
      // this.target_y = sort([0, pos, map.length - 1])[1] * this._padding;
      this.konva.setY(sort([0, pos, map.length - 1])[1] * this._padding);
      map_layer.draw();
    },
    do_action(action, animate=false){
      var y = this.y;
      var x = this.x;
      var fun;
      switch (action) {
        case dir.UP:
          y--;
          fun = function () {return [this.x,this.y-1]}.bind(this);
          break;
        case dir.RIGHT:
          x++;
          fun = function () {return [this.x+1,this.y]}.bind(this);
          break;
        case dir.DOWN:
          y++;
          fun = function () {return [this.x,this.y+1]}.bind(this);
          break;
        case dir.LEFT:
          x--;
          fun = function () {return [this.x-1,this.y]}.bind(this);
          break;
      }
      if (animate){
        this.todos.push(fun);
      } else {
        this.todos = [];
        this.target_x = undefined;
        this.target_y = undefined;
        this.x = x;
        this.y = y;
      }
    },
    set_state(state, animate=false){
      let y = Math.floor(state/map[0].length);
      let x = state%map[0].length;
      if (animate){
        this.todos.push([x,y])
      } else {
        this.todos = [];
        this.target_x = undefined;
        this.target_y = undefined;
        this.x = x;
        this.y = y;
      }
    },
    "animation": function () {
      return new Konva.Animation(function(frame) {
        if (this.target_x === undefined || this.target_y === undefined) {
          if (this.todos.length == 0){
            return
          }
          var current = this.todos.shift();
          if (current.length == 2){
            [this.target_x,this.target_y] = current;
          } else {
            [this.target_x,this.target_y] = current();
          }
        }
        var x = sort([0, this.target_x, map[1].length - 1])[1] * this._padding;
        var y = sort([0, this.target_y, map.length - 1])[1] * this._padding;
        var vec = [x-this.konva.getX(),y-this.konva.getY()];
        const length = Math.sqrt(vec[0]**2+vec[1]**2);
        var step = frame.timeDiff*(padding/100);
        if (length < step){
          this.konva.setX(x);
          this.konva.setY(y);
          this.target_x = undefined;
          this.target_y = undefined;
        } else {
          vec[0] = vec[0]/length;
          vec[1] = vec[1]/length;
          this.konva.setX(this.konva.getX()+vec[0]*step);
          this.konva.setY(this.konva.getY()+vec[1]*step);
        }
      }.bind(this), map_layer);
    }
  }
  var anim = agent.animation();
  agent.set_state(state);
  anim.start();
  agent_group.add(agent.konva);
  map_group.add(agent_group);
}

function update_agent(state, animate=false) {
  agent.padding = padding;
  agent.set_state(state, animate);
}

function draw_map(map) {
  grid_group.remove();
  grid_group = new Konva.Group();
  tile_group.remove();
  tile_group = new Konva.Group();

  init_stage();

  padding = Math.min(map_group.height() / map.length, map_group.width() / map[0].length);
  var strokeW = padding/50;
  const offset = strokeW / 2;
  // x
  for (let i = 0; i < map[0].length + 1; i++) {
    grid_group.add(new Konva.Line({
      points: [Math.round(i * padding), -offset, Math.round(i * padding), padding * map.length + offset],
      strokeWidth: strokeW,
      ...grid_line
    }));
    grid_group.width(Math.round(i * padding));
  }
  // y
  for (let j = 0; j < map.length + 1; j++) {
    grid_group.add(new Konva.Line({
      points: [-offset, Math.round(j * padding), padding * map[0].length + offset, Math.round(j * padding)],
      strokeWidth: strokeW,
      ...grid_line
    }));
    grid_group.height(Math.round(j * padding));
  }

  for (var idy in map) {
    for (var idx in map[idy]) {
      const layout = {
        x: padding * idx + offset,
        y: padding * idy + offset,
        width: padding - 2 * offset,
        height: padding - 2 * offset,
        // stroke: '#CF6412',
        // strokeWidth: 4
      };
      if (map[idy][idx] == tile.dangerous) {
        tile_group.add(new Konva.Rect({
          ...layout,
          fill: '#FF7B17',
          opacity: 1,
        }))
      } else if (map[idy][idx] == tile.end) {
        tile_group.add(new Konva.Rect({
          ...layout,
          fill: '#0eb500',
          opacity: 0.5,
        }))
      } else if (map[idy][idx] == tile.start) {
        tile_group.add(new Konva.Rect({
          ...layout,
          fill: '#ff0008',
          opacity: 0.5,
        }))
      }
    }
  }

  map_group.offset({
    x: -(map_group.width() - grid_group.width()) / 2,
    y: -(map_group.height() - grid_group.height()) / 2,
  });

  map_group.add(grid_group);
  map_group.add(tile_group);

  map_layer.draw();
}

window.addEventListener('resize', function() {
  canvas_width = canvas.offsetWidth;
  canvas_height = canvas.offsetHeight;
  draw_map(map);
  draw_agent(machine.state);
});

draw_map(map)
draw_agent(machine.state)

// New

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
