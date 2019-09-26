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

function draw_map(map, state) {
  // cleanup
  agent_group.remove();
  agent_group = new Konva.Group();
  grid_group.remove();
  grid_group = new Konva.Group();
  tile_group.remove();
  tile_group = new Konva.Group();

  init_stage();

  map = map;
  var padding = Math.min(map_group.height() / map.length, map_group.width() / map[0].length);
  var strokeW = 16 / Math.max(map.length, map[0].length);
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
          fill: '#ffc908',
          opacity: 0.5,
        }))
      }
    }
  }

  map_group.offset({
    x: -(map_group.width() - grid_group.width()) / 2,
    y: -(map_group.height() - grid_group.height()) / 2,
  });

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
      strokeWidth: 2
    }),
    get x() {
      return Math.floor(this.konva.getX() / padding);
    },
    set x(pos) {
      this.konva.setX(sort([0, pos, map[0].length - 1])[1] * padding);
      map_layer.draw();
    },
    get y() {
      return Math.floor(this.konva.getY() / padding);
    },
    set y(pos) {
      this.konva.setY(sort([0, pos, map.length - 1])[1] * padding);
      map_layer.draw();
    },
    up() {
      this.y--;
    },
    down() {
      this.y++;
    },
    left() {
      this.x++;
    },
    right() {
      this.x--;
    },
    set_state(state){
      this.y = Math.floor(state/map[0].length);
      this.x = state%map[0].length;
    }
  }

  agent.set_state(state);
  agent_group.add(agent.konva);

  map_group.add(grid_group);
  map_group.add(tile_group);
  map_group.add(agent_group);
  map_layer.draw();
}

draw_map(map, 32);

window.addEventListener('resize', function() {
  canvas_width = canvas.offsetWidth;
  canvas_height = canvas.offsetHeight;
  draw_map(map, machine.state);
});
