// CSS is linked render-blocking in index.html (see main.css) so the overlay
// headings never flash at default sizes before styling loads.

// Libraries

import { csv, extent, min, scaleLinear, group } from 'd3'
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
]).then(([allEntities]) => {
    // Only the CSV result is used; Lato.fnt loads for its side effect (font
    // registration) and app.init() returns nothing.

    // Drop detached clusters: any whose centroid is a far outlier (> 2σ from the
    // overall centroid — e.g. "Holiday Giveaways Events", which sits alone far to
    // one side) is cut from the visualization so it doesn't clutter the view or
    // squeeze the main body. Detected by distance, not a hardcoded id, so a data
    // regeneration is fine.
    const clustered = allEntities.filter((e) => e.cluster !== '-1')
    const avg = (arr, key) => arr.reduce((a, e) => a + parseInt(e[key]), 0) / arr.length
    const cx = avg(clustered, 'x')
    const cy = avg(clustered, 'y')

    const distances = [...group(clustered, (e) => e.cluster)].map(([id, members]) => ({
        id,
        d: Math.hypot(avg(members, 'x') - cx, avg(members, 'y') - cy),
    }))
    const dMean = distances.reduce((a, c) => a + c.d, 0) / distances.length
    const dStd = Math.sqrt(distances.reduce((a, c) => a + (c.d - dMean) ** 2, 0) / distances.length)
    const detached = new Set(distances.filter((c) => c.d > dMean + 2 * dStd).map((c) => c.id))

    const entities = allEntities.filter((e) => !detached.has(e.cluster))

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

    // Set viewport — sized from the renderer's screen (kept in sync by the
    // app's resizeTo: window). events + ticker come from the app.

    const { width, height } = s.app.screen

    s.viewport = new Viewport({
        screenWidth: width,
        screenHeight: height,
        worldWidth: width,
        worldHeight: height,
        events: s.app.renderer.events,
    })
        .drag()
        .pinch()
        .wheel()
        .decelerate()
        // Zoom is bounded, but panning is free: the contours/blobs spill past the
        // article extent, so a world-bounds clamp would hide that overhang. Use
        // the Reset view button to recenter.
        .clampZoom({ minWidth: 50, minHeight: 50, maxWidth: width, maxHeight: height })

    s.app.stage.addChild(s.viewport)

    // Start slightly zoomed in on the map's center (the default scale of 1 fits
    // the whole world; this tightens the initial framing). Captured as the
    // "home" view by controls(), so Reset view returns here.
    s.viewport.setZoom(1.3, true)

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

    // Keep the viewport in sync with the auto-resized canvas, and re-draw (the
    // app renders on demand). The wheel handler stops the browser from zooming
    // the page when the pointer is over the map.
    window.addEventListener('resize', () => {
        const { width, height } = s.app.screen
        s.viewport.resize(width, height, width, height)
        s.app.render()
    })
    window.addEventListener('wheel', (e) => e.preventDefault(), { passive: false })
})
