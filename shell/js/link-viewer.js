// Links open on the site itself, with "Open in a new tab" if you'd rather. Two places use it:
//   the XMB (on the PSP's screen): createLinkViewer({ screen: true }) fills the screen, and the
//       PSP's ○ / Escape goes back to the menu: GitHub, LinkedIn, YouTube and the like open here
//   the shell: a panel over everything, kept for live apps (a project's running site); anything
//       else is passed on to the PSP's screen by `route`
// Each kind of link gets what works best inside a page:
//   YouTube        the video, embedded
//   Spotify        the player, embedded
//   GitHub repo    the repo's details and its README (GitHub's API; GitHub pages can't be framed)
//   GitHub profile the profile and the latest repos
//   LinkedIn, Letterboxd, Goodreads, Spotify pages and other sites that refuse to be framed:
//                  a card that says so, with the new-tab button
//   anything else  the page in a frame (with the new-tab button in case it stays blank)
const NO_FRAME = /(^|\.)(linkedin\.com|letterboxd\.com|goodreads\.com|github\.com|google\.com|instagram\.com|x\.com|twitter\.com|facebook\.com|psnprofiles\.com|playstation\.com)$/i;
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CSS = new URL('../css/link-viewer.css?v=94', import.meta.url).href;

export function createLinkViewer({ screen = false, route = null } = {}) {
    if (!document.querySelector('link[data-lv]')) {
        const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = CSS; l.dataset.lv = '';
        document.head.appendChild(l);
    }
    const el = document.createElement('div');
    el.className = screen ? 'lv lv--screen' : 'lv'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Link');
    el.innerHTML = `
        <div class="lv__scrim"></div>
        <section class="lv__box">
            <header class="lv__bar">
                <div class="lv__where"><span class="lv__host"></span><span class="lv__title"></span></div>
                <a class="lv__out" target="_blank" rel="noopener">Open in a new tab ↗</a>
                ${screen ? '<button type="button" class="lv__close" aria-label="Back"><i aria-hidden="true"></i>Back</button>' : '<button type="button" class="lv__close" aria-label="Close">×</button>'}
            </header>
            <div class="lv__body"></div>
        </section>`;
    document.body.appendChild(el);
    const $ = (c) => el.querySelector(c);
    const body = $('.lv__body');
    let lastFocus = null, job = 0;

    const close = () => {
        if (el.hidden) return;
        el.classList.remove('is-in');
        setTimeout(() => { if (!el.classList.contains('is-in')) { el.hidden = true; body.innerHTML = ''; } }, 220);
        lastFocus?.focus?.();
    };
    $('.lv__close').addEventListener('click', close);
    $('.lv__scrim').addEventListener('click', close);
    $('.lv__out').addEventListener('click', () => setTimeout(close, 50));
    addEventListener('keydown', (e) => {
        if (el.hidden) return;
        if (e.key === 'Escape' || (screen && e.key === 'Backspace')) { e.preventDefault(); e.stopImmediatePropagation(); close(); return; }
        if (!screen) return;
        // on the PSP the menu behind keeps still; the d-pad scrolls the page
        e.stopImmediatePropagation();
        const step = { ArrowDown: 160, ArrowUp: -160, PageDown: 560, PageUp: -560 }[e.key];
        if (step) { e.preventDefault(); (body.querySelector('.lv__repo') ? body.querySelector('.lv__readme')?.contentWindow : body)?.scrollBy?.({ top: step, behavior: 'smooth' }); }
    }, { capture: true });

    const card = (html) => { body.innerHTML = `<div class="lv__card">${html}</div>`; };
    const frame = (src, note) => {
        body.innerHTML = `<iframe class="lv__frame" src="${esc(src)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>${note ? `<p class="lv__note">${note}</p>` : ''}`;
    };
    const gh = (path, accept) => fetch(`https://api.github.com${path}`, { headers: { Accept: accept || 'application/vnd.github+json' } }).then((r) => (r.ok ? (accept ? r.text() : r.json()) : Promise.reject(new Error(r.status))));

    const youtubeId = (u) => {
        if (/(^|\.)youtu\.be$/i.test(u.hostname)) return u.pathname.slice(1).split('/')[0];
        if (/(^|\.)youtube(-nocookie)?\.com$/i.test(u.hostname)) {
            if (u.searchParams.get('v')) return u.searchParams.get('v');
            const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/); if (m) return m[1];
        }
        return null;
    };

    const show = async (url, label = '') => {
        let u;
        try { u = new URL(url, location.href); } catch { return; }
        if (!/^https?:$/.test(u.protocol)) { location.href = url; return; }      // mailto: and the like
        const mine = ++job;
        lastFocus = document.activeElement;
        $('.lv__host').textContent = u.hostname.replace(/^www\./, '');
        $('.lv__title').textContent = label ? `  ·  ${label}` : '';
        $('.lv__out').href = u.href;
        el.dataset.kind = '';
        body.innerHTML = '<p class="lv__loading">Loading…</p>';
        el.hidden = false;
        requestAnimationFrame(() => el.classList.add('is-in'));
        $('.lv__close').focus({ preventScroll: true });

        const yt = youtubeId(u);
        if (yt) { el.dataset.kind = 'video'; frame(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?autoplay=1&rel=0`); return; }

        const sp = /(^|\.)open\.spotify\.com$/i.test(u.hostname) && u.pathname.match(/^\/(?:intl-\w+\/)?(playlist|album|track|artist|show|episode)\/(\w+)/);
        if (sp) { el.dataset.kind = 'page'; frame(`https://open.spotify.com/embed/${sp[1]}/${sp[2]}?theme=0`); return; }

        const ghParts = /(^|\.)github\.com$/i.test(u.hostname) ? u.pathname.split('/').filter(Boolean) : null;
        if (ghParts && ghParts.length >= 2) {
            el.dataset.kind = 'doc';
            const [owner, repo] = ghParts;
            try {
                const [info, readme] = await Promise.all([gh(`/repos/${owner}/${repo}`), gh(`/repos/${owner}/${repo}/readme`, 'application/vnd.github.html+json').catch(() => '')]);
                if (mine !== job) return;
                body.innerHTML = `
                    <div class="lv__repo">
                        <div class="lv__repo-head">
                            <h2>${esc(info.full_name)}</h2>
                            ${info.description ? `<p>${esc(info.description)}</p>` : ''}
                            <p class="lv__meta">${[info.language, `★ ${info.stargazers_count}`, info.license?.spdx_id, `updated ${new Date(info.pushed_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`].filter(Boolean).map(esc).join('  ·  ')}</p>
                        </div>
                        ${readme ? '<iframe class="lv__readme" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="README"></iframe>' : '<p class="lv__note">No README in this repo.</p>'}
                    </div>`;
                const rf = body.querySelector('.lv__readme');
                if (rf) rf.srcdoc = `<!doctype html><meta charset="utf-8"><base target="_blank"><style>
                    body{margin:0;padding:24px 28px;font:${screen ? 24 : 15}px/1.6 -apple-system,'Segoe UI',Geist,Arial,sans-serif;color:#e6e8ee;background:#0d1117}
                    a{color:#6cb6ff} img{max-width:100%} pre,code{background:#161b22;border-radius:6px} pre{padding:12px;overflow:auto} code{padding:2px 5px}
                    h1,h2{border-bottom:1px solid #30363d;padding-bottom:.3em} table{border-collapse:collapse} td,th{border:1px solid #30363d;padding:6px 10px}
                    </style>${readme}`;
            } catch {
                if (mine !== job) return;
                card(`<h2>${esc(owner)}/${esc(repo)}</h2><p>GitHub doesn't let its pages open inside other sites, and the repo's details couldn't be loaded just now.</p>`);
            }
            return;
        }
        if (ghParts && ghParts.length === 1) {
            el.dataset.kind = 'doc';
            const [user] = ghParts;
            try {
                const [p, repos] = await Promise.all([gh(`/users/${user}`), gh(`/users/${user}/repos?sort=pushed&per_page=8`)]);
                if (mine !== job) return;
                body.innerHTML = `
                    <div class="lv__profile">
                        <img class="lv__avatar" src="${esc(p.avatar_url)}" alt="">
                        <div><h2>${esc(p.name || p.login)}</h2><p class="lv__meta">@${esc(p.login)}  ·  ${p.public_repos} public repos  ·  ${p.followers} followers</p>${p.bio ? `<p>${esc(p.bio)}</p>` : ''}</div>
                    </div>
                    <ul class="lv__repos">${repos.map((r) => `<li><button type="button" data-href="${esc(r.html_url)}"><b>${esc(r.name)}</b>${r.description ? `<span>${esc(r.description)}</span>` : ''}<small>${esc([r.language, `★ ${r.stargazers_count}`].filter(Boolean).join('  ·  '))}</small></button></li>`).join('')}</ul>`;
                body.querySelectorAll('[data-href]').forEach((b) => b.addEventListener('click', () => show(b.dataset.href, b.querySelector('b').textContent)));
            } catch {
                if (mine !== job) return;
                card(`<h2>@${esc(user)} on GitHub</h2><p>GitHub doesn't let its pages open inside other sites, and the profile couldn't be loaded just now.</p>`);
            }
            return;
        }
        if (NO_FRAME.test(u.hostname)) {
            el.dataset.kind = 'card';
            const site = u.hostname.replace(/^www\./, '').split('.').slice(-2, -1)[0];
            const name = { linkedin: 'LinkedIn', letterboxd: 'Letterboxd', goodreads: 'Goodreads', psnprofiles: 'PSN Profiles', playstation: 'PlayStation' }[site] || u.hostname.replace(/^www\./, '');
            card(`<h2>${esc(label || name)}</h2><p>${esc(name)} doesn't let its pages open inside other sites, so this one opens in a new tab.</p><a class="lv__go" href="${esc(u.href)}" target="_blank" rel="noopener">Open ${esc(name)} ↗</a>`);
            body.querySelector('.lv__go').addEventListener('click', () => setTimeout(close, 50));
            return;
        }
        el.dataset.kind = 'page';
        frame(u.href, 'If the page stays blank, the site doesn’t allow being shown inside another one: use “Open in a new tab”.');
    };

    // every outside link on the page opens here (a link marked data-newtab, or with a modifier key, still opens a tab)
    document.addEventListener('click', (e) => {
        const a = e.target.closest?.('a[href]');
        if (!a || el.contains(a) || a.dataset.newtab != null || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        let u; try { u = new URL(a.href, location.href); } catch { return; }
        if (!/^https?:$/.test(u.protocol) || u.origin === location.origin) return;
        e.preventDefault();
        if (route?.(u.href, a.dataset.label || '', a)) return;
        show(u.href, a.dataset.label || '');
    }, { capture: true });

    return { show, close, get open() { return !el.hidden; } };
}
