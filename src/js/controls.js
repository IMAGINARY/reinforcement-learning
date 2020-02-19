import { machine, dir } from "./rl.js";

var animate = false;

const KeyCodeLeft = 37;
const KeyCodeUp = 38;
const KeyCodeRight = 39;
const KeyCodeDown= 40;

function key2Action(keyCode) {
  switch (keyCode) {
    case KeyCodeLeft: return dir.LEFT;
    case KeyCodeUp: return dir.UP;
    case KeyCodeRight: return dir.RIGHT;
    case KeyCodeDown: return dir.DOWN;
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
     machine.attemptStep(machine.state, action);
  }
}
