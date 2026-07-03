// Layer switches — a small panel of toggles that show/hide each viewport
// layer by flipping its `.visible`. Call after all layers are rendered so
// they can be located by their `.label`. Some layers expose nested
// sub-switches (e.g. the red/blue cluster subgroups).

const LAYERS = [
    { label: 'elements', name: 'Articles' },
    { label: 'fronts', name: 'Fronts' },
    {
        label: 'clusters',
        name: 'Clusters',
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
    return row
}

export default () => {
    const panel = document.createElement('div')
    panel.id = 'controls'

    const heading = document.createElement('h1')
    heading.textContent = 'Layers'
    panel.appendChild(heading)

    LAYERS.forEach(({ label, name, children }) => {
        const layer = findByLabel(s.viewport, label)
        if (!layer) return
        panel.appendChild(makeSwitch(layer, name, false))

        children?.forEach((sub) => {
            const subLayer = findByLabel(s.viewport, sub.label)
            if (subLayer) panel.appendChild(makeSwitch(subLayer, sub.name, true))
        })
    })

    document.body.appendChild(panel)
}
