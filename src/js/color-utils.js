
function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

let colormap = require('colormap')

const ColorMapShades = 64;
const qColorMap = colormap({
  colormap: 'jet',
  nshades: 64,
  format: 'hex',
})

/**
 * 
 * @param qValue A normalized value
 */
export function getQColor(qValue) {
  return qColorMap[Math.floor(qValue * (ColorMapShades - 1))];
}