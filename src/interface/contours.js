import { Graphics } from 'pixi.js'
import { contourDensity } from 'd3'

const width = 0.5
const cellSize = 1
const bandwidth = 30 // Extension
const thresholds = 15

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

    density.forEach((layer) => {
        layer.coordinates.forEach((array) => {
            array[0].forEach(([x, y], i) => {
                if (i == 0) stage.moveTo(x, y)
                stage.lineTo(x, y)
            })
        })
    })

    stage.stroke({ width, color: s.contours })
}
