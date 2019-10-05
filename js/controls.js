function dir_to_action(dir){
  let actions = [...Array(machine.q_table[machine.state].length).keys()].map((a) => maze.get_direction(machine.state,a));
  var action = actions.indexOf(dir);
  if (action>-1){
    return action;
  }
  return undefined;
}
var animate = false;

function key_callback(e) {
  var tmp;
  if (animate){
    return
  }
  switch (e.keyCode) {
        case 37:
            tmp = dir_to_action(dir.LEFT);
            break;
        case 38:
            tmp = dir_to_action(dir.UP);
            break;
        case 39:
            tmp = dir_to_action(dir.RIGHT);
            break;
        case 40:
            tmp = dir_to_action(dir.DOWN);
            break;
  }
  var ret = 1;
  if (tmp != undefined){
    agent.do_action(tmp, true);
    ret = machine.step(tmp);
  }
  update_agent(machine.state, true);
}
document.addEventListener('keydown', key_callback);

function show_solution() {
  var sol = machine.current_solution();
  animate = true;
  show_path(sol.states, 0);
}

function show_path(path, i){
  if (path.length == i) {
    animate = false;
    return
  }
  agent.set_state(path[i]);
  window.setTimeout(function(){ show_path(path, ++i) }, 1000);
}
