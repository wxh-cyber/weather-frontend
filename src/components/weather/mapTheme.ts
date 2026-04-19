import * as mars2d from 'mars2d'

export const createEcoBasemapLayer = () =>
  new mars2d.layer.GaodeLayer({
    layer: 'vec',
    opacity: 0.82,
  })
