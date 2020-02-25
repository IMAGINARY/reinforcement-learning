import { dir } from "./rl.js";

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

function isModalDialogVisible() {
  return document.querySelector(".lightbox.active") == null;
}

export function setKeyboardActionCallback(callback) {
  document.addEventListener('keydown', (e) => {
    var action = key2Action(e.keyCode);
    if (action != undefined && isModalDialogVisible()) {
      callback(action);
    }
  });
}