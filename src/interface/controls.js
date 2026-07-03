// Layer switches — a small panel of toggles that show/hide each viewport
// layer by flipping its `.visible`. Call after all layers are rendered so
// they can be located by their `.label`.

const LAYERS = [
    { label: 'elements', name: 'Articles' },
    { label: 'fronts', name: 'Fronts' },
    { label: 'clusters', name: 'Clusters' },
    { label: 'contours', name: 'Contours' },
    { label: 'background', name: 'Background' },
]

export default () => {
    const panel = document.createElement('div')
    panel.id = 'controls'

    const heading = document.createElement('h1')
    heading.textContent = 'Layers'
    panel.appendChild(heading)

    LAYERS.forEach(({ label, name }) => {
        const layer = s.viewport.children.find((child) => child.label === label)
        if (!layer) return

        const row = document.createElement('label')
        row.className = 'switch'

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
        panel.appendChild(row)
    })

    document.body.appendChild(panel)
}
