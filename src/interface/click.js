import { select } from 'd3'

// The station report: clicking an article opens a met-bulletin style readout,
// grouped by source — an "Article" block (what Svalbardposten published: date,
// headline, standfirst, byline, tags, length) then an "Analysis" block (what
// the Weather Map pipeline derived: High/Low system, cluster topic, keywords),
// with a link out to the source. The original text is Norwegian; prefer the
// English translations (*_en columns) when present, else the originals.
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

// "Last, First" → "First Last" for a natural byline; pass through anything
// that isn't in that shape.
function formatByline(name) {
    if (!name) return ''
    const parts = name.split(',')
    return parts.length === 2 ? `${parts[1].trim()} ${parts[0].trim()}` : name.trim()
}

export function click(e) {
    select('#focus').remove() // Replace any previous report

    const tags = e.tags_en || e.tags
    const title = e.title_en || e.title
    const subtitle = e.subtitle_en || e.subtitle
    const keywords = e.top_keywords_en || e.top_keywords
    const byline = formatByline(e.created_by_name)
    const day = parseInt(e.day)
    const date = day && e.month ? `${day} ${MONTHS[parseInt(e.month) - 1]} ${e.year}` : e.year
    // temperature keys the weather metaphor: warm (>0) = High/emerging, else Low.
    const system = parseFloat(e.temperature) > 0 ? 'High' : 'Low'
    const systemClass = parseFloat(e.temperature) > 0 ? 'hi' : 'lo'

    const focus = select('body').append('div').attr('id', 'focus')

    // Content is grouped by source: what the newspaper published (Article) and
    // what the Weather Map pipeline derived from it (Analysis).
    const section = (label) => focus.append('p').attr('class', 'section').text(label)

    // Labelled term lines — "Tags: a, b, c" / "Keywords: a, b, c".
    const termLine = (label, value) => {
        if (!value) return
        const p = focus.append('p').attr('class', 'readout-terms')
        p.append('span').attr('class', 'readout-terms-label').text(`${label}: `)
        p.append('span').text(value)
    }

    // Instrument readings — label/value pairs in a compact grid.
    const readings = (pairs) => {
        const meta = focus.append('dl').attr('class', 'readout-meta')
        pairs.forEach(([label, value, valueClass]) => {
            if (!value) return
            meta.append('dt').text(label)
            meta.append('dd').attr('class', valueClass || null).text(value)
        })
    }

    // From the article (Svalbardposten) — date + title lead.
    section('Article')
    focus.append('p').attr('class', 'readout-date').text(date)
    focus.append('h1').attr('class', 'readout-title').text(title)
    if (subtitle) focus.append('p').attr('class', 'readout-sub').text(subtitle)
    readings([
        ['Byline', byline],
        ['Length', e.word_count && `${e.word_count} words`],
    ])
    termLine('Tags', tags)

    // From the analysis (Weather Map pipeline) — derived placement/topic.
    section('Analysis')
    readings([
        ['System', system, systemClass],
        ['Topic', e.cluster_subject_x],
    ])
    termLine('Keywords', keywords && keywords.replace(/[[\]']/g, ''))

    focus
        .append('a')
        .attr('class', 'readout-link')
        .attr('href', `https://www.svalbardposten.no${e.published_url}`)
        .attr('target', '_blank')
        .attr('rel', 'noopener')
        .text('Read on svalbardposten.no ↗')
}

// Close the station report — used when the user clicks empty map (deselect).
export function deselect() {
    select('#focus').remove()
}
