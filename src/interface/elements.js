import { BitmapText, Container, Graphics, Rectangle } from 'pixi.js'

import { click } from './click'

export default (entities) => {

    const stage = new Container()
    stage.alpha = 0
    stage.label = 'elements'
    s.viewport.addChild(stage)

    entities.forEach(e => {

        // Cross

        const length = 0.4      // original lenght = 1
        const tickness = 0.1     // original thickness = 0.2
        const color = Number(e.color)

        const line_1 = new Graphics()
        line_1.moveTo(e.x, e.y - length)
        line_1.lineTo(e.x, e.y + length)
        line_1.stroke({ width: tickness, color })
        stage.addChild(line_1)

        const line_2 = new Graphics()
        line_2.moveTo(e.x - length, e.y)
        line_2.lineTo(e.x + length, e.y)
        line_2.stroke({ width: tickness, color })
        stage.addChild(line_2)

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
        bitmap.position.set(e.x + .3, e.y + 0.1)  //(e.x + .6, e.y + 0.2)
        stage.addChild(bitmap)


        // Interaction

        bitmap.hitArea = new Rectangle(0, 0, bitmap.width, bitmap.height)
        bitmap.eventMode = 'static'
        bitmap.cursor = 'pointer'

        bitmap.on('pointertap', () => { click(e) }) // On click



    })

}