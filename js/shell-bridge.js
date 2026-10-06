// Lets the 3D PSP shell (index.html) drive this page when it's running on the
// PSP's screen. Opening xmb.html on its own behaves exactly as before.
//
//   xmb.html?boot=skip  -> straight to the menu (handy while developing)
//   messages from the shell:
//     { type: 'xmb-start' }          the shell's "Start" press: on the PSP the XMB's own
//                                    title sequence is skipped (the shell has its intro);
//                                    the disclaimer shows, then the menu
//     { type: 'xmb-key', key }       a button press (arrows, Enter, Escape, ...)
//     { type: 'xmb-home' }           jump back to the first section
//     { type: 'xmb-arm' }            show a pulsing "press start" on the dark screen
//     { type: 'xmb-skip' }           skip the intro and go straight to the menu
//     { type: 'xmb-go', index }      open a main section (the shell's top menu)
//   messages to the shell:
//     { type: 'xmb-ready', sections } loaded; the main section titles, in order
//     { type: 'xmb-at', index }      the section now open
//     { type: 'xmb-menu' }           the menu is up (intro / disclaimer over)
//     { type: 'xmb-tap' }            the screen was tapped before Start (counts as Start)
(() => {
    const inShell = window.parent !== window
    // controls that only exist on the 3D PSP (HOME button, dragging it round)
    document.documentElement.classList.toggle('in-shell', inShell)
    const boot = new URLSearchParams(location.search).get('boot')
    const press = (key) => document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    let started = false

    // browsers can refuse sound inside a frame; don't let that throw
    for (const audio of [navSound, startupSound]) {
        const play = audio.play.bind(audio)
        audio.play = () => play().catch(() => {})
    }

    const toShell = (msg) => { if (inShell) window.parent.postMessage(msg, '*') }
    let clockOn = false
    const startClock = () => { if (!clockOn) { clockOn = true; sideClock() } }

    // menu up: shared by the PSP start, "skip intro" and the top menu
    const showMenu = () => {
        if (menuReady) return
        warning.style.opacity = '0'
        setTimeout(() => warning.remove(), 320)
        menu.style.opacity = '1'
        clockSection.style.opacity = '1'
        startClock()
        menuReady = true
        toShell({ type: 'xmb-menu' })
    }

    // On the PSP: no XMB title sequence (the shell already had an intro).
    // Straight to the disclaimer, then the menu; any button skips the wait.
    const startOnPsp = () => {
        if (started) return
        started = true
        document.removeEventListener('click', startApp)
        document.removeEventListener('keydown', startApp)
        document.getElementById('start-screen').style.display = 'none'
        startupSound.play()
        titles.remove()
        video.play().catch(() => {})
        video.style.opacity = '1'
        warning.style.opacity = '1'
        const timer = setTimeout(showMenu, 5500)
        const early = () => { clearTimeout(timer); document.removeEventListener('keydown', early, true); showMenu() }
        setTimeout(() => document.addEventListener('keydown', early, true), 400)
    }
    const start = () => {
        if (started) return
        if (inShell) { startOnPsp(); return }
        started = true
        startApp()
    }
    if (inShell) {
        // the shell starts things; a tap on the dark screen before that is a Start press
        document.removeEventListener('click', startApp)
        document.removeEventListener('keydown', startApp)
        document.addEventListener('click', () => { if (!started) toShell({ type: 'xmb-tap' }) })
    } else {
        document.addEventListener('click', () => { started = true }, { once: true, capture: true })
        document.addEventListener('keydown', () => { started = true }, { once: true, capture: true })
    }

    window.addEventListener('message', (e) => {
        const d = e.data || {}
        if (d.type === 'xmb-start') {
            if (!started) {
                const flash = document.createElement('div')
                flash.className = 'power-flash'
                document.body.appendChild(flash)
                setTimeout(() => flash.remove(), 1000)
            }
            start()
        }
        if (d.type === 'xmb-key') { if (!started) start(); else press(d.key) }
        if (d.type === 'xmb-home') for (let i = 0; i < sections.length; i++) press('ArrowLeft')
        if (d.type === 'xmb-skip' && !menuReady) skipIntro()
        if (d.type === 'xmb-go') goSection(Number(d.index))
        if (d.type === 'xmb-arm') {
            const prompt = document.querySelector('#start-screen h1')
            if (prompt) { prompt.textContent = 'press start'; prompt.classList.add('press-start') }
        }
    })

    const skipIntro = () => {
        if (menuReady) return
        started = true
        document.removeEventListener('click', startApp)
        document.removeEventListener('keydown', startApp)
        document.getElementById('start-screen').style.display = 'none'
        titles.remove()
        warning.remove()
        video.style.transition = 'none'
        video.style.opacity = '1'
        video.play().catch(() => {})
        menu.style.transition = 'none'
        menu.style.opacity = '1'
        clockSection.style.opacity = '1'
        startClock()
        if (!menuReady) { menuReady = true; toShell({ type: 'xmb-menu' }) }
    }
    if (boot === 'skip') skipIntro()

    // the shell's top menu: go straight to a main section. Skips the intro if
    // it's still playing, and closes an open folder or message box first.
    const goSection = (i) => {
        if (!Number.isInteger(i) || i < 0 || i >= sections.length) return
        if (!menuReady) skipIntro()
        const f = window.XMB_FEATURES
        if (document.body.classList.contains('folder-open')) f?.closeFolder()
        if (document.querySelector('.psn-compose:not([hidden])')) f?.closeCompose()
        if (focusSection(i)) { navSound.currentTime = 0; navSound.play() }
    }
    let reported = -1
    document.addEventListener('xmb:focus', () => {
        if (!inShell || sectionNumber === reported) return
        reported = sectionNumber
        window.parent.postMessage({ type: 'xmb-at', index: sectionNumber }, '*')
    })

    // on the PSP the shell has its own "press start" splash, so keep the
    // screen dark instead of showing "Click anywhere to start"
    if (inShell && boot !== 'skip') {
        const prompt = document.querySelector('#start-screen h1')
        if (prompt) prompt.style.visibility = 'hidden'
    }

    if (inShell) window.parent.postMessage({
        type: 'xmb-ready',
        sections: sections.map((s) => s.querySelector(':scope > .titletext')?.textContent.trim() || ''),
    }, '*')
})()
