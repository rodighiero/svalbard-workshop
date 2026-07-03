import { Graphics, Container } from 'pixi.js'
import { polygonHull, polygonCentroid, polygonContains, group } from 'd3'

export default (entities) => {
    const stage = new Container()
    stage.alpha = 1
    stage.interactiveChildren = false
    stage.label = 'fronts'
    s.viewport.addChild(stage)

    const clusters = group(entities, (e) => e['cluster'])

    // Precompute each cluster's coords, hull and centroid once. The pairwise
    // loop below is O(K²); computing polygonHull inside it rebuilt every hull
    // ~K times. Outliers (-1) are excluded here rather than skipped per pair.
    const meta = new Map()
    clusters.forEach((members, id) => {
        if (id == -1) return
        const coordinates = members.map((e) => [e.x, e.y])
        const hull = polygonHull(coordinates)
        meta.set(id, { coordinates, hull, center: polygonCentroid(hull) })
    })

    meta.forEach((c1, i1) => {
        meta.forEach((c2, i2) => {
            if (i1 >= i2) return // each unordered pair once (keys compared as before)

            const p1 = c1.hull
            const center_1 = c1.center
            const center_2 = c2.center

            const overlapping = c2.coordinates.some((point) => polygonContains(p1, point))

            if (overlapping) {
                const container = new Container()
                stage.addChild(container)
                container.x = (center_1[0] + center_2[0]) / 2
                container.y = (center_1[1] + center_2[1]) / 2

                const width = center_2[0] - center_1[0]
                const heigth = center_2[1] - center_1[1]

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
        })
    })
}
