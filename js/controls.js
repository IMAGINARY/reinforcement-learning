function dir_to_action(dir){
  let actions = [...Object.keys(machine.q_table[machine.state])];
  if (actions.indexOf(dir) > -1){
    return dir;
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
    ret = machine.step(tmp);
  }
  // show_q_table();
}
document.addEventListener('keydown', key_callback);
