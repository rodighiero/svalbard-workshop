import { Point } from 'pixi.js'
import autoComplete from '@tarekraafat/autocomplete.js'

export default (entities) => {

    // Data

    const dataSearch = entities.map(e => ({
        name: e.title, x: e.x, y: e.y,
    }))

    // The autoComplete.js Engine instance creator

    const autoCompletejs = new autoComplete({

        data: {
            src: dataSearch,
            keys: ['name'],
            cache: true
        },
        diacritics: true, // Match Norwegian ø/æ/å regardless of accents
        sort: (a, b) => {
            if (a.match < b.match) return -1
            if (a.match > b.match) return 1
            return 0
        },
        placeHolder: 'Search',
        maxResults: 20,
        onSelection: feedback => {

            const node = feedback.selection.value
            const { x, y, name } = node
            const center = { x: s.viewport.center.x, y: s.viewport.center.y }

            document.querySelector("#autoComplete").value = name

            // Zooming from distant to close

            const zoomIn = () => s.viewport.animate({
                scale: 10,
                position: new Point(x, y),
                time: 1000,
                ease: 'easeInOutSine',
            })

            // Zooming from close to close

            const zoomOutIn = () => s.viewport.animate({
                scale: 1,
                position: new Point((x + center.x) / 2, (y + center.y) / 2),
                time: 1000,
                ease: 'easeInOutSine',
                callbackOnComplete: () => {
                    s.viewport.animate({
                        scale: 10,
                        position: new Point(x, y),
                        time: 1000,
                        ease: 'easeInOutSine',
                    })
                }
            })

            if (s.viewport.scale.x < 10)
                zoomIn()
            else
                zoomOutIn()


        }
    })

}