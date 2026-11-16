// The liquid-metal name drawn in a worker (metallic-paint.js, opts.worker): the page hands over
// its canvas and the name's pixels; the shading (a Poisson solve) and every frame happen here,
// so the loading screen keeps moving while the page is busy building the room.
import { createPaintCore, DEFAULTS } from './metallic-paint.js?v=93';

let core = null;
self.onmessage = (e) => {
    try { handle(e.data || {}); } catch (err) { self.postMessage({ type: 'error', message: String(err && err.stack || err) }); }
};
const handle = (m) => {
    if (m.type === 'init') {
        core = createPaintCore(m.canvas, { ...DEFAULTS, ...m.opts }, { onReady: () => self.postMessage({ type: 'ready' }) });
        if (!core) self.postMessage({ type: 'fail' });
        return;
    }
    if (!core) return;
    if (m.type === 'size') core.size(m.w, m.h);
    else if (m.type === 'pending') core.pending();
    else if (m.type === 'shape') core.shape(m.data);
    else if (m.type === 'tilt') core.tilt(m.x, m.y);
    else if (m.type === 'visible') core.visible(m.v);
    else if (m.type === 'hidden') core.hidden(m.h);
    else if (m.type === 'paused') core.paused(m.p);
    else if (m.type === 'destroy') { core.destroy(); core = null; }
};
