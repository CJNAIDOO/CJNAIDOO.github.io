// One worker for everything that moves on the loading screen (intro-name.js): the name in liquid
// metallic paint, the liquid chrome behind it and the handwritten line under it each draw on their
// own OffscreenCanvas here, so the page building the room can't stall any of them. Messages carry
// `to` (paint | chrome | hand); replies carry `from`.
import { createPaintCore, DEFAULTS as PAINT_DEFAULTS } from './metallic-paint.js?v=93';
import { createChromeCore } from './liquid-chrome.js?v=93';
import { createHandwriting } from './handwriting-core.js?v=93';

const reply = (from, m) => self.postMessage({ ...m, from });
let paint = null, chrome = null, hand = null;

const toPaint = (m) => {
    if (m.type === 'init') {
        paint = createPaintCore(m.canvas, { ...PAINT_DEFAULTS, ...m.opts }, { onReady: () => reply('paint', { type: 'ready' }) });
        if (!paint) reply('paint', { type: 'fail' });
        return;
    }
    if (!paint) return;
    if (m.type === 'size') paint.size(m.w, m.h);
    else if (m.type === 'pending') paint.pending();
    else if (m.type === 'shape') paint.shape(m.data);
    else if (m.type === 'tilt') paint.tilt(m.x, m.y);
    else if (m.type === 'visible') paint.visible(m.v);
    else if (m.type === 'hidden') paint.hidden(m.h);
    else if (m.type === 'paused') paint.paused(m.p);
    else if (m.type === 'destroy') { paint.destroy(); paint = null; }
};
const toChrome = (m) => {
    if (m.type === 'init') { chrome = createChromeCore(m.canvas, m.opts); return; }
    if (!chrome) return;
    if (m.type === 'resize') chrome.resize(m.w, m.h, m.dpr);
    else if (m.type === 'move') chrome.move(m.fx, m.fy);
    else if (m.type === 'down') chrome.down(m.fx, m.fy);
    else if (m.type === 'leave') chrome.leave();
    else if (m.type === 'visible') chrome.visible(m.v);
    else if (m.type === 'paused') chrome.paused(m.p);
    else if (m.type === 'destroy') { chrome.destroy(); chrome = null; }
};
const toHand = (m) => {
    if (m.type === 'init') { hand = createHandwriting(m); reply('hand', { type: hand ? 'ready' : 'fail' }); return; }
    if (!hand) return;
    if (m.type === 'start') hand.start(m.delay || 0);
    else if (m.type === 'finish') hand.finish();
    else if (m.type === 'destroy') { hand.destroy(); hand = null; }
};

self.onmessage = (e) => {
    const m = e.data || {};
    try {
        if (m.to === 'paint') toPaint(m);
        else if (m.to === 'chrome') toChrome(m);
        else if (m.to === 'hand') toHand(m);
    } catch (err) { if (m.to) reply(m.to, { type: 'fail', message: String(err) }); }
};
