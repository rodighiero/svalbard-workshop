// CSS is linked render-blocking in index.html (see main.css) so the overlay
// headings never flash at default sizes before styling loads.

// Libraries

import { csv, extent, min, scaleLinear } from 'd3'
import { Application, Assets } from 'pixi.js'
import { Viewport } from 'pixi-viewport'

// Modules

import clusters from './interface/clusters.js'
import contours from './interface/contours.js'
import controls from './interface/controls.js'
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
    app.init({
        antialias: true,
        resolution: 2,
        autoDensity: true,
        resizeTo: window,
        preserveDrawingBuffer: true,
        backgroundAlpha: 0, // Transparent canvas so the white page shows through
    }),
]).then(([entities]) => {
    // Only the CSV result is used; Lato.fnt loads for its side effect (font
    // registration) and app.init() returns nothing.

    // Set dimensions

    const ext_X = extent(entities, (e) => parseInt(e.x))
    const ext_Y = extent(entities, (e) => parseInt(e.y))
    const smallerDimension = min([window.innerWidth, window.innerHeight])

    const scale_X = scaleLinear().domain(ext_X).range([0, smallerDimension])
    const scale_Y = scaleLinear().domain(ext_Y).range([0, smallerDimension])

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

    // Rendering

    contours(entities)
    clusters(entities)
    elements(entities)
    fronts(entities)

    // Layer show/hide switches (reads the rendered layers by their .label)
    controls()

    // Draw the first frame, then fade the loading cover out to reveal the map
    // (the map is already painted underneath, so it's a clean crossfade). The
    // canvas stays fully visible throughout, so a slow timer can never leave
    // the map hidden — worst case the cover lingers a moment longer.
    s.app.render()
    const loading = document.getElementById('loading')
    if (loading) {
        loading.style.opacity = '0'
        setTimeout(() => loading.remove(), 700)
    }

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
