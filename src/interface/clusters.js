import { BitmapText, Container, Graphics } from 'pixi.js'
import { clusterGeometry, paintBlob } from './geometry.js'

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
    s.viewport.addChild(stage)

    // Red (emerging) and blue (receding) subgroups toggle independently; each is
    // a labelled Container holding its own hull Graphics plus its labels.
    const groups = { red: new Container(), blue: new Container() }
    groups.red.label = 'clusters-red'
    groups.blue.label = 'clusters-blue'
    const graphics = { red: new Graphics(), blue: new Graphics() }
    groups.red.addChild(graphics.red)
    groups.blue.addChild(graphics.blue)
    stage.addChild(groups.red, groups.blue)

    clusterGeometry(entities).forEach((c) => {
        paintBlob(graphics[c.key], c.expanded, c.color)

        const bitmap = new BitmapText({
            text: splitInTwo(c.subject),
            style: {
                fontFamily: 'Lato',
                fontSize: 4, //5
                align: 'center',
            },
        })
        bitmap.tint = c.key === 'red' ? 0xff0000 : 0x0000ff
        bitmap.position.set(c.center[0] - bitmap.width / 2, c.center[1] - bitmap.height / 2)
        groups[c.key].addChild(bitmap)
    })
}
