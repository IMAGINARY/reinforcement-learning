import { machine, dir } from "./rl.js";

function dir_to_action(dir){
  let actions = [...Object.keys(machine.q_table[machine.state])];
  if (actions.indexOf(dir) > -1){
    return dir;
  }
  return undefined;
}
var animate = false;

const KeyCodeLeft = 37;
const KeyCodeUp = 38;
const KeyCodeRight = 39;
const KeyCodeDown= 40;

function key2Action(keyCode) {
  switch (keyCode) {
    case KeyCodeLeft: return dir_to_action(dir.LEFT);
    case KeyCodeUp: return dir_to_action(dir.UP);
    case KeyCodeRight: return dir_to_action(dir.RIGHT);
    case KeyCodeDown: return dir_to_action(dir.DOWN);
  }
  return undefined;
}

function isLightBoxInactive() {
  return document.querySelector(".lightbox.active") == null;
}

export function key_callback(e) {
  if (animate) {
    return
  }
  var action = key2Action(e.keyCode);
  if (action != undefined && isLightBoxInactive()) {
     machine.step(action);
  }
}
