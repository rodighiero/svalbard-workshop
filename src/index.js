// CSS is linked render-blocking in index.html (see main.css) so the overlay
// headings never flash at default sizes before styling loads.

// Libraries

import { csv, extent, min, scaleLinear } from 'd3'
import { Application, Assets } from 'pixi.js'
import { Viewport } from 'pixi-viewport'

// Modules

import background from './interface/background.js'
import clusters from './interface/clusters.js'
import contours from './interface/contours.js'
import elements from './interface/elements.js'
import fronts from './interface/fronts.js'

// Static assets live in public/ and are served verbatim (the Lato.fnt bitmap
// font references Lato.png by a stable, unhashed name, so it must not be bundled)

const base = import.meta.env.BASE_URL

// Set app — init runs concurrently with the asset loads below (it needs none
// of that data), overlapping renderer creation with network/decode latency.

const app = new Application()

// Load

Promise.all([
    csv(base + 'entities.csv'),
    Assets.load(base + 'Lato.fnt'), // Registers the 'Lato' bitmap font
    Assets.load(base + 'background.png'), // Returns a Texture
    app.init({
        antialias: true,
        resolution: 2,
        autoDensity: true,
        resizeTo: window,
        preserveDrawingBuffer: true,
    }),
]).then(([entities, , backgroundTexture]) => {
    // Lato.fnt result unused (loading registers the font)

    // Set dimensions

    const ext_X = extent(entities, (e) => parseInt(e.x))
    const ext_Y = extent(entities, (e) => parseInt(e.y))
    const margin = 150
    const smallerDimension = min([window.innerWidth, window.innerHeight])

    const scale_X = scaleLinear()
        .domain(ext_X)
        .range([margin, smallerDimension - margin])
    const scale_Y = scaleLinear()
        .domain(ext_Y)
        .range([margin, smallerDimension - margin])

    const marginTop =
        window.innerWidth > window.innerHeight ? 0 : (window.innerHeight - window.innerWidth) / 2
    const marginLeft =
        window.innerWidth < window.innerHeight ? 0 : (window.innerWidth - window.innerHeight) / 2

    // Parsing

    entities.map((e) => {
        e.x = marginLeft + parseInt(scale_X(e.x))
        e.y = marginTop + parseInt(scale_Y(e.y))
        e.color = '0x' + e.color.substring(1)
        return e
    })

    // Set variables

    window.s = {
        entities: entities,
        blue: 0x385da6,
        red: 0xa6242f,
        gray: 0x666666,
        contours: 0xcccccc,
    }

    // App is already initialized (see Promise.all above)

    s.app = app

    document.body.prepend(s.app.canvas)

    // Set viewport

    s.viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: window.innerWidth,
        worldHeight: window.innerHeight,
        events: s.app.renderer.events,
    })
        .drag()
        .pinch()
        .wheel()
        .decelerate()
        .clampZoom({
            minWidth: 50,
            minHeight: 50,
            maxWidth: window.innerWidth,
            maxHeight: window.innerHeight,
        })
        .clamp({ direction: 'all' })

    s.app.stage.addChild(s.viewport)

    // Transparency on zoom

    let scale
    const zoomOut = scaleLinear().domain([6, 1]).range([0, 1]) // Visible when zooming out
    const zoomIn = scaleLinear().domain([6, 1]).range([1, 0]) // Visible when zooming in

    // Distant-reading layers fade in when zooming out; per-article elements fade
    // in when zooming in. Layers are located by their .label (see each module).
    const fadeOut = ['fronts', 'clusters', 'contours']
    const fadeIn = ['elements']

    s.viewport.on('zoomed', (e) => {
        try {
            scale = e.viewport.lastViewport.scaleX
        } catch {
            scale = 1
        }

        const stage = (label) => e.viewport.children.find((child) => child.label == label)
        fadeOut.forEach((label) => (stage(label).alpha = zoomOut(scale)))
        fadeIn.forEach((label) => (stage(label).alpha = zoomIn(scale)))
    })

    // Rendering

    background(backgroundTexture)
    contours(entities)
    clusters(entities)
    elements(entities)
    fronts(entities)

    // Draw the first frame, then drop the loading cover so the map is already
    // visible the moment it's revealed (no flash of empty canvas).
    s.app.render()
    document.getElementById('loading')?.remove()

    // Viewport exceptions

    window.onresize = () => {
        s.viewport.resize()
    } // Prevent pinch gesture in Chrome

    window.addEventListener(
        'wheel',
        (e) => {
            e.preventDefault()
        },
        { passive: false },
    ) // Prevent wheel interference
})
