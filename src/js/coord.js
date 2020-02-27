
export function areEqual(coordA, coordB) {
  return (coordA.x == coordB.x && coordA.y == coordB.y);
}

export function areAdjacent(coordA, coordB) {
  return (coordA.x == coordB.x && (coordA.y == coordB.y + 1 || coordA.y == coordB.y - 1)) ||
         (coordA.y == coordB.y && (coordA.x == coordB.x + 1 || coordA.x == coordB.x - 1));
}
