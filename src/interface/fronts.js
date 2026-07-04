import { Graphics, Container } from 'pixi.js'
import { polygonContains } from 'd3'
import { clusterGeometry } from './geometry.js'

// Two convex hulls overlap if either has a vertex inside the other.
const overlap = (a, b) =>
    a.some((p) => polygonContains(b, p)) || b.some((p) => polygonContains(a, p))

// Small 2D vector helpers.
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const len = (a) => Math.hypot(a[0], a[1])
const norm = (a) => {
    const l = len(a) || 1
    return [a[0] / l, a[1] / l]
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]

// Mean distance from a hull's vertices to its centre — a rough cluster radius,
// used to size the front to the pair it separates.
const radius = (hull, center) => {
    let sum = 0
    for (const [x, y] of hull) sum += Math.hypot(x - center[0], y - center[1])
    return sum / hull.length
}

// Quadratic Bézier point and derivative (tangent) at parameter u ∈ [0,1].
const bez = (p0, q, p2, u) => {
    const m = 1 - u
    return [m * m * p0[0] + 2 * m * u * q[0] + u * u * p2[0], m * m * p0[1] + 2 * m * u * q[1] + u * u * p2[1]]
}
const bezD = (p0, q, p2, u) => {
    const m = 1 - u
    return [2 * m * (q[0] - p0[0]) + 2 * u * (p2[0] - q[0]), 2 * m * (q[1] - p0[1]) + 2 * u * (p2[1] - q[1])]
}

const LINE_WIDTH = 1 // the front's base line
const PIP_R = 2.2 // semicircle radius — the same on every front (no scaling)
const PIP_STEP = PIP_R * 3 // centre-to-centre spacing, leaving a gap between pips
const BOW = 0.22 // curve bow, as a fraction of the chord length
const SEG = 10 // semicircle tessellation
const RED = 0xcc6b73 // a lighter red than the map's High red, softer for fronts

// A semicircle of radius r at C, its diameter along unit `t`, bulging toward
// unit `n`. Built explicitly (not via arc) so the bulge side is unambiguous as
// the curve bends: p(θ) = C + r(cosθ·t + sinθ·n), θ ∈ [0, π].
const semicircle = (g, C, t, n, r) => {
    g.moveTo(C[0] + r * t[0], C[1] + r * t[1])
    for (let i = 1; i <= SEG; i++) {
        const th = (Math.PI * i) / SEG
        const c = Math.cos(th)
        const sn = Math.sin(th)
        g.lineTo(C[0] + r * (c * t[0] + sn * n[0]), C[1] + r * (c * t[1] + sn * n[1]))
    }
    g.closePath()
    g.fill({ color: RED })
}

// A warm front: emerging (warm/red) discourse advancing into the space vacated
// by receding (cold/blue) discourse — the only direction this map runs. A red
// curve spans `mid ± along·half`, bowed toward the warm cluster for a dynamic
// shape but shifted so the curve's own midpoint stays exactly at `mid` (the
// centre between the two labels), carrying evenly spaced red semicircles that
// follow the curve and bulge toward the cold side (the direction of advance).
// Drawn in world coordinates on the shared Graphics `g`.
const drawFront = (g, mid, along, half, warmCenter) => {
    const cn = norm(sub(warmCenter, mid)) // toward warm; the bow direction

    // Endpoints of the (straight) chord, then a bow of ±(BOW·length) split
    // symmetrically: pull the endpoints one way and the control point the other,
    // so the Bézier's midpoint B(0.5) lands back on `mid`.
    const bow = BOW * half // half the chord length is `half`
    const P1 = [mid[0] - along[0] * half + cn[0] * bow, mid[1] - along[1] * half + cn[1] * bow]
    const P2 = [mid[0] + along[0] * half + cn[0] * bow, mid[1] + along[1] * half + cn[1] * bow]
    const Q = [mid[0] - cn[0] * bow, mid[1] - cn[1] * bow]

    // Base curve.
    g.moveTo(P1[0], P1[1])
    g.quadraticCurveTo(Q[0], Q[1], P2[0], P2[1])
    g.stroke({ width: LINE_WIDTH, color: RED, alpha: 0.9 })

    // Arc-length table, so the semicircles keep a fixed spacing along the curve.
    const N = 80
    const cum = [0]
    let prev = bez(P1, Q, P2, 0)
    for (let i = 1; i <= N; i++) {
        const p = bez(P1, Q, P2, i / N)
        cum.push(cum[i - 1] + len(sub(p, prev)))
        prev = p
    }
    const L = cum[N] || 1

    // Evenly spaced semicircles that follow the curve and bulge toward the cold
    // side (the direction of advance).
    const count = Math.max(1, Math.round(L / PIP_STEP))
    const spacing = L / count
    for (let k = 0; k < count; k++) {
        const target = (k + 0.5) * spacing
        let i = 1
        while (i < N && cum[i] < target) i++
        const u = (i - 1 + (target - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)) / N

        const C = bez(P1, Q, P2, u)
        const t = norm(bezD(P1, Q, P2, u))
        let n = [-t[1], t[0]]
        if (dot(n, sub(warmCenter, C)) > 0) n = [-n[0], -n[1]] // bulge toward cold
        semicircle(g, C, t, n, PIP_R)
    }
}

export default (entities) => {
    const stage = new Container()
    stage.interactiveChildren = false
    stage.label = 'fronts'
    s.viewport.addChild(stage) // on by default; toggled independently of fills/labels

    const g = new Graphics()
    stage.addChild(g)

    const geoms = clusterGeometry(entities)

    // A front marks the friction between emerging and receding discourse: one for
    // each red↔blue pair whose blobs overlap, along the contact between them.
    for (let i = 0; i < geoms.length; i++) {
        for (let j = i + 1; j < geoms.length; j++) {
            const c1 = geoms[i]
            const c2 = geoms[j]
            if (c1.key === c2.key) continue // opposite colours only
            if (!overlap(c1.expanded, c2.expanded)) continue

            const warm = c1.key === 'red' ? c1 : c2
            const cold = c1.key === 'red' ? c2 : c1

            // The front runs orthogonally to the axis between the two cluster
            // centres, centred on the midpoint between them (i.e. exactly between
            // the two labels). Its length is set by the clusters' own size, not by
            // their overlap area.
            const axis = norm(sub(warm.center, cold.center))
            const along = [-axis[1], axis[0]] // perpendicular to that axis
            const mid = [(c1.center[0] + c2.center[0]) / 2, (c1.center[1] + c2.center[1]) / 2]
            const half = 0.7 * Math.min(radius(warm.hull, warm.center), radius(cold.hull, cold.center))

            drawFront(g, mid, along, half, warm.center)
        }
    }
}
