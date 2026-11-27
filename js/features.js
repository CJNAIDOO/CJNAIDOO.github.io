// ============================================================================
// Extra XMB features, layered on top of script.js without changing it:
//   - info overlays for My Academics, My Expertise, My Projects, Let's Connect
//   - My Projects: one row per project, styled like My Academics
//   - a PSN-style "Create Message" box for email
//   - ✕ / Enter to open, ○ / Esc / Backspace to go back, mouse + touch support
//   - on-screen button prompts
// Content comes from js/content.js (PORTFOLIO).
// ============================================================================
(() => {
    const C = PORTFOLIO
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    const chips = (items, cls = '') => `<ul class="chip-row ${cls}">${(items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
    const rowById = (id) => document.querySelector(`.submenu[data-id="${id}"]`)
    const currentRow = () => submenuItems(sections[sectionNumber])[focusedItem[sectionNumber]] || null
    const playNav = () => { try { navSound.currentTime = 0; navSound.play() } catch {} }

    // ------------------------------------------------------------------------
    // Overlays: a full-screen layer inside a row, shown while that row is focused
    // (same idea as Home's Welcome card).
    // ------------------------------------------------------------------------
    const addOverlay = (id, kind, panelHtml, photo, logo) => {
        const row = rowById(id)
        if (!row) return
        const el = document.createElement('div')
        el.className = `xmb-overlay ${kind}-overlay${photo ? ' has-photo' : ''}`
        const photoLayer = photo
            ? `<div class="overlay-photo" style="background-image:url('${esc(photo)}')"></div>`
            : ''
        // the school's / university's / project's logo, bottom left of the screen
        const logoLayer = logo ? `<div class="overlay-logo"><img src="${esc(logo)}" alt=""></div>` : ''
        el.innerHTML = `${photoLayer}<div class="overlay-scrim"></div>${logoLayer}<div class="overlay-panel">${panelHtml}</div>`
        row.appendChild(el)
    }

    // PlayStation-style trophies for achievements (platinum / gold / silver):
    // a plain list, each with a small trophy
    const TIERS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver' }
    const trophyList = (items, heading = true) => {
        const list = (items || []).filter((t) => TIERS[t.tier])
        if (!list.length) return ''
        return `
            ${heading ? '<p class="panel-label">Trophies</p>' : ''}
            <ul class="trophy-list${list.some((t) => t.tier === 'platinum') || list.length > 3 ? '' : ' is-one-row'}">${list.map((t) => `
                <li class="trophy is-${t.tier}">
                    <img class="trophy__icon" src="images/trophies/${t.tier}.png" alt="${TIERS[t.tier]} trophy">
                    <span class="trophy__title">${esc(t.title)}</span>${t.detail ? `<span class="trophy__detail">${esc(t.detail)}</span>` : ''}
                </li>`).join('')}
            </ul>`
    }
        // run on from the summary sentence: "...with seven distinctions; Physical Science (95%), ..."
    const subjectList = (subjects) => subjects?.length
        ? `; ${subjects.map((x) => esc(x.mark ? `${x.name} (${x.mark})` : x.name)).join(', ')}.`
        : ''

    for (const [id, a] of Object.entries(C.academics)) {
        addOverlay(id, 'academic', `
            <h2 class="panel-title">${esc(a.name)}</h2>
            <p class="panel-meta">${esc(a.years)}${a.location ? ` &middot; ${esc(a.location)}` : ''}</p>
            <p class="panel-summary">${esc(a.summary)}${subjectList(a.subjects)}</p>
            ${a.trophies?.length ? trophyList(a.trophies) : (a.highlights?.length ? `<p class="panel-label">Highlights</p>${chips(a.highlights, 'is-gold')}` : '')}
            ${a.details?.length ? `<dl class="panel-details">${a.details.map((d) => `<div><dt>${esc(d.label)}</dt><dd>${esc(d.value)}</dd></div>`).join('')}</dl>` : ''}
        `, a.photo, a.logo)
    }

    if (C.about) {
        const a = C.about
        const paras = Array.isArray(a.summary) ? a.summary : [a.summary]
        addOverlay('about', 'about', `
            ${paras.map((t, i) => `<p class="panel-summary${i === 0 ? ' panel-lead' : ''}">${esc(t)}</p>`).join('')}
        `, a.photo)
    }

    // My Expertise: just the tools: icon, name and what it's for.
    // Anything still being learnt goes to the end of its list.
    const initials = (name) => name.split(/[\s&.]+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    for (const [id, s] of Object.entries(C.expertise)) {
        addOverlay(id, 'skills', `
            <ul class="tool-list">${[...(s.tools || [])].sort((a, b) => !!a.learning - !!b.learning).map((t) => `
                <li class="tool${t.learning ? ' is-learning' : ''}">
                    <span class="tool__icon">${t.icon
                        ? `<img${t.mono ? ' class="is-mono"' : ''} src="images/tech/${esc(t.icon)}.svg" alt="">`
                        : `<span class="tool__initials">${esc(initials(t.name))}</span>`}</span>
                    <span class="tool__text">
                        <span class="tool__name">${esc(t.name)}${t.learning ? ' <span class="tool__tag">Learning</span>' : ''}</span>
                        <span class="tool__note">${esc(t.note || '')}</span>
                    </span>
                </li>`).join('')}
            </ul>
        `)
    }

    // My Projects: one row per project, laid out like My Academics: the
    // project's own background photo, its logo bottom left, and the write-up
    // on the right. ✕ opens the live site, or the code if there isn't one.
    for (const [id, p] of Object.entries(C.projects)) {
        addOverlay(id, 'project', `
            <h2 class="panel-title">${esc(p.title)}</h2>
            <p class="panel-meta">${[p.year, p.status].filter(Boolean).map(esc).join(' &middot; ')}</p>
            <p class="panel-summary">${esc(p.summary)}</p>
            ${p.stack?.length ? chips(p.stack) : ''}
            ${trophyList(p.trophies, false)}
            ${p.video ? '<button type="button" class="panel-watch" data-video>&#9654;&ensp;Watch the demo video</button>' : ''}
        `, p.photo, p.logo)
    }

    // ------------------------------------------------------------------------
    // Toasts + opening links (works standalone and on the PSP's screen)
    // ------------------------------------------------------------------------
    const toast = document.createElement('p')
    toast.className = 'xmb-toast'
    toast.setAttribute('role', 'status')
    document.body.appendChild(toast)
    let toastTimer
    const showToast = (text) => {
        toast.textContent = text
        toast.classList.add('is-visible')
        clearTimeout(toastTimer)
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600)
    }

    // Links open on the PSP's screen itself (shell/js/link-viewer.js, loaded the first time): GitHub,
    // LinkedIn, YouTube... with ○ to go back to the menu. Only a live app (a project's running
    // site) pops up over the whole site, in the shell's viewer; on its own the XMB opens it in a tab.
    let screenViewer = null
    const screenLinks = () => screenViewer ||= import(new URL('shell/js/link-viewer.js?v=97', document.baseURI).href)
        .then((m) => { const v = m.createLinkViewer({ screen: true }); window.XMB_LINKS = v; return v })
    const openLink = (url, { live = false, label = '' } = {}) => {
        if (!url) { showToast('Link coming soon'); return }
        if (live) {
            if (window.parent !== window) window.parent.postMessage({ type: 'open-url', url }, '*')
            else window.open(url, '_blank', 'noopener')
            return
        }
        screenLinks().then((v) => v.show(url, label)).catch(() => window.open(url, '_blank', 'noopener'))
    }
    window.XMB_OPEN_LINK = (url, label) => openLink(url, { label })
    // ✕ on GitHub, LinkedIn and a project's code / live app opens a new browser tab, every time; the
    // menu stays where it is. (An anchor click counts as the key press's user gesture, so it isn't blocked.)
    const openTab = (url) => {
        if (!url) { showToast('Link coming soon'); return }
        const a = document.createElement('a')
        a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.dataset.newtab = ''
        document.body.appendChild(a); a.click(); a.remove()
    }

    // ------------------------------------------------------------------------
    // Button prompts (bottom right)
    // ------------------------------------------------------------------------
    const prompts = document.createElement('div')
    prompts.className = 'xmb-prompts'
    document.getElementById('menu').appendChild(prompts)
    const GLYPH_SVG = {
        x: '<svg viewBox="0 0 20 20"><path d="M6 6l8 8M14 6l-8 8"/></svg>',
        o: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="4.6"/></svg>',
        t: '<svg viewBox="0 0 20 20"><path d="M10 5.2l5 8.6H5z"/></svg>',
    }
    const prompt = (btn, text) => `<span class="prompt"><i class="glyph glyph-${btn}" aria-hidden="true">${GLYPH_SVG[btn]}</i>${esc(text)}</span>`

    const actionLabels = { linkedin: 'Open LinkedIn', github: 'Open GitHub', email: 'Write a message' }
    const updatePrompts = () => {
        if (compose.open) { prompts.innerHTML = prompt('o', 'Cancel'); return }
        const id = currentRow()?.dataset.id
        const p = C.projects[id]
        const label = C.games?.[id]?.play ? (C.games[id].demo ? 'Play demo' : 'Play') : p ? (p.live ? 'Open live site' : p.repo ? 'View code' : '') : actionLabels[id]
        prompts.innerHTML = (label ? prompt('x', label) : '') + (p?.video ? prompt('t', 'Watch video') : '')
    }

    // ------------------------------------------------------------------------
    // PSN-style "Create Message" box
    // ------------------------------------------------------------------------
    const compose = { open: false }
    const composeEl = document.createElement('div')
    composeEl.className = 'psn-compose'
    composeEl.hidden = true
    composeEl.innerHTML = `
        <div class="psn-window" role="dialog" aria-modal="true" aria-labelledby="psn-title">
            <header class="psn-bar">
                <span class="psn-icon" aria-hidden="true">&#9993;</span>
                <h2 id="psn-title">Create Message</h2>
            </header>
            <form class="psn-form" novalidate>
                <div class="psn-row"><span class="psn-label">To</span><span class="psn-to">${esc(C.connect.email.to)}</span></div>
                <label class="psn-row"><span class="psn-label">From</span><input id="psn-name" name="name" autocomplete="name" placeholder="Your name" required></label>
                <label class="psn-row"><span class="psn-label">Reply to</span><input id="psn-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></label>
                <label class="psn-row"><span class="psn-label">Subject</span><input id="psn-subject" name="subject" placeholder="Hi Cameron"></label>
                <label class="psn-body"><span class="psn-label">Message</span><textarea id="psn-message" name="message" rows="6" required></textarea></label>
                <input class="psn-bot" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">
                <p class="psn-status" role="status"></p>
                <footer class="psn-foot">
                    <button type="button" class="psn-btn" data-act="cancel"><i class="glyph glyph-o" aria-hidden="true">${GLYPH_SVG.o}</i>Cancel</button>
                    <button type="submit" class="psn-btn is-primary"><i class="glyph glyph-x" aria-hidden="true">${GLYPH_SVG.x}</i>Send</button>
                </footer>
            </form>
        </div>`
    document.body.appendChild(composeEl)
    const form = composeEl.querySelector('form')
    const statusEl = composeEl.querySelector('.psn-status')

    const openCompose = () => {
        compose.open = true
        composeEl.hidden = false
        statusEl.textContent = ''
        statusEl.className = 'psn-status'
        updatePrompts()
        setTimeout(() => document.getElementById('psn-name').focus(), 50)
    }
    const closeCompose = () => {
        compose.open = false
        composeEl.hidden = true
        updatePrompts()
    }
    composeEl.querySelector('[data-act="cancel"]').addEventListener('click', closeCompose)

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(form))
        if (!data.name || !data.email || !data.message) {
            statusEl.textContent = 'Add your name, an email to reply to, and a message.'
            statusEl.className = 'psn-status is-error'
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            statusEl.textContent = "That reply-to email doesn't look right."
            statusEl.className = 'psn-status is-error'
            return
        }
        const { endpoint, web3formsKey: key } = C.connect.email
        if (!endpoint && !key) {
            statusEl.textContent = "Messages aren't connected yet (add the Worker address or a Web3Forms key in js/content.js)."
            statusEl.className = 'psn-status is-error'
            return
        }
        statusEl.textContent = 'Sending…'
        statusEl.className = 'psn-status'
        try {
            const res = await fetch(endpoint || 'https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    ...(endpoint ? {} : { access_key: key }),
                    from_name: 'XMB Portfolio',
                    name: data.name,
                    email: data.email,
                    subject: data.subject || `Portfolio message from ${data.name}`,
                    message: data.message,
                    botcheck: data.botcheck ? true : '',
                }),
            })
            const out = await res.json().catch(() => ({}))
            if (!res.ok || out.success === false) throw new Error(out.message || res.statusText)
            statusEl.textContent = 'Message sent. Thanks, I’ll get back to you soon.'
            statusEl.className = 'psn-status is-ok'
            form.reset()
        } catch (err) {
            statusEl.textContent = `Couldn't send that: ${err.message}. Try again in a moment.`
            statusEl.className = 'psn-status is-error'
        }
    })

    // ------------------------------------------------------------------------
    // ✕ / ○ and keys. Runs before script.js's listener (capture phase) so an
    // open message box gets the keys instead of the XMB behind it.
    // ------------------------------------------------------------------------
    const CONFIRM = new Set(['Enter'])
    const BACK = new Set(['Escape', 'Backspace'])
    const openProject = (p) => {
        if (!p.live && !p.repo) { showToast('Link coming soon'); return }
        openTab(p.live || p.repo)
    }
    const actions = {
        ...Object.fromEntries(Object.entries(C.projects).map(([id, p]) => [id, () => openProject(p)])),
        tetris: () => window.XMB_TETRIS?.open(),
        ilifa: () => { window.XMB_ILIFA?.open(); document.dispatchEvent(new CustomEvent('ilifa:open')) },
        linkedin: () => openTab(C.connect.linkedin),
        github: () => openTab(C.connect.github),
        email: () => openCompose(),
    }

    window.addEventListener('keydown', (e) => {
        if (!menuReady || window.XMB_LINKS?.open) return
        const typing = e.target instanceof Element && e.target.closest('input, textarea')

        if (compose.open) {
            e.stopImmediatePropagation()           // keep arrows/typing inside the box
            if (e.key === 'Escape') { e.preventDefault(); closeCompose() }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit() }
            return
        }
        if (typing) return

        if ((e.key === 'c' || e.key === 'C') && C.projects[currentRow()?.dataset.id]?.video) {     // △: the demo video, on the PSP's screen
            e.preventDefault(); openLink(C.projects[currentRow().dataset.id].video, { label: 'Demo video' }); return
        }
        if (CONFIRM.has(e.key)) {
            const action = actions[currentRow()?.dataset.id]
            if (action) { e.preventDefault(); action() }
        }
    }, true)

    // ------------------------------------------------------------------------
    // Mouse / touch: click a category icon to go there, click a row to focus
    // it, click the focused row to open it.
    // ------------------------------------------------------------------------
    sections.forEach((sectionEl, sn) => {
        const icon = sectionEl.querySelector(':scope > img')
        icon?.addEventListener('click', () => {
            if (!menuReady || compose.open) return
            if (focusSection(sn)) playNav()
        })
        submenuItems(sectionEl).forEach((row, i) => {
            row.addEventListener('click', (e) => {
                if (!menuReady || compose.open || sn !== sectionNumber) return
                if (e.target.closest('.xmb-overlay')) return
                if (focusedItem[sn] === i) {
                    actions[row.dataset.id]?.()
                } else {
                    focusedItem[sn] = i
                    layoutSubmenu(sn)
                    playNav()
                }
            })
        })
    })

    document.addEventListener('click', (e) => {
        const btn = e.target.closest?.('[data-video]')
        if (!btn) return
        const p = C.projects[btn.closest('.submenu')?.dataset.id]
        if (p?.video) { e.stopPropagation(); openLink(p.video, { label: 'Demo video' }) }
    }, true)

    document.addEventListener('xmb:focus', updatePrompts)

    // MZALA speaks for me: when a project row is focused, the shell has him say what I did on it
    // (the room's guide, or a plain docked caption where there's no room). Once per visit per
    // project, after a short pause so scrolling past doesn't start a line, and it stops on leaving.
    if (window.parent !== window) {
        const spoken = new Set()
        let sayTimer, saying = null
        document.addEventListener('xmb:focus', () => {
            clearTimeout(sayTimer)
            const id = currentRow()?.dataset.id
            const text = C.projects[id]?.says
            if (saying && saying !== id) { window.parent.postMessage({ type: 'xmb-say', text: null }, '*'); saying = null }
            if (!text || spoken.has(id) || saying === id) return
            sayTimer = setTimeout(() => {
                if (currentRow()?.dataset.id !== id) return
                spoken.add(id); saying = id
                window.parent.postMessage({ type: 'xmb-say', id, text }, '*')
            }, 700)
        })
    }

    // Line the right-hand lists (My Expertise, My Projects) up with the
    // focused row's label. The focused row always ends up in the same slot, so
    // measure it once it has slid there, and again on resize.
    let alignTimer
    const alignToRow = () => {
        clearTimeout(alignTimer)
        alignTimer = setTimeout(() => {
            const label = currentRow()?.querySelector(':scope > .submenu-title, :scope > .context')
            if (!label) return
            const r = label.getBoundingClientRect()
            document.documentElement.style.setProperty('--row-y', `${Math.round(r.top + r.height / 2)}px`)
        }, 300)
    }
    document.addEventListener('xmb:focus', alignToRow)

    // Game rows can have a muted gameplay clip as their background. It only
    // loads the first time its row is focused, plays while focused, and stays
    // hidden if the file isn't there.
    document.querySelectorAll('video.game-video').forEach((v) => {
        v.addEventListener('error', () => { v.dataset.missing = '1' }, true)
    })
    const syncGameVideos = () => {
        const row = currentRow()
        document.querySelectorAll('video.game-video').forEach((v) => {
            const on = row && row.contains(v) && !v.dataset.missing
            if (on) {
                if (!v.src) { v.src = v.dataset.src; v.load() }
                v.play().catch(() => {})
            } else if (!v.paused) v.pause()
        })
    }
    document.addEventListener('xmb:focus', syncGameVideos)

    // Ilifa's menu music plays while its row is focused (a demo, so a taste of it), fading in
    // and out, and stops when the game itself opens (it has its own music).
    {
        let tune = null, fade = 0, stopT = 0, ac = null, gain = null, level = 0
        // iPhones and iPads ignore audio.volume (it is read-only there), so the fade runs on a Web Audio
        // gain instead; and the pause never waits on the fade finishing, or the music would play on forever
        const setLevel = (v) => { level = v; if (gain) gain.gain.value = v; else tune.volume = v }
        const ramp = (to, done) => {
            clearInterval(fade)
            fade = setInterval(() => {
                if (!tune) return clearInterval(fade)
                const d = to - level
                if (Math.abs(d) < 0.03) { setLevel(to); clearInterval(fade); done?.() } else setLevel(Math.max(0, Math.min(1, level + Math.sign(d) * 0.03)))
            }, 40)
        }
        const syncIlifaTune = () => {
            const on = currentRow()?.dataset.id === 'ilifa' && !window.XMB_ILIFA?.isOpen
            clearTimeout(stopT)
            if (on) {
                if (!tune) {
                    tune = new Audio('games/ilifa/assets/menu_music.mp3'); tune.loop = true; tune.preload = 'auto'
                    tune.volume = 0.5
                    if (tune.volume !== 0.5) {                      // volume can't be set here (iOS): use a gain node
                        try {
                            const AC = window.AudioContext || window.webkitAudioContext
                            ac = new AC(); gain = ac.createGain(); gain.gain.value = 0
                            ac.createMediaElementSource(tune).connect(gain); gain.connect(ac.destination)
                        } catch { ac = gain = null }
                    }
                    setLevel(0)
                }
                ac?.resume?.()
                tune.play().then(() => ramp(0.35)).catch(() => {})
            } else if (tune && !tune.paused) {
                ramp(0, () => tune.pause())
                stopT = setTimeout(() => { clearInterval(fade); setLevel(0); tune.pause() }, 1200)   // (whatever the fade did)
            }
        }
        document.addEventListener('xmb:focus', syncIlifaTune)
        document.addEventListener('xmb:away', (e) => {        // zoomed out: the menu tune stops at once; zooming back in brings it back
            if (e.detail.away) { clearInterval(fade); clearTimeout(stopT); if (tune) { setLevel(0); tune.pause() } }
            else syncIlifaTune()
        })
        document.addEventListener('ilifa:close', syncIlifaTune)
        document.addEventListener('ilifa:open', syncIlifaTune)
    }
    // a demo video on the PSP's screen stops when you zoom out
    document.addEventListener('xmb:away', (e) => { if (e.detail.away && window.XMB_LINKS?.open) window.XMB_LINKS.close() })
    // Tetris's tune plays quietly, fading in, while its row is focused (the game then carries it on)
    {
        const syncTetrisTune = () => window.XMB_TETRIS?.preview(currentRow()?.dataset.id === 'tetris')
        document.addEventListener('xmb:focus', syncTetrisTune)
        document.addEventListener('tetris:close', syncTetrisTune)
    }
    addEventListener('resize', alignToRow)
    updatePrompts()

    // for the PSP shell and for debugging
    window.XMB_FEATURES = { openCompose, closeCompose, showToast }
})()

// The detail panels sit under the row of category icons, whatever the screen's shape: on the
// desk's wide, short monitor 42% from the top ran into the icons. The icons' bottom edge goes in
// --row-bottom (px), and the panels start below it (scss/controls-mode.css).
;(() => {
    const measure = () => {
        let bottom = 0
        document.querySelectorAll('.xmb-title > img.category-icon').forEach((img) => {
            const r = img.getBoundingClientRect()
            if (r.width) bottom = Math.max(bottom, r.bottom)
        })
        if (bottom) document.documentElement.style.setProperty('--row-bottom', `${Math.round(bottom)}px`)
    }
    addEventListener('resize', measure)
    addEventListener('load', () => { measure(); setTimeout(measure, 600); setTimeout(measure, 2500) })
    new MutationObserver(() => requestAnimationFrame(measure)).observe(document.getElementById('menu') || document.body, { attributes: true, subtree: false })
})()
