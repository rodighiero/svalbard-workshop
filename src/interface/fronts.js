import { Graphics, Container } from 'pixi.js'
import { polygonContains } from 'd3'
import { clusterGeometry, paintBlob, makeLabel } from './geometry.js'

// Two convex hulls overlap if either has a vertex inside the other.
const overlap = (a, b) =>
    a.some((p) => polygonContains(b, p)) || b.some((p) => polygonContains(a, p))

export default (entities) => {
    const stage = new Container()
    stage.interactiveChildren = false
    stage.label = 'fronts'
    stage.visible = false // opt-in mode, toggled from the Clusters switches
    s.viewport.addChild(stage)

    // Blobs of the overlapping clusters (added first so the curves sit on top).
    const blobs = new Graphics()
    stage.addChild(blobs)

    const geoms = clusterGeometry(entities)
    const shown = new Set()

    // A front marks the friction between emerging and receding discourse: draw a
    // curve for each red↔blue pair whose blobs overlap, and keep the two
    // clusters themselves visible (no separate overlap shape).
    for (let i = 0; i < geoms.length; i++) {
        for (let j = i + 1; j < geoms.length; j++) {
            const c1 = geoms[i]
            const c2 = geoms[j]
            if (c1.key === c2.key) continue // opposite colours only
            if (!overlap(c1.expanded, c2.expanded)) continue

            shown.add(c1)
            shown.add(c2)

            const container = new Container()
            stage.addChild(container)
            container.x = (c1.center[0] + c2.center[0]) / 2
            container.y = (c1.center[1] + c2.center[1]) / 2

            const width = c2.center[0] - c1.center[0]
            const heigth = c2.center[1] - c1.center[1]

            const width_1 = 0.3
            const shift_1 = 0.07
            const a = [+heigth * width_1 - width * shift_1, -width * width_1 - heigth * shift_1]
            const b = [-heigth * width_1 - width * shift_1, width * width_1 - heigth * shift_1]

            const width_2 = 1
            const shift_2 = 0.3
            const c = [+heigth * width_2 + width * shift_2, -width * width_2 + heigth * shift_2]
            const d = [-heigth * width_2 + width * shift_2, width * width_2 + heigth * shift_2]

            const bezier = new Graphics()
            bezier.moveTo(c[0], c[1])
            bezier.bezierCurveTo(a[0], a[1], b[0], b[1], d[0], d[1])
            bezier.stroke({ width: 1.5, color: s.gray })
            container.addChild(bezier)
        }
    }

    // Draw only the clusters that take part in a front, exactly as clusters.js
    // draws them (shared blob + label), so they match the normal view. Labels
    // are added last so they sit on top of the blobs and curves.
    shown.forEach((c) => paintBlob(blobs, c.expanded, c.color))
    shown.forEach((c) => stage.addChild(makeLabel(c)))
}
