// The handwritten line's drawing (a white paint marker): each letter (its outline as a Path2D) shows
// through a thick pen stroke run along it, one letter after another. The ink is m.tex, the line
// painted as a paint marker (images/room/role-ink.png, tools/role-ink.py): solid where the hand
// pressed, thinning to let the background through where it eased off; without it, flat white. Runs in a worker on an
// OffscreenCanvas (intro-worker.js, handwriting-worker.js).
export function createHandwriting(m) {
    const canvas = m.canvas;
    canvas.width = m.w; canvas.height = m.h;
    const tmp = new OffscreenCanvas(m.w, m.h);
    const ctx = canvas.getContext('2d'), tctx = tmp.getContext('2d');
    if (!ctx || !tctx || typeof Path2D === 'undefined') return null;
    const s = m.w / m.W, asc = m.asc;
    const glyphs = m.glyphs.map((g) => ({ ...g, path: new Path2D(g.dPath) }));
    const tex = m.tex || null;
    let t0 = 0, raf = 0, alive = true;
    const draw = (now) => {
        raf = 0;
        if (!alive) return;
        const t = (now - t0) / 1000;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let busy = false;
        for (const g of glyphs) {
            const p = Math.min(1, Math.max(0, (t - g.d) / g.t));
            if (p < 1) busy = true;
            if (p <= 0) continue;
            const mx = [s, 0, 0, -s, g.x * s, asc * s];
            if (p >= 1) {
                ctx.save(); ctx.setTransform(...mx); ctx.clip(g.path);
                if (tex) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(tex, 0, 0, canvas.width, canvas.height); }
                else { ctx.fillStyle = m.color; ctx.fill(g.path); }
                ctx.restore();
                continue;
            }
            // the pen so far (inside the letter only), then the ink only where the pen has been
            tctx.setTransform(1, 0, 0, 1, 0, 0);
            tctx.globalCompositeOperation = 'source-over';
            tctx.clearRect(0, 0, tmp.width, tmp.height);
            tctx.save(); tctx.setTransform(...mx); tctx.clip(g.path);
            tctx.lineWidth = m.pen; tctx.lineCap = 'round'; tctx.lineJoin = 'round';
            tctx.setLineDash([g.len * p, g.len + 1]);
            tctx.strokeStyle = '#fff'; tctx.stroke(g.path);
            tctx.restore();
            tctx.globalCompositeOperation = 'source-in';
            tctx.setTransform(1, 0, 0, 1, 0, 0);
            if (tex) tctx.drawImage(tex, 0, 0, tmp.width, tmp.height);
            else { tctx.fillStyle = m.color; tctx.fillRect(0, 0, tmp.width, tmp.height); }
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(tmp, 0, 0);
        }
        if (busy) raf = requestAnimationFrame(draw);
    };
    return {
        start(delay) { t0 = performance.now() + delay; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); },
        finish() { t0 = -1e9; cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); },
        destroy() { alive = false; cancelAnimationFrame(raf); },
    };
}
