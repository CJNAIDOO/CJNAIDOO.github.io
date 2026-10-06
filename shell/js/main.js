// The PSP shell. Three acts:
//   1. the mark    - on paper while everything loads: your name rises in, the
//                    full stop after "J." orbits it and lands with a burst
//                    (shell/js/mark.js), and your role settles in
//   2. the PSP     - the dot opens into the dark stage, the PSP pops in and
//                    lands dead-front, rim-lit, and its screen pulses
//                    "press start"
//   3. the site    - press start: the camera flies in until the PSP fills
//                    the window and the XMB boots on its screen
// "skip intro" (or Esc during the intro) jumps straight to the XMB menu.
//   index.html?skipintro  -> skip automatically (handy while developing)
import { createHandheld } from './viewer.js';
import { createStudio } from './studio.js';

const params = new URLSearchParams(location.search);
const autoSkip = params.has('skipintro');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 20) : ms));

const $ = (id) => document.getElementById(id);
const body = document.body;
const stage = $('stage');
const mark = $('mark');
const markRole = $('mark-role');
const markBar = $('mark-bar');
const hint = $('hint');
const skipBtn = $('skip');
const toolbar = $('toolbar');
const credits = $('credits');
// the studio behind the PSP: floor, spotlight, dark / light (shell/js/studio.js)
const field = createStudio($('studio'), $('studio-toggle'));

// ---- act 1: the mark (shell/js/mark.js) -------------------------------------
const { done: markDone, dot } = window.MARK;

const setProgress = (p) => { markBar.style.transform = `scaleX(${Math.min(1, p).toFixed(3)})`; };

// ---- the XMB on the screen ---------------------------------------------------
const frame = document.createElement('iframe');
frame.title = 'Cameron J. Naidoo XMB portfolio';
frame.allow = 'autoplay';
let xmbReady;
const bootXmb = () => {
    xmbReady = new Promise((resolve) => {
        const onMsg = (e) => {
            if (e.source === frame.contentWindow && e.data?.type === 'xmb-ready') {
                window.removeEventListener('message', onMsg);
                resolve();
            }
        };
        window.addEventListener('message', onMsg);
    });
    frame.src = `xmb.html?t=${Date.now()}`;
};
bootXmb();
const send = (msg) => frame.contentWindow?.postMessage(msg, '*');

// links opened from the XMB (projects, LinkedIn, GitHub) open from here, so a
// key press on the PSP counts as the click that allows a new tab
window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow) return;
    if (e.data?.type === 'open-url' && /^https?:\/\//.test(e.data.url)) window.open(e.data.url, '_blank', 'noopener');
});

// ---- load the model with progress ------------------------------------------
const fetchWithProgress = async (url, onProgress) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    const total = Number(res.headers.get('Content-Length')) || 0;
    if (!res.body || !total) { const buf = await res.arrayBuffer(); onProgress(1); return buf; }
    const reader = res.body.getReader();
    const chunks = []; let got = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); got += value.length;
        onProgress(Math.min(0.99, got / total));
    }
    const out = new Uint8Array(got); let o = 0;
    for (const c of chunks) { out.set(c, o); o += c.length; }
    onProgress(1);
    return out.buffer;
};

// ---- the top menu: the XMB's main headings --------------------------------
// Built from the section titles the XMB reports when it's ready, so it always
// matches the menu on the screen. Clicking one moves the XMB there; moving
// around on the PSP moves the dot here.
const sitenav = $('sitenav');
const navList = $('sitenav-list');
const navDot = $('sitenav-dot');
let navButtons = [];
let navAt = 0;

// the brand: just the name, in the menu's serif (index.html)

// Sections left out of the top menu: Games is there to be found by exploring,
// not part of the professional tour.
const NAV_HIDDEN = /^games$/i;
const placeNavDot = () => {
    const b = navButtons[navAt];
    // on a section that isn't in the menu (Games) the dot just fades out
    if (!b) { navDot.classList.remove('is-placed'); return; }
    navDot.style.setProperty('--dot-x', `${b.offsetLeft + b.offsetWidth / 2}px`);
    navDot.classList.add('is-placed');
};
const setNavAt = (i) => {
    navAt = i;
    navButtons.forEach((b, j) => b?.setAttribute('aria-current', String(j === i)));
    placeNavDot();
};
const buildNav = (titles) => {
    if (!Array.isArray(titles) || !titles.length) return;
    navList.innerHTML = '';
    navButtons = titles.map((t, i) => {
        if (NAV_HIDDEN.test(String(t).trim())) return null;
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = String(t).replace(/^My\s+/i, '');   // "My Projects" -> "Projects"
        b.setAttribute('aria-label', t);
        b.style.setProperty('--i', i);
        b.addEventListener('click', () => goSection(i));
        li.appendChild(b);
        navList.appendChild(li);
        return b;
    });
    setNavAt(0);
};
const goSection = (i) => {
    if (phase !== 'site') return;
    send({ type: 'xmb-go', index: i });
    skipBtn.hidden = true;                 // going somewhere skips the XMB's intro too
    if (i !== navAt) field.pulse(i > navAt ? 1 : -1);
    setNavAt(i);
    document.activeElement?.blur?.();      // keys go back to the PSP
};
$('brand').addEventListener('click', () => goSection(0));
window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow) return;
    if (e.data?.type === 'xmb-ready') buildNav(e.data.sections);
    if (e.data?.type === 'xmb-at' && Number.isInteger(e.data.index) && e.data.index !== navAt) {
        field.pulse(e.data.index > navAt ? 1 : -1);   // a wave of light the way the XMB moved
        setNavAt(e.data.index);
    }
    if (e.data?.type === 'xmb-menu') skipBtn.hidden = true;              // the XMB is at its menu
    if (e.data?.type === 'xmb-tap' && phase === 'armed') start();       // tapped the screen: Start
});
addEventListener('resize', placeNavDot);
document.fonts?.ready.then(placeNavDot);
document.fonts?.load('italic 400 19px "Instrument Serif"').catch(() => {});   // ready before the menu shows
const showNav = () => {
    sitenav.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { sitenav.classList.add('is-in'); placeNavDot(); }));
};

// ---- state -----------------------------------------------------------------
let handheld = null;
let phase = 'mark';          // mark -> psp -> armed -> site
let skipWanted = autoSkip;

const showSite = () => {
    phase = 'site';
    body.dataset.stage = 'site';
    hint.classList.remove('is-lit');
    // toolbar.hidden = false;   // reset view / power cycle / credits: hidden for now
    showNav();
    field.showToggle();
};

// the 3D PSP. Building it (parsing the model, lighting, uploading textures)
// ties up the page for a moment, and so does the XMB booting inside it, so
// neither starts until the mark has finished moving: it holds still, the
// loading bar finishes, and only then does the stage open.
const glbPromise = fetchWithProgress('models/psp.glb', (p) => setProgress(p * 0.8));
let handheldPromise = null;
const ensureHandheld = () => handheldPromise ||= (async () => {
    const glb = await glbPromise;
    await frames(2);                            // let the last mark frame paint
    handheld = await createHandheld({
        container: stage,
        glb,
        screenEl: frame,
        screenUV: { u0: 38 / 4096, v0: 1523 / 4096, u1: 1629 / 4096, v1: 2412 / 4096 },
        screenWidthPx: 1280,
        topInset: () => (innerHeight <= 500 ? 40 : 56),   // room for the top menu
        onKey: (key) => {
            if (phase === 'armed') { start(); return; }
            if (phase !== 'site') return;
            send(key === 'Home' ? { type: 'xmb-home' } : { type: 'xmb-key', key });
        },
    });
    window.PSP = handheld; // handy in the console while developing
    field.attach(handheld);                     // the studio follows the PSP
    handheld.setActive(false);                  // renders once, which loads the XMB
    setProgress(0.9);
    await Promise.race([xmbReady, sleep(7000)]);
    setProgress(1);
    await frames(2);
    return handheld;
})();
const frames = (n) => new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });

// act 2
const iris = $('iris');
const toPsp = async () => {
    if (phase !== 'mark') return;
    phase = 'psp';
    // the j's dot opens up into the stage
    const r = dot.getBoundingClientRect();
    iris.style.setProperty('--x', `${r.left + r.width / 2}px`);
    iris.style.setProperty('--y', `${r.top + r.height / 2}px`);
    iris.hidden = false;
    void iris.offsetWidth;
    iris.classList.add('is-open');
    body.classList.add('is-dark');              // goes dark under the blue, so no grey in between
    await sleep(640);
    if (phase !== 'psp') return;               // skipped meanwhile
    mark.hidden = true;
    body.dataset.stage = 'psp';
    stage.classList.add('is-lit');
    handheld.setActive(true);
    field.start();
    iris.classList.add('is-night');
    const landed = handheld.enter();
    await sleep(260);
    iris.classList.add('is-gone');
    setTimeout(() => { iris.hidden = true; }, 600);
    await landed;
    if (phase !== 'psp') return;
    handheld.glint();
    send({ type: 'xmb-arm' });
    hint.classList.add('is-lit');
    phase = 'armed';
};

// act 3
const start = async () => {
    if (phase !== 'armed') return;
    showSite();
    send({ type: 'xmb-start' });
    // "skip intro" stays for the disclaimer; it goes when the menu is up
    // (xmb-menu), or after a while as a fallback
    setTimeout(() => { skipBtn.hidden = true; }, 9000);
    await handheld.setMode('immersive');
};

const skip = async () => {
    if (skipWanted && phase === 'site') return;
    skipWanted = true;
    skipBtn.hidden = true;
    try { await ensureHandheld(); } catch { return; }   // the boot below reports it
    if (phase === 'site') return;
    phase = 'site';
    mark.hidden = true;
    iris.hidden = true;
    body.classList.add('is-dark');
    stage.classList.add('is-lit');
    handheld.setActive(true);
    field.start();
    handheld.jumpTo('immersive');
    send({ type: 'xmb-skip' });
    showSite();
};
skipBtn.addEventListener('click', skip);

// ---- boot --------------------------------------------------------------------
try {
    if (skipWanted) {
        await skip();
    } else {
        // let the mark play out, even on a fast connection
        await Promise.all([markDone, glbPromise]);
        if (!skipWanted) {
            await ensureHandheld();
            if (!skipWanted) toPsp();
        }
    }
    if (!handheld) await ensureHandheld();
} catch (err) {
    console.error(err);
    phase = 'error';
    markRole.classList.add('is-in', 'is-error');
    markRole.innerHTML = 'The 3D PSP couldn’t start here. <a href="xmb.html">Open the XMB on its own</a>';
}

// ---- input -------------------------------------------------------------------
// a tap on the PSP starts it; a drag just turns it
let down = null;
stage.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
stage.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y);
    down = null;
    if (moved < 7) start();
});

const FORWARD = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace']);
const MESH_FOR = { Backspace: 'Escape' };
window.addEventListener('keydown', (e) => {
    if (credits.open) return;
    if (['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
    // Enter/Space on a menu button reached with Tab works the button
    const el = document.activeElement;
    if ((e.key === 'Enter' || e.key === ' ') && el?.closest?.('.sitenav, .toolbar, .studio-toggle') && el.matches(':focus-visible')) return;
    if (phase === 'mark' || phase === 'psp') {
        if (e.key === 'Escape') { e.preventDefault(); skip(); }
        return;
    }
    if (phase === 'armed') { e.preventDefault(); start(); return; }
    if (phase !== 'site' || !FORWARD.has(e.key)) return;
    e.preventDefault();
    handheld.press(MESH_FOR[e.key] || e.key);
    send({ type: 'xmb-key', key: e.key });
});

// ---- toolbar -----------------------------------------------------------------
$('reset').addEventListener('click', () => handheld?.resetView());
$('reboot').addEventListener('click', async () => {
    setNavAt(0);
    bootXmb();
    await xmbReady;
    send({ type: 'xmb-start' });
});
$('credits-open').addEventListener('click', () => credits.showModal());
