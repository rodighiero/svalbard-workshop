import { Container, Graphics } from 'pixi.js'
import { clusterGeometry, paintBlob, makeLabel, deconflictLabels } from './geometry.js'

export default (entities) => {
    const stage = new Container()
    stage.interactiveChildren = false
    stage.label = 'clusters'
    s.viewport.addChild(stage)

    // Fills and labels are independent layers so they can be toggled separately
    // (e.g. labels alone, alongside the fronts). The fill Graphics holds every
    // blob — each paintBlob commits with its own red/blue tint.
    const fills = new Graphics()
    fills.label = 'clusters-fills'
    const labels = new Container()
    labels.label = 'clusters-labels'
    stage.addChild(fills, labels)

    const labelList = []
    clusterGeometry(entities).forEach((c) => {
        paintBlob(fills, c.expanded, c.color)
        const label = makeLabel(c)
        labels.addChild(label)
        labelList.push(label)
    })

    // Nudge overlapping labels apart before they're drawn.
    deconflictLabels(labelList)
}
