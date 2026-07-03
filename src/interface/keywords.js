import { BitmapText, Container, Graphics } from 'pixi.js'

const margin = 10 // Minimum gap between keyword labels
const cell = 64   // Spatial-hash cell size (world units)

// Axis-aligned overlap test, inflated by `margin` on every side.
const overlaps = (a, b) => !(
    a.x > b.x + b.width + margin
    || a.x + a.width + margin < b.x
    || a.y > b.y + b.height + margin
    || a.y + a.height + margin < b.y)

// Grid cells a box touches. `pad` inflates the footprint (used with `margin`
// on queries so any box within the gap shares a cell with the candidate).
const cellsFor = (x, y, w, h, pad) => {
    const cells = []
    const x0 = Math.floor((x - pad) / cell), x1 = Math.floor((x + w + pad) / cell)
    const y0 = Math.floor((y - pad) / cell), y1 = Math.floor((y + h + pad) / cell)
    for (let cx = x0; cx <= x1; cx++)
        for (let cy = y0; cy <= y1; cy++) cells.push(cx + ',' + cy)
    return cells
}

export default entities => {

    const stage = new Container()
    stage.label = 'keywords'
    stage.alpha = 1
    stage.interactiveChildren = false
    s.viewport.addChild(stage)

    // Spatial hash of already-placed labels. Replaces the per-candidate scan
    // over every accepted label (O(n²)) with a lookup against only the labels
    // sharing a grid cell; acceptance stays greedy in slope order.
    const grid = new Map()

    entities
        .filter(e => e.type === 'tag') // Keep keywords
        .sort((a, b) => b.slope - a.slope) // Order by linear regression
        .forEach(e => {

            const bitmap = new BitmapText({
                text: e.name,
                style: {
                    fontFamily: 'Lato',
                    fontSize: (e.frequency_norm + .5) * 20, // Normalization ([0:1] + x) + scale
                    align: 'center',
                },
            })
            bitmap.tint = s.gray

            bitmap.position.set(e.x - bitmap.width / 2, e.y - bitmap.height / 2)


            // Check overlapping against neighbours in the shared grid cells only
            let overlapping = false
            const seen = new Set()
            for (const c of cellsFor(bitmap.x, bitmap.y, bitmap.width, bitmap.height, margin)) {
                const bucket = grid.get(c)
                if (!bucket) continue
                for (const other of bucket) {
                    if (seen.has(other)) continue
                    seen.add(other)
                    if (overlaps(bitmap, other)) { overlapping = true; break }
                }
                if (overlapping) break
            }

            if (!overlapping) {

                const background = new Graphics();
                background.roundRect(bitmap.x, bitmap.y + 1.5, bitmap.width, bitmap.height, 1)
                background.fill(0xFFFFFF)

                stage.addChild(background)
                stage.addChild(bitmap)

                s.bitmaps.push(bitmap)

                // Index the accepted label by its actual footprint
                for (const c of cellsFor(bitmap.x, bitmap.y, bitmap.width, bitmap.height, 0)) {
                    if (!grid.has(c)) grid.set(c, [])
                    grid.get(c).push(bitmap)
                }

            }

        })

}
