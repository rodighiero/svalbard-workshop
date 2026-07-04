// Layer switches — a small panel of toggles that show/hide each viewport
// layer by flipping its `.visible`. Call after all layers are rendered so they
// can be located by their `.label`. Some layers expose nested sub-switches
// (Clusters splits into independently toggleable Fills, Labels, and Fronts).
// The panel also holds zoom and "Reset view" controls.

const LAYERS = [
    {
        label: 'elements',
        name: 'Articles',
        children: [{ label: 'elements-years', name: 'Years' }],
    },
    {
        label: 'clusters',
        name: 'Clusters',
        children: [
            { label: 'clusters-fills', name: 'Fills' },
            { label: 'clusters-labels', name: 'Labels' },
            // Front curves only — off by default; combine with Labels (and no
            // Fills) to read the fronts and their topic labels alone.
            { label: 'fronts', name: 'Fronts' },
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

export default () => {
    const panel = document.createElement('div')
    panel.id = 'controls'

    const heading = document.createElement('p')
    heading.className = 'eyebrow'
    heading.textContent = 'Chart layers'
    panel.appendChild(heading)

    LAYERS.forEach(({ label, name, children }) => {
        const layer = findByLabel(s.viewport, label)
        if (!layer) return
        panel.appendChild(makeSwitch(layer, name, false).row)

        children?.forEach((sub) => {
            const subLayer = findByLabel(s.viewport, sub.label)
            if (!subLayer) return
            panel.appendChild(makeSwitch(subLayer, sub.name, true).row)
        })
    })

    // View controls. Snapshot the initial camera now (before any user
    // interaction) so Reset can jump back to it. Reset directly (not via the
    // animate plugin) since this app renders on demand rather than per-frame.
    const home = { scale: s.viewport.scale.x, x: s.viewport.center.x, y: s.viewport.center.y }
    const zoomBy = (factor) => {
        s.viewport.setZoom(s.viewport.scale.x * factor, true) // clampZoom bounds it
        s.app.render()
    }

    const button = (text, className, aria, onClick) => {
        const b = document.createElement('button')
        b.textContent = text
        b.className = className
        if (aria) b.setAttribute('aria-label', aria)
        b.addEventListener('click', onClick)
        return b
    }

    const section = document.createElement('p')
    section.className = 'section'
    section.textContent = 'View'
    panel.appendChild(section)

    const row = document.createElement('div')
    row.className = 'view-controls'
    row.append(
        button('–', 'zoom-btn', 'Zoom out', () => zoomBy(1 / 1.4)),
        button('Reset', 'reset-btn', null, () => {
            s.viewport.setZoom(home.scale, true)
            s.viewport.moveCenter(home.x, home.y)
            s.app.render()
        }),
        button('+', 'zoom-btn', 'Zoom in', () => zoomBy(1.4)),
    )
    panel.appendChild(row)

    document.body.appendChild(panel)
}
