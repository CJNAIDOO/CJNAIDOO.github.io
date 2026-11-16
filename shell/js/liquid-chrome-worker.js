// The loading screen's liquid chrome, drawn in a worker (liquid-chrome.js, opts.worker): the page
// hands over its canvas, then only its size and the pointer.
import { createChromeCore } from './liquid-chrome.js?v=94';

let core = null;
self.onmessage = (e) => {
    const m = e.data || {};
    try {
        if (m.type === 'init') { core = createChromeCore(m.canvas, m.opts); return; }
        if (!core) return;
        if (m.type === 'resize') core.resize(m.w, m.h, m.dpr);
        else if (m.type === 'move') core.move(m.fx, m.fy);
        else if (m.type === 'down') core.down(m.fx, m.fy);
        else if (m.type === 'leave') core.leave();
        else if (m.type === 'visible') core.visible(m.v);
        else if (m.type === 'paused') core.paused(m.p);
        else if (m.type === 'destroy') { core.destroy(); core = null; }
    } catch (err) { self.postMessage({ type: 'error', message: String(err) }); }
};
