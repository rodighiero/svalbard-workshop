import { select } from 'd3'

const line = '—————————————'


export function click(e) {

    select('#focus').remove() // Delete previous focus

    const focus = select('body').append('div').attr('id', 'focus')


    // Heading

    focus.append('h2').html('Release Date: ' + e.year)
    focus.append('h2').html('Newspaper Tag/s: ' + e.tags)
    focus.append('p').html(line)
    focus.append('h1').html(e.title)
    focus.append('h2').html(e.subtitle)
    // focus.append('p').html(line)
    focus.append('h2').html(`<a href=https://www.svalbardposten.no${e.published_url} target="_blank">Reference Link</a>`)

}