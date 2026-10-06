// Act 1, the mark. Runs on its own (no three.js), so it starts the moment the
// page loads while the PSP downloads in the background. main.js waits on
// window.MARK.done before moving to act 2.
//
// Your name rises in letter by letter (Instrument Serif Italic, the same face
// as the site's top menu). The full stop after "J." is the star: it pops in,
// orbits the name with a short trail, lands back in place with a squash and a
// burst of sparkles, and later opens up into the dark stage (main.js).
(() => {
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);
const SVGNS = 'http://www.w3.org/2000/svg';
const markName = $('mark-name');
const markRole = $('mark-role');
const dot = $('mark-dot');
const trailG = $('mark-trail');
const sparksG = $('mark-sparks');

// ---- split the name into letters; the full stop keeps its space but is
// drawn by the dot instead, and a zero-size probe marks the text baseline
const nameText = markName.textContent.trim();
markName.setAttribute('aria-label', nameText);
const stopAt = nameText.indexOf('.');
markName.innerHTML = [...nameText].map((c, i) => {
    const ch = c === ' ' ? '&nbsp;' : c;
    if (i === stopAt) return `<span class="ch-probe" aria-hidden="true"></span><span class="ch ch--stop" aria-hidden="true" style="--i:${i}">${ch}</span>`;
    return `<span class="ch" aria-hidden="true" style="--i:${i}">${ch}</span>`;
}).join('');
markName.classList.add('is-split');
const stopEl = markName.querySelector('.ch--stop');
const probe = markName.querySelector('.ch-probe');

// ---- where the full stop really sits: measure the glyph in the name's font
let glyph = { cx: 0.12, cy: -0.06, r: 0.055 };          // in em, refined once the font is in
const measureGlyph = () => {
    const cs = getComputedStyle(markName);
    const c = document.createElement('canvas').getContext('2d');
    c.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
    const m = c.measureText('.');
    const l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight;
    const a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
    if (r - -l > 0 && a + d > 0) glyph = { cx: (r - l) / 200, cy: -(a - d) / 200, r: Math.max(r + l, a + d) / 200 };
};
// home of the dot, in page px (the fx layer covers the whole mark)
const home = () => {
    const fs = parseFloat(getComputedStyle(markName).fontSize);
    const s = stopEl.getBoundingClientRect();
    const baseline = probe.getBoundingClientRect().top;
    // italic glyphs lean; the probe sits at the start of the full stop's box
    return { x: s.left + glyph.cx * fs, y: baseline + glyph.cy * fs, r: glyph.r * fs };
};
// the orbit: an ellipse round the whole name
const orbit = () => {
    const n = markName.getBoundingClientRect();
    return { cx: n.left + n.width / 2, cy: n.top + n.height / 2, rx: n.width / 2 + 34, ry: n.height / 2 + 28 };
};

const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const backOut = (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const place = (el, x, y, sx = 1, sy = sx) => el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`);

// out from home onto the ellipse, once round, and back home
const pathAt = (p, h, o) => {
    const dx = (h.x - o.cx) / o.rx, dy = (h.y - o.cy) / o.ry;
    const r0 = Math.hypot(dx, dy), th0 = Math.atan2(dy, dx);
    const th = th0 - p * Math.PI * 2;                     // anticlockwise: up and over the name first
    const s = r0 + (1 - r0) * Math.sin(Math.min(1, p * 4) * Math.PI / 2) * Math.sin(Math.min(1, (1 - p) * 4) * Math.PI / 2);
    return { x: o.cx + o.rx * s * Math.cos(th), y: o.cy + o.ry * s * Math.sin(th) };
};

const ghosts = [0.34, 0.22, 0.13, 0.07].map((o) => {
    const g = document.createElementNS(SVGNS, 'circle');
    g.setAttribute('r', '1');
    g.setAttribute('class', 'mark__ghost');
    g.style.opacity = '0';
    g.dataset.o = o;
    trailG.appendChild(g);
    return g;
});
const STAR = 'M0 -1 L0.22 -0.22 L1 0 L0.22 0.22 L0 1 L-0.22 0.22 L-1 0 L-0.22 -0.22Z';
const sparks = Array.from({ length: 9 }, (_, i) => {
    const s = document.createElementNS(SVGNS, 'path');
    s.setAttribute('d', STAR);
    s.setAttribute('class', 'mark__spark');
    s.style.opacity = '0';
    s.dataset.a = String(-Math.PI / 2 + (i / 9) * Math.PI * 2 + (i % 2 ? 0.2 : -0.1));
    s.dataset.r = String(i % 3 === 0 ? 5.5 : i % 3 === 1 ? 4.2 : 3);     // in dot radii
    s.dataset.k = String(i % 2 ? 0.75 : 1.1);
    sparksG.appendChild(s);
    return s;
});

// timeline (ms)
const T = reduced
    ? { name: 0, pop: 0, orbit: 0, orbitMs: 1, land: 0, role: 0, done: 700 }
    : { name: 120, pop: 1350, orbit: 1750, orbitMs: 1600, land: 3350, role: 2500, done: 4350 };
const markDone = new Promise((resolve) => {
    let t0 = 0;
    const tick = (now) => {
        const t = now - t0;
        const h = home();
        dot.setAttribute('r', h.r.toFixed(2));
        ghosts.forEach((g) => g.setAttribute('r', h.r.toFixed(2)));
        // pop in where the full stop goes
        if (t >= T.pop && t < T.orbit) {
            dot.style.opacity = '1';
            place(dot, h.x, h.y, backOut(clamp01((t - T.pop) / 420)));
        }
        // lift off and round the name, trailing ghosts
        if (t >= T.orbit && t < T.land) {
            const o = orbit();
            const p = inOut(clamp01((t - T.orbit) / T.orbitMs));
            const lift = Math.sin(p * Math.PI);
            const at = pathAt(p, h, o);
            dot.style.opacity = '1';
            place(dot, at.x, at.y, 1 + 0.35 * lift);
            ghosts.forEach((g, i) => {
                const q = inOut(clamp01((t - T.orbit - (i + 1) * 45) / T.orbitMs));
                const a = pathAt(q, h, o);
                g.style.opacity = String(Number(g.dataset.o) * lift);
                place(g, a.x, a.y, 1 + 0.3 * lift);
            });
        }
        // land with a squash, and burst
        if (t >= T.land) {
            const q = clamp01((t - T.land) / 380);
            const squash = Math.sin(q * Math.PI) * (1 - q);
            dot.style.opacity = '1';
            place(dot, h.x, h.y, 1 + 0.35 * squash, 1 - 0.3 * squash);
            ghosts.forEach((g) => { g.style.opacity = '0'; });
            const b = clamp01((t - T.land) / 750);
            sparks.forEach((s) => {
                const a = Number(s.dataset.a), r = Number(s.dataset.r) * h.r * (1 - Math.pow(1 - b, 3));
                const k = Number(s.dataset.k) * h.r * (1 - b * 0.7);
                s.style.opacity = String(b < 1 ? 1 - b : 0);
                s.setAttribute('transform', `translate(${(h.x + Math.cos(a) * r).toFixed(1)} ${(h.y + Math.sin(a) * r).toFixed(1)}) rotate(${(b * 90).toFixed(1)}) scale(${k.toFixed(2)})`);
            });
        }
        if (t < T.done) requestAnimationFrame(tick);
        else resolve();
    };
    // measure once the serif is in (it's preloaded, so this is quick)
    document.fonts.load('italic 400 64px "Instrument Serif"').catch(() => {}).finally(() => {
        measureGlyph();
        setTimeout(() => markName.classList.add('is-in'), T.name);
        setTimeout(() => markRole.classList.add('is-in'), T.role);
        requestAnimationFrame((now) => { t0 = now; requestAnimationFrame(tick); });
    });
});

window.MARK = { done: markDone, dot };
})();
