// ============================================================================
// Tetris: a JavaScript port of my C# / WPF Tetris (github.com/CJNAIDOO/Tetris),
// so it can run on the PSP's screen. Same rules as the original:
// a 22 x 10 grid (top 2 rows hidden), 7 blocks with their rotation tables,
// hold (once per piece), ghost piece, next preview, hard drop, 1 point per
// cleared row, and the fall delay drops by 25 ms per point (1000 ms -> 75 ms).
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
        g.next = random()
        g.take = () => {                                   // BlockQueue.getAndUpdateBlock
            const b = g.next
            do { g.next = random() } while (g.next.id === b.id)
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
    const clearFullRows = (g) => {
        let cleared = 0
        for (let r = ROWS - 1; r >= 0; r--) {
            if (g.grid[r].every((v) => v !== 0)) { g.grid[r].fill(0); cleared++ }
            else if (cleared > 0) { g.grid[r + cleared] = g.grid[r]; g.grid[r] = new Array(COLS).fill(0) }
        }
        return cleared
    }
    const place = (g) => {
        for (const [r, c] of g.current.cells()) if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g.grid[r][c] = g.current.id
        g.score += clearFullRows(g)
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
        if (!g.canHold) return
        if (!g.held) { g.held = g.current; setCurrent(g, g.take()) }
        else { const t = g.current; setCurrent(g, g.held); g.held = t }
        g.canHold = false
    }

    // ---- screen ---------------------------------------------------------------
    const el = document.createElement('div')
    el.className = 'tetris'
    el.hidden = true
    el.innerHTML = `
        <div class="tetris__bg"></div>
        <p class="tetris__score">Score: <span>0</span></p>
        <div class="tetris__side tetris__side--hold"><p>Hold</p><img alt=""></div>
        <canvas class="tetris__board" width="${COLS * 32}" height="${(ROWS - HIDDEN) * 32}"></canvas>
        <div class="tetris__side tetris__side--next"><p>Next</p><img alt=""></div>
        <div class="tetris__paused" hidden>
            <p class="tetris__over-title">Paused</p>
        </div>
        <div class="tetris__over" hidden>
            <p class="tetris__over-title">Game Over</p>
            <p class="tetris__over-score"></p>
        </div>
        <div class="tetris__prompts"></div>`
    document.body.appendChild(el)
    const canvas = el.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const scoreEl = el.querySelector('.tetris__score span')
    const holdImg = el.querySelector('.tetris__side--hold img')
    const nextImg = el.querySelector('.tetris__side--next img')
    const overEl = el.querySelector('.tetris__over')
    const promptsEl = el.querySelector('.tetris__prompts')
    const pausedEl = el.querySelector('.tetris__paused')

    const tiles = TILE_NAMES.map((n) => { const i = new Image(); i.src = `${IMG}tile-${n}.png`; return i })
    BLOCK_NAMES.forEach((n) => { new Image().src = `${IMG}block-${n}.png` })   // preload previews

    const CELL = 32
    const drawTile = (id, r, c, alpha = 1) => {
        if (r < HIDDEN) return
        ctx.globalAlpha = alpha
        const img = tiles[id]
        if (img.complete && img.naturalWidth) ctx.drawImage(img, c * CELL, (r - HIDDEN) * CELL, CELL, CELL)
        ctx.globalAlpha = 1
    }
    const draw = () => {
        ctx.fillStyle = '#101010'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) drawTile(g.grid[r][c], r, c)
        if (!g.over) {
            const d = dropDistance(g)
            for (const [r, c] of g.current.cells()) drawTile(g.current.id, r + d, c, 0.25)   // ghost
            for (const [r, c] of g.current.cells()) drawTile(g.current.id, r, c)
        }
        scoreEl.textContent = g.score
        holdImg.src = `${IMG}block-${BLOCK_NAMES[g.held ? g.held.id : 0]}.png`
        nextImg.src = `${IMG}block-${BLOCK_NAMES[g.next.id]}.png`
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
        promptsEl.innerHTML = g.over
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
    const delay = () => Math.max(MIN_DELAY, MAX_DELAY - g.score * DELAY_DECREASE)
    const tick = () => {
        if (!isOpen || g.over || paused) return
        moveDown(g)
        draw()
        if (g.over) return gameOver()
        timer = setTimeout(tick, delay())
    }
    const gameOver = () => {
        clearTimeout(timer)
        overEl.hidden = false
        overEl.querySelector('.tetris__over-score').textContent = `Final Score: ${g.score}`
        setPrompts()
    }
    const setPaused = (on) => {
        paused = on
        pausedEl.hidden = !on
        clearTimeout(timer)
        if (!on) timer = setTimeout(tick, delay())
        setPrompts()
    }
    const restart = () => {
        paused = false
        pausedEl.hidden = true
        g = newGame()
        overEl.hidden = true
        setPrompts()
        draw()
        clearTimeout(timer)
        timer = setTimeout(tick, delay())
    }

    // open resumes a game in progress; a finished one starts over
    const open = () => {
        isOpen = true
        el.hidden = false
        document.body.classList.add('tetris-open')
        if (g.over) restart()
        else { draw(); setPaused(false) }
    }
    const close = () => {
        isOpen = false
        clearTimeout(timer)
        el.hidden = true
        document.body.classList.remove('tetris-open')
        document.dispatchEvent(new CustomEvent('tetris:close'))
    }

    const ACTIONS = {
        ArrowLeft: () => tryMove(g, 0, -1),
        ArrowRight: () => tryMove(g, 0, 1),
        ArrowUp: () => rotate(g, true),
        ArrowDown: () => rotate(g, false),
        z: () => rotate(g, false),
        c: () => hold(g),
        ' ': () => hardDrop(g),
        Enter: () => hardDrop(g),
    }
    window.addEventListener('keydown', (e) => {
        if (!isOpen) return
        e.stopImmediatePropagation()
        e.preventDefault()
        if (e.key === 'Escape' || e.key === 'Backspace') { close(); return }
        if (g.over) { if (e.key === 'Enter' || e.key === ' ') restart(); return }
        if (e.key === 'p' || e.key === 'P') { setPaused(!paused); return }
        if (paused) return
        const act = ACTIONS[e.key.length === 1 ? e.key.toLowerCase() : e.key]
        if (!act) return
        act()
        draw()
        if (g.over) gameOver()
    }, true)

    window.XMB_TETRIS = { open, close, get isOpen() { return isOpen } }
})()
