// ============================================================================
// Full-screen photo viewer. ✕ / a click in the Photos space opens it
// on the PSP: one big photo, a filmstrip underneath, ← → to move, ○ to go back.
// Photos come from PORTFOLIO.photos.items in js/content.js; a photo left
// as null shows an empty frame until there's a picture for it.
//
// window.XMB_ALBUM = { open('photos', index), close(), get isOpen }
// Loaded before features.js, so its key listener runs first while it's open.
// ============================================================================
(() => {
    const C = PORTFOLIO
    const albums = { photos: { title: C.photos?.title || 'Photos', photos: C.photos?.items || [] } }
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
    const srcOf = (p) => (typeof p === 'string' ? p : p?.src) || null
    const captionOf = (p) => (typeof p === 'object' && p ? p.caption : '') || ''

    const el = document.createElement('div')
    el.className = 'album'
    el.hidden = true
    el.innerHTML = `
        <div class="album__backdrop"></div>
        <header class="album__head">
            <p class="album__title"></p>
            <p class="album__count"></p>
        </header>
        <figure class="album__stage">
            <div class="album__photo"></div>
            <figcaption class="album__caption"></figcaption>
        </figure>
        <ol class="album__strip"></ol>
        <div class="album__prompts"></div>`
    document.body.appendChild(el)
    const $ = (s) => el.querySelector(s)
    const titleEl = $('.album__title'), countEl = $('.album__count'), photoEl = $('.album__photo')
    const captionEl = $('.album__caption'), stripEl = $('.album__strip'), backdropEl = $('.album__backdrop')
    $('.album__prompts').innerHTML = `
        <span class="prompt"><i class="glyph glyph-o" aria-hidden="true"><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="4.6"/></svg></i>Back</span>`

    const state = { open: false, id: null, index: 0 }
    const photos = () => albums[state.id]?.photos || []

    const frame = (p, i) => {
        const src = srcOf(p)
        return src
            ? `<img src="${esc(src)}" alt="${esc(captionOf(p))}" loading="lazy">`
            : `<span class="album__empty"><svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="11" width="34" height="26" rx="3"/><path d="M11 33l9-10 6 6 4-4 7 8"/><circle cx="33" cy="18" r="2.6"/></svg>${i + 1}</span>`
    }

    const render = () => {
        const list = photos()
        const i = state.index
        const p = list[i]
        countEl.textContent = list.length ? `${i + 1} / ${list.length}` : 'No photos yet'
        photoEl.innerHTML = list.length ? frame(p, i) : ''
        photoEl.classList.toggle('is-empty', !srcOf(p))
        captionEl.textContent = captionOf(p)
        const src = srcOf(p)
        backdropEl.style.backgroundImage = src ? `url("${src.replace(/"/g, '%22')}")` : ''
        stripEl.querySelectorAll('li').forEach((li, j) => li.classList.toggle('is-current', j === i))
        stripEl.querySelector('.is-current')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }

    const open = (id, start = 0) => {
        if (!albums[id]) return
        state.open = true; state.id = id; state.index = Math.max(0, Math.min(start, (albums[id].photos || []).length - 1))
        const a = albums[id]
        titleEl.textContent = a.title
        stripEl.innerHTML = (a.photos || []).map((p, i) => `<li data-index="${i}">${frame(p, i)}</li>`).join('')
        el.hidden = false
        document.body.classList.add('album-open')
        render()
    }
    const close = () => {
        state.open = false
        el.hidden = true
        document.body.classList.remove('album-open')
    }
    const move = (step) => {
        const n = photos().length
        const next = state.index + step
        if (next < 0 || next >= n) return
        state.index = next
        try { navSound.currentTime = 0; navSound.play() } catch {}
        render()
    }

    stripEl.addEventListener('click', (e) => {
        const li = e.target.closest('li')
        if (li) { state.index = Number(li.dataset.index); render() }
    })

    window.addEventListener('keydown', (e) => {
        if (!state.open) return
        e.stopImmediatePropagation()
        e.preventDefault()
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(1)
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(-1)
        else if (e.key === 'Escape' || e.key === 'Backspace') close()
    }, true)

    window.XMB_ALBUM = { open, close, get isOpen() { return state.open } }
})()
