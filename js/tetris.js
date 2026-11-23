// ============================================================================
// Tetris: a JavaScript port of my C# / WPF Tetris (github.com/CJNAIDOO/Tetris),
// so it can run on the PSP's screen. Same rules as the original:
// a 22 x 10 grid (top 2 rows hidden), 7 blocks with their rotation tables,
// hold (once per piece), ghost piece, next preview, hard drop, next-three queue, 1 point per
// cleared row, and the fall delay drops by 25 ms per point (1000 ms -> 75 ms).
//
// Also: an intro (TETRIS built letter by letter in the grid from the game's own tiles), a synthesised
// Korobeiniki loop + sound effects (Web Audio, no files), line-clear flash / particles /
// shake, and a clearer ghost piece.
//
// Controls (keyboard / PSP):
//   ← →  move      ↑  rotate clockwise      ↓ / Z / □  rotate anticlockwise
//   C / △  hold    Space / ✕  hard drop     P / START  pause
//   Esc / Backspace / ○  back to the XMB (the game pauses)
//
// window.XMB_TETRIS = { open(), close(), get isOpen }
// Loaded before features.js, so its key listener runs first while it's open.
// ============================================================================
(() => {
    const ROWS = 22, COLS = 10, HIDDEN = 2
    const MAX_DELAY = 1000, MIN_DELAY = 75, DELAY_DECREASE = 25
    const IMG = 'images/tetris/'

    // ---- blocks (rotation tables copied from the C# classes) ----------------
    // [row, column] tiles per rotation state, plus the start offset
    const BLOCKS = [
        null,
        { id: 1, start: [1, 3], tiles: [[[1,0],[1,1],[1,2],[1,3]], [[0,2],[1,2],[2,2],[3,2]], [[2,0],[2,1],[2,2],[2,3]], [[0,1],[1,1],[2,1],[3,1]]] }, // I
        { id: 2, start: [0, 3], tiles: [[[0,0],[1,0],[1,1],[1,2]], [[0,1],[0,2],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,0],[2,1]]] },  // J
        { id: 3, start: [0, 3], tiles: [[[0,2],[1,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[1,2],[2,0]], [[0,0],[0,1],[1,1],[2,1]]] },  // L
        { id: 4, start: [0, 4], tiles: [[[0,0],[0,1],[1,0],[1,1]]] },                                                                                // O
        { id: 5, start: [0, 3], tiles: [[[0,1],[0,2],[1,0],[1,1]], [[0,1],[1,1],[1,2],[2,2]], [[1,1],[1,2],[2,0],[2,1]], [[0,0],[1,0],[1,1],[2,1]]] },  // S
        { id: 6, start: [0, 3], tiles: [[[0,1],[1,0],[1,1],[1,2]], [[0,1],[1,1],[1,2],[2,1]], [[1,0],[1,1],[1,2],[2,1]], [[0,1],[1,0],[1,1],[2,1]]] },  // T
        { id: 7, start: [0, 3], tiles: [[[0,0],[0,1],[1,1],[1,2]], [[0,2],[1,1],[1,2],[2,1]], [[1,0],[1,1],[2,1],[2,2]], [[0,1],[1,0],[1,1],[2,0]]] },  // Z
    ]
    const TILE_NAMES = ['empty', 'cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red']
    const BLOCK_NAMES = ['empty', 'i', 'j', 'l', 'o', 's', 't', 'z']

    class Piece {
        constructor(def) { this.def = def; this.reset() }
        get id() { return this.def.id }
        reset() { this.rot = 0; this.r = this.def.start[0]; this.c = this.def.start[1] }
        cells() { return this.def.tiles[this.rot].map(([r, c]) => [r + this.r, c + this.c]) }
        rotateCW() { this.rot = (this.rot + 1) % this.def.tiles.length }
        rotateCCW() { this.rot = (this.rot + this.def.tiles.length - 1) % this.def.tiles.length }
        move(dr, dc) { this.r += dr; this.c += dc }
    }

    // ---- game state (GameState.cs) ------------------------------------------
    const newGame = () => {
        const g = {
            grid: Array.from({ length: ROWS }, () => new Array(COLS).fill(0)),
            score: 0, over: false, held: null, canHold: true,
            next: null, current: null,
        }
        const random = () => new Piece(BLOCKS[1 + Math.floor(Math.random() * 7)])
        g.queue = []                                       // the next three pieces (+1 spare); no piece twice in a row
        const fill = () => {
            while (g.queue.length < 4) {
                let p
                do { p = random() } while (g.queue.length && p.id === g.queue[g.queue.length - 1].id)
                g.queue.push(p)
            }
        }
        fill()
        g.next = g.queue[0]
        g.take = () => {                                   // BlockQueue.getAndUpdateBlock
            const b = g.queue.shift()
            fill()
            g.next = g.queue[0]
            return b
        }
        setCurrent(g, g.take())
        return g
    }
    const isEmpty = (g, r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && g.grid[r][c] === 0
    const fits = (g) => g.current.cells().every(([r, c]) => isEmpty(g, r, c))
    const setCurrent = (g, piece) => {
        g.current = piece
        piece.reset()
        for (let i = 0; i < 2; i++) { piece.move(1, 0); if (!fits(g)) piece.move(-1, 0) }
    }
    const CLEAR_MS = 320
    const clearFullRows = (g) => {
        let cleared = 0
        for (let r = ROWS - 1; r >= 0; r--) {
            if (g.grid[r].every((v) => v !== 0)) { g.grid[r].fill(0); cleared++ }
            else if (cleared > 0) { g.grid[r + cleared] = g.grid[r]; g.grid[r] = new Array(COLS).fill(0) }
        }
        return cleared
    }
    // lock the piece; full rows are kept on the grid for CLEAR_MS (the flash), then finishPlace clears them
    const place = (g) => {
        for (const [r, c] of g.current.cells()) if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g.grid[r][c] = g.current.id
        const full = []
        for (let r = 0; r < ROWS; r++) if (g.grid[r].every((v) => v !== 0)) full.push(r)
        g.locked = true
        if (full.length) { g.clearing = { rows: full, ids: full.map((r) => g.grid[r].slice()), t0: performance.now() }; return }
        finishPlace(g)
    }
    const finishPlace = (g) => {
        if (g.clearing) { g.score += clearFullRows(g); g.clearing = null }
        if (!(g.grid[0].every((v) => !v) && g.grid[1].every((v) => !v))) g.over = true
        else { setCurrent(g, g.take()); g.canHold = true }
    }
    const tryMove = (g, dr, dc) => { g.current.move(dr, dc); if (!fits(g)) { g.current.move(-dr, -dc); return false } return true }
    const moveDown = (g) => { if (!tryMove(g, 1, 0)) place(g) }
    const rotate = (g, cw) => {
        cw ? g.current.rotateCW() : g.current.rotateCCW()
        if (!fits(g)) cw ? g.current.rotateCCW() : g.current.rotateCW()
    }
    const dropDistance = (g) => Math.min(...g.current.cells().map(([r, c]) => { let d = 0; while (isEmpty(g, r + d + 1, c)) d++; return d }))
    const hardDrop = (g) => { g.current.move(dropDistance(g), 0); place(g) }
    const hold = (g) => {
        if (!g.canHold || g.clearing) return
        if (!g.held) { g.held = g.current; setCurrent(g, g.take()) }
        else { const t = g.current; setCurrent(g, g.held); g.held = t }
        g.canHold = false
    }

    // ---- sound: Korobeiniki + effects, synthesised with Web Audio (no audio files) ----
    const audio = (() => {
        let ctx = null, master = null, timer = null, idx = 0, loopStart = 0, running = false
        const BPM = 150, SPB = 60 / BPM, LOOP = 32
        const hz = (n) => 440 * 2 ** ((n - 69) / 12)
        // [midi, beats] (0 = rest). Korobeiniki is a Russian folk tune (public domain).
        const LEAD = [
            [76,1],[71,.5],[72,.5],[74,1],[72,.5],[71,.5],  [69,1],[69,.5],[72,.5],[76,1],[74,.5],[72,.5],
            [71,1.5],[72,.5],[74,1],[76,1],                 [72,1],[69,1],[69,2],
            [0,.5],[74,1.5],[77,.5],[81,1],[79,.5],[77,.5], [76,1.5],[72,.5],[76,1],[74,.5],[72,.5],
            [71,1],[71,.5],[72,.5],[74,1],[76,1],           [72,1],[69,1],[69,2],
        ]
        const BASS = [[57,64],[57,64],[52,59],[57,64],[50,57],[48,55],[52,59],[57,64]]   // root, fifth per bar
        const events = []
        let b = 0
        for (const [m, d] of LEAD) { if (m) events.push({ t: b, d, m, lead: true }); b += d }
        BASS.forEach(([r, f], bar) => { for (let k = 0; k < 8; k++) events.push({ t: bar * 4 + k * .5, d: .45, m: k % 2 ? f : r }) })
        events.sort((a, c) => a.t - c.t)

        const ensure = () => {
            if (!ctx) {
                const AC = window.AudioContext || window.webkitAudioContext
                if (!AC) return false
                ctx = new AC()
                master = ctx.createGain(); master.gain.value = 0.55
                master.connect(ctx.destination)
            }
            if (ctx.state === 'suspended') ctx.resume()
            return true
        }
        const tone = (when, freq, dur, type, vol, { to = 0, lp = 0, attack = 0.005, dest = master } = {}) => {
            const o = ctx.createOscillator(), g = ctx.createGain()
            o.type = type; o.frequency.setValueAtTime(freq, when)
            if (to) o.frequency.exponentialRampToValueAtTime(to, when + dur)
            g.gain.setValueAtTime(0.0001, when)
            g.gain.exponentialRampToValueAtTime(vol, when + attack)
            g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
            let out = g
            if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; g.connect(f); out = f }
            o.connect(g); out.connect(dest)
            o.start(when); o.stop(when + dur + 0.05)
        }
        let musicBus = null
        const schedule = () => {
            if (!running) return
            while (loopStart + events[idx].t * SPB < ctx.currentTime + 0.3) {
                const e = events[idx], when = loopStart + e.t * SPB
                if (e.lead) tone(when, hz(e.m), e.d * SPB * 0.95, 'square', 0.07, { lp: 2600, dest: musicBus })
                else tone(when, hz(e.m - 12), e.d * SPB, 'triangle', 0.16, { dest: musicBus })
                if (++idx >= events.length) { idx = 0; loopStart += LOOP * SPB }
            }
            timer = setTimeout(schedule, 80)
        }
        const sfx = (fn) => { if (ensure()) fn(ctx.currentTime) }
        return {
            unlock() { ensure() },
            begin(fadeIn) {
                if (!ensure() || running) return
                this.stop(true)
                musicBus = ctx.createGain(); musicBus.gain.value = fadeIn ? 0.0001 : 1; musicBus.connect(master)
                if (fadeIn) musicBus.gain.setTargetAtTime(1, ctx.currentTime, 0.6)
                running = true; idx = 0; loopStart = ctx.currentTime + 0.08
                schedule()
            },
            stop(now) {
                running = false; clearTimeout(timer)
                if (musicBus && ctx) {
                    const bus = musicBus; musicBus = null
                    bus.gain.setTargetAtTime(0, ctx.currentTime, now ? 0.01 : 0.25)
                    setTimeout(() => bus.disconnect(), 1200)
                }
            },
            pause() { if (ctx && ctx.state === 'running') ctx.suspend() },
            resume() { if (ctx && ctx.state === 'suspended') ctx.resume() },
            move: () => sfx((t) => tone(t, 190, 0.04, 'square', 0.05, { lp: 1500 })),
            rotate: () => sfx((t) => tone(t, 420, 0.05, 'square', 0.05, { to: 560, lp: 2000 })),
            hold: () => sfx((t) => { tone(t, 330, 0.06, 'triangle', 0.12); tone(t + .06, 495, 0.08, 'triangle', 0.12) }),
            drop: () => sfx((t) => { tone(t, 150, 0.12, 'sine', 0.3, { to: 55 }); tone(t, 900, 0.03, 'square', 0.04) }),
            lock: () => sfx((t) => tone(t, 120, 0.07, 'sine', 0.22, { to: 70 })),
            clear: (n) => sfx((t) => {
                const run = n >= 4 ? [72, 76, 79, 84, 88] : n === 3 ? [72, 76, 79, 84] : n === 2 ? [72, 76, 79] : [76, 83]
                run.forEach((m, i) => tone(t + i * 0.07, hz(m), 0.22, 'square', 0.08, { lp: 3200 }))
                if (n >= 4) tone(t, 90, 0.5, 'sawtooth', 0.12, { to: 45, lp: 500 })
            }),
            over: () => sfx((t) => [72, 68, 64, 60, 55].forEach((m, i) => tone(t + i * 0.16, hz(m), 0.3, 'square', 0.07, { lp: 1800 }))),
        }
    })()

    // ---- screen ---------------------------------------------------------------
    const el = document.createElement('div')
    el.className = 'tetris'
    el.hidden = true
    el.innerHTML = `
        <div class="tetris__bg"></div>
        <p class="tetris__score">Score: <span>0</span></p>
        <div class="tetris__side tetris__side--hold"><p>Hold</p><img alt=""></div>
        <div class="tetris__boardwrap">
            <canvas class="tetris__board" width="${COLS * 32}" height="${(ROWS - HIDDEN) * 32}"></canvas>
            <p class="tetris__banner" aria-hidden="true"></p>
        </div>
        <div class="tetris__side tetris__side--next"><p>Next</p><img alt=""><img class="small" alt=""><img class="small" alt=""></div>
        <div class="tetris__paused" hidden>
            <p class="tetris__over-title">Paused</p>
        </div>
        <div class="tetris__over" hidden>
            <p class="tetris__over-title">Game Over</p>
            <p class="tetris__over-score"></p>
            <p class="tetris__over-best"></p>
        </div>
        <div class="tetris__prompts"></div>`
    document.body.appendChild(el)
    const canvas = el.querySelector('.tetris__board')
    const ctx = canvas.getContext('2d')
    const scoreEl = el.querySelector('.tetris__score span')
    const holdImg = el.querySelector('.tetris__side--hold img')
    const nextImgs = [...el.querySelectorAll('.tetris__side--next img')]
    const overEl = el.querySelector('.tetris__over')
    const promptsEl = el.querySelector('.tetris__prompts')
    const pausedEl = el.querySelector('.tetris__paused')
    const bannerEl = el.querySelector('.tetris__banner')

    let best = 0
    try { best = +localStorage.getItem('xmb-tetris-best') || 0 } catch {}
    const saveBest = () => { if (g.score > best) { best = g.score; try { localStorage.setItem('xmb-tetris-best', String(best)) } catch {} } }

    const tiles = TILE_NAMES.map((n) => { const i = new Image(); i.src = `${IMG}tile-${n}.png`; return i })
    BLOCK_NAMES.forEach((n) => { new Image().src = `${IMG}block-${n}.png` })   // preload previews
    const TILE_HEX = ['#000', '#3fd0ee', '#4a6df0', '#f29a35', '#f6dc2e', '#52c452', '#b052d8', '#e84848']

    const CELL = 32
    const drawTile = (id, r, c, alpha = 1, dy = 0) => {
        if (r < HIDDEN) return
        ctx.globalAlpha = alpha
        const img = tiles[id]
        if (img.complete && img.naturalWidth) ctx.drawImage(img, c * CELL, (r - HIDDEN) * CELL + dy, CELL, CELL)
        ctx.globalAlpha = 1
    }

    // ---- effects: line-clear flash, particles, shake, banner ----
    const fx = { particles: [], shake: 0, shakeAt: 0, raf: 0 }
    const BANNERS = { 2: 'DOUBLE', 3: 'TRIPLE', 4: 'TETRIS!' }
    const burst = (rows, ids) => {
        rows.forEach((r, k) => ids[k].forEach((id, c) => {
            for (let i = 0; i < 3; i++) fx.particles.push({
                x: (c + 0.5) * CELL, y: (r - HIDDEN + 0.5) * CELL,
                vx: (Math.random() - 0.5) * 260 + (c - COLS / 2) * 14, vy: -Math.random() * 260 - 40,
                s: 4 + Math.random() * 6, col: TILE_HEX[id], t: 0, life: 0.55 + Math.random() * 0.35,
            })
        }))
    }
    const shake = (amt) => { fx.shake = Math.max(fx.shake, amt); fx.shakeAt = performance.now() }
    const showBanner = (n) => {
        if (!BANNERS[n]) return
        bannerEl.textContent = BANNERS[n]
        bannerEl.classList.remove('is-on'); void bannerEl.offsetWidth
        bannerEl.classList.toggle('is-big', n === 4)
        bannerEl.classList.add('is-on')
    }
    const stepParticles = (dt) => {
        for (const p of fx.particles) { p.t += dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt }
        fx.particles = fx.particles.filter((p) => p.t < p.life)
    }
    let lastFrame = 0
    const fxBusy = () => g.clearing || fx.particles.length || fx.shake > 0.2
    const fxLoop = (now) => {
        fx.raf = 0
        const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016); lastFrame = now
        stepParticles(dt)
        if (fx.shake > 0) {
            const k = 1 - (now - fx.shakeAt) / 380
            if (k <= 0) { fx.shake = 0; canvas.style.transform = '' }
            else { const a = fx.shake * k; canvas.style.transform = `translate(${(Math.random() - .5) * 2 * a}px, ${(Math.random() - .5) * 2 * a}px)` }
        }
        draw()
        if (isOpen && phase === 'play' && fxBusy()) fx.raf = requestAnimationFrame(fxLoop)
    }
    const kick = () => { if (!fx.raf) { lastFrame = performance.now(); fx.raf = requestAnimationFrame(fxLoop) } }

    const drawBase = () => {
        ctx.fillStyle = '#101010'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        // faint grid
        ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1; ctx.beginPath()
        for (let c = 1; c < COLS; c++) { ctx.moveTo(c * CELL + .5, 0); ctx.lineTo(c * CELL + .5, canvas.height) }
        for (let r = 1; r < ROWS - HIDDEN; r++) { ctx.moveTo(0, r * CELL + .5); ctx.lineTo(canvas.width, r * CELL + .5) }
        ctx.stroke()
    }
    const drawParticles = () => {
        for (const p of fx.particles) {
            ctx.globalAlpha = Math.max(0, 1 - p.t / p.life)
            ctx.fillStyle = p.col
            ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s)
        }
        ctx.globalAlpha = 1
    }
    const draw = () => {
        drawBase()
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) drawTile(g.grid[r][c], r, c)
        if (!g.over && !g.clearing) {
            const d = dropDistance(g)
            if (d > 0) {                                   // ghost: tinted outline where it will land
                ctx.save()
                ctx.strokeStyle = TILE_HEX[g.current.id]; ctx.fillStyle = TILE_HEX[g.current.id]; ctx.lineWidth = 2
                for (const [r, c] of g.current.cells()) {
                    if (r + d < HIDDEN) continue
                    const x = c * CELL, y = (r + d - HIDDEN) * CELL
                    ctx.globalAlpha = 0.16; ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)
                    ctx.globalAlpha = 0.85; ctx.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6)
                }
                ctx.restore()
            }
            for (const [r, c] of g.current.cells()) drawTile(g.current.id, r, c)
        }
        if (g.clearing) {                                  // rows flash white, blinking, just before they go
            const p = Math.min(1, (performance.now() - g.clearing.t0) / CLEAR_MS)
            const a = 0.9 * Math.abs(Math.sin(p * Math.PI * 2.5)) * (1 - p * 0.3)
            ctx.fillStyle = `rgba(255,255,255,${a})`
            for (const r of g.clearing.rows) if (r >= HIDDEN) ctx.fillRect(0, (r - HIDDEN) * CELL, canvas.width, CELL)
        }
        drawParticles()
        scoreEl.textContent = g.score
        holdImg.src = `${IMG}block-${BLOCK_NAMES[g.held ? g.held.id : 0]}.png`
        nextImgs.forEach((im, i) => { im.src = `${IMG}block-${BLOCK_NAMES[g.queue[i].id]}.png` })
    }

    // ---- intro: T E T R I S, one letter at a time, built from the game's own tiles inside the grid ----
    // one colour per letter (digits are tile colours: 1 cyan, 3 orange, 4 yellow, 5 green, 6 purple, 7 red)
    const LOGO = [
        ['77777', '..7..', '..7..', '..7..', '..7..'],   // T  red
        ['33333', '3....', '3333.', '3....', '33333'],   // E  orange
        ['44444', '..4..', '..4..', '..4..', '..4..'],   // T  yellow
        ['5555.', '5...5', '5555.', '5..5.', '5...5'],   // R  green
        ['11111', '..1..', '..1..', '..1..', '11111'],   // I  cyan
        ['.6666', '6....', '.666.', '....6', '6666.'],   // S  purple
    ]
    const LETTER_MS = 950, BUILD_MS = 560, HOLD_END = 780      // per letter: build, hold, then it clears
    const INTRO_MS = LOGO.length * LETTER_MS
    const LX = 2.5, LY = 7.5                                   // the letter's top-left, in cells (centred in the grid)
    const bounce = (t) => {
        const n = 7.5625, d = 2.75
        if (t < 1 / d) return n * t * t
        if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
        if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
        return n * (t -= 2.625 / d) * t + 0.984375
    }
    let introRaf = 0, introT0 = 0, introLast = 0, introFired = {}
    const introFrame = (now) => {
        introRaf = 0
        if (!isOpen || phase !== 'intro') return
        const t = Math.max(0, now - introT0)
        stepParticles(Math.min(0.05, (now - introLast) / 1000 || 0.016)); introLast = now
        if (t >= INTRO_MS) return startGame()
        const li = Math.floor(t / LETTER_MS), lt = t - li * LETTER_MS
        drawBase()
        const letter = LOGO[li]
        const clearing = lt >= HOLD_END
        const flash = clearing ? Math.abs(Math.sin((lt - HOLD_END) / (LETTER_MS - HOLD_END) * Math.PI * 2.5)) : 0
        if (lt > BUILD_MS && !introFired[`b${li}`]) { introFired[`b${li}`] = 1; audio.lock() }
        if (clearing && !introFired[`c${li}`]) {
            introFired[`c${li}`] = 1; audio.clear(1)
            letter.forEach((row, y) => [...row].forEach((ch, x) => {
                if (ch === '.') return
                for (let i = 0; i < 2; i++) fx.particles.push({
                    x: (LX + x + 0.5) * CELL, y: (LY + y + 0.5 - HIDDEN + HIDDEN) * CELL,
                    vx: (Math.random() - 0.5) * 240 + (x - 2) * 30, vy: -Math.random() * 240 - 30,
                    s: 4 + Math.random() * 6, col: TILE_HEX[+ch], t: 0, life: 0.5 + Math.random() * 0.3,
                })
            }))
        }
        if (lt < LETTER_MS - 60) {
            letter.forEach((row, y) => [...row].forEach((ch, x) => {
                if (ch === '.') return
                const k = (lt - ((4 - y) * 70 + x * 18)) / 380       // bottom of the letter lands first
                if (k < 0) return
                const e = k >= 1 ? 1 : bounce(k)
                const px = (LX + x) * CELL, py = (LY + y) * CELL - (1 - e) * (LY + 3) * CELL
                const img = tiles[+ch]
                if (img.complete && img.naturalWidth) ctx.drawImage(img, px, py, CELL, CELL)
                if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.9})`; ctx.fillRect(px, py, CELL, CELL) }
            }))
        }
        drawParticles()
        introRaf = requestAnimationFrame(introFrame)
    }
    const showIntro = () => {
        phase = 'intro'
        el.classList.add('is-intro')
        g = newGame(); fx.particles = []; introFired = {}
        overEl.hidden = true; pausedEl.hidden = true; paused = false
        scoreEl.textContent = 0
        introT0 = introLast = performance.now()
        cancelAnimationFrame(introRaf); introRaf = requestAnimationFrame(introFrame)
        setPrompts()
    }
    const startGame = () => {
        cancelAnimationFrame(introRaf)
        el.classList.remove('is-intro')
        phase = 'play'
        audio.unlock()
        restart()
    }

    const GLYPH = {
        x: '<svg viewBox="0 0 20 20"><path d="M6 6l8 8M14 6l-8 8"/></svg>',
        o: '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="4.6"/></svg>',
        t: '<svg viewBox="0 0 20 20"><path d="M10 5.2l5 8.6H5z"/></svg>',
        s: '<svg viewBox="0 0 20 20"><rect x="5.6" y="5.6" width="8.8" height="8.8"/></svg>',
    }
    const startBtn = (text) => `<span class="prompt"><i class="glyph-start" aria-hidden="true">START</i>${text}</span>`
    const prompt = (b, text) => `<span class="prompt"><i class="glyph glyph-${b}" aria-hidden="true">${GLYPH[b]}</i>${text}</span>`
    const setPrompts = () => {
        promptsEl.innerHTML = phase === 'intro'
            ? prompt('x', 'Skip') + prompt('o', 'Back')
            : g.over
                ? prompt('x', 'Play again') + prompt('o', 'Back')
                : paused
                    ? startBtn('Resume') + prompt('o', 'Back')
                    : prompt('x', 'Drop') + prompt('t', 'Hold') + startBtn('Pause') + prompt('o', 'Back')
    }

    // ---- loop -----------------------------------------------------------------
    let g = newGame()
    let timer = null
    let isOpen = false
    let paused = false
    let phase = 'intro'            // 'intro' | 'play'
    const delay = () => Math.max(MIN_DELAY, MAX_DELAY - g.score * DELAY_DECREASE)

    // call after anything that may have locked a piece: starts the clear animation or ends the game
    const afterLock = (hard) => {
        if (!g.locked) return
        g.locked = false
        if (g.clearing) {
            const n = g.clearing.rows.length
            burst(g.clearing.rows, g.clearing.ids)
            audio.clear(n); showBanner(n)
            if (n >= 3) shake(n >= 4 ? 9 : 5)
            clearTimeout(timer)
            timer = setTimeout(endClear, CLEAR_MS)
            kick()
            return
        }
        hard ? audio.drop() : audio.lock()
        if (hard) shake(2.5), kick()
        if (g.over) gameOver()
    }
    const endClear = () => {
        if (!isOpen || paused) return
        finishPlace(g)
        saveBest()
        draw(); kick()
        if (g.over) return gameOver()
        timer = setTimeout(tick, delay())
    }
    const tick = () => {
        if (!isOpen || g.over || paused || g.clearing) return
        moveDown(g)
        draw()
        afterLock(false)
        if (g.over || g.clearing) return
        timer = setTimeout(tick, delay())
    }
    const gameOver = () => {
        clearTimeout(timer)
        saveBest()
        audio.stop(); audio.over()
        overEl.hidden = false
        overEl.querySelector('.tetris__over-score').textContent = `Final Score: ${g.score}`
        overEl.querySelector('.tetris__over-best').textContent = best > g.score ? `Best: ${best}` : (g.score ? 'New best!' : '')
        setPrompts()
    }
    const setPaused = (on) => {
        paused = on
        pausedEl.hidden = !on
        clearTimeout(timer)
        if (on) audio.pause()
        else { audio.resume(); timer = setTimeout(g.clearing ? endClear : tick, g.clearing ? 60 : delay()) }
        setPrompts()
    }
    const restart = () => {
        paused = false
        pausedEl.hidden = true
        g = newGame()
        fx.particles = []
        overEl.hidden = true
        setPrompts()
        draw()
        clearTimeout(timer)
        timer = setTimeout(tick, delay())
        audio.begin()
    }

    // open resumes a game in progress; otherwise it plays the TETRIS intro, then the game starts
    const open = () => {
        isOpen = true
        el.hidden = false
        document.body.classList.add('tetris-open')
        audio.unlock()
        overEl.hidden = true
        if (phase === 'play' && !g.over) { el.classList.remove('is-intro'); draw(); audio.begin(); setPaused(false) }
        else { audio.begin(); showIntro() }
    }
    const close = () => {
        isOpen = false
        clearTimeout(timer)
        cancelAnimationFrame(introRaf)
        audio.stop(true)
        audio.resume()
        el.hidden = true
        document.body.classList.remove('tetris-open')
        document.dispatchEvent(new CustomEvent('tetris:close'))
    }

    const ACTIONS = {
        ArrowLeft: () => tryMove(g, 0, -1) && audio.move(),
        ArrowRight: () => tryMove(g, 0, 1) && audio.move(),
        ArrowUp: () => { rotate(g, true); audio.rotate() },
        ArrowDown: () => { rotate(g, false); audio.rotate() },
        z: () => { rotate(g, false); audio.rotate() },
        c: () => { const was = g.canHold; hold(g); if (was && !g.canHold) audio.hold() },
        ' ': () => { hardDrop(g); afterLock(true); return 'hard' },
        Enter: () => { hardDrop(g); afterLock(true); return 'hard' },
    }
    window.addEventListener('keydown', (e) => {
        if (!isOpen) return
        e.stopImmediatePropagation()
        e.preventDefault()
        if (e.key === 'Escape' || e.key === 'Backspace') { close(); return }
        if (phase === 'intro') { if (e.key === 'Enter' || e.key === ' ') startGame(); return }
        if (g.over) { if (e.key === 'Enter' || e.key === ' ') restart(); return }
        if (e.key === 'p' || e.key === 'P') { setPaused(!paused); return }
        if (paused || g.clearing) return
        const act = ACTIONS[e.key.length === 1 ? e.key.toLowerCase() : e.key]
        if (!act) return
        act()
        draw()
    }, true)
    el.addEventListener('click', () => { if (isOpen && phase === 'intro') startGame() })

    // the XMB plays the tune quietly, fading in, while the Tetris row is focused (like Ilifa's)
    const preview = (on) => { if (isOpen) return; on ? audio.begin(true) : audio.stop() }

    window.XMB_TETRIS = { open, close, preview, get isOpen() { return isOpen } }
})()
