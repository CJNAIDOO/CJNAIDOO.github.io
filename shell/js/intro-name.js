// The loading screen: CAMERON J. NAIDOO in silver liquid metallic paint (metallic-paint.js), set
// in Prince Valiant, over polished liquid chrome on a dark studio (liquid-chrome.js, React Bits'
// LiquidChrome) that flows and ripples under the pointer. Both draw in workers, so the room loading
// on the page can't stall them. The name turns slightly as the room loads, then drifts towards you
// and fades into the room. Without WebGL2, createIntroName returns null and main.js shows the 2D
// name on the plain dark screen instead.
import { createMetallicPaint } from './metallic-paint.js?v=93';
import { createLiquidChrome } from './liquid-chrome.js?v=93';

export function createIntroName(host, { reduced = false } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'mark__paint';
    wrap.setAttribute('aria-hidden', 'true');
    host.appendChild(wrap);
    const linesFor = () => (innerWidth / innerHeight < 1.25 ? ['CAMERON J.', 'NAIDOO'] : ['CAMERON J. NAIDOO']);
    let lines = linesFor();
    wrap.classList.toggle('is-stacked', lines.length > 1);
    host.classList.toggle('is-stacked-name', lines.length > 1);
    // one worker for everything that moves here (intro-worker.js): the name, the chrome, the handwriting
    let shared = null;
    try {
        if (typeof OffscreenCanvas !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype) {
            shared = new Worker(new URL('./intro-worker.js?v=93', import.meta.url), { type: 'module' });
        }
    } catch { shared = null; }
    const paint = createMetallicPaint(wrap, {
        lines, fontFamily: "'Prince Valiant'", fontWeight: 400,
        scale: 1, density: 2, edgeBend: 0.85, dispersion: 0.3, distortion: 0.07, softness: 0.1,
        mouseTilt: 0.45, tiltTarget: host, intro: true,
        // drawn in a worker, so the room loading on the page can't stall it; 1x pixels (capped)
        worker: true, sharedWorker: shared, workerTag: 'paint', workerWait: 6000, dpr: 1, minRatio: 1, maxPixels: 1.4e6, fps: 60,
    });
    if (!paint) { wrap.remove(); return null; }
    paint.onReady(() => { host.classList.add('has-3d'); wrap.classList.add('is-in'); });

    // polished liquid chrome on a dark studio behind it all, and a soft dark pool behind the name
    host.classList.add('mark--chrome');
    const bg = document.createElement('div');
    bg.className = 'mark__chrome'; bg.setAttribute('aria-hidden', 'true');
    const veil = document.createElement('div');
    veil.className = 'mark__veil'; veil.setAttribute('aria-hidden', 'true');
    host.prepend(bg, veil);
    const chrome = createLiquidChrome(bg, { color: '#ffffff', worker: true, sharedWorker: shared, workerTag: 'chrome', maxDevicePixelRatio: 1.5, pixelBudget: 1.3e6 });

    // the role, written on like a white marker just under the name: set in The Overcook (a graffiti
    // hand, images/room/role-handwriting.svg has its letters as paths), each letter revealed by a
    // thick pen stroke running along it, one letter after another. The plain line stays for screen readers.
    const role = host.querySelector('.mark__role');
    const graf = document.createElement('div');
    graf.className = 'mark__graf'; graf.setAttribute('aria-hidden', 'true');
    host.appendChild(graf);
    host.classList.add('has-graf');
    let hw = null;                                    // the worker that draws it, when there is one
    const svgReady = fetch('images/room/role-handwriting.svg?v=93').then((r) => r.text()).then((svg) => {
        graf.innerHTML = svg;
        const pens = [...graf.querySelectorAll('.pen')];
        const lens = pens.map((p) => Math.ceil(p.getTotalLength()));
        const total = lens.reduce((a, b) => a + b, 0) || 1, line = 2.6;           // seconds for the whole line
        let at = 0;
        const timing = pens.map((p, k) => {
            const t = Math.max(0.12, (lens[k] / total) * line);
            p.style.setProperty('--len', lens[k]);
            p.style.setProperty('--d', `${at.toFixed(3)}s`);
            p.style.setProperty('--t', `${t.toFixed(3)}s`);
            const out = { d: at, t };
            at += t * 0.92;                                                       // the next letter starts as this one ends
            return out;
        });
        // drawn in a worker when it can be (OffscreenCanvas + Path2D), so the room build can't stall it;
        // otherwise the SVG above animates itself (CSS)
        try {
            if (typeof OffscreenCanvas === 'undefined' || !('transferControlToOffscreen' in HTMLCanvasElement.prototype)) return;
            const el = graf.querySelector('svg');
            const [, , W, H] = el.getAttribute('viewBox').split(/\s+/).map(Number);
            const asc = -Number(el.getAttribute('viewBox').split(/\s+/)[1]);
            const inks = [...graf.querySelectorAll('.ink path')];
            const glyphs = inks.map((p, k) => ({
                x: Number((p.getAttribute('transform') || '').match(/translate\(([-\d.]+)/)?.[1] || 0),
                dPath: p.getAttribute('d'), len: lens[k], d: timing[k].d, t: timing[k].t,
            }));
            const box = graf.getBoundingClientRect();
            const ratio = Math.min(devicePixelRatio || 1, 2);
            const w = Math.max(1, Math.round(box.width * ratio)), h = Math.max(1, Math.round(box.width * ratio * H / W));
            const canvas = document.createElement('canvas');
            canvas.className = 'graf__canvas';
            const off = canvas.transferControlToOffscreen();
            const own = !shared;
            const worker = shared || new Worker(new URL('./handwriting-worker.js?v=93', import.meta.url), { type: 'module' });
            const send = (m, t) => worker.postMessage(own ? m : { ...m, to: 'hand' }, t || []);
            const pen = Number(pens[0]?.getAttribute('stroke-width')) || 300;
            return new Promise((res) => {
                let done = false;
                const fail = () => { if (done && hw) return; done = true; if (own) worker.terminate(); canvas.remove(); graf.classList.remove('is-canvas'); hw = null; res(); };
                const onMsg = (e) => {
                    const d = e.data || {};
                    if (!own && d.from !== 'hand') return;
                    if (d.type === 'ready') { done = true; graf.appendChild(canvas); graf.classList.add('is-canvas'); hw = { post: send, own, worker }; res(); }
                    else if (d.type === 'fail') fail();
                };
                worker.addEventListener('message', onMsg);
                if (own) worker.onerror = fail;
                setTimeout(() => { if (!hw) fail(); }, 3000);
                // the ink: the line as a white paint marker (tools/role-ink.py), laid out like the SVG
                fetch('images/room/role-ink.png?v=93').then((r) => (r.ok ? r.blob() : null)).then((b) => (b ? createImageBitmap(b) : null)).catch(() => null).then((tex) => {
                    send({ type: 'init', canvas: off, w, h, W, asc, pen, color: '#f6f7fb', glyphs, tex }, tex ? [off, tex] : [off]);
                });
            });
        } catch { /* the SVG way */ }
    }).catch(() => { graf.remove(); host.classList.remove('has-graf'); });
    const write = () => svgReady.then(() => {
        if (hw) hw.post({ type: reduced ? 'finish' : 'start' });
        else graf.classList.add('is-on');
    });
    if (role) {
        const mo = new MutationObserver(() => { if (role.classList.contains('is-in')) { mo.disconnect(); write(); } });
        mo.observe(role, { attributes: true, attributeFilter: ['class'] });
        if (role.classList.contains('is-in')) write();
    } else write();

    const onResize = () => {
        const want = linesFor();
        if (want.length === lines.length) return;
        lines = want;
        wrap.classList.toggle('is-stacked', lines.length > 1);
        host.classList.toggle('is-stacked-name', lines.length > 1);
        paint.setLines(lines);
    };
    addEventListener('resize', onResize);

    // turning a little as the room loads, from a slight angle round to facing you: CSS transitions
    // and a CSS sway (shell/css/room.css), which the compositor runs even while the page is busy
    let target = 0;
    const turn = (p) => {
        wrap.style.setProperty('--ry', `${(reduced ? 0 : -16 * (1 - p)).toFixed(2)}deg`);
        wrap.style.setProperty('--rx', `${(reduced ? 0 : 4 * (1 - p)).toFixed(2)}deg`);
    };
    turn(0);
    let alive = true;
    const dispose = () => {
        if (!alive) return;
        alive = false;
        removeEventListener('resize', onResize);
        paint.destroy();
        chrome?.destroy();
        setTimeout(() => shared?.terminate(), 100);
        wrap.remove(); bg.remove(); veil.remove(); hw?.post({ type: 'destroy' }); if (hw?.own) hw.worker.terminate(); graf.remove(); host.classList.remove('has-graf');
    };
    return {
        get ready() { return paint.ready; },
        progress(p) {
            const t = Math.max(target, Math.min(1, p));
            if (t - target < 0.02 && t < 1) return;          // a step at a time: each one a smooth transition
            target = t; turn(t);
        },
        // held still while the room's being built and warmed up (the page is busy then anyway)
        pause(on) { paint.setPaused(on); },
        leave() {
            wrap.classList.add('is-leaving');
            bg.classList.add('is-leaving'); veil.classList.add('is-leaving'); graf.classList.add('is-leaving');
            return new Promise((r) => setTimeout(() => { dispose(); r(); }, reduced ? 10 : 950));
        },
        dispose,
    };
}

// the name in the top menu, after the room has loaded: the same paint, small
export function paintNavName(el) {
    if (!el || el.dataset.painted) return null;
    const box = document.createElement('span');
    box.className = 'sitenav__paint';
    box.setAttribute('aria-hidden', 'true');
    el.appendChild(box);
    const paint = createMetallicPaint(box, {
        lines: [el.textContent.trim()], fontFamily: "'Prince Valiant'", fontWeight: 400,
        scale: 0.98, density: 1.4, edgeBend: 0.75, dispersion: 0.22, distortion: 0.05,
        mouseTilt: 0.35, minRatio: 3, smallBlur: 0, intro: false, fps: 30, maxPixels: 4e5, worker: true,
    });
    if (!paint) { box.remove(); return null; }
    el.dataset.painted = '1';
    paint.onReady(() => el.classList.add('is-painted'));
    return paint;
}

// the controls (the back button, the volume, sound on/off) in the same liquid metal: the button's
// own shape, a pill or a rounded plate, painted under its label. Made once the control has a size
// (the volume starts hidden), and re-made when its shape changes (sound on -> sound off).
export function paintControl(el, { radius = 0.5 } = {}) {
    if (!el || el.dataset.painted) return null;
    el.dataset.painted = '1';
    const box = document.createElement('span');
    box.className = 'ctl-paint';
    box.setAttribute('aria-hidden', 'true');
    el.prepend(box);
    let paint = null, aspect = 0;
    const shape = () => {
        const r = box.getBoundingClientRect();
        const H = 256, W = Math.max(H, Math.round(H * (r.width / Math.max(1, r.height))));
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const g = c.getContext('2d'), pad = H * 0.07;
        g.fillStyle = '#000'; g.beginPath();
        g.roundRect(pad, pad, W - pad * 2, H - pad * 2, Math.min((H - pad * 2) / 2, (H - pad * 2) * radius));
        g.fill();
        return c;
    };
    const ro = new ResizeObserver(() => {
        const r = box.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        const a = r.width / r.height;
        if (!paint) {
            aspect = a;
            paint = createMetallicPaint(box, {
                shape, scale: 1, density: 1.6, edgeBend: 0.55, dispersion: 0.22, distortion: 0.06, softness: 0.12,
                mouseTilt: 0.4, intro: false, fps: 30, minRatio: 2, smallBlur: 0, maxPixels: 2e5, worker: true,
            });
            if (!paint) { box.remove(); ro.disconnect(); return; }
            paint.onReady(() => el.classList.add('is-painted'));
        } else if (Math.abs(a - aspect) / aspect > 0.04) { aspect = a; paint.setLines([]); }
    });
    ro.observe(box);
    return { get paint() { return paint; } };
}
