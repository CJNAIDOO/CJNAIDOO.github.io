// ============================================================================
// Photos: a three.js space that fills the screen as soon as you land on the
// Photos section (no click). Drifting particles, with the photos floating in
// a loose tunnel; ↑ / ↓ fly from one photo to the next, ✕ opens the current
// one full screen (js/album.js). Empty photos (null in js/content.js) show as
// numbered frames until there's a picture.
// It only renders while Photos is the open section.
// ============================================================================
import * as THREE from 'three'

const C = window.PORTFOLIO || PORTFOLIO
const items = C.photos?.items || []
const sectionEl = document.querySelector('.xmb-title.photos')
if (sectionEl) init()

function init() {
    const host = document.createElement('div')
    host.className = 'photo-space'
    sectionEl.appendChild(host)
    const hud = document.createElement('div')
    hud.className = 'photo-space__hud'
    hud.innerHTML = '<p class="photo-space__count"></p><p class="photo-space__caption"></p>'
    sectionEl.appendChild(hud)
    const countEl = hud.querySelector('.photo-space__count')
    const captionEl = hud.querySelector('.photo-space__caption')

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    renderer.setClearColor(0x05050a, 1)
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x05050a, 0.055)
    const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 120)

    // ---- particles: a long tube of dust the camera travels through -------------
    const N = 5000, LEN = Math.max(60, items.length * 6 + 30)
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
        const r = 1.5 + Math.random() * 14, a = Math.random() * Math.PI * 2
        pos[i * 3] = Math.cos(a) * r
        pos[i * 3 + 1] = Math.sin(a) * r * 0.7
        pos[i * 3 + 2] = 10 - Math.random() * LEN
        const t = Math.random()
        col.set(t < 0.75 ? [0.85, 0.88, 1] : t < 0.92 ? [0.55, 0.7, 1] : [1, 0.82, 0.6], i * 3)
        seed[i] = Math.random() * 100
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    pGeo.setAttribute('seed', new THREE.BufferAttribute(seed, 1))
    const pMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
        uniforms: { uTime: { value: 0 }, uSize: { value: 34 * renderer.getPixelRatio() } },
        vertexShader: `
            attribute float seed; uniform float uTime; uniform float uSize; varying vec3 vColor; varying float vFade;
            void main(){
                vec3 p = position;
                p.x += sin(uTime * 0.25 + seed) * 0.25;
                p.y += cos(uTime * 0.2 + seed * 1.3) * 0.25;
                vec4 mv = modelViewMatrix * vec4(p, 1.0);
                gl_Position = projectionMatrix * mv;
                gl_PointSize = uSize * (0.35 + 0.65 * fract(seed)) / -mv.z;
                vColor = color;
                vFade = clamp(1.0 - (-mv.z) / 40.0, 0.0, 1.0) * (0.55 + 0.45 * sin(uTime * 1.5 + seed * 6.0));
            }`,
        fragmentShader: `
            varying vec3 vColor; varying float vFade;
            void main(){
                float d = length(gl_PointCoord - 0.5);
                float a = smoothstep(0.5, 0.0, d);
                gl_FragColor = vec4(vColor, a * vFade);
            }`,
    })
    scene.add(new THREE.Points(pGeo, pMat))

    // ---- photo cards ------------------------------------------------------------
    const W = 2.4, H = 1.6
    const srcOf = (p) => (typeof p === 'string' ? p : p?.src) || null
    const captionOf = (p) => (typeof p === 'object' && p ? p.caption : '') || ''
    const placeholder = (n) => {
        const c = document.createElement('canvas'); c.width = 480; c.height = 320
        const g = c.getContext('2d')
        const grd = g.createLinearGradient(0, 0, 480, 320)
        grd.addColorStop(0, '#2a2a34'); grd.addColorStop(1, '#141419')
        g.fillStyle = grd; g.fillRect(0, 0, 480, 320)
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 3; g.lineJoin = 'round'
        g.strokeRect(195, 112, 90, 66)
        g.beginPath(); g.moveTo(203, 170); g.lineTo(228, 142); g.lineTo(244, 158); g.lineTo(256, 146); g.lineTo(277, 170); g.stroke()
        g.beginPath(); g.arc(266, 128, 6, 0, Math.PI * 2); g.stroke()
        g.fillStyle = 'rgba(255,255,255,0.4)'; g.font = '500 22px Geist, Arial, sans-serif'; g.textAlign = 'center'
        g.fillText(String(n).padStart(2, '0'), 240, 220)
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
    }
    const loader = new THREE.TextureLoader()
    const cards = items.map((p, i) => {
        const mat = new THREE.MeshBasicMaterial({ map: placeholder(i + 1), transparent: true, side: THREE.DoubleSide })
        const src = srcOf(p)
        if (src) loader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.needsUpdate = true })
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat)
        const side = i % 2 ? 1 : -1
        mesh.position.set(side * (1.3 + Math.random() * 0.9), (Math.random() - 0.5) * 1.4, -i * 6)
        mesh.rotation.set((Math.random() - 0.5) * 0.12, -side * (0.18 + Math.random() * 0.15), (Math.random() - 0.5) * 0.06)
        mesh.userData = { base: mesh.position.clone(), phase: Math.random() * 10 }
        // a faint frame
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }))
        mesh.add(edge)
        scene.add(mesh)
        return mesh
    })

    // ---- camera travel ---------------------------------------------------------
    let index = 0
    const target = new THREE.Vector3(), look = new THREE.Vector3()
    const camPos = new THREE.Vector3(0, 0, 8), camLook = new THREE.Vector3(0, 0, -6)
    const pointer = { x: 0, y: 0 }
    const aim = () => {
        const m = cards[index]
        if (!m) { target.set(0, 0, 8); look.set(0, 0, -6); return }
        // look a little above the photo so it sits below the XMB's icon bar
        target.set(m.userData.base.x * 0.55, m.userData.base.y + 0.3, m.userData.base.z + 4.2)
        look.set(m.userData.base.x, m.userData.base.y + 0.7, m.userData.base.z)
    }
    const hudUpdate = () => {
        countEl.textContent = items.length ? `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}` : 'No photos yet'
        captionEl.textContent = captionOf(items[index])
    }
    aim(); hudUpdate()

    // ---- run only while Photos is open -------------------------------------------
    let active = false, raf = 0, last = performance.now(), time = 0
    const resize = () => {
        const w = innerWidth, h = innerHeight
        renderer.setSize(w, h, false)
        camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    addEventListener('resize', resize); resize()

    const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now
        time += reduce ? dt * 0.2 : dt
        pMat.uniforms.uTime.value = time
        const k = 1 - Math.pow(0.0025, dt)                  // smooth follow
        camPos.lerp(target, k); camLook.lerp(look, k)
        camera.position.set(camPos.x + pointer.x * 0.35 + Math.sin(time * 0.3) * 0.08, camPos.y + pointer.y * 0.25 + Math.cos(time * 0.25) * 0.06, camPos.z)
        camera.lookAt(camLook)
        cards.forEach((m, i) => {
            const u = m.userData
            m.position.y = u.base.y + Math.sin(time * 0.6 + u.phase) * 0.06
            const on = i === index
            const s = THREE.MathUtils.lerp(m.scale.x, on ? 1.08 : 1, k)
            m.scale.setScalar(s)
            m.material.opacity = THREE.MathUtils.lerp(m.material.opacity, on ? 1 : 0.55, k)
        })
        renderer.render(scene, camera)
        raf = requestAnimationFrame(frame)
    }
    const setActive = (on) => {
        if (on === active) return
        active = on
        document.body.classList.toggle('photos-open', on)
        if (on) { last = performance.now(); raf = requestAnimationFrame(frame) }
        else cancelAnimationFrame(raf)
    }

    const isOpen = () => sectionEl.classList.contains('active')
    const sync = () => {
        setActive(isOpen())
        if (isOpen()) {
            const prompts = document.querySelector('.xmb-prompts')
            if (prompts && items.length) prompts.innerHTML = `<span class="prompt"><i class="glyph glyph-x" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M6 6l8 8M14 6l-8 8"/></svg></i>View</span><span class="prompt photo-space__keys">↑ ↓ Browse</span>`
        }
    }
    document.addEventListener('xmb:focus', sync)
    new MutationObserver(sync).observe(sectionEl, { attributes: true, attributeFilter: ['class'] })

    const go = (step) => {
        const next = index + step
        if (next < 0 || next >= cards.length) return
        index = next; aim(); hudUpdate()
        try { navSound.currentTime = 0; navSound.play() } catch {}
    }
    window.addEventListener('keydown', (e) => {
        if (!active || window.XMB_ALBUM?.isOpen || window.XMB_TETRIS?.isOpen) return
        if (document.querySelector('.psn-compose:not([hidden])')) return
        if (e.key === 'ArrowDown') { e.preventDefault(); e.stopImmediatePropagation(); go(1) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); e.stopImmediatePropagation(); go(-1) }
        else if (e.key === 'Enter' && items.length) { e.preventDefault(); e.stopImmediatePropagation(); window.XMB_ALBUM?.open('photos', index) }
    }, true)
    host.addEventListener('pointermove', (e) => {
        pointer.x = (e.clientX / innerWidth - 0.5) * 2
        pointer.y = -(e.clientY / innerHeight - 0.5) * 2
    })
    // wheel / swipe also move through the photos
    let wheelLock = 0
    host.addEventListener('wheel', (e) => {
        if (!active || performance.now() < wheelLock) return
        wheelLock = performance.now() + 350
        go(e.deltaY > 0 ? 1 : -1)
    }, { passive: true })
    host.addEventListener('click', () => { if (active && items.length) window.XMB_ALBUM?.open('photos', index) })

    sync()
}
