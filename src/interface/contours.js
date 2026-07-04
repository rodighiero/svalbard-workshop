import { Graphics } from 'pixi.js'
import { contourDensity } from 'd3'

const width = 0.5
const cellSize = 1
const bandwidth = 24 // Extension — smaller = crisper, more defined isolines
const thresholds = 20 // Number of density levels (isoline count)
const color = 0xb7c2cc // cool slate — matches the chrome's hairline rules

export default (entities) => {
    const stage = new Graphics()
    stage.interactiveChildren = false
    stage.label = 'contours'
    stage.alpha = 1
    s.viewport.addChild(stage)

    const density = contourDensity()
        .x((e) => e.x)
        .y((e) => e.y)
        .weight(() => 10) // constant weight for every point
        .size([window.innerWidth, window.innerHeight])
        .cellSize(cellSize)
        .bandwidth(bandwidth)
        .thresholds(thresholds)(entities)

    // Each contour level is a MultiPolygon: an array of polygons, and each
    // polygon is an array of rings — ring[0] the exterior, ring[1..] the holes
    // (enclosed basins). Trace every ring so nested peaks and valleys are drawn,
    // not just the outer silhouette.
    density.forEach((layer) => {
        layer.coordinates.forEach((polygon) => {
            polygon.forEach((ring) => {
                ring.forEach(([x, y], i) => {
                    if (i == 0) stage.moveTo(x, y)
                    else stage.lineTo(x, y)
                })
            })
        })
    })

    stage.stroke({ width, color })
}
