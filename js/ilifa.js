// ============================================================================
// Ilifa on the XMB: opens the game (games/ilifa/) over the menu, the same way
// Tetris does. Phaser and the game only load the first time it's opened.
//
// Controls (keyboard / PSP):
//   ← → / A D  run      ↑ / W / Space / ✕  jump      ↑ ↓  move in the menu
//   Enter / ✕  select / next intro panel      P / START  pause
//   Esc / Backspace / ○  back to the XMB (the game pauses where it is)
//
// window.XMB_ILIFA = { open(), close(), get isOpen }
// Loaded before features.js, so its key listener runs first while it's open.
// ============================================================================
(() => {
    const DIR = 'games/ilifa/'

    // ---- input: what the game reads -------------------------------------------
    // Keys map to named actions. Every press (the shell forwards keyboard and PSP-button
    // presses with a matching keyup) stays held until its keyup arrives, so holding ← or →
    // keeps you running. The timer is only a safety net in case a keyup is ever lost: it is
    // longer than the keyboard's initial repeat delay (up to about a second) and every key
    // repeat renews it.
    const KEYMAP = {
        ArrowLeft: ['left'], a: ['left'],
        ArrowRight: ['right'], d: ['right'],
        ArrowUp: ['up'], w: ['up'],
        ArrowDown: ['down'], s: ['down'],
        ' ': ['jump', 'confirm'], Enter: ['jump', 'confirm'],
    }
    const held = new Map()             // action -> release timer (or true while a real key is down)
    const handlers = {}
    const input = {
        isDown: (name) => held.has(name),
        on: (name, fn) => { (handlers[name] ||= new Set()).add(fn) },
        off: (name, fn) => { handlers[name]?.delete(fn) },
    }
    const press = (names, trusted, repeat) => {
        for (const n of names) {
            clearTimeout(held.get(n))
            held.set(n, trusted ? true : setTimeout(() => held.delete(n), 2500))
            if (!repeat) handlers[n]?.forEach((fn) => fn())
        }
    }
    const release = (names) => names.forEach((n) => { clearTimeout(held.get(n)); held.delete(n) })
    const releaseAll = () => { held.forEach((t) => clearTimeout(t)); held.clear() }
    const actionsFor = (key) => KEYMAP[key.length === 1 ? key.toLowerCase() : key]

    // ---- screen -----------------------------------------------------------------
    const el = document.createElement('div')
    el.className = 'ilifa'
    el.hidden = true
    el.innerHTML = `
        <div class="ilifa__stage"></div>
        <p class="ilifa__loading">Loading Ilifa…</p>
        <div class="ilifa__paused" hidden><p>Paused</p></div>
        <div class="ilifa__prompts"></div>`
    document.body.appendChild(el)
    const stage = el.querySelector('.ilifa__stage')
    const loadingEl = el.querySelector('.ilifa__loading')
    const pausedEl = el.querySelector('.ilifa__paused')
    const promptsEl = el.querySelector('.ilifa__prompts')

    const GLYPH = {
        x: '<svg viewBox="0 0 20 20"><path d="M6 6l8 8M14 6l-8 8"/></svg>',
        o: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="4.6"/></svg>',
    }
    const prompt = (b, text) => `<span class="prompt"><i class="glyph glyph-${b}" aria-hidden="true">${GLYPH[b]}</i>${text}</span>`
    const startBtn = (text) => `<span class="prompt"><i class="glyph-start" aria-hidden="true">START</i>${text}</span>`
    const setPrompts = () => {
        promptsEl.innerHTML = paused ? startBtn('Resume') + prompt('o', 'Back') : startBtn('Pause') + prompt('o', 'Back')
    }

    // ---- loading ----------------------------------------------------------------
    const script = (src) => new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = src
        s.onload = resolve
        s.onerror = () => reject(new Error(`couldn't load ${src}`))
        document.head.appendChild(s)
    })
    const font = () => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap'
        document.head.appendChild(link)
        // don't hold the game up for more than ~1.5 s if the font is slow or blocked
        const ready = new Promise((r) => { link.onload = r; link.onerror = r })
            .then(() => document.fonts?.load('700 20px Cinzel'))
            .catch(() => {})
        return Promise.race([ready, new Promise((r) => setTimeout(r, 1500))])
    }
    let game = null
    let loading = null
    const load = () => loading ||= Promise.all([
        window.Phaser ? null : script(DIR + 'lib/phaser.min.js').then(() => script(DIR + 'ilifa.js')),
        font(),
    ]).then(() => {
        game = window.ILIFA_GAME.create({ parent: stage, input, onQuit: () => close() })
        loadingEl.hidden = true
    }).catch((err) => {
        console.error(err)
        loading = null
        loadingEl.textContent = 'Ilifa couldn’t load. Press ○ to go back.'
    })

    // ---- open / close -------------------------------------------------------------
    let isOpen = false
    let paused = false
    const setPaused = (on) => {
        paused = on
        pausedEl.hidden = !on
        if (game) {
            if (on) { game.pause(); game.sound.pauseAll() }
            else { game.resume(); game.sound.resumeAll() }
        }
        releaseAll()
        setPrompts()
    }

    // open resumes the game where it was left
    const open = () => {
        if (isOpen) return
        isOpen = true
        el.hidden = false
        document.body.classList.add('ilifa-open')
        releaseAll()
        if (game) setPaused(false)
        else { paused = false; pausedEl.hidden = true; setPrompts(); load() }
    }
    const close = () => {
        if (!isOpen) return
        if (game) setPaused(true)
        isOpen = false
        el.hidden = true
        pausedEl.hidden = true
        document.body.classList.remove('ilifa-open')
        document.dispatchEvent(new CustomEvent('ilifa:close'))
    }

    window.addEventListener('keydown', (e) => {
        if (!isOpen) return
        e.stopImmediatePropagation()
        e.preventDefault()
        if (e.key === 'Escape' || e.key === 'Backspace') { close(); return }
        if (e.key === 'p' || e.key === 'P') { if (game) setPaused(!paused); return }
        if (paused || !game) return
        const names = actionsFor(e.key)
        if (names) press(names, e.isTrusted, e.repeat)
    }, true)
    window.addEventListener('keyup', (e) => {
        if (!isOpen) return
        const names = actionsFor(e.key)
        if (names) release(names)
    }, true)
    window.addEventListener('blur', releaseAll)
    // zoomed out of the PSP / PS3: the game pauses (and its music with it); zooming back in shows it paused
    document.addEventListener('xmb:away', (e) => { if (e.detail.away) { releaseAll(); if (isOpen && game && !paused) setPaused(true) } })

    window.XMB_ILIFA = { open, close, get isOpen() { return isOpen }, get game() { return game } }
})()
