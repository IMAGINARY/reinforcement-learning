import { getQColor } from './color-utils';
import Konva from 'konva';

export function createColorScaleReference() {
  const colorScaleStage = new Konva.Stage({
    container: 'color_scale',
    width: 200,
    height: 20
  });
  const colorScaleRect = new Konva.Rect({
    x: 0, y: 0,
    width: 200, height: 200,
    fillLinearGradientStartPoint: {x: 0, y: 0},
    fillLinearGradientEndPoint: {x: 200, y: 0},
    fillLinearGradientColorStops:
      [0, getQColor(0),
        0.2, getQColor(0.2),
        0.4, getQColor(0.4),
        0.6, getQColor(0.6),
        0.8, getQColor(0.8),
        1, getQColor(1)]
  });
  const colorScaleLayer = new Konva.Layer( { opacity: 0.5 } );
  colorScaleLayer.add(colorScaleRect);
  colorScaleStage.add(colorScaleLayer);
  }
