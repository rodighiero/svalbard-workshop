// Layer switches — a small panel of toggles that show/hide each viewport
// layer by flipping its `.visible`. Call after all layers are rendered so
// they can be located by their `.label`. Some layers expose nested
// sub-switches (e.g. the red/blue cluster subgroups). The panel also holds a
// "Reset view" button that animates the camera back to its initial framing.

const LAYERS = [
    { label: 'elements', name: 'Articles' },
    { label: 'fronts', name: 'Fronts' },
    {
        label: 'clusters',
        name: 'Clusters',
        // The red/blue subgroups can't both be off: turning one off while the
        // other is already off flips the other back on.
        atLeastOneChild: true,
        children: [
            { label: 'clusters-red', name: 'Red (emerging)' },
            { label: 'clusters-blue', name: 'Blue (receding)' },
        ],
    },
    { label: 'contours', name: 'Contours' },
]

// Depth-first search for a labelled display object (sub-switches live nested
// inside their parent layer, not directly on the viewport).
const findByLabel = (node, label) => {
    if (node.label === label) return node
    for (const child of node.children ?? []) {
        const found = findByLabel(child, label)
        if (found) return found
    }
    return null
}

const makeSwitch = (layer, name, sub) => {
    const row = document.createElement('label')
    row.className = sub ? 'switch sub' : 'switch'

    const input = document.createElement('input')
    input.type = 'checkbox'
    input.checked = layer.visible
    input.addEventListener('change', () => {
        layer.visible = input.checked
    })

    const slider = document.createElement('span')
    slider.className = 'slider'

    const text = document.createElement('span')
    text.className = 'switch-label'
    text.textContent = name

    row.append(input, slider, text)
    return { row, input, layer }
}

// Keep at least one switch in a group active: if turning one off leaves the
// whole group off, turn the others back on.
const keepOneActive = (group) => {
    group.forEach((control) => {
        control.input.addEventListener('change', () => {
            if (control.input.checked) return
            if (!group.every((g) => !g.input.checked)) return
            group
                .filter((g) => g !== control)
                .forEach((g) => {
                    g.input.checked = true
                    g.layer.visible = true // setting .checked doesn't fire change
                })
        })
    })
}

export default () => {
    const panel = document.createElement('div')
    panel.id = 'controls'

    const heading = document.createElement('h1')
    heading.textContent = 'Layers'
    panel.appendChild(heading)

    LAYERS.forEach(({ label, name, children, atLeastOneChild }) => {
        const layer = findByLabel(s.viewport, label)
        if (!layer) return
        panel.appendChild(makeSwitch(layer, name, false).row)

        const group = []
        children?.forEach((sub) => {
            const subLayer = findByLabel(s.viewport, sub.label)
            if (!subLayer) return
            const control = makeSwitch(subLayer, sub.name, true)
            panel.appendChild(control.row)
            group.push(control)
        })

        if (atLeastOneChild && group.length > 1) keepOneActive(group)
    })

    // Snapshot the initial camera now (before any user interaction) and jump
    // back to it when the button is clicked. Reset directly (not via the
    // animate plugin) since this app renders on demand rather than per-frame.
    const home = { scale: s.viewport.scale.x, x: s.viewport.center.x, y: s.viewport.center.y }
    const reset = document.createElement('button')
    reset.textContent = 'Reset view'
    reset.addEventListener('click', () => {
        s.viewport.setZoom(home.scale, true)
        s.viewport.moveCenter(home.x, home.y)
        s.app.render()
    })
    panel.appendChild(reset)

    document.body.appendChild(panel)
}
