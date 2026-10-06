// The studio behind the PSP: a seamless backdrop, a soft spotlight from above
// and a pool of light on the floor, in a dark or a light version. The backdrop
// is plain CSS (.studio in shell.css); this keeps it lined up with the 3D PSP:
// the floor line sits where the PSP stands, and the spotlight drifts the way
// you turn the PSP. The reflection and contact shadow are in viewer.js.
//
// The dark / light toggle (bottom left) remembers your choice in this browser.
import * as THREE from 'three';

const KEY = 'psp-studio';
const load = () => { try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };
const save = (v) => { try { localStorage.setItem(KEY, v); } catch { /* private mode etc. */ } };

export function createStudio(el, toggle) {
    let handheld = null;
    let running = false, raf = 0;
    let theme = load();
    const floorPoint = new THREE.Vector3();

    const apply = () => {
        document.documentElement.dataset.studio = theme;
        handheld?.setStudioTheme(theme);
        toggle?.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.theme === theme)));
    };
    toggle?.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-theme]');
        if (!b || b.dataset.theme === theme) return;
        theme = b.dataset.theme;
        save(theme);
        apply();
        b.blur();                                          // keys go back to the PSP
    });
    apply();

    // follow the PSP: where its floor is on screen, and which way it's turned
    let sx = 50, fy = 72;
    const frame = () => {
        if (handheld) {
            const cam = handheld.camera;
            floorPoint.set(0, handheld.floorY, 0).project(cam);
            const tfy = THREE.MathUtils.clamp((1 - (floorPoint.y * 0.5 + 0.5)) * 100, 40, 98);
            const az = Math.atan2(cam.position.x, cam.position.z);            // 0 = straight on
            const tsx = 50 - Math.sin(az) * 22;
            sx += (tsx - sx) * 0.08;
            fy += (tfy - fy) * 0.2;
            el.style.setProperty('--sx', `${sx.toFixed(2)}%`);
            el.style.setProperty('--fy', `${fy.toFixed(2)}%`);
        }
        if (running) raf = requestAnimationFrame(frame);
    };
    const start = () => {
        if (running) return;
        running = true;
        el.classList.add('is-on');
        raf = requestAnimationFrame(frame);
    };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    document.addEventListener('visibilitychange', () => {
        if (!el.classList.contains('is-on')) return;
        if (document.hidden) stop(); else start();
    });

    return {
        attach: (h) => { handheld = h; apply(); },
        start,
        stop,
        // the XMB changed section: the light lifts for a moment
        pulse: () => {
            el.classList.remove('is-pulse');
            void el.offsetWidth;
            el.classList.add('is-pulse');
        },
        showToggle: () => { if (toggle) toggle.hidden = false; },
        get theme() { return theme; },
    };
}
