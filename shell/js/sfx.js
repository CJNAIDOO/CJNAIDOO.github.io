// MZALA's noises: little synthesised beeps (no sound files). One audio
// context for the whole page; browsers only let it start after your first
// click or key press, so anything before that is silent.
//
// The sound button (bottom left, next to dark / light) mutes him; the choice
// is remembered in this browser.
const KEY = 'room-sound';
let ac = null, out = null;
let muted = (() => { try { return localStorage.getItem(KEY) === 'off'; } catch { return false; } })();
let volume = (() => { try { const v = parseFloat(localStorage.getItem(KEY + '-vol')); return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.8; } catch { return 0.8; } })();
const listeners = new Set();

const ctx = () => {
    if (!ac) {
        try {
            ac = new (window.AudioContext || window.webkitAudioContext)();
            out = ac.createGain();
            out.gain.value = muted ? 0 : volume;
            out.connect(ac.destination);
        } catch { ac = null; }
    }
    return ac;
};
const wake = () => { const a = ctx(); if (a && a.state !== 'running') a.resume().catch(() => {}); };
addEventListener('pointerdown', wake, { capture: true });
addEventListener('keydown', wake, { capture: true });

const live = () => { const a = ctx(); return a && a.state === 'running' && !muted ? a : null; };

// one tone: type, from -> to Hz over `dur` s, starting `at` s from now
const tone = (a, { type = 'square', from, to = from, dur = 0.08, at = 0, vol = 0.03 }) => {
    const t = a.currentTime + at;
    const o = a.createOscillator(), v = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    v.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(v).connect(out);
    o.start(t); o.stop(t + dur + 0.02);
};
const r = (a, b) => a + Math.random() * (b - a);
// the meme board (myinstants.com): what MZALA plays when you poke him
const MI = 'https://www.myinstants.com/media/sounds/';
const MEMES = {
    violin: MI + 'tf_nemesis.mp3',                 // the sad violin
    siren: MI + '999-social-credit-siren.mp3',     // -999 social credit
    damage: MI + 'emotional-damage-meme.mp3',
    sus: MI + 'among-us-role-reveal-sound.mp3',
    pipe: MI + 'metal-pipe-clang.mp3',
    sponge: MI + 'spongebob-fail.mp3',           // the SpongeBob fail
    bruh: MI + 'bruh-sound-effect_WstdzdM.mp3',
    boom: MI + 'vine-boom.mp3',
    xp: MI + 'erro.mp3',                         // the Windows XP error
    huh: MI + 'huh-cat.mp3',
    bonk: MI + 'bonk_7zPAD7C.mp3',               // the doge bonk
    oof: MI + 'roblox-death-sound_1.mp3',
    wasted: MI + 'gta-v-wasted-death-sound.mp3',
    stopit: MI + 'untitled3_13.mp3',             // "Stop it. Get some help."
    alert: MI + 'metal-gear-alert-sound-effect_XKoHReZ.mp3',   // the Metal Gear "!"
    dodge: MI + 'dbz-dodge.mp3',                 // the DBZ instant-transmission dodge
    missed: MI + 'doh-i-missed.mp3',             // Wario: "D'oh, I missed!"
};

export const sfx = {
    // a typing blip while he talks
    blip() { const a = live(); if (a) tone(a, { from: r(280, 540), dur: 0.06, vol: 0.025 }); },
    // R2-ish chatter: a few quick random beeps (when he's idle, or poked)
    chirp(n = 3 + Math.floor(Math.random() * 3)) {
        const a = live(); if (!a) return;
        let at = 0;
        for (let i = 0; i < n; i++) {
            const f = r(700, 1900), d = r(0.04, 0.09);
            tone(a, { type: Math.random() < 0.5 ? 'sine' : 'square', from: f, to: f * r(0.7, 1.5), dur: d, at, vol: 0.022 });
            at += d + r(0.01, 0.05);
        }
    },
    // popping up: a rising boing and a happy double beep
    pop() {
        const a = live(); if (!a) return;
        tone(a, { type: 'sine', from: 180, to: 760, dur: 0.22, vol: 0.06 });
        tone(a, { type: 'square', from: 1200, dur: 0.06, at: 0.24, vol: 0.025 });
        tone(a, { type: 'square', from: 1600, dur: 0.08, at: 0.32, vol: 0.025 });
    },
    // hopping off: up, then a falling whistle
    hop() {
        const a = live(); if (!a) return;
        tone(a, { type: 'sine', from: 400, to: 900, dur: 0.12, vol: 0.05 });
        tone(a, { type: 'sine', from: 900, to: 160, dur: 0.35, at: 0.12, vol: 0.04 });
    },
    // dance sounds: a vinyl scratch, a whoosh for a spin, a beep-boop for the robot
    scratch() {
        const a = live(); if (!a) return;
        const len = 0.28, buf = a.createBuffer(1, a.sampleRate * len, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const src = a.createBufferSource(); src.buffer = buf;
        const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6;
        const t = a.currentTime;
        bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.1); bp.frequency.exponentialRampToValueAtTime(500, t + len);
        const v = a.createGain(); v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.09, t + 0.02); v.gain.exponentialRampToValueAtTime(0.0001, t + len);
        src.connect(bp).connect(v).connect(out); src.start(t); src.stop(t + len);
    },
    whoosh() {
        const a = live(); if (!a) return;
        tone(a, { type: 'sine', from: 300, to: 1400, dur: 0.25, vol: 0.035 });
        tone(a, { type: 'sine', from: 1400, to: 500, dur: 0.25, at: 0.25, vol: 0.03 });
    },
    beepboop() {
        const a = live(); if (!a) return;
        [880, 660, 990, 520].forEach((f, i) => tone(a, { type: 'square', from: f, dur: 0.07, at: i * 0.11, vol: 0.02 }));
    },
    // falling over: a dull thud
    thud() {
        const a = live(); if (!a) return;
        tone(a, { type: 'sine', from: 150, to: 45, dur: 0.22, vol: 0.12 });
        tone(a, { type: 'triangle', from: 90, to: 40, dur: 0.12, at: 0.02, vol: 0.06 });
    },
    // cross: a low, buzzy grumble
    grumble() {
        const a = live(); if (!a) return;
        [0, 0.13, 0.26].forEach((at, i) => tone(a, { type: 'sawtooth', from: 220 - i * 30, to: 120 - i * 15, dur: 0.11, at, vol: 0.03 }));
    },
    // a soft little tick for each step
    step() { const a = live(); if (a) tone(a, { type: 'triangle', from: r(1900, 2300), to: 900, dur: 0.025, vol: 0.012 }); },
    // a computer "ready" chime (the room's loaded)
    ready() {
        const a = live(); if (!a) return;
        [660, 880, 1320].forEach((f, i) => tone(a, { type: 'sine', from: f, dur: 0.18, at: i * 0.09, vol: 0.035 }));
    },
    // meme sounds for MZALA's reactions: our own copy in audio/memes/ if it's there,
    // otherwise straight from Myinstants. Cut off after `max` seconds.
    meme(name, max = 5) {
        if (muted) return;
        const src = MEMES[name]; if (!src) return;
        const play = (url, fallback) => {
            const a = new Audio(url); a.volume = 0.6 * volume;
            if (fallback) a.addEventListener('error', () => play(fallback, null), { once: true });
            a.play().catch(() => {});
            setTimeout(() => { a.pause(); }, max * 1000);
        };
        play(`audio/memes/${name}.mp3`, src);
    },
    get muted() { return muted; },
    get unlocked() { return !!ac && ac.state === 'running'; },
    setMuted(m) {
        muted = !!m;
        try { localStorage.setItem(KEY, muted ? 'off' : 'on'); } catch { /* fine */ }
        if (out) out.gain.value = muted ? 0 : volume;
        listeners.forEach((fn) => fn(muted));
    },
    get volume() { return volume; },
    setVolume(v) {
        volume = Math.min(1, Math.max(0, +v || 0));
        try { localStorage.setItem(KEY + '-vol', String(volume)); } catch { /* fine */ }
        if (out) out.gain.setTargetAtTime(muted ? 0 : volume, out.context.currentTime, 0.02);
    },
    onMute(fn) { listeners.add(fn); },
    // run fn as soon as sound can play (now, or on the first click / key)
    whenUnlocked(fn) {
        if (sfx.unlocked) { fn(); return; }
        const go = () => { removeEventListener('pointerdown', go, true); removeEventListener('keydown', go, true); setTimeout(fn, 60); };
        addEventListener('pointerdown', go, true);
        addEventListener('keydown', go, true);
    },
};
