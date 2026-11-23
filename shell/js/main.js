// The PSP shell. Three acts:
//   1. the mark    - while everything loads: your name in metallic paint (intro-name.js), the
//                    2D name (mark.js) only if WebGL is not there
//                    and your role settles in
//   2. the PSP     - the dot opens into the dark stage, the PSP pops in and
//                    lands dead-front, rim-lit, and its screen pulses
//                    "press start"
//   3. the site    - press start: the camera flies in until the PSP fills
//                    the window and the XMB boots on its screen
// "skip intro" (or Esc during the intro) jumps straight to the XMB menu.
//   index.html?skipintro  -> skip automatically (handy while developing)
//
// With Cameron's room (shell/js/room.js), act 2 lands in the room instead,
// and you choose how to look round the portfolio: pick up the PSP on the
// wall shelf, or sit down at the PS3 and play it on the monitor. The "room"
// button (bottom left) takes you back. If the room can't load, the PSP
// floats in the dark studio as before.
import { createHandheld } from './viewer.js?v=95';
import { createStudio } from './studio.js?v=95';
import { loadRoomAssets, buildRoom } from './room.js?v=124';
import { createIntroName, paintNavName } from './intro-name.js?v=105';
import { sfx } from './sfx.js?v=95';
import { createLinkViewer } from './link-viewer.js?v=95';

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
const { done: markDone, dot, waiting: markWaiting } = window.MARK;

// The mark doubles as the loading screen. It plays out, and if the room isn't
// ready by then it stays up: the full stop breathes and a line under the bar
// says what's happening. The stage only opens once everything is downloaded,
// built, warmed up (shaders compiled, textures on the GPU) and the XMB has
// booted, so the room appears without a stutter.
//   downloading the PSP and the room  0 .. 0.8   (by bytes)
//   building the room                 0.85
//   warming up                        0.92
//   the XMB booting                   1
const setProgress = (p) => { setStatus(lineFor(p)); markBar.style.transform = `scaleX(${Math.min(1, p).toFixed(3)})`; try { intro?.progress(p); } catch { /* not made yet */ } };   // the chrome name turns with it
const statusEl = $('mark-status');
let status = '', introOver = false, ready = false;
const showStatus = () => {
    statusEl.textContent = status;
    statusEl.classList.toggle('is-in', introOver && !ready && !!status);
    markWaiting?.(introOver && !ready);
};
const setStatus = (text) => { status = text; showStatus(); };
markDone.then(() => { introOver = true; showStatus(); });
// Phones get the PSP on its own, in the studio: the room (36 models, about half a gigabyte of
// textures, 2 million triangles) is more than a phone's browser will hold, and the tab is killed
// before it loads. ?room in the address forces the room, ?lite forces the PSP alone (to test).
const query = new URLSearchParams(location.search);
const LITE = !query.has('room') && (query.has('lite')
    || (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820)
    || (navigator.deviceMemory && navigator.deviceMemory <= 2));
// what the loading screen says: understated, and nothing about what is being loaded
const lineFor = (p) => (p < 0.2 ? 'one moment' : p < 0.7 ? 'preparing' : p < 0.75 ? 'nearly' : p < 0.9 ? 'just a little longer' : 'welcome');
const loaded = { psp: 0, room: 0 };
const showLoaded = () => {
    const p = LITE ? loaded.psp * 0.8 : loaded.psp * 0.2 + loaded.room * 0.6;
    setProgress(p);
    setStatus(lineFor(p));
};

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

// links open on the PSP's screen (the XMB's own viewer); only live apps pop up over the site,
// in this viewer (shell/js/link-viewer.js), with a button for a new tab. A link in the room (a
// card's Spotify or Letterboxd) picks the PSP up and opens there; one marked data-live pops up.
const toScreen = async (url, label = '') => {
    if (phase === 'room' && room) enterDevice('psp');
    await xmbReady;
    send({ type: 'xmb-link', url, label });
};
const links = createLinkViewer({ route: (url, label, a) => { if (a?.dataset.live != null) return false; toScreen(url, label); return true; } });
window.LINKS = links;
// links opened from the XMB (projects, LinkedIn, GitHub) open from here, so a
// key press on the PSP counts as the click that allows a new tab
window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow) return;
    if (e.data?.type === 'open-url' && /^https?:\/\//.test(e.data.url)) links.show(e.data.url);
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

// Sections left out of the top menu: Games and Photos are there to be found by exploring,
// not part of the professional tour.
const NAV_HIDDEN = /^(games|photos)$/i;
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
    // from the room, the menu picks the PSP up and opens that section on it
    if (phase === 'room' && room) {
        enterDevice('psp');
        send({ type: 'xmb-go', index: i });
        skipBtn.hidden = true;
        setNavAt(i);
        return;
    }
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
    if (e.data?.type === 'xmb-tap' && phase === 'room') enterDevice('ps3');
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
let phase = 'mark';          // mark -> psp -> armed -> site (no room) | mark -> psp -> room <-> site
let device = null;           // in the room: 'psp' or 'ps3' while you're in the portfolio
let xmbStarted = false;
// the XMB only takes clicks while you're using it (in the room, a click on the monitor sits you down)
const setFrameClicks = () => { frame.style.pointerEvents = !room || phase === 'site' ? '' : 'none'; };
let skipWanted = autoSkip;
// the loading screen: your name in liquid metallic paint while the room loads
// (shell/js/intro-name.js); without WebGL2, the 2D name instead
const intro = autoSkip ? null : createIntroName(mark, { reduced });
// and the same paint on the name in the top menu, once you're in
paintNavName(document.querySelector('#brand .sitenav__name'));
if (!intro && !autoSkip) mark.classList.add('no-3d');

const showSite = () => {
    phase = 'site';
    body.dataset.stage = 'site';
    hint.classList.remove('is-lit');
    // toolbar.hidden = false;   // reset view / power cycle / credits: hidden for now
    showNav();
    if (room) roomBtn.hidden = false;
    // (no day / night toggle: the room follows the time of day)
    if (room) soundBtn.hidden = false; showSound();
};

// the 3D PSP. Building it (parsing the model, lighting, uploading textures)
// ties up the page for a moment, and so does the XMB booting inside it, so
// neither starts until the mark has finished moving: it holds still, the
// loading bar finishes, and only then does the stage open.
const glbPromise = fetchWithProgress('models/psp.glb', (p) => { loaded.psp = p; showLoaded(); });
const roomAssets = (LITE ? Promise.resolve(null) : loadRoomAssets((p) => { loaded.room = p; showLoaded(); }))
    .catch((err) => { console.warn('the room could not load; the PSP goes in the studio', err); return null; });
let room = null;               // the room's API once it's built (null: no room)
const roomBtn = $('room-btn');
// one way back, everywhere: an arrow on the left (out of a card, a close-up, the PSP or the PS3)
const setBack = (label) => {
    if (!roomBtn.querySelector('.room-btn__label')) [...roomBtn.childNodes].forEach((n) => { if (n.nodeType === 3) n.remove(); }), roomBtn.insertAdjacentHTML('beforeend', '<span class="room-btn__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 12H6M11.5 6.5 6 12l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="room-btn__label"></span>');
    roomBtn.querySelector('.room-btn__label').textContent = label; roomBtn.setAttribute('aria-label', label === 'room' ? 'Back to the room' : 'Back'); };
setBack('room');
// MZALA's sound on / off (shell/js/sfx.js)
const soundBtn = $('sound-btn');
soundBtn.innerHTML = '<span class="sound-btn__label">sound on</span>';
// the volume: five bars, shortest on the left, tallest (loudest) on the right, filled from the left
const volBox = $('vol'), VOL_N = 5;                         // five bars, each clearly taller than the last
volBox.innerHTML = Array.from({ length: VOL_N }, (_, i) => `<span class="vol__bar" style="--h:${0.22 + (i / (VOL_N - 1)) ** 1.15 * 0.78}"></span>`).join('');
const volBars = [...volBox.children];
let volLevel = Math.round(sfx.volume * VOL_N);
const paintVol = () => {
    volBars.forEach((b, i) => b.classList.toggle('is-on', i < volLevel));
    volBox.setAttribute('aria-valuenow', String(volLevel));
    volBox.setAttribute('aria-valuetext', `${volLevel * 20}%`);
};
const setVol = (n, chirp) => {
    n = Math.max(0, Math.min(VOL_N, n));
    if (n === volLevel) return;
    volLevel = n; sfx.setVolume(n / VOL_N); paintVol();
    if (chirp) sfx.chirp?.(1);
};
paintVol();
const levelAt = (x) => {                                     // a bar under the pointer: lit up to it, from the left (left of the first: off)
    const r = volBox.getBoundingClientRect();
    return Math.max(0, Math.min(VOL_N, Math.round(((x - r.left - 6) / (r.width - 12)) * VOL_N + 0.4)));
};
let volDrag = false;
volBox.addEventListener('pointerdown', (e) => { volDrag = true; volBox.setPointerCapture(e.pointerId); setVol(levelAt(e.clientX)); e.preventDefault(); });
volBox.addEventListener('pointermove', (e) => { if (volDrag) setVol(levelAt(e.clientX)); });
volBox.addEventListener('pointerup', () => { if (volDrag) { volDrag = false; sfx.chirp?.(1); } });
volBox.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];      // right: louder (the taller bars)
    if (d) { setVol(volLevel + d, true); e.preventDefault(); e.stopPropagation(); }
    else if (e.key === 'Home') { setVol(0, true); e.preventDefault(); }
    else if (e.key === 'End') { setVol(VOL_N, true); e.preventDefault(); }
});
const showSound = () => {
    volBox.hidden = sfx.muted || soundBtn.hidden;      // the slider, to its left, while the sound is on
    soundBtn.querySelector('.sound-btn__label').textContent = sfx.muted ? 'sound off' : 'sound on';
    soundBtn.setAttribute('aria-pressed', String(!sfx.muted));
};
soundBtn.addEventListener('click', () => { sfx.setMuted(!sfx.muted); showSound(); if (!sfx.muted) sfx.chirp(2); soundBtn.blur(); });
showSound();
// the corner clock: Johannesburg time
{
    const el = $('rc-time');
    const fmt = new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Africa/Johannesburg' });
    const tick = () => { if (el) el.textContent = `${fmt.format(new Date())} SAST`; };
    tick();
    setInterval(tick, 15000);
}
const tip = $('room-tip');
const showTip = (label, e) => {
    if (room?.hoverFigure) { room.hoverFigure(label); tip.classList.remove('is-in'); return; }   // figures show their logo instead
    if (!label || !e) { tip.classList.remove('is-in'); return; }
    tip.textContent = label;
    tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 16}px)`;
    tip.classList.add('is-in');
};
let handheldPromise = null;
const ensureHandheld = () => handheldPromise ||= (async () => {
    const glb = await glbPromise;
    const assets = await roomAssets;
    await frames(2);                            // let the last mark frame paint
    handheld = await createHandheld({
        container: stage,
        glb,
        room: !!assets,
        onPspClick: () => { if (phase === 'armed') start(); else if (phase === 'room' && !room?.clickPsp()) enterDevice('psp'); },
        onHover: (label, e) => showTip(label, e),
        screenEl: frame,
        screenUV: { u0: 38 / 4096, v0: 1523 / 4096, u1: 1629 / 4096, v1: 2412 / 4096 },
        screenWidthPx: 1280,
        topInset: () => (innerHeight <= 500 ? 40 : 56),   // room for the top menu
        onKey: (key) => {
            if (phase === 'armed') { start(); return; }
            if (phase !== 'site') return;
            send(key === 'Home' ? { type: 'xmb-home' } : { type: 'xmb-key', key });
        },
        onKeyUp: (key) => { if (phase === 'site') send({ type: 'xmb-keyup', key }); },
    });
    // nothing of the scene shows until the loading screen lifts: it draws one frame (which puts the
    // XMB into the page, so it loads) and then waits, so the build below isn't redrawn every frame
    handheld.setActive(false);
    window.PSP = handheld; // handy in the console while developing
    // the XMB shows the PSP's buttons on the PSP, and the keyboard's on the monitor
    const useScreen = handheld.useScreen;
    let ctlDevice = 'psp';
    handheld.useScreen = (spec) => { useScreen(spec); ctlDevice = !spec || spec === 'psp' ? 'psp' : 'desktop'; xmbReady.then(() => send({ type: 'xmb-device', device: ctlDevice })); };
    if (assets) {
        // (the name keeps moving: it draws in a worker)
        setProgress(0.82);
        await frames(2);                        // let that show before the page is busy
        try {
            room = await buildRoom(handheld, assets, { onPs3: () => enterDevice('ps3') });
            handheld.useScreen(room.monitorScreen);      // the XMB starts out on the monitor; the PSP is on standby
            // a close-up of a figure: the bottom-left button steps back out of it
            room.onFocus((on) => {
                if (phase !== 'room') return;
                setBack('back');
                roomBtn.hidden = !on;
                hint.classList.toggle('is-lit', !on);
            });
            room.onPickPsp(() => enterDevice('psp'));     // the close-up's "pick up"
            window.ROOM = room;
        }
        catch (err) { console.warn('the room could not be built', err); room = null; }
    }
    body.classList.toggle('has-room', !!room);
    if (room) hint.textContent = 'pick up the PSP, or play on the PS3';
    setFrameClicks();
    field.attach(handheld);                     // the studio follows the PSP
    handheld.setActive(false);                  // renders once, which loads the XMB
    if (room) {
        setProgress(0.88);
        await frames(2);
        try { await handheld.prepare('roomFar'); } catch (err) { console.warn('warm-up skipped', err); }
    }
    intro?.pause?.(false);
    setProgress(0.94);
    await Promise.race([xmbReady, sleep(7000)]);
    setProgress(1);
    ready = true;
    showStatus();
    await frames(2);
    return handheld;
})();
const frames = (n) => new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });

// act 2
const iris = $('iris');
const toPsp = async () => {
    if (phase !== 'mark') return;
    phase = 'psp';
    // the room starts under the name, and the name fades into it
    body.classList.add('is-dark');
    body.dataset.stage = 'psp';
    stage.classList.add('is-lit');
    handheld.setActive(true);
    field.start();
    let landed;
    if (room) {
        // an establishing shot that glides into the room
        handheld.jumpTo('roomFar');
        landed = handheld.setMode('room', reduced ? 1 : 3200);
        setTimeout(() => { if (phase === 'psp' || phase === 'room') room.say('welcome'); }, reduced ? 0 : 1800);
    } else {
        landed = handheld.enter();
    }
    mark.classList.add('is-out');
    (intro ? intro.leave() : sleep(700)).then(() => { mark.hidden = true; });
    await landed;
    if (phase !== 'psp') return;
    send({ type: 'xmb-arm' });
    hint.classList.add('is-lit');
    if (room) { landedInRoom(); return; }
    handheld.glint();
    phase = 'armed';
};
const landedInRoom = () => {
    phase = 'room';
    body.dataset.stage = 'room';
    skipBtn.hidden = true;
    setFrameClicks();
    // (no day / night toggle: the room follows the time of day in South Africa)
    soundBtn.hidden = false; showSound();
    showNav();                                  // the top menu is always there: one click into the PSP
    room?.hello();
};

// act 3
const start = async () => {
    if (phase !== 'armed') return;
    showSite();
    send({ type: 'xmb-start' });
    // "skip intro" stays for the disclaimer; it goes when the menu is up
    // (xmb-menu), or after a while as a fallback
    setTimeout(() => { skipBtn.hidden = true; }, 9000);
    if (room) { room.closeOverlays(); setTimeout(() => room.say('enterPsp'), 1700); }
    await handheld.setMode('immersive', room ? 2000 : 1600);
};

// PSP or desktop: a switch (bottom centre, under the screen) while you're in the portfolio
const viewSwitch = $('view-switch');
const paintSwitch = () => viewSwitch.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === device)));
const switchDevice = async (dev) => {
    if (phase !== 'site' || !room || !device || dev === device) return;
    if (device === 'psp') room.putDown();
    device = dev; body.dataset.device = dev; paintSwitch();
    document.activeElement?.blur?.();
    if (dev === 'psp') { room.pickUp(); handheld.useScreen('psp'); await handheld.setMode('immersive', 1500); }
    else { handheld.useScreen(room.monitorScreen); await handheld.setMode('monitor', 1500); }
};
viewSwitch.addEventListener('click', (e) => { const b = e.target.closest('button[data-view]'); if (b) switchDevice(b.dataset.view); });

// in the room: into the portfolio on the PSP or the PS3, and back out
const enterDevice = async (dev) => {
    if (phase !== 'room' || !room) return;
    room.closeOverlays();
    showTip(null);
    phase = 'site';
    device = dev;
    body.dataset.stage = 'site';
    body.dataset.device = dev;
    hint.classList.remove('is-lit');
    roomBtn.hidden = false;
    setBack('room');
    showNav();
    setFrameClicks();
    document.activeElement?.blur?.();
    if (!xmbStarted) {
        // the first time: the XMB boots (its intro can still be skipped)
        xmbStarted = true;
        send({ type: 'xmb-start' });
        // (no skip button: the start-up just plays)
        setTimeout(() => { skipBtn.hidden = true; }, 9000);
    }
    viewSwitch.hidden = false; paintSwitch();
    if (dev === 'psp') {
        room.pickUp();
        handheld.useScreen('psp');
        setTimeout(() => room.say('enterPsp'), 1700);
        await handheld.setMode('immersive', 1800);
    } else {
        handheld.useScreen(room.monitorScreen);
        setTimeout(() => room.say('enterPs3'), 1500);
        await handheld.setMode('monitor', 1700);
    }
};
const enterRoom = () => {
    if (phase !== 'site' || !room) return;
    showTip(null);
    phase = 'room';
    body.dataset.stage = 'room';
    delete body.dataset.device;
    setFrameClicks();
    roomBtn.hidden = true;
    viewSwitch.hidden = true;
    skipBtn.hidden = true;
    hint.classList.add('is-lit');
    document.activeElement?.blur?.();
    // the PSP goes back on the shelf, and the XMB back to the monitor
    if (device === 'psp') { room.putDown(); handheld.useScreen(room.monitorScreen); }
    device = null;
    handheld.setMode('room', 1800);
    setTimeout(() => room.say('backHome'), 900);
};
roomBtn.addEventListener('click', () => {
    if (phase === 'room') { room?.back(); return; }        // a card, the thing you're holding, a close-up: one step back
    enterRoom();
});

const skip = async () => {
    // in the room, "skip intro" skips the XMB's own intro
    if (room && phase === 'site') { send({ type: 'xmb-skip' }); skipBtn.hidden = true; return; }
    if (skipWanted && (phase === 'site' || phase === 'room')) return;
    skipWanted = true;
    skipBtn.hidden = true;
    intro?.dispose();
    try { await ensureHandheld(); } catch { return; }   // the boot below reports it
    if (phase === 'site' || phase === 'room') return;
    mark.hidden = true;
    iris.hidden = true;
    body.classList.add('is-dark');
    stage.classList.add('is-lit');
    handheld.setActive(true);
    field.start();
    if (room) {
        // straight into the room
        handheld.jumpTo('room');
        send({ type: 'xmb-arm' });
        hint.classList.add('is-lit');
        landedInRoom();
        setTimeout(() => room.say('welcome'), 600);
        return;
    }
    phase = 'site';
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
        // let the mark play out, even on a fast connection; then it's the
        // loading screen until everything is ready
        await Promise.all([markDone, glbPromise]);
        if (!skipWanted) {
            await ensureHandheld();
            await sleep(250);                       // a beat on the full bar before the stage opens
            if (!skipWanted) toPsp();
        }
    }
    if (!handheld) await ensureHandheld();
} catch (err) {
    console.error(err);
    phase = 'error';
    ready = true; showStatus();                 // no more loading screen
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
    if (moved < 7 && !room) start();      // in the room it's the PSP itself you click (onPspClick)
});

// z / c / Space / p are for Tetris (rotate left / hold / hard drop / pause)
// w / a / s / d are for Ilifa (they press the D-pad)
const FORWARD = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace', 'z', 'Z', 'c', 'C', ' ', 'p', 'P',
    'w', 'W', 'a', 'A', 's', 'S', 'd', 'D']);
const MESH_FOR = { Backspace: 'Escape', Z: 'z', C: 'c', ' ': 'Enter', P: 'p',
    w: 'ArrowUp', W: 'ArrowUp', a: 'ArrowLeft', A: 'ArrowLeft', s: 'ArrowDown', S: 'ArrowDown', d: 'ArrowRight', D: 'ArrowRight' };
// releases too, so a game can tell a held key (Ilifa: hold ← → to run)
window.addEventListener('keyup', (e) => {
    if (phase === 'site' && FORWARD.has(e.key)) send({ type: 'xmb-keyup', key: e.key });
});
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
    if (phase === 'armed') {
        if (room?.overlayOpen()) return;
        e.preventDefault(); start(); return;
    }
    if (phase === 'room') {
        if (room.overlayOpen()) return;           // the photo album has the keys
        if ((e.key === 'Escape' || e.key === 'Backspace') && room.back()) { e.preventDefault(); return; }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterDevice('ps3'); }
        return;
    }
    if (phase !== 'site' || !FORWARD.has(e.key)) return;
    e.preventDefault();
    if (!room || device === 'psp') handheld.press(MESH_FOR[e.key] || e.key);
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
