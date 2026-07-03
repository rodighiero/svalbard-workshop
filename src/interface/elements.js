import { BitmapText, Container, Graphics, Rectangle } from 'pixi.js'

import { click } from './click'

export default (entities) => {
    const stage = new Container()
    stage.alpha = 0
    stage.label = 'elements'
    s.viewport.addChild(stage)

    const length = 0.4 // original lenght = 1
    const tickness = 0.1 // original thickness = 0.2

    // All crosses are inert (only the year labels are clickable), so batch them
    // into one Graphics rather than ~2 per article. Each stroke() commits the
    // path built since the previous commit, keeping the per-article color.
    const crosses = new Graphics()
    stage.addChild(crosses)

    entities.forEach((e) => {
        // Cross

        const color = Number(e.color)

        crosses.moveTo(e.x, e.y - length).lineTo(e.x, e.y + length)
        crosses.moveTo(e.x - length, e.y).lineTo(e.x + length, e.y)
        crosses.stroke({ width: tickness, color })

        // Label

        const bitmap = new BitmapText({
            text: e.year,
            style: {
                fontFamily: 'Lato',
                fontSize: 0.7, // 1
                align: 'left',
            },
        })
        bitmap.tint = color
        bitmap.position.set(e.x + 0.3, e.y + 0.1) //(e.x + .6, e.y + 0.2)
        stage.addChild(bitmap)

        // Interaction

        bitmap.hitArea = new Rectangle(0, 0, bitmap.width, bitmap.height)
        bitmap.eventMode = 'static'
        bitmap.cursor = 'pointer'

        bitmap.on('pointertap', () => {
            click(e)
        }) // On click
    })
}
