// Picking things up in the room: like examining an item in a game. The thing
// you clicked (a figure, the controller, the PS3) comes up in front of you on
// its own little stage: drag to turn it, scroll (or pinch) to zoom, Esc or
// the button to put it back. The object itself is moved here while you look
// at it (no copy), and goes back exactly where it was.
//
// An `action` adds a prompt, e.g. the controller's START: "play on the PS3".
import * as THREE from 'three';

export function createInspector() {
    const wrap = document.createElement('div');
    wrap.className = 'inspect';
    wrap.hidden = true;
    wrap.innerHTML = `
        <canvas class="inspect__view" aria-hidden="true"></canvas>
        <button class="inspect__back" type="button" aria-label="Put it back">✕</button>
        <div class="inspect__keys" aria-hidden="true">
            <span><b>drag</b> turn</span><span><b>scroll</b> zoom</span><button type="button" class="inspect__key" hidden></button><span><b>esc</b> put back</span>
        </div>
        <button class="inspect__action" type="button" hidden></button>`;
    document.body.appendChild(wrap);
    const canvas = wrap.querySelector('canvas');
    const actionBtn = wrap.querySelector('.inspect__action');
    const keyBtn = wrap.querySelector('.inspect__key');
    let keyAction = null;                      // a key that does something while you hold it (e.g. V: voice line)
    keyBtn.addEventListener('click', () => keyAction?.run());

    let renderer = null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 50);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2a30, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(1.5, 2.5, 3);
    const rim = new THREE.DirectionalLight(0xbfd2ff, 1.4); rim.position.set(-2.5, 1.2, -2);
    scene.add(key, rim);
    const turn = new THREE.Group();          // what you drag
    scene.add(turn);

    let held = null, open = false, raf = 0, last = 0, onAction = null, keepOpen = false;
    let yaw = 0, pitch = 0.15, vyaw = 0, dist = 3, want = 3, t0 = 0;
    const DIST = { min: 1.4, max: 5 };

    const size = () => {
        const w = innerWidth, h = innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        // fit a 1-unit object comfortably on any screen
        const fit = 1.15 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(1, camera.aspect);
        DIST.min = fit * 0.45; DIST.max = fit * 1.6; want = dist = fit;
    };

    const frame = (now) => {
        const dt = Math.min(50, now - (last || now)); last = now;
        if (!dragging) { yaw += vyaw * dt; vyaw *= Math.pow(0.9, dt / 16); }
        if (!dragging && Math.abs(vyaw) < 0.00005) yaw += dt * 0.00012;     // a slow idle turn
        dist += (want - dist) * Math.min(1, dt * 0.012);
        const k = Math.min(1, (now - t0) / 380), e = 1 - Math.pow(1 - k, 3);  // pop in
        turn.scale.setScalar(0.6 + 0.4 * e);
        turn.rotation.set(pitch, yaw, 0);
        camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
    };

    // drag to turn
    let dragging = false, px = 0, py = 0, lastMove = 0;
    canvas.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; vyaw = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - px, dy = e.clientY - py, now = performance.now();
        px = e.clientX; py = e.clientY;
        yaw += dx * 0.01; pitch = THREE.MathUtils.clamp(pitch + dy * 0.008, -1.2, 1.2);
        vyaw = dx * 0.01 / Math.max(8, now - lastMove); lastMove = now;
    });
    const up = () => { dragging = false; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    // scroll / pinch to zoom
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); want = THREE.MathUtils.clamp(want * Math.exp(e.deltaY * 0.0012), DIST.min, DIST.max); }, { passive: false });
    let pinch = 0;
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length !== 2) { pinch = 0; return; }
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (pinch) want = THREE.MathUtils.clamp(want * pinch / d, DIST.min, DIST.max);
        pinch = d;
    }, { passive: true });
    canvas.addEventListener('touchend', () => { pinch = 0; });

    // keys: arrows turn, +/- zoom, Esc puts back, Enter does the action
    addEventListener('keydown', (e) => {
        if (!open) return;
        const k = e.key;
        if (keyAction && k.toLowerCase() === keyAction.key) keyAction.run();
        else if (k === 'Escape' || k === 'Backspace') close();
        else if (k === 'ArrowLeft') yaw -= 0.25;
        else if (k === 'ArrowRight') yaw += 0.25;
        else if (k === 'ArrowUp') pitch = Math.max(-1.2, pitch - 0.2);
        else if (k === 'ArrowDown') pitch = Math.min(1.2, pitch + 0.2);
        else if (k === '+' || k === '=') want = Math.max(DIST.min, want * 0.85);
        else if (k === '-') want = Math.min(DIST.max, want / 0.85);
        else if ((k === 'Enter' || k === ' ') && onAction) { const a = onAction; if (!keepOpen) close(); a(); }
        else return;
        e.preventDefault(); e.stopImmediatePropagation();
    }, { capture: true });
    wrap.querySelector('.inspect__back').addEventListener('click', () => close());
    actionBtn.addEventListener('click', () => { const a = onAction; if (!keepOpen) close(); a?.(); });

    // pick it up: move the object onto the stage, centred and scaled to ~1 unit
    let home = null;
    const show = (obj, { action = null, key = null, turnTo = 0, tilt = 0.15 } = {}) => {
        if (open) close();
        if (!renderer) {
            renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            addEventListener('resize', () => { if (open) size(); });
        }
        held = obj;
        home = { parent: obj.parent, position: obj.position.clone(), quaternion: obj.quaternion.clone(), scale: obj.scale.clone(), visible: obj.visible };
        turn.scale.setScalar(1); turn.rotation.set(0, 0, 0); turn.updateMatrixWorld(true);
        obj.updateMatrixWorld(true);
        // keep its look (world scale/rotation) but bring it to the origin
        const ws = new THREE.Vector3(), wq = new THREE.Quaternion();
        obj.matrixWorld.decompose(new THREE.Vector3(), wq, ws);
        turn.add(obj);
        obj.position.set(0, 0, 0); obj.quaternion.copy(wq); obj.scale.copy(ws);
        obj.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(obj, true), c = b.getCenter(new THREE.Vector3());
        const s = 1.6 / Math.max(...b.getSize(new THREE.Vector3()).toArray());
        obj.scale.multiplyScalar(s);
        obj.position.copy(c).multiplyScalar(-s);
        obj.visible = true;
        yaw = turnTo; pitch = tilt; vyaw = 0;
        onAction = action?.run || null;
        keepOpen = !!action?.keepOpen;
        keyAction = key;
        keyBtn.hidden = !key;
        if (key) keyBtn.innerHTML = `<b>${key.key}</b> ${key.label}`;
        actionBtn.hidden = !action;
        if (action) actionBtn.innerHTML = action.label;
        wrap.hidden = false;
        size();
        open = true; t0 = last = performance.now();
        requestAnimationFrame(() => wrap.classList.add('is-in'));
        raf = requestAnimationFrame(frame);
    };
    const close = () => {
        if (!open) return;
        open = false;
        cancelAnimationFrame(raf);
        wrap.classList.remove('is-in');
        wrap.hidden = true;
        if (held && home) {
            home.parent.add(held);
            held.position.copy(home.position); held.quaternion.copy(home.quaternion); held.scale.copy(home.scale); held.visible = home.visible;
        }
        held = null; home = null; onAction = null;
        onClose?.();
    };
    let onClose = null;

    return {
        show,
        close,
        get open() { return open; },
        onClose: (fn) => { onClose = fn; },
    };
}
