import { select } from 'd3'

// The station report: clicking an article's date opens a met-bulletin style
// readout — the year as a large instrument reading, the newspaper tags, then
// the headline, standfirst, and a link out to the source.
export function click(e) {
    select('#focus').remove() // Replace any previous report

    const focus = select('body').append('div').attr('id', 'focus')

    focus.append('p').attr('class', 'eyebrow').text('Station report')
    focus.append('div').attr('class', 'readout-year').text(e.year)
    if (e.tags) focus.append('p').attr('class', 'readout-tags').text(e.tags)

    focus.append('hr')

    focus.append('h1').attr('class', 'readout-title').text(e.title)
    if (e.subtitle) focus.append('p').attr('class', 'readout-sub').text(e.subtitle)

    focus
        .append('a')
        .attr('class', 'readout-link')
        .attr('href', `https://www.svalbardposten.no${e.published_url}`)
        .attr('target', '_blank')
        .attr('rel', 'noopener')
        .text('Read on svalbardposten.no ↗')
}
