import { Graphics, Container } from 'pixi.js'
import { polygonHull, polygonCentroid, group, mean } from 'd3'
import { average, rgb, formatHex } from 'culori'

// Grow a hull proportionally about its centroid (matches clusters.js) so the
// overlap patches line up with the drawn cluster blobs.
const expand = (polygon, centroid, growth = 0.15) => {
    const scale = 1 + growth
    return polygon.map(([x, y]) => [
        centroid[0] + (x - centroid[0]) * scale,
        centroid[1] + (y - centroid[1]) * scale,
    ])
}

// Intersection of two convex polygons via Sutherland–Hodgman clipping. Returns
// the clipped polygon (empty if they don't overlap). Orientation-agnostic: the
// interior side of each clip edge is chosen using the clip polygon's centroid.
const intersect = (subject, clip) => {
    const cc = polygonCentroid(clip)
    const side = (a, b, p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    const lineIntersect = (a, b, p, q) => {
        const a1 = b[1] - a[1]
        const b1 = a[0] - b[0]
        const c1 = a1 * a[0] + b1 * a[1]
        const a2 = q[1] - p[1]
        const b2 = p[0] - q[0]
        const c2 = a2 * p[0] + b2 * p[1]
        const det = a1 * b2 - a2 * b1
        if (det === 0) return q
        return [(b2 * c1 - b1 * c2) / det, (a1 * c2 - a2 * c1) / det]
    }

    let output = subject
    for (let i = 0; i < clip.length && output.length; i++) {
        const a = clip[i]
        const b = clip[(i + 1) % clip.length]
        const interior = Math.sign(side(a, b, cc))
        const inside = (p) => side(a, b, p) === 0 || Math.sign(side(a, b, p)) === interior
        const input = output
        output = []
        for (let j = 0; j < input.length; j++) {
            const cur = input[j]
            const prev = input[(j + input.length - 1) % input.length]
            if (inside(cur)) {
                if (!inside(prev)) output.push(lineIntersect(a, b, prev, cur))
                output.push(cur)
            } else if (inside(prev)) {
                output.push(lineIntersect(a, b, prev, cur))
            }
        }
    }
    return output
}

export default (entities) => {
    const stage = new Container()
    stage.interactiveChildren = false
    stage.label = 'fronts'
    stage.visible = false // opt-in mode, toggled from the Clusters switches
    s.viewport.addChild(stage)

    // One Graphics batches every overlap patch; curves are drawn per pair.
    const patches = new Graphics()
    stage.addChild(patches)

    // Precompute per cluster: expanded hull, centroid, mean colour, and whether
    // it's red (emerging, temperature > 0) or blue (receding).
    const meta = new Map()
    group(entities, (e) => e['cluster']).forEach((members, id) => {
        if (id == -1) return
        const hull = polygonHull(members.map((e) => [e.x, e.y]))
        if (!hull) return
        const center = polygonCentroid(hull)
        const temperature = mean(members.map((e) => e.temperature))
        const colors = members.map((e) => rgb(e['color'].substring(2)))
        meta.set(id, {
            center,
            expanded: expand(hull, center),
            key: temperature > 0 ? 'red' : 'blue',
            color: formatHex(average(colors, 'rgb')),
        })
    })

    // A front is the friction between emerging and receding discourse: draw one
    // (overlap patch + curve) only where a red and a blue cluster actually
    // overlap. The patch is the intersection of their (expanded) hulls.
    meta.forEach((c1, i1) => {
        meta.forEach((c2, i2) => {
            if (i1 >= i2) return // each unordered pair once
            if (c1.key === c2.key) return // opposite colours only

            const patch = intersect(c1.expanded, c2.expanded)
            if (patch.length < 3) return // hulls don't overlap

            // Overlap patch — both colours at low alpha, reproducing the blend
            // seen where the two blobs cross in the normal view.
            const flat = patch.flat()
            patches.poly(flat).fill({ color: c1.color, alpha: 0.25 })
            patches.poly(flat).fill({ color: c2.color, alpha: 0.25 })

            // Front curve between the two cluster centres
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
        })
    })
}
