// CSS

import 'css-reset-and-normalize/css/reset-and-normalize.min.css'
import './assets/main.css'

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
import keywords from './interface/keywords.js'

// Static assets live in public/ and are served verbatim (the Lato.fnt bitmap
// font references Lato.png by a stable, unhashed name, so it must not be bundled)

const base = import.meta.env.BASE_URL

// Load

Promise.all([
    csv(base + 'entities.csv'),
    Assets.load(base + 'Lato.fnt'),        // Registers the 'Lato' bitmap font
    Assets.load(base + 'background.png'),  // Returns a Texture

]).then(async ([entities, fontLato, backgroundTexture]) => {


    // Set dimensions

    const ext_X = extent(entities, e => parseInt(e.x))
    const ext_Y = extent(entities, e => parseInt(e.y))
    const margin = 150
    const smallerDimension = min([window.innerWidth, window.innerHeight])

    const scale_X = scaleLinear().domain(ext_X).range([margin, smallerDimension - margin])
    const scale_Y = scaleLinear().domain(ext_Y).range([margin, smallerDimension - margin])

    const marginTop = window.innerWidth > window.innerHeight ? 0 : (window.innerHeight - window.innerWidth) / 2
    const marginLeft = window.innerWidth < window.innerHeight ? 0 : (window.innerWidth - window.innerHeight) / 2


    // Parsing

    entities.map(e => {
        e.x = marginLeft + parseInt(scale_X(e.x))
        e.y = marginTop + parseInt(scale_Y(e.y))
        e.color = '0x' + e.color.substring(1)
        return e
    })


    // Set variables

    window.s = {
        'entities': entities,
        'bitmaps': [], // Collector of bitmaps for overlapping
        'blue': 0x385DA6,
        'red': 0xA6242F,
        'gray': 0x666666,
        'contours': 0xCCCCCC,
    }

    // Set app

    s.app = new Application()
    await s.app.init({
        antialias: true,
        resolution: 2, // Interface
        // resolution: 8, // Canvas export
        autoDensity: true,
        resizeTo: window,
        preserveDrawingBuffer: true,
    })

    document.body.prepend(s.app.canvas)


    // Set viewport

    s.viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: window.innerWidth,
        worldHeight: window.innerHeight,
        events: s.app.renderer.events
    }).drag().pinch().wheel().decelerate()
        .clampZoom({
            minWidth: 50, minHeight: 50,
            maxWidth: window.innerWidth,
            maxHeight: window.innerHeight
        })
        .clamp({ direction: 'all' })

    s.app.stage.addChild(s.viewport)


    // Transparency on zoom

    let scale
    const zoomOut = scaleLinear().domain([6, 1]).range([0, 1]) // Visible when zooming out
    const zoomIn = scaleLinear().domain([6, 1]).range([1, 0]) // Visible when zooming in

    s.viewport.on('zoomed', e => {

        try { scale = e.viewport.lastViewport.scaleX } catch { scale = 1 }

        e.viewport.children.find(child => child.label == 'fronts').alpha = zoomOut(scale)
        e.viewport.children.find(child => child.label == 'clusters').alpha = zoomOut(scale)
        e.viewport.children.find(child => child.label == 'contours').alpha = zoomOut(scale)
        e.viewport.children.find(child => child.label == 'keywords').alpha = zoomOut(scale)

        e.viewport.children.find(child => child.label == 'elements').alpha = zoomIn(scale)
    })


    // Rendering

    background(backgroundTexture)
    contours(entities)
    keywords(entities)
    clusters(entities)
    elements(entities)
    fronts(entities)


    // Viewport exceptions

    window.onresize = () => {
        s.viewport.resize()
    } // Prevent pinch gesture in Chrome

    window.addEventListener('wheel', e => {
        e.preventDefault()
    }, { passive: false }) // Prevent wheel interference

})

// Canvas Export
/*


a = document.createElement("a");
canvas = document.getElementsByTagName("canvas")[0]

function saveCanvas() {
  a.href = canvas.toDataURL();
  a.download = "image.png";
  a.click();
  a.remove();
  
}

setTimeout(saveCanvas, 100)


*/