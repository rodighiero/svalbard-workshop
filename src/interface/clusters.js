import { BitmapText, Container, Graphics } from 'pixi.js'
import { group, mean, polygonHull, polygonCentroid } from 'd3'
import { average, rgb, formatHex } from 'culori'

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

        // Contour with Rounded Corners, including expansion
        for (let i = 0; i < expandedPolygon.length; i++) {
            const currentPoint = expandedPolygon[i]
            const nextPoint = expandedPolygon[(i + 1) % expandedPolygon.length] // Wrap around to the start
            const prevPoint =
                expandedPolygon[(i - 1 + expandedPolygon.length) % expandedPolygon.length] // Previous point with wrap-around
            const controlPoint = [
                (prevPoint[0] + currentPoint[0]) / 2,
                (prevPoint[1] + currentPoint[1]) / 2,
            ]

            if (i === 0) {
                g.moveTo(controlPoint[0], controlPoint[1]) // Start at the midpoint of the last segment
            }

            const midPoint = [
                (currentPoint[0] + nextPoint[0]) / 2,
                (currentPoint[1] + nextPoint[1]) / 2,
            ]
            g.quadraticCurveTo(currentPoint[0], currentPoint[1], midPoint[0], midPoint[1]) // Smooth curve
        }

        g.closePath() // Close the path
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
