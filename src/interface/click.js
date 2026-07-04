import { select } from 'd3'

// The station report: clicking an article's date opens a met-bulletin style
// readout — the year as a large instrument reading, the newspaper tags, then
// the headline, standfirst, and a link out to the source. The original text is
// Norwegian; prefer the English translations (*_en columns) when present, and
// fall back to the Norwegian originals otherwise.
export function click(e) {
    select('#focus').remove() // Replace any previous report

    const tags = e.tags_en || e.tags
    const title = e.title_en || e.title
    const subtitle = e.subtitle_en || e.subtitle

    const focus = select('body').append('div').attr('id', 'focus')

    focus.append('p').attr('class', 'eyebrow').text('Station report')
    focus.append('div').attr('class', 'readout-year').text(e.year)
    if (tags) focus.append('p').attr('class', 'readout-tags').text(tags)

    focus.append('hr')

    focus.append('h1').attr('class', 'readout-title').text(title)
    if (subtitle) focus.append('p').attr('class', 'readout-sub').text(subtitle)

    focus
        .append('a')
        .attr('class', 'readout-link')
        .attr('href', `https://www.svalbardposten.no${e.published_url}`)
        .attr('target', '_blank')
        .attr('rel', 'noopener')
        .text('Read on svalbardposten.no ↗')
}
