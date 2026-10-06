// ============================================================================
// Extra XMB features, layered on top of script.js without changing it:
//   - info overlays for My Academics, My Expertise, My Projects, Let's Connect
//   - project folders (open like a PS3/PSP folder) with a project card
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
    const PHOTO_KINDS = new Set(['academic', 'about'])
    const addOverlay = (id, kind, panelHtml, photo, logo) => {
        const row = rowById(id)
        if (!row) return
        const el = document.createElement('div')
        el.className = `xmb-overlay ${kind}-overlay`
        const photoLayer = PHOTO_KINDS.has(kind)
            ? `<div class="overlay-photo${photo ? '' : ' is-empty'}"${photo ? ` style="background-image:url('${esc(photo)}')"` : ''}></div>`
            : ''
        // the school's / university's logo, bottom left of the screen
        const logoLayer = logo ? `<div class="overlay-logo"><img src="${esc(logo)}" alt=""></div>` : ''
        el.innerHTML = `${photoLayer}<div class="overlay-scrim"></div>${logoLayer}<div class="overlay-panel">${panelHtml}</div>`
        row.appendChild(el)
    }

    // PlayStation-style trophies for achievements (platinum / gold / silver):
    // a plain list, each with a small trophy
    const TIERS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver' }
    const trophyList = (items) => {
        const list = (items || []).filter((t) => TIERS[t.tier])
        if (!list.length) return ''
        return `
            <p class="panel-label">Trophies</p>
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

    for (const [id, f] of Object.entries(C.projects)) {
        const n = f.items.length
        addOverlay(id, 'folder', `
            <p class="panel-eyebrow">My Projects</p>
            <h2 class="panel-title">${esc(f.label)}</h2>
            <p class="panel-meta">${n} project${n === 1 ? '' : 's'}</p>
            <p class="panel-summary">Open the folder to browse them.</p>
        `)
    }

    const connectCopy = {
        linkedin: ['LinkedIn', 'Opens my LinkedIn profile in a new tab.'],
        email: ['Email', 'Write me a message and it lands straight in my inbox.'],
        github: ['GitHub', 'Opens my GitHub profile in a new tab.'],
    }
    for (const [id, [title, text]] of Object.entries(connectCopy)) {
        addOverlay(id, 'connect', `
            <p class="panel-eyebrow">Let's Connect</p>
            <h2 class="panel-title">${esc(title)}</h2>
            <p class="panel-summary">${esc(text)}</p>
        `)
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

    const openLink = (url) => {
        if (!url) { showToast('Link coming soon'); return }
        const inShell = window.parent !== window
        // A click inside the screen can open the tab here; a key pressed on the
        // PSP shell only counts as a click out there, so let the shell open it.
        const canOpenHere = !inShell || (navigator.userActivation ? navigator.userActivation.isActive : true)
        if (canOpenHere) window.open(url, '_blank', 'noopener')
        else window.parent.postMessage({ type: 'open-url', url }, '*')
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
    }
    const prompt = (btn, text) => `<span class="prompt"><i class="glyph glyph-${btn}" aria-hidden="true">${GLYPH_SVG[btn]}</i>${esc(text)}</span>`

    const actionLabels = { academic: 'Open folder', personal: 'Open folder', linkedin: 'Open LinkedIn', github: 'Open GitHub', email: 'Write a message' }
    const updatePrompts = () => {
        if (compose.open) { prompts.innerHTML = prompt('o', 'Cancel'); return }
        if (folder.open) { prompts.innerHTML = prompt('x', 'Open') + prompt('o', 'Back'); return }
        const id = currentRow()?.dataset.id
        prompts.innerHTML = id && actionLabels[id] ? prompt('x', actionLabels[id]) : ''
    }

    // ------------------------------------------------------------------------
    // Project folders
    // ------------------------------------------------------------------------
    const folder = { open: false, kind: null, index: 0 }
    const folderEl = document.createElement('div')
    folderEl.className = 'folder-view'
    folderEl.hidden = true
    document.body.appendChild(folderEl)

    const projectCard = (p, kindLabel) => `
        <p class="panel-eyebrow">Project &middot; ${esc(kindLabel)}</p>
        <h2 class="panel-title">${esc(p.title)}</h2>
        <p class="panel-summary">${esc(p.summary)}</p>
        <p class="panel-label">Built with</p>
        ${chips(p.stack)}
        <dl class="panel-details">
            <div><dt>Role</dt><dd>${esc(p.role)}</dd></div>
            <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
            <div><dt>Status</dt><dd>${esc(p.status)}</dd></div>
        </dl>
        <div class="card-links">
            <button type="button" data-link="live" ${p.live ? '' : 'disabled'}>Open live</button>
            <button type="button" data-link="repo" ${p.repo ? '' : 'disabled'}>View code</button>
        </div>`

    const renderFolder = () => {
        const f = C.projects[folder.kind]
        const p = f.items[folder.index]
        folderEl.innerHTML = `
            <div class="folder-scrim"></div>
            <div class="folder-head"><img src="images/file.png" alt=""><p>${esc(f.label)}</p></div>
            <ul class="folder-list">
                ${f.items.map((it, i) => `
                    <li class="folder-item${i === folder.index ? ' active' : ''}" data-index="${i}">
                        <img src="images/file.png" alt="">
                        <div><p class="item-title">${esc(it.title)}</p><p class="item-meta">${esc(it.year)}${it.status ? ` &middot; ${esc(it.status)}` : ''}</p></div>
                    </li>`).join('')}
            </ul>
            <aside class="project-card">${p ? projectCard(p, f.label) : '<p class="panel-summary">This folder is empty.</p>'}</aside>`
    }
    const openFolder = (kind) => {
        folder.open = true; folder.kind = kind; folder.index = 0
        renderFolder()
        folderEl.hidden = false
        document.body.classList.add('folder-open')
        updatePrompts()
    }
    const closeFolder = () => {
        folder.open = false
        folderEl.hidden = true
        document.body.classList.remove('folder-open')
        updatePrompts()
    }
    const moveFolder = (step) => {
        const n = C.projects[folder.kind].items.length
        const next = folder.index + step
        if (next < 0 || next >= n) return
        folder.index = next
        playNav()
        renderFolder()
    }
    const openProject = (which) => {
        const p = C.projects[folder.kind].items[folder.index]
        if (!p) return
        openLink(which === 'repo' ? p.repo : which === 'live' ? p.live : (p.live || p.repo))
    }
    folderEl.addEventListener('click', (e) => {
        const link = e.target.closest('[data-link]')
        if (link) { openProject(link.dataset.link); return }
        const item = e.target.closest('.folder-item')
        if (item) {
            const i = Number(item.dataset.index)
            if (i === folder.index) openProject()
            else { folder.index = i; playNav(); renderFolder() }
            return
        }
        if (e.target.closest('.folder-head')) closeFolder()
    })

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
        const key = C.connect.email.web3formsKey
        if (!key) {
            statusEl.textContent = "Messages aren't connected yet (add a Web3Forms key in js/content.js)."
            statusEl.className = 'psn-status is-error'
            return
        }
        statusEl.textContent = 'Sending…'
        statusEl.className = 'psn-status'
        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    access_key: key,
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
    // open folder or message box gets the keys instead of the XMB behind it.
    // ------------------------------------------------------------------------
    const CONFIRM = new Set(['Enter'])
    const BACK = new Set(['Escape', 'Backspace'])
    const actions = {
        academic: () => openFolder('academic'),
        personal: () => openFolder('personal'),
        linkedin: () => openLink(C.connect.linkedin),
        github: () => openLink(C.connect.github),
        email: () => openCompose(),
    }

    window.addEventListener('keydown', (e) => {
        if (!menuReady) return
        const typing = e.target instanceof Element && e.target.closest('input, textarea')

        if (compose.open) {
            e.stopImmediatePropagation()           // keep arrows/typing inside the box
            if (e.key === 'Escape') { e.preventDefault(); closeCompose() }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); form.requestSubmit() }
            return
        }
        if (typing) return

        if (folder.open) {
            e.stopImmediatePropagation()
            if (e.key === 'ArrowDown') { e.preventDefault(); moveFolder(1) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); moveFolder(-1) }
            else if (CONFIRM.has(e.key)) { e.preventDefault(); openProject() }
            else if (BACK.has(e.key)) { e.preventDefault(); closeFolder() }
            return
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
            if (!menuReady || folder.open || compose.open) return
            if (focusSection(sn)) playNav()
        })
        submenuItems(sectionEl).forEach((row, i) => {
            row.addEventListener('click', (e) => {
                if (!menuReady || folder.open || compose.open || sn !== sectionNumber) return
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

    document.addEventListener('xmb:focus', updatePrompts)
    updatePrompts()

    // for the PSP shell and for debugging
    window.XMB_FEATURES = { openFolder, closeFolder, openCompose, closeCompose, showToast }
})()
