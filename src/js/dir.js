
export const dir = {
  UP: "UP",
  RIGHT: "RIGHT",
  DOWN: "DOWN",
  LEFT: "LEFT",
};

export function dirToMovement(direction) {
  switch (direction) {
    case dir.UP: return { x: 0, y: -1 };
    case dir.DOWN: return { x: 0, y: 1 };
    case dir.LEFT: return { x: -1, y: 0 };
    case dir.RIGHT: return { x: 1, y: 0 };
  }
}