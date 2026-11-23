// The handwritten line in a worker of its own (when there's no shared one): see handwriting-core.js.
import { createHandwriting } from './handwriting-core.js?v=95';
let hand = null;
self.onmessage = (e) => {
    const m = e.data || {};
    try {
        if (m.type === 'init') { hand = createHandwriting(m); self.postMessage({ type: hand ? 'ready' : 'fail' }); }
        else if (!hand) return;
        else if (m.type === 'start') hand.start(m.delay || 0);
        else if (m.type === 'finish') hand.finish();
        else if (m.type === 'destroy') { hand.destroy(); hand = null; }
    } catch (err) { self.postMessage({ type: 'fail', message: String(err) }); }
};
