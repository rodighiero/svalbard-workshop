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
    fills.visible = false // off by default; the fronts read on their own
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

    // Nudge labels apart before they're drawn. The generous padding keeps a gap
    // between neighbours so the fronts running between clusters have room; the
    // extra iterations let the (now larger) labels fully settle to no overlap.
    deconflictLabels(labelList, { padding: 4, iterations: 200 })
}
