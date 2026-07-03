import { BitmapText, Container, Graphics } from 'pixi.js'
import { group, mean, polygonHull, polygonCentroid, line, curveCatmullRomClosed } from 'd3'
import { average, rgb, formatHex } from 'culori'

// Smooth, closed blob through a set of [x, y] points. d3's line generator
// issues moveTo/bezierCurveTo/closePath — the same methods a Pixi Graphics
// exposes — so it can draw straight onto one via .context().
const blob = line()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveCatmullRomClosed)

const splitInTwo = (string) => {
    const middle = Math.round(string.length / 2)
    for (let i = middle, j = middle; i < string.length || j >= 0; i++, j--) {
        if (string[i] === ' ') return string.substring(0, i) + '\n' + string.substring(i + 1)
        if (string[j] === ' ') return string.substring(0, j) + '\n' + string.substring(j + 1)
    }
    return string
}

export default (entities) => {
    const stage = new Container()
    stage.interactiveChildren = false
    stage.label = 'clusters'
    stage.alpha = 1
    s.viewport.addChild(stage)

    // Split clusters into red (emerging, temperature > 0) and blue (receding)
    // subgroups so each can be toggled independently. Each subgroup is a
    // labelled Container holding its own hull Graphics plus its labels.
    const groups = { red: new Container(), blue: new Container() }
    groups.red.label = 'clusters-red'
    groups.blue.label = 'clusters-blue'
    const graphics = { red: new Graphics(), blue: new Graphics() }
    groups.red.addChild(graphics.red)
    groups.blue.addChild(graphics.blue)
    stage.addChild(groups.red, groups.blue)

    group(entities, (e) => e.cluster).forEach((cluster) => {
        const temperature = mean(cluster.map((e) => e.temperature))
        const key = temperature > 0 ? 'red' : 'blue'
        const g = graphics[key]
        const coordinates = cluster.map((e) => [e.x, e.y])
        const polygon = polygonHull(coordinates)
        const center = polygonCentroid(polygon)
        // e.color is '0xrrggbb'; strip the '0x' to hand culori a bare hex string
        const colors = cluster.map((e) => rgb(e['color'].substring(2)))
        const colorRGB = average(colors, 'rgb')
        const color = formatHex(colorRGB) // '#rrggbb', accepted directly by Pixi v8

        // Expand the polygon outward from its (already computed) centroid
        const expandPolygon = (polygon, centroid, factor = 10) => {
            return polygon.map(([x, y]) => {
                const dx = x - centroid[0]
                const dy = y - centroid[1]
                const distance = Math.sqrt(dx * dx + dy * dy)
                const scale = (distance + factor) / distance // Expand by the factor
                return [centroid[0] + dx * scale, centroid[1] + dy * scale]
            })
        }

        // Expanded polygon
        const expandedPolygon = expandPolygon(polygon, center, 10) // Adjust the factor to control expansion

        // Smooth blob through the edge MIDPOINTS of the expanded hull (as the
        // original corner-rounding did), so the footprint matches the pre-spline
        // size — running the spline through the vertices bulges it outward.
        const midpoints = expandedPolygon.map((p, i) => {
            const q = expandedPolygon[(i + 1) % expandedPolygon.length]
            return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
        })
        blob.context(g)
        blob(midpoints)
        g.fill({ color, alpha: 0.2 }) // Fill with transparency
        g.stroke({ width: 0.4, color, alpha: 0.2 }) // Contour

        // Text

        const bitmap = new BitmapText({
            text: splitInTwo(cluster[0].cluster_subject_x),
            style: {
                fontFamily: 'Lato',
                fontSize: 4, //5
                align: 'center',
            },
        })
        bitmap.tint = temperature > 0 ? 0xff0000 : 0x0000ff

        bitmap.position.set(center[0] - bitmap.width / 2, center[1] - bitmap.height / 2)

        groups[key].addChild(bitmap)
    })
}
