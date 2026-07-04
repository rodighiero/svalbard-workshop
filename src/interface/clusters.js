import { Container, Graphics } from 'pixi.js'
import { clusterGeometry, paintBlob, makeLabel } from './geometry.js'

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
        groups[c.key].addChild(makeLabel(c))
    })
}
