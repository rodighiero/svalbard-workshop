import { group, mean, polygonHull, polygonCentroid, line, curveCatmullRomClosed } from 'd3'
import { average, rgb, formatHex } from 'culori'

// Proportional padding around each cluster's points (uniform scale about the
// centroid). Lives here so the cluster blobs and the fronts overlap logic can
// never drift apart.
const EXPANSION = 0.15

const expand = (polygon, centroid) => {
    const scale = 1 + EXPANSION
    return polygon.map(([x, y]) => [
        centroid[0] + (x - centroid[0]) * scale,
        centroid[1] + (y - centroid[1]) * scale,
    ])
}

// Per-cluster geometry shared by the clusters and fronts layers: convex hull,
// its expanded (drawn) form, centroid, mean colour, red/blue key by mean
// temperature, and the topic label. Memoised on the entities array so the two
// layers don't each recompute it.
let cache = null
let cacheKey = null
export const clusterGeometry = (entities) => {
    if (cache && cacheKey === entities) return cache

    const out = []
    group(entities, (e) => e.cluster).forEach((members, id) => {
        if (id == -1) return
        const hull = polygonHull(members.map((e) => [e.x, e.y]))
        if (!hull) return
        const center = polygonCentroid(hull)
        const temperature = mean(members.map((e) => e.temperature))
        const colors = members.map((e) => rgb(e.color.substring(2)))
        out.push({
            id,
            hull,
            expanded: expand(hull, center),
            center,
            color: formatHex(average(colors, 'rgb')),
            key: temperature > 0 ? 'red' : 'blue', // emerging vs receding
            subject: members[0].cluster_subject_x,
        })
    })

    cache = out
    cacheKey = entities
    return out
}

// Smooth closed blob through the edge midpoints of the expanded hull (rounds
// corners inward, keeping the footprint faithful), filled + stroked onto `g`.
const blob = line()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveCatmullRomClosed)

export const paintBlob = (g, expanded, color) => {
    const midpoints = expanded.map((p, i) => {
        const q = expanded[(i + 1) % expanded.length]
        return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
    })
    blob.context(g)
    blob(midpoints)
    g.fill({ color, alpha: 0.2 })
    g.stroke({ width: 0.4, color, alpha: 0.2 })
}
