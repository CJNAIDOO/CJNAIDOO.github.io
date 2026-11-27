// ============================================================================
// Cameron's room: the 3D home of the portfolio.
//
// A gaming room with black walls: the desk along the back wall with the
// monitor, the PSP on its stand and MZALA (a little robot desk buddy); the
// PS3 stands under the desk; the bookshelf in the gap on the left has the
// record player and the figurines on top.
//
// There is one portfolio (the XMB, xmb.html) and two ways into it:
//   - pick up the PSP from the desk: it comes up into your hands and the
//     XMB runs on its screen (viewer.js, as before)
//   - sit at the desk: the XMB runs on the monitor, through the PS3
// The XMB moves to whichever one you use; the other one shows its standby.
//
// The PSP stays at the centre of the scene (viewer.js), so the live page on
// its screen works exactly as before. The room is built around it at the
// PSP's scale (1 unit = 1 cm), so that the PSP's spot on the desk is the
// scene origin. Picking it up moves the room, not the PSP.
//
// Content (posters, lines, photos, playlist) lives in room-config.js.
// Models (models/room/): see the credits in index.html.
// ============================================================================
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { ROOM, GUIDE } from './room-config.js?v=110';
import { sfx } from './sfx.js?v=95';
import { createInspector } from './inspect.js?v=97';
import { BOOKS, FILMS, GAMES, LINKS, TEXTBOOKS } from './shelf-data.js?v=98';
import { countsHTML, trophyListHTML } from './trophy-list.js?v=95';
import { DISCS } from './records-data.js?v=95';

const MODELS = {
    bedroom: 'models/room/bedroom.glb',         // the room itself (its TV wall and desk set-up removed)
    monitor: 'models/room/monitor.glb',
    keyboard: 'models/room/keyboard.glb',
    mouse: 'models/room/mouse.glb',
    chair: 'models/room/chair.glb',             // the gaming chair
    laptop: 'models/room/laptop.glb',           // my Legion
    stand: 'models/room/laptop-stand.glb',
    bookshelf: 'models/room/bookshelf.glb',
    ps3: 'models/room/ps3.glb',
    ds3: 'models/room/ds3.glb',
    turntable: 'models/room/record-player.glb',
    vinyl: 'models/room/vinyl.glb',             // one record: the wall, the platter and the pile
    cyclops: 'models/room/cyclops.glb',
    hood: 'models/room/hood.glb',
    jubilee: 'models/room/jubilee.glb',
    daredevil: 'models/room/daredevil.glb',
    jeff: 'models/room/jeff.glb',               // Jeff the Land Shark
    thing: 'models/room/thing.glb',
    robot: 'models/room/robot.glb',             // MZALA, the desk buddy
    ps4: 'models/room/ps4.glb',                 // a PS4 on its own shelf...
    ds4: 'models/room/ds4-controller.glb',      // ...its controller on top
    bonsai: 'models/room/bonsai.glb',           // a bonsai on the top shelf...
    terrarium: 'models/room/terrarium.glb',     // ...and a forest in a jar beside it
    notebook: 'models/room/notebook.glb',       // a composition book on the desk, module codes taped across it
    dvd: 'models/room/dvd-case.glb',            // one DVD case: every film on the shelf is a copy with its own cover
    rug: 'models/room/rug.glb',                 // a Persian rug on the floor
    lava: 'models/room/lava-lamp.glb',          // a lava lamp on the bedside table
    cork: 'models/room/corkboard.glb',          // a pin board on the wall behind the chair
    frames: 'models/room/frames.glb',           // nine black picture frames (frame + picture opening): the photos hang in these
    blind: 'models/room/blind.glb',             // window blinds over the low windows (the file has three: 01, 02 lowered, 03 raised)
    ball: 'models/room/jabulani.glb',           // the 2010 World Cup ball, under the desk
};

// ---- loading (with progress, so the intro's bar can follow it) --------------
// bump when a model file changes, so browsers fetch the new one (models are cached hard)
const MODELS_V = 3;
export function loadRoomAssets(onProgress = () => {}) {
    // the models' geometry is decoded in background workers, so MZALA's loading face keeps moving
    try { MeshoptDecoder.useWorkers(Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 4) - 1))); } catch { /* fine: on the main thread */ }
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const keys = Object.keys(MODELS);
    // progress by bytes (a file counts as ~1 MB until its real size is known)
    const got = Object.fromEntries(keys.map((k) => [k, 0]));
    const tot = Object.fromEntries(keys.map((k) => [k, 1e6]));
    const report = () => {
        const g = keys.reduce((s, k) => s + Math.min(got[k], tot[k]), 0);
        const t = keys.reduce((s, k) => s + tot[k], 0);
        onProgress(g / t);
    };
    return Promise.all(keys.map((k) => loader.loadAsync(`${MODELS[k]}?v=${MODELS_V}`, (e) => {
        if (e.lengthComputable) { got[k] = e.loaded; tot[k] = e.total; report(); }
    }).then((g) => { got[k] = tot[k]; report(); g.scene.userData.clips = g.animations; return [k, g.scene]; })))
        .then((pairs) => Object.fromEntries(pairs));
}

const texLoader = new THREE.TextureLoader();
const loadTex = (src) => new Promise((res, rej) => texLoader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, rej));
const canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
};

// ============================================================================
export async function buildRoom(handheld, assets, { onPs3: onPs3Option } = {}) {
    const { scene, info } = handheld;
    const psp = info.size;                                  // the PSP's size in cm

    // ---- the room, in metres ----------------------------------------------------
    // The gaming bedroom (an attic room: the ceiling slopes down over the bed on
    // the left, with skylights). x: along the back wall (0 = the left wall),
    // y: up, z: out from the back wall towards the open side.
    const R = { w: 4.57, d: 4.54 };
    const DESK = { x0: 1.95, x1: 4.45, top: 0.75, depth: 0.8 };
    const PSP_STAND = 0.008;
    // the room is drawn at K scene units (cm) per metre. Less than 100 makes the
    // PSP (which stays life-size in cm) a little bigger than life in the room.
    const K = 80;
    const pspM = psp.clone().divideScalar(K);                // the PSP's size in room metres
    const pspSpot = new THREE.Vector3(2.12, DESK.top + PSP_STAND + pspM.y / 2, 0.4);   // on the desk, left of the monitor

    // world: the room in metres, moved so the PSP's spot is the scene origin.
    // `held` moves the room away when you pick the PSP up (so the PSP stays put).
    const REST = pspSpot.clone().multiplyScalar(-K);
    const HELD = REST.clone().add(new THREE.Vector3(0, -42, -60));    // the PSP comes up off the desk, ~60 cm towards you
    const anchor = new THREE.Group();
    anchor.scale.setScalar(K);
    anchor.position.copy(REST);
    scene.add(anchor);
    const world = new THREE.Group();
    anchor.add(world);
    const toScene = (v) => v.clone().sub(pspSpot).multiplyScalar(K);   // room metres -> scene (room at rest)

    // place an object so its bounding box lands where we want it
    // (x/z: 'c' centre, '0' min, '1' max; y always the bottom)
    const place = (obj, { x, y = 0, z, ax = 'c', az = 'c' }) => {
        anchor.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(world.matrixWorld).invert();
        const b = new THREE.Box3().setFromObject(obj, true).applyMatrix4(inv);
        const pick = (min, max, a) => (a === '0' ? min : a === '1' ? max : (min + max) / 2);
        obj.position.x += x - pick(b.min.x, b.max.x, ax);
        obj.position.y += y - b.min.y;
        obj.position.z += z - pick(b.min.z, b.max.z, az);
    };
    const boxOf = (obj) => {
        anchor.updateMatrixWorld(true);
        return new THREE.Box3().setFromObject(obj, true).applyMatrix4(new THREE.Matrix4().copy(world.matrixWorld).invert());
    };
    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o });

    // ---- light: one set for night (the default) and one for day; setTheme() blends ----
    const hemi = new THREE.HemisphereLight(0xc9c2ff, 0x140a14, 0.9);
    const sun = new THREE.DirectionalLight(0xfff1dc, 0);       // day: through the skylights on the left
    sun.position.set(-2.5, 5, 2.2);
    sun.target.position.set(2.6, 0, 1.2);
    const ceiling = new THREE.PointLight(0xffd7b0, 1.2, 0, 0);
    ceiling.position.set(2.6, 3.2, 2.2);
    const screenGlow = new THREE.PointLight(0x7aa8ff, 0.9, 200, 1);
    screenGlow.position.set(3.25, 1.05, 0.6);
    const deskLight = new THREE.SpotLight(0xfff0dc, 3.2, 0, 0.45, 0.7, 0);     // a little light on the PSP and MZALA
    deskLight.position.set(pspSpot.x - 0.1, 2.6, 1.2);
    deskLight.target.position.copy(pspSpot);
    const neonGlow = new THREE.PointLight(0xff2a3a, 0.8, 0, 1.6);              // the red neon over the bed
    neonGlow.position.set(0.25, 1.75, 2.9);
    const lampGlow = new THREE.PointLight(0xffb36b, 0.7, 0, 1.6);              // the bedside lamp
    lampGlow.position.set(2.0, 0.75, 4.25);
    world.add(hemi, sun, sun.target, ceiling, screenGlow, deskLight, deskLight.target, neonGlow, lampGlow);

    // ---- the bedroom (its TV wall and its desk set-up are gone: ours goes there) -------
    const BED_SCALE = 0.005435;                              // its units -> metres (its desk was 0.75 m high)
    const bedroom = assets.bedroom;
    bedroom.scale.setScalar(BED_SCALE);
    bedroom.position.set(-147 * BED_SCALE, -437.4 * BED_SCALE, -114 * BED_SCALE);   // the back-left corner, on the floor, at 0
    world.add(bedroom);
    const WALLC = (() => { const q = new URLSearchParams(location.search).get('wall') || ''; return /^[0-9a-f]{6}$/i.test(q) ? parseInt(q, 16) : 0xc8bca8; })();   // warm greige; ?wall=RRGGBB previews another
    const roomMats = { walls: std(WALLC, { roughness: 0.95 }), trim: std(0x121214), floor: null };
    let paintMat = () => roomMats.walls;
    const floorTex = canvasTex(1024, 1024, (g, w, h) => {
        // wide oak boards, staggered; colour comes from the material (so it works for day and night)
        g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
        const rows = 8, bh = h / rows;
        for (let r = 0; r < rows; r++) {
            let x = -((r * 397) % 600);
            while (x < w) {
                const len = 420 + ((r * 131 + x * 7) % 260);
                const tone = 222 + ((r * 37 + Math.round(x)) % 30);
                g.fillStyle = `rgb(${tone},${tone},${tone})`; g.fillRect(x, r * bh, len, bh);
                for (let k = 0; k < 7; k++) {          // a few long grain lines
                    g.strokeStyle = `rgba(0,0,0,${0.03 + (k % 3) * 0.015})`; g.lineWidth = 1 + (k % 2);
                    const yy = r * bh + 6 + ((k * 23 + r * 11) % (bh - 12));
                    g.beginPath(); g.moveTo(x + 4, yy); g.bezierCurveTo(x + len * 0.3, yy + 3, x + len * 0.6, yy - 3, x + len - 4, yy + 1); g.stroke();
                }
                g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x, r * bh, 2, bh);
                x += len;
            }
            g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, r * bh, w, 2);
        }
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(R.w / 2.4, R.d / 2.4);
    roomMats.floor = std(0x3a2c22, { map: floorTex, roughness: 0.5 });
    // the floor and walls get the master bedroom's textures: light oak planks on the floor (a
    // tile's ~4 m), and the walls its fine wallpaper grain, as bumps only (the walls stay black)
    {
        const tl = new THREE.TextureLoader();
        const tile = (url, rx, ry, srgb) => { const t = tl.load(url); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
        Object.assign(roomMats.floor, { map: tile('images/room/tex/floor.webp', R.w / 4, R.d / 4, true), normalMap: tile('images/room/tex/floor_n.webp', R.w / 4, R.d / 4), roughness: 0.55 });
        roomMats.floor.normalScale.set(1, 1);
        // the walls' uneven paint (a seamless PBR set: its normal map and roughness, the walls stay black)
        Object.assign(roomMats.walls, { normalMap: tile('images/room/tex/wall_paint_n.webp?v=110', 1, 1), roughnessMap: tile('images/room/tex/wall_paint_r.webp?v=110', 1, 1), roughness: 1 });
        roomMats.walls.normalScale.set(1, 1);
        // a flat panel of wall (the right wall, the roof slope, the low windows' fill) paints the same
        // way at the same scale: one tile per ~1.5 m, so the grain runs on across the joins
        paintMat = (w, h, side) => {
            const m = roomMats.walls.clone();
            m.normalMap = tile('images/room/tex/wall_paint_n.webp?v=110', w / 1.5, h / 1.5);
            m.roughnessMap = tile('images/room/tex/wall_paint_r.webp?v=110', w / 1.5, h / 1.5);
            if (side) m.side = side;
            return m;
        };
        roomMats.frames = std(0xffffff, { map: tile('images/room/tex/metal.webp', 1, 1, true), normalMap: tile('images/room/tex/metal_n.webp', 1, 1), metalness: 0.6, roughness: 0.45 });
    }
    const rug = std(0x101012, { roughness: 1 });
    const recolour = {                                        // streetwear: black, white and red
        'Material.033': std(0xd4202c, { roughness: 0.7 }),    // the chair's stripes
        'Material.032': std(0x111113, { roughness: 0.75 }),
        'Material.025': std(0x1c1c20, { roughness: 0.95 }),   // the duvet
        'cojin1': std(0xd8d2c4, { roughness: 0.95 }),         // pillows
        'Material.026': std(0x2a1f18, { roughness: 0.7 }),    // the bed frame
        'Material.010': std(0x1a1a1d, { roughness: 0.5 }),    // the lamp
        'Material.015': std(0xffcf9a, { emissive: 0xffb36b, emissiveIntensity: 1.2 }),
        'Material.013': rug,
        'marco': roomMats.frames,                             // window frames: dark brushed metal
    };
    const frames = {};                                        // the three picture frames: posters go in them
    bedroom.traverse((o) => {
        if (!o.isMesh) return;
        const name = o.material?.name || '';
        if (/^cuarto00[12]/.test(o.name)) o.visible = false;   // its floor: ours below
        else if (/^cuarto_/.test(o.name)) o.material = name === 'Material.014' ? roomMats.walls : roomMats.trim;
        else if (recolour[name]) o.material = recolour[name];
        if (/^cuadro\d?_Material/.test(o.name)) frames[o.name.split('_')[0]] = o;
    });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(R.w + 0.3, 0.04, R.d + 0.05), roomMats.floor);      // runs out to the rebuilt left wall too
    floor.position.set(R.w / 2 - 0.1, -0.02, R.d / 2);
    world.add(floor);

    // the gaming chair, pulled out to the right of the desk and turned so the PSP and MZALA
    // stay in view (the bedroom's own chair goes)
    bedroom.traverse((o) => { if (o.isMesh && /^silla_/.test(o.name)) o.visible = false; });
    const chair = new THREE.Group();
    {
        const c = assets.chair;
        c.traverse((o) => {
            if (!o.isMesh) return;
            const n = o.material?.name || '';
            if (/Pink/i.test(n)) o.material = std(0xd4202c, { roughness: /leather/i.test(n) ? 0.6 : 0.4 });   // pink -> the room's red
        });
        const b = new THREE.Box3().setFromObject(c);
        c.scale.setScalar(1.35 / (b.max.y - b.min.y));        // ~1.35 m to the top of the headrest
        const b2 = new THREE.Box3().setFromObject(c), cc = b2.getCenter(new THREE.Vector3());
        c.position.set(-cc.x, -b2.min.y, -cc.z);
        chair.add(c);
        world.add(chair);
        chair.rotation.y = ROOM.chair?.turn ?? -2.3;
        chair.position.set(ROOM.chair?.x ?? 4.0, 0, ROOM.chair?.z ?? 1.5);
        chair.userData.pivot = chair;
    }

    // ---- the desk along the back wall: a thick oak top on a black steel leg (left)
    // and a black pedestal (right) with a drawer, and an open cubby the PS3 stands in
    const desk = new THREE.Group();
    world.add(desk);
    const oakTex = canvasTex(1024, 256, (g, w, h) => {
        g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 70; i++) {                         // long grain, along the desk
            const y = Math.random() * h, a = 0.025 + Math.random() * 0.05;
            g.strokeStyle = `rgba(80,45,15,${a})`; g.lineWidth = 1 + Math.random() * 2.5;
            g.beginPath(); g.moveTo(0, y);
            for (let x = 0; x <= w; x += 64) g.lineTo(x, y + Math.sin(x * 0.004 + i) * 6 + Math.sin(x * 0.02 + i * 3) * 1.5);
            g.stroke();
        }
        for (let i = 0; i < 3; i++) {                          // a couple of soft knots
            const x = Math.random() * w, y = Math.random() * h;
            const r = g.createRadialGradient(x, y, 0, x, y, 26); r.addColorStop(0, 'rgba(90,50,20,0.25)'); r.addColorStop(1, 'rgba(90,50,20,0)');
            g.fillStyle = r; g.fillRect(x - 30, y - 30, 60, 60);
        }
    });
    // the desk top: the bookshelf's own wood (a strip of its photo texture, grain along the desk)
    const deskWood = new THREE.TextureLoader().load('images/room/tex/desk-wood.webp');
    deskWood.colorSpace = THREE.SRGBColorSpace; deskWood.wrapS = deskWood.wrapT = THREE.MirroredRepeatWrapping; deskWood.anisotropy = 8;
    deskWood.center.set(0.5, 0.5); deskWood.rotation = Math.PI / 2; deskWood.repeat.set(2, 5);
    const oak = std(0xf1c57c, { map: deskWood, roughness: 0.55 });                  // (tinted to read the same as the shelf under the room's light)
    const steel = std(0x111113, { roughness: 0.4, metalness: 0.6 });
    const matte = std(0x18181b, { roughness: 0.7 });
    const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); desk.add(m); return m; };
    const TOP_T = 0.04, LEN = DESK.x1 - DESK.x0, DZ = 0.02;
    box(LEN, TOP_T, DESK.depth, oak, DESK.x0 + LEN / 2, DESK.top - TOP_T / 2, DZ + DESK.depth / 2);
    // the steel leg: two posts, a foot and a rail
    const legH = DESK.top - TOP_T, lx = DESK.x0 + 0.06;
    for (const z of [DZ + 0.06, DZ + DESK.depth - 0.06]) box(0.045, legH, 0.045, steel, lx, legH / 2, z);
    box(0.05, 0.03, DESK.depth - 0.04, steel, lx, 0.015, DZ + DESK.depth / 2);
    box(0.045, 0.045, DESK.depth - 0.12, steel, lx, legH - 0.03, DZ + DESK.depth / 2);
    // a beam along the back, under the top
    const PED = { w: 0.48 };
    const px0 = DESK.x1 - PED.w;
    box(px0 - lx, 0.05, 0.03, steel, (lx + px0) / 2, legH - 0.04, DZ + 0.05);
    // the pedestal: sides, back, a drawer up top, an open cubby below for the PS3
    const pT = 0.022, pD = DESK.depth - 0.02;
    box(pT, legH, pD, matte, px0 + pT / 2, legH / 2, DZ + pD / 2);
    box(pT, legH, pD, matte, DESK.x1 - pT / 2, legH / 2, DZ + pD / 2);
    box(PED.w, legH, pT, matte, px0 + PED.w / 2, legH / 2, DZ + pT / 2);
    box(PED.w, 0.03, pD, matte, px0 + PED.w / 2, 0.015, DZ + pD / 2);              // plinth
    const CUBBY = 0.46;
    box(PED.w - 2 * pT, pT, pD, matte, px0 + PED.w / 2, CUBBY, DZ + pD / 2);        // cubby roof
    const drawer = box(PED.w - 2 * pT - 0.006, legH - CUBBY - pT - 0.012, 0.02, std(0x1d1d21, { roughness: 0.6 }), px0 + PED.w / 2, (CUBBY + pT / 2 + legH) / 2, DZ + pD - 0.01);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.014, 0.02), oak);
    handle.position.set(0, 0.03, 0.02); drawer.add(handle);
    desk.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });

    const shelf = assets.bookshelf;
    shelf.scale.set(2.0, 1.35, 1.35);                        // deeper than the model, so a turntable fits on top
    shelf.rotation.y = Math.PI / 2;                          // books facing into the room
    world.add(shelf);
    {
        place(shelf, { x: DESK.x0 - 0.1, ax: '1', z: 0.0, az: '0' });
    }
    const shelfBox = boxOf(shelf);
    const BOOK_TOP = shelfBox.max.y;

    // ---- the gaming set-up on the desk: the ultrawide in the middle-right, the Razer
    // keyboard and mouse, the controller on the right; the PSP and MZALA on the left.
    const fitW = (obj, width, part) => {
        const b = new THREE.Box3().setFromObject(part || obj);
        obj.scale.multiplyScalar(width / (b.max.x - b.min.x));
    };
    const monitor = assets.monitor;
    fitW(monitor, 1.04, monitor.getObjectByName('Ultrawide_Monitor_Screen_0') || monitor.getObjectByProperty('isMesh', true));   // a 34" ultrawide: 80 cm of screen
    world.add(monitor);
    place(monitor, { x: 3.4, y: DESK.top, z: 0.08, az: '0' });
    const keyboard = assets.keyboard;
    fitW(keyboard, 0.46, keyboard.getObjectByName('kbA_kbA_0'));                // tenkeyless (36 cm), at room scale
    world.add(keyboard);
    {
        // its cable hangs down behind it, so line up the keyboard itself (its
        // keys start ~1.9 cm above the desk)
        const keys = keyboard.getObjectByName('kbA_kbA_0') || keyboard;
        const kb = boxOf(keys);
        keyboard.position.x += 3.33 - (kb.min.x + kb.max.x) / 2;
        keyboard.position.z += 0.56 - (kb.min.z + kb.max.z) / 2;
        keyboard.position.y += DESK.top + 0.024 - kb.min.y;
    }
    const mouse = assets.mouse;
    fitW(mouse, 0.085, mouse.getObjectByName('mouse_mouse_0'));                 // a DeathAdder (6.4 cm wide), at room scale
    world.add(mouse);
    place(mouse, { x: 3.86, y: DESK.top, z: 0.56 });
    // the PS3 stands up in the pedestal's cubby, under the right end of the desk
    const ps3 = assets.ps3;
    ps3.rotation.z = Math.PI / 2;                            // on its side, standing up
    ps3.rotation.y = Math.PI;                                // its front (the disc slot and logo) toward the room
    ps3.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI));   // upside down about its front, so the disc tray is at the top
    world.add(ps3);
    {
        const b = boxOf(ps3);
        ps3.scale.multiplyScalar(0.37 / (b.max.y - b.min.y));  // a slim, standing: ~37 cm (the room's a touch bigger than life)
        place(ps3, { x: px0 + PED.w / 2, y: 0.03, z: DZ + pD / 2 + 0.04 });
    }
    const ds3 = assets.ds3;
    {
        const b = new THREE.Box3().setFromObject(ds3);
        ds3.scale.setScalar(0.24 / (b.max.x - b.min.x));      // a touch bigger than life, so it reads bigger than the mouse
        world.add(ds3);
        ds3.rotation.y = -0.35;
        place(ds3, { x: 4.18, y: DESK.top, z: 0.24 });
    }

    // the monitor's screen: where the XMB shows when you play on the PS3
    const screenMesh = monitor.getObjectByName('Ultrawide_Monitor_Screen_0');
    const sb = boxOf(screenMesh);
    const SCREEN = {
        w: sb.max.x - sb.min.x, h: sb.max.y - sb.min.y,
        centre: new THREE.Vector3((sb.min.x + sb.max.x) / 2, (sb.min.y + sb.max.y) / 2, sb.max.z + 0.002),
    };
    screenMesh.visible = false;
    // standby: a dark XMB-blue wave with a hint
    const standbyTex = canvasTex(1024, Math.round(1024 * SCREEN.h / SCREEN.w), (g, w, h) => {
        const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#05081a'); bg.addColorStop(1, '#0d1f4a');
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(140,180,255,0.35)'; g.lineWidth = 3;
        for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = h * 0.62 + Math.sin(x * 0.006 + k) * h * 0.08 + k * 10; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
        g.fillStyle = 'rgba(230,236,255,0.85)'; g.font = '300 44px Geist, system-ui, sans-serif'; g.textAlign = 'center';
        g.fillText('click to play on the PS3', w / 2, h * 0.42);
    });
    const monitorStandby = new THREE.MeshBasicMaterial({ map: standbyTex, toneMapped: false });
    const monitorHole = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, blending: THREE.NoBlending, depthWrite: true });
    const monitorPanel = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h), monitorStandby);
    monitorPanel.position.copy(SCREEN.centre);
    world.add(monitorPanel);

    // ---- the wall shelf: figurines and the PSP on a little stand -----------------------------
    const figure = (obj, height, x, y, z, turn) => {
        const b = new THREE.Box3().setFromObject(obj);
        obj.scale.setScalar(height / (b.max.y - b.min.y));
        obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });     // skinned: bounds can lie
        const g = new THREE.Group(); g.add(obj); world.add(g);
        g.rotation.y = turn;
        place(g, { x, y, z });
        const hb = boxOf(g);
        const hit = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.1, hb.max.x - hb.min.x), height, Math.max(0.1, hb.max.z - hb.min.z)), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.set((hb.min.x + hb.max.x) / 2, y + height / 2, (hb.min.z + hb.max.z) / 2);
        world.add(hit);
        hit.userData.figure = g;                               // what the inspector picks up
        return hit;
    };

    const acrylic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, transparent: true, opacity: 0.35 });
    const stand = new THREE.Group();
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(pspM.x * 0.7, PSP_STAND, 0.06), acrylic);
    standBase.position.y = PSP_STAND / 2;
    const standBack = new THREE.Mesh(new THREE.BoxGeometry(pspM.x * 0.5, pspM.y * 0.8, 0.004), acrylic);
    standBack.position.set(0, PSP_STAND + pspM.y * 0.4, -pspM.z / 2 - 0.004);
    stand.add(standBase, standBack);
    stand.position.set(pspSpot.x, DESK.top, pspSpot.z);
    world.add(stand);
    // a soft halo behind the PSP, so you know you can take it
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(160,200,255,0.9)'); r.addColorStop(0.35, 'rgba(120,160,255,0.35)'); r.addColorStop(1, 'rgba(120,160,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    }));
    halo.scale.set(0.42, 0.26, 1);
    halo.position.set(pspSpot.x, pspSpot.y, pspSpot.z - pspM.z - 0.03);
    halo.visible = false;                 // (no glow behind the PSP)

    // ---- the bookshelf's top: record player, a trophy and a school photo; records on the floor
    // the bookshelf: its bottom row of books comes out and the record player goes in
    // there (lid off); the top is for the Rivals team of six
    const shelfH = shelfBox.max.y - shelfBox.min.y, r = shelfH / 1.15;    // model units -> room metres
    {
        const cut = shelfBox.min.y + 1.13 * r;                // all its own books go (the top row's the bonsai's)
        const inv = new THREE.Matrix4().copy(world.matrixWorld).invert(), v = new THREE.Vector3();
        anchor.updateMatrixWorld(true);
        shelf.traverse((o) => {
            if (!o.isMesh || !o.geometry.index) return;
            const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
            const pos = o.geometry.attributes.position, idx = o.geometry.index.array, keep = [];
            const ys = new Float32Array(pos.count);
            for (let i = 0; i < pos.count; i++) ys[i] = v.fromBufferAttribute(pos, i).applyMatrix4(m).y;
            const book = (i) => ys[i] < cut && ys[i] > shelfBox.min.y + 0.03 * r;
            let dropped = 0;
            for (let t = 0; t < idx.length; t += 3) {
                if (book(idx[t]) && book(idx[t + 1]) && book(idx[t + 2]) && o.geometry.attributes.position.count > 5000) { dropped++; continue; }
                keep.push(idx[t], idx[t + 1], idx[t + 2]);
            }
            if (dropped) { o.geometry = o.geometry.clone(); o.geometry.setIndex(keep); }
        });
    }
    // ---- the shelves, bottom up: records, PS2 games, then two rows of books --------------
    // (rows in the bookshelf model's units: board tops and the board above)
    const ROWS = [[0.035, 0.235], [0.25, 0.465], [0.48, 0.675], [0.69, 0.875]];
    // a row's floor: found by dropping a ray onto the shelf board (the model's rows aren't evenly spaced)
    const dropRay = new THREE.Raycaster();
    const boardTop = (x, z, from) => {
        anchor.updateMatrixWorld(true);
        const o = world.localToWorld(new THREE.Vector3(x, from, z)), d = world.localToWorld(new THREE.Vector3(x, from - 1, z)).sub(o).normalize();
        dropRay.set(o, d);
        const hit = dropRay.intersectObject(shelf, true).find((h) => h.object.visible);
        return hit ? world.worldToLocal(hit.point.clone()).y : null;
    };
    const rowY = ([a, b]) => {
        const y0 = shelfBox.min.y + a * r, y1 = shelfBox.min.y + b * r;
        const cx = (shelfBox.min.x + shelfBox.max.x) / 2, cz = shelfBox.max.z - 0.12;
        const ys = [-0.25, 0, 0.25].map((f) => boardTop(cx + f * (shelfBox.max.x - shelfBox.min.x), cz, y0 + (y1 - y0) * 0.5)).filter((v) => v !== null && Math.abs(v - y0) < 0.08);
        return [ys.length ? Math.max(...ys) + 0.001 : y0, y1];
    };
    const inX0 = shelfBox.min.x + (shelfBox.max.x - shelfBox.min.x) * 0.045, inX1 = shelfBox.max.x - (shelfBox.max.x - shelfBox.min.x) * 0.045;
    const frontZ = shelfBox.max.z - 0.035;
    // one piece of a model as a mesh stood upright: its thinnest side along x (the
    // shelf), its longest up and the other one front-to-back (the spine to the room)
    const frameOf = (geos) => {
        const c = new THREE.Vector3(), v = new THREE.Vector3(); let n = 0;
        for (const geo of geos) { const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { c.add(v.fromBufferAttribute(pos, i)); n++; } }
        c.divideScalar(n);
        const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (const geo of geos) {
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i).sub(c); const a = [v.x, v.y, v.z];
                for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) C[j][k] += a[j] * a[k];
            }
        }
        // Jacobi: the box's own axes
        const V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        for (let it = 0; it < 30; it++) {
            let p = 0, q = 1;
            if (Math.abs(C[0][2]) > Math.abs(C[p][q])) { p = 0; q = 2; }
            if (Math.abs(C[1][2]) > Math.abs(C[p][q])) { p = 1; q = 2; }
            if (Math.abs(C[p][q]) < 1e-12) break;
            const th = 0.5 * Math.atan2(2 * C[p][q], C[q][q] - C[p][p]), cs = Math.cos(th), sn = Math.sin(th);
            for (let k = 0; k < 3; k++) { const a = C[k][p], b = C[k][q]; C[k][p] = cs * a - sn * b; C[k][q] = sn * a + cs * b; }
            for (let k = 0; k < 3; k++) { const a = C[p][k], b = C[q][k]; C[p][k] = cs * a - sn * b; C[q][k] = sn * a + cs * b; }
            for (let k = 0; k < 3; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = cs * a - sn * b; V[k][q] = sn * a + cs * b; }
        }
        const ax = [0, 1, 2].map((i) => ({ val: C[i][i], vec: new THREE.Vector3(V[0][i], V[1][i], V[2][i]) })).sort((a, b) => a.val - b.val);
        const ex = ax[0].vec, ey = ax[2].vec, ez = ax[1].vec;
        if (new THREE.Vector3().crossVectors(ex, ey).dot(ez) < 0) ex.negate();        // keep it right-handed (no mirroring)
        const m = new THREE.Matrix4().makeBasis(ex, ey, ez).transpose().multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
        // then bottom centre at the origin
        const bb = new THREE.Box3();
        for (const geo of geos) { const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) bb.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(m)); }
        const mid = bb.getCenter(new THREE.Vector3());
        return new THREE.Matrix4().makeTranslation(-mid.x, -bb.min.y, -mid.z).multiply(m);
    };
    const upright = (geo, mat) => {
        const g = geo.clone(); g.applyMatrix4(frameOf([geo])); g.computeBoundingBox();
        const mesh = new THREE.Mesh(g, mat); mesh.castShadow = mesh.receiveShadow = true;
        return mesh;
    };
    // a model's meshes baked into one geometry per material, in the model's own space
    const baked = (root, skip = () => false) => {
        root.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), out = [];
        root.traverse((o) => {
            if (!o.isMesh || skip(o)) return;
            // plain floats first (the files are quantised: a scaled int16 attribute would clip)
            const g = new THREE.BufferGeometry();
            for (const [name, a] of Object.entries(o.geometry.attributes)) {
                if (!['position', 'normal', 'uv'].includes(name)) continue;
                const f = new Float32Array(a.count * a.itemSize);
                for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) f[i * a.itemSize + k] = a.getComponent(i, k);
                g.setAttribute(name, new THREE.BufferAttribute(f, a.itemSize));
            }
            if (o.geometry.index) g.setIndex(o.geometry.index.clone());
            g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
            out.push({ geo: g, mat: o.material });
        });
        return out;
    };
    // the separate books in the pile (each one its own little island of triangles)
    const pieces = (geo) => {
        const g = geo.index ? geo : geo.clone();
        if (!g.index) g.setIndex([...Array(g.attributes.position.count).keys()]);
        const pos = g.attributes.position, I = g.index.array, n = pos.count, par = new Int32Array(n).map((_, i) => i);
        const f = (x) => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
        const u = (a, b) => { a = f(a); b = f(b); if (a !== b) par[a] = b; };
        for (let t = 0; t < I.length; t += 3) { u(I[t], I[t + 1]); u(I[t], I[t + 2]); }
        const seen = new Map();
        for (let i = 0; i < n; i++) { const k = `${Math.round(pos.getX(i) * 500)},${Math.round(pos.getY(i) * 500)},${Math.round(pos.getZ(i) * 500)}`; seen.has(k) ? u(i, seen.get(k)) : seen.set(k, i); }
        const tris = new Map();
        for (let t = 0; t < I.length; t += 3) { const k = f(I[t]); if (!tris.has(k)) tris.set(k, []); tris.get(k).push(I[t], I[t + 1], I[t + 2]); }
        // each book its own compact geometry (only its own vertices)
        return [...tris.values()].filter((t) => t.length >= 30).map((t) => {
            const map = new Map(), idx = [];
            for (const i of t) { if (!map.has(i)) map.set(i, map.size); idx.push(map.get(i)); }
            const p = new THREE.BufferGeometry();
            for (const [name, a] of Object.entries(g.attributes)) {
                const f = new Float32Array(map.size * a.itemSize);
                for (const [i, j] of map) for (let k = 0; k < a.itemSize; k++) f[j * a.itemSize + k] = a.getComponent(i, k);
                p.setAttribute(name, new THREE.BufferAttribute(f, a.itemSize));
            }
            p.setIndex(idx);
            return p;
        });
    };
    // a row of standing things, left to right, with a little gap; returns how far it got
    const standRow = (group, items, x0, x1, y, gap = 0.003) => {
        let x = x0;
        for (const it of items) {
            it.updateMatrixWorld(true);
            const b = new THREE.Box3().setFromObject(it);
            const w = b.max.x - b.min.x, d = b.max.z - b.min.z;
            if (x + w > x1) break;
            it.position.set(x + w / 2, y, frontZ - d / 2 - 0.01);
            group.add(it); x += w + gap;
        }
        return x;
    };
    const shelfStuff = { vinylSet: null, games: new THREE.Group(), console: new THREE.Group(), books: [new THREE.Group(), new THREE.Group(), new THREE.Group()] };
    // the records (a row of sleeves, the model's loose record left out): they go in the cube under the record player
    if (assets.vinyls) {
        // (no record, and nothing lying flat: only the standing sleeves)
        const parts = baked(assets.vinyls, (o) => /^(vinyl|label)/.test(o.material?.name || '')).filter(({ geo }) => {
            geo.computeBoundingBox(); const z = geo.boundingBox.getSize(new THREE.Vector3());
            return z.y > 0.5 * Math.max(z.x, z.z);
        });
        const set = new THREE.Group();
        for (const { geo, mat } of parts) { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; set.add(m); }
        const b = new THREE.Box3().setFromObject(set), sz = b.getSize(new THREE.Vector3());
        const s = 0.3 / sz.y;
        const unit = new THREE.Group(); unit.add(set);
        set.scale.setScalar(s);
        set.rotation.y = Math.PI / 2;                         // the model's sleeves face front: turn them spines-out
        const b2 = new THREE.Box3().setFromObject(unit), c2 = b2.getCenter(new THREE.Vector3());
        set.position.set(-c2.x, -b2.min.y, -c2.z);
        shelfStuff.vinylSet = unit;
    }
    // second: the PS4 (its controller on top), Cam's PS4 games spines-out beside it like the
    // films above, and a bonsai at the end
    {
        const [y0, y1] = rowY(ROWS[1]);
        let x = inX0 + 0.03, ps4Left = inX1;
        if (assets.ps4) {
            const ps4 = assets.ps4;
            const drop = []; ps4.traverse((o) => { if (o.isMesh && /Invisible/i.test(o.material?.name || '')) drop.push(o); });
            drop.forEach((o) => o.parent.remove(o));
            const solid = (o) => { if (!o.isMesh) return; o.castShadow = o.receiveShadow = true; for (const m of [].concat(o.material)) { m.transparent = false; m.depthWrite = true; m.alphaTest = 0.5; } };
            ps4.traverse(solid);                                          // (all its materials were 'blend': its insides showed through)
            const unit = new THREE.Group(); unit.add(ps4);
            ps4.rotation.y = ROOM.ps4?.turn ?? Math.PI / 2;                     // its front (the disc slot) to the room
            let b = new THREE.Box3().setFromObject(unit), sz = b.getSize(new THREE.Vector3());
            ps4.scale.multiplyScalar(Math.min(0.305 / sz.x, (frontZ - shelfBox.min.z - 0.03) / sz.z));   // a real PS4: 30.5 cm across
            b = new THREE.Box3().setFromObject(unit); const c = b.getCenter(new THREE.Vector3());
            ps4.position.sub(new THREE.Vector3(c.x, b.min.y, c.z));
            shelfStuff.console.add(unit);
            const ub = new THREE.Box3().setFromObject(unit), w = ub.max.x - ub.min.x, d = ub.max.z - ub.min.z, h = ub.max.y - ub.min.y;
            unit.position.set(inX1 - 0.006 - w / 2, y0, frontZ - d / 2 + 0.005);     // at the right end; its front at the shelf's edge
            ps4Left = inX1 - 0.006 - w;
            // the controller, lying flat beside it (placed once the games are in)
            if (assets.ds4) {
                const pad = assets.ds4;
                pad.traverse(solid);
                const pb = new THREE.Box3().setFromObject(pad), ps = pb.getSize(new THREE.Vector3());
                pad.scale.multiplyScalar(0.162 / ps.x);                  // a DualShock 4: 16 cm across
                const pg = new THREE.Group(); pg.add(pad);
                const b2 = new THREE.Box3().setFromObject(pg), c2 = b2.getCenter(new THREE.Vector3());
                pad.position.sub(new THREE.Vector3(c2.x, b2.min.y, c2.z));
                pg.rotation.y = -0.25;
                shelfStuff.console.add(pg);
                shelfStuff.pad = pg;
            }
            world.add(shelfStuff.console);
            x += w + 0.025;
        }
        // (the games go on the left of this row, beside the controller: built with the films below,
        // from the same case model)
        shelfStuff.ps4Row = { y0, ps4Left };
    }
    // the bonsai, on its own on the top shelf (under the figures)
    if (assets.bonsai) {
        const [y0, y1] = rowY([0.885, 1.13]);
        const bon = assets.bonsai;
        bon.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
        // (the model's levelled and turned so the pot's long side runs along x: along the shelf)
        bon.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(bon), sz = b.getSize(new THREE.Vector3());
        bon.scale.multiplyScalar(Math.min((y1 - y0) * 0.86 / sz.y, (inX1 - inX0) * 0.6 / sz.x, (frontZ - shelfBox.min.z - 0.04) / sz.z));
        world.add(bon);
        const bw = boxOf(bon), bwx = bw.max.x - bw.min.x;
        // to the left, to make room for the terrarium
        place(bon, { x: inX0 + 0.03 + bwx / 2, y: y0, z: frontZ - (bw.max.z - bw.min.z) / 2 + 0.01 });   // forward, to the shelf's edge
        shelfStuff.plant = bon;
        // the forest in a jar, on the right
        if (assets.terrarium) {
            const jar = assets.terrarium;
            jar.traverse((o) => {
                if (!o.isMesh) return;
                o.castShadow = o.receiveShadow = !o.material.transparent;
                if (o.material.transparent) { o.material.depthWrite = false; o.renderOrder = 2; }   // the glass, drawn after what's in it
            });
            const js = new THREE.Box3().setFromObject(jar).getSize(new THREE.Vector3());
            jar.scale.multiplyScalar(Math.min((y1 - y0) * 0.8 / js.y, (inX1 - (inX0 + 0.03 + bwx) - 0.06) / js.x));
            world.add(jar);
            const jb = boxOf(jar), jw = jb.max.x - jb.min.x;
            place(jar, { x: inX1 - 0.03 - jw / 2, y: y0, z: frontZ - (jb.max.z - jb.min.z) / 2 - 0.01 });
            shelfStuff.jar = jar;
        }
    }
    // ---- Cam's textbooks, upright on the bottom shelf (spines out, flush left) ----
    {
        const [y0, y1] = rowY(ROWS[0]);
        const H = Math.min(0.254, y1 - y0 - 0.008), D = 0.2, gap = 0.002;     // a textbook: 25 x 20 cm
        const textSpine = (b) => canvasTex(Math.max(48, Math.round(1024 * b.t / H)), 1024, (g, w, h) => {
            g.fillStyle = b.bg; g.fillRect(0, 0, w, h);
            g.fillStyle = b.accent; g.fillRect(0, 0, w, h * 0.07); g.fillRect(0, h * 0.86, w, h * 0.025);
            g.save(); g.translate(w / 2, h * 0.1); g.rotate(Math.PI / 2);
            g.textBaseline = 'middle'; g.fillStyle = b.ink;
            // the authors' surnames at the foot, the title in the room that leaves
            const foot = (b.author || '').split(/\s*&\s*/).map((n) => n.trim().split(' ').pop()).filter(Boolean).join(' · ');
            g.font = `400 ${Math.min(w * 0.3, 26)}px Geist, Arial, sans-serif`;
            const footW = foot ? g.measureText(foot).width + h * 0.04 : 0;
            let size = Math.min(w * 0.5, 58); g.font = `700 ${size}px Geist, Arial, sans-serif`;
            while (g.measureText(b.title).width > h * 0.66 - footW && size > 8) g.font = `700 ${(size -= 1)}px Geist, Arial, sans-serif`;
            g.fillText(b.title, 0, 0);
            if (foot) { g.font = `400 ${Math.min(w * 0.3, 26)}px Geist, Arial, sans-serif`; g.globalAlpha = 0.8; g.textAlign = 'right'; g.fillText(foot, h * 0.72, 0); }
            g.restore();
        });
        let x = inX0 + 0.035;
        const textbooks = new THREE.Group(), tbPages = std(0xf1ebdc, { roughness: 0.9 });
        const loadCover = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
        TEXTBOOKS.forEach((b, i) => {
            const cover = std(new THREE.Color(b.bg).getHex(), { roughness: 0.5 });
            const spine = new THREE.MeshStandardMaterial({ roughness: 0.5, map: textSpine(b) });
            const m = new THREE.Mesh(new THREE.BoxGeometry(b.t, H, D), [cover, cover, tbPages, tbPages, spine, tbPages]);
            m.position.set(x + b.t / 2, y0 + H / 2, frontZ - D / 2 - 0.004);
            m.castShadow = m.receiveShadow = true;
            m.userData.shelfItem = { kind: 'textbook', i, color: b.bg };
            // the front cover (on its right side, its left edge at the spine), as the books have
            if (b.cover) loadCover(b.cover).then((im) => {
                const front = new THREE.Texture(im); front.colorSpace = THREE.SRGBColorSpace; front.anisotropy = 8; front.needsUpdate = true;
                m.material[0] = new THREE.MeshStandardMaterial({ map: front, roughness: 0.55 });
            }).catch(() => {});
            else m.material[0] = new THREE.MeshStandardMaterial({ roughness: 0.55, map: canvasTex(512, 640, (g, w, h) => {
                g.fillStyle = b.bg; g.fillRect(0, 0, w, h);                       // (no cover yet: one in its colours)
                g.fillStyle = b.accent; g.fillRect(0, h * 0.62, w, h * 0.012);
                g.fillStyle = b.ink; g.font = '700 64px Geist, Arial, sans-serif'; g.textBaseline = 'top';
                b.title.split(' ').forEach((word, k) => g.fillText(word, 40, 70 + k * 72));
            }) });
            textbooks.add(m); x += b.t + gap;
        });
        world.add(textbooks);
        shelfStuff.textbooks = textbooks;
        // ---- this year's notebooks (room-config.js `modules`): one per module, flat beside the
        // textbooks in a loose stack, the module code on a strip of tape across each cover. Each is
        // built in a book's frame (its cover on +x, its top up), so it pulls out like the books.
        if (assets.notebook && (ROOM.modules || []).length) {
            const src = assets.notebook;
            src.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
            const s0 = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3());
            const NW = 0.19, NT = 0.011, k = NW / s0.x;
            const tapeTex = (code) => canvasTex(1024, 180, (g, w, h) => {
                g.fillStyle = '#ebdfb8'; g.fillRect(0, 0, w, h);
                g.globalAlpha = 0.16; g.fillStyle = '#b7a477';
                for (let n = 0; n < 60; n++) g.fillRect((n * 97) % w, 0, 2, h);
                g.globalAlpha = 1; g.fillStyle = '#141418'; g.textAlign = 'center'; g.textBaseline = 'middle';
                g.font = `400 112px 'Permanent Marker', Nafta, 'Comic Sans MS', cursive`;
                g.fillText(code, w / 2, h / 2 + 6);
            });
            const notebooks = new THREE.Group();
            const nbBox = new THREE.Box3();                                   // (placed once we know their size)
            ROOM.modules.forEach((mod, i) => {
                const unit = new THREE.Group();
                const nb = src.clone();
                nb.scale.set(k, k, Math.min(k, NT / s0.z));
                nb.rotation.y = Math.PI / 2;                                 // its cover (+z) to +x, its spine to +z
                const inner = new THREE.Group(); inner.add(nb);
                const b = new THREE.Box3().setFromObject(inner), c = b.getCenter(new THREE.Vector3());
                nb.position.sub(c);                                          // centred on its own middle
                const half = (b.max.x - b.min.x) / 2, NH = b.max.y - b.min.y;
                unit.add(inner);
                // a strip across the cover, shorter than the book
                const tape = new THREE.Mesh(new THREE.PlaneGeometry((b.max.z - b.min.z) * 0.86, 0.034), new THREE.MeshStandardMaterial({ map: tapeTex(mod.code), roughness: 0.85 }));
                tape.rotation.set(0, Math.PI / 2, 0.035 * (i % 2 ? 1 : -1));       // across the cover
                tape.position.set(half + 0.0012, NH * 0.04, 0);
                unit.add(tape);
                // lying flat, its cover up and its spine to the room, a little askew
                const lie = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 0, 1)));
                const yaw = [0.08, -0.17, 0.23, -0.06][i % 4];
                unit.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(lie));
                const n = ROOM.modules.length;
                const x0 = inX1 - 0.05 - NH / 2;                                  // over to the right of the shelf
                unit.position.set(x0 + [0.0, 0.025, -0.018, 0.012][i % 4], y0 + half + (n - 1 - i) * (2 * half + 0.0006), frontZ - NW / 2 - 0.03 + [0.0, -0.02, 0.014, -0.008][i % 4]);
                unit.userData.shelfItem = { kind: 'notebook', i, color: '#1d1d1f' };
                notebooks.add(unit);
            });
            world.add(notebooks);
            shelfStuff.notebooks = notebooks;
        }
    }
    // ---- Cam's books (second row from the top) and his favourite films (the row under) ----
    // Made here, one box each, with a printed spine: from his Goodreads and Letterboxd
    // (shelf-data.js). Click the row to go up close, then a spine to open its card.
    const shelfBooks = new THREE.Group(), shelfFilms = new THREE.Group();
    const hashOf = (str) => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
    const CLOTH = ['#1f3a5f', '#7a1f2b', '#2f4a3a', '#c9a227', '#e8e1d3', '#3b2f2f', '#5b3a6e', '#b5532e', '#1d1d1f', '#2d5d6b', '#8a8f3c', '#d9cbb0', '#9c2f45', '#f0e6cf'];
    const inkOn = (bg) => { const c = new THREE.Color(bg); return c.r * 0.3 + c.g * 0.59 + c.b * 0.11 > 0.5 ? '#151515' : '#f4efe6'; };
    const surname = (a) => a.split(' ').filter(Boolean).pop();
    // a spine: the title running down it, the author (or year) at the foot
    const spineTex = (t, H, bg, fg, title, foot, accent) => {
        const ch = 512, cw = Math.max(24, Math.min(200, Math.round(ch * t / H)));
        return canvasTex(cw, ch, (c, w, h) => {
            c.fillStyle = bg; c.fillRect(0, 0, w, h);
            if (accent) { c.fillStyle = accent; c.fillRect(0, 0, w, 34); }
            c.fillStyle = fg; c.globalAlpha = 0.55; c.fillRect(0, 40, w, 1.5); c.fillRect(0, h - 44, w, 1.5); c.globalAlpha = 1;
            c.save(); c.translate(w / 2, 56); c.rotate(Math.PI / 2);
            c.textBaseline = 'middle'; c.fillStyle = fg;
            let size = Math.min(w * 0.56, 30); c.font = `600 ${size}px Geist, Arial, sans-serif`;
            while (c.measureText(title).width > h - 190 && size > 8) c.font = `600 ${(size -= 1)}px Geist, Arial, sans-serif`;
            c.fillText(title, 0, 0);
            c.font = `400 ${Math.min(w * 0.4, 15)}px Geist, Arial, sans-serif`; c.globalAlpha = 0.75; c.textAlign = 'right';
            c.fillText(foot, h - 112, 0);
            c.restore();
        });
    };
    const loadImg = (src) => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = rej; im.src = src; });
    const avgColour = (im) => {
        const c = document.createElement('canvas'); c.width = c.height = 6;
        const g = c.getContext('2d'); g.drawImage(im, 0, 0, 6, 6);
        const d = g.getImageData(0, 0, 6, 6).data; let r = 0, gg = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
        return new THREE.Color(r / 36 / 255, gg / 36 / 255, b / 36 / 255);
    };
    const pagesMat = std(0xeee4cf, { roughness: 0.92 });
    // the books: a modern edition's real cover on each (shelf-data.js), at the size of a B-format
    // paperback (129 x 198 mm, ~0.07 mm a page). The spine takes the cover's colours, and its title
    // runs down it: cut from the cover itself (`spine.crop`, like the films' logos) or set in type
    // to match (`spine.text`). Until the cover's in, a plain spine in its colours.
    const bookSpine = (b, t, H, im) => {
        const sp = b.spine || {}, ch = 1024, cw = Math.max(28, Math.round(ch * t / H));
        return canvasTex(cw, ch, (g, w, h) => {
            // the background: given, or picked from just inside the title's corner on the cover
            let bg = sp.bg || '#1b1b1d';
            if (!sp.bg && im && sp.crop) {
                const c = document.createElement('canvas'); c.width = c.height = 1;
                const cx = c.getContext('2d'); cx.drawImage(im, im.width * sp.crop[0] + 2, im.height * sp.crop[1] + 2, 2, 2, 0, 0, 1, 1);
                const d = cx.getImageData(0, 0, 1, 1).data; bg = `rgb(${d[0]},${d[1]},${d[2]})`;
            }
            g.fillStyle = bg; g.fillRect(0, 0, w, h);
            g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 2);               // reads top to bottom
            if (im && sp.crop) {
                const [x, y, cw2, ch2] = sp.crop, sw = im.width * cw2, sh = im.height * ch2;
                const k = Math.min((h * 0.78) / sw, (w * 0.8) / sh);
                g.drawImage(im, im.width * x, im.height * y, sw, sh, -sw * k / 2, -sh * k / 2, sw * k, sh * k);
            } else {
                g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = sp.ink || '#f1ede6';
                const font = (px) => (sp.font || '700 {s}px Geist, Arial, sans-serif').replace('{s}', px);
                let size = Math.min(w * 0.62, 64); g.font = font(size);
                const title = sp.font && /Impact/.test(sp.font) ? b.title.toUpperCase() : b.title;
                while (g.measureText(title).width > h * 0.7 && size > 8) g.font = font((size -= 1));
                g.fillText(title, -h * 0.06, 0);
                g.fillStyle = sp.accent || sp.ink || '#f1ede6'; g.font = font(Math.max(8, size * 0.42));
                g.textAlign = 'right'; g.fillText(surname(b.author).toUpperCase(), h * 0.45, 0);
            }
            g.restore();
        });
    };
    {
        const [y0] = rowY(ROWS[3]);
        const H = 0.198, D = 0.129, gap = 0.0015;                  // a B-format paperback
        let x = inX0 + 0.035;
        BOOKS.forEach((b, i) => {
            const t = Math.min(0.045, 0.004 + (b.pages || 250) * 0.00007);
            const bg = b.spine?.bg || '#2a2a2c';
            const cover = std(new THREE.Color(bg).getHex(), { roughness: 0.62 });
            const spine = new THREE.MeshStandardMaterial({ roughness: 0.6, map: bookSpine(b, t, H, null) });
            const m = new THREE.Mesh(new THREE.BoxGeometry(t, H, D), [cover, cover, pagesMat, pagesMat, spine, pagesMat]);
            m.position.set(x + t / 2, y0 + H / 2, frontZ - D / 2);       // spines flush with the shelf's front
            m.castShadow = m.receiveShadow = true;
            m.userData.shelfItem = { kind: 'book', i, color: bg };
            if (b.cover) loadImg(b.cover).then((im) => {
                if (im.width < 10) return;                              // Open Library's 1x1 'no cover'
                const old = spine.map;
                spine.map = bookSpine(b, t, H, im); spine.needsUpdate = true; old.dispose();
                if (!b.spine?.bg) { const col = avgColour(im); cover.color.copy(col); m.userData.shelfItem.color = '#' + col.getHexString(); }
                const front = new THREE.Texture(im); front.colorSpace = THREE.SRGBColorSpace; front.anisotropy = 8; front.needsUpdate = true;
                m.material[0] = new THREE.MeshStandardMaterial({ map: front, roughness: 0.6 });   // the front cover, on its right side (its left edge at the spine)
            }).catch(() => {});
            shelfBooks.add(m); x += t + gap;
        });
        world.add(shelfBooks);
    }
    // the films: a real DVD case each (the model's cover insert repainted per film, the
    // way a printed sleeve wraps round: back, spine, front), spines to the room
    // the sleeve, laid out like the model's own (a 1024 square: back 0-480, spine 480-528, front 528-1024)
    const SLEEVE = { back: [0, 484], spine: [484, 535], front: [535, 1024], aspect: 133 / 186 };   // (measured from the case's UVs: the spine, rounded edges included, is u 484-535)
    const sleeve = (f, poster, logo = null) => {
        const c = document.createElement('canvas'); c.width = c.height = 1024;
        const g = c.getContext('2d');
        const [b0, b1] = SLEEVE.back, [s0, s1] = SLEEVE.spine, [f0, f1] = SLEEVE.front;
        const crop = (im) => {                                      // the poster cropped to the cover's shape
            const want = SLEEVE.aspect, have = im.width / im.height;
            return have > want ? [(im.width - im.height * want) / 2, 0, im.height * want, im.height] : [0, (im.height - im.width / want) / 2, im.width, im.width / want];
        };
        const base = poster ? avgColour(poster) : new THREE.Color(0x101012);
        const dark = base.clone().multiplyScalar(0.45), light = base.getHSL({}).l > 0.55;
        // back: the poster blurred and dark, the title and credits on top
        g.fillStyle = '#' + dark.getHexString(); g.fillRect(b0, 0, b1 - b0, 1024);
        if (poster) { g.save(); g.filter = 'blur(10px) brightness(0.35) saturate(1.2)'; g.drawImage(poster, ...crop(poster), b0 - 30, -30, b1 - b0 + 60, 1084); g.restore(); }
        const sx = ((b1 - b0) / 1024) / SLEEVE.aspect;               // the sleeve's pixels aren't square: squash text to match
        g.save(); g.setTransform(sx, 0, 0, 1, b0 + 40, 0);
        g.fillStyle = '#f3efe8'; g.textBaseline = 'top';
        g.font = '700 54px Geist, Arial, sans-serif';
        const words = f.title.toUpperCase().split(' '); let line = '', y = 120;
        for (const w of words) { if (g.measureText(line + w).width > 560 && line) { g.fillText(line.trim(), 0, y); y += 62; line = ''; } line += w + ' '; }
        g.fillText(line.trim(), 0, y); y += 90;
        g.font = '400 30px Geist, Arial, sans-serif'; g.globalAlpha = 0.85;
        g.fillText(`A film by ${f.director}`, 0, y); g.fillText(String(f.year), 0, y + 44);
        g.globalAlpha = 0.7; g.font = '500 24px Geist, Arial, sans-serif';
        g.fillText('ONE OF CAM’S ALL-TIME FAVOURITES', 0, 860); g.fillText('letterboxd.com/camwtf', 0, 900);
        g.restore();
        // spine: one colour all the way, with the film's own title (its logo, as on the poster) down it
        const spW = 77, sp = document.createElement('canvas'); sp.width = spW; sp.height = 1024;
        const q = sp.getContext('2d');
        // the logo's own brightness decides the spine: a light logo on the film's dark colour, a dark one on a pale tint
        let logoLight = true;
        if (logo) {
            const t = document.createElement('canvas'); t.width = 40; t.height = 12;
            const tg = t.getContext('2d'); tg.drawImage(logo, 0, 0, 40, 12);
            const d = tg.getImageData(0, 0, 40, 12).data; let sum = 0, n = 0;
            for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { sum += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; n++; }
            logoLight = n ? sum / n > 110 : true;
        }
        // blacks and greys only: a light logo (or plain type) on a dark grey, a dark one on a pale grey
        const h = hashOf(f.slug), DARKS = ['#0d0d0f', '#17171a', '#202023', '#2b2b2f'], LIGHTS = ['#ececea', '#e0e0de', '#d2d2d0'];
        const onDark = logo ? logoLight : h % 4 !== 0;
        q.fillStyle = onDark ? DARKS[h % DARKS.length] : LIGHTS[h % LIGHTS.length]; q.fillRect(0, 0, spW, 1024);
        const ink = onDark ? '#f4f0ea' : '#151515';
        const centred = ['moonlight-2016', 'brother-bear', '12th-fail', 'her', 'the-dark-knight-rises'].includes(f.slug);   // Cam's picks in the middle of the spine; the rest at the top
        const room = 1024 - 210;
        q.save(); q.rotate(Math.PI / 2);                                  // reading down the spine
        if (logo) {
            const k = Math.min(room / logo.width, (spW * 0.78) / logo.height), L = logo.width * k;
            q.drawImage(logo, centred ? (1024 - L) / 2 - 30 : 70, -spW / 2 - logo.height * k / 2, L, logo.height * k);
        } else {
            q.fillStyle = ink; q.textBaseline = 'middle';
            let size = 40; q.font = `800 ${size}px Geist, Arial, sans-serif`;
            const t = f.title.toUpperCase();
            while (q.measureText(t).width > room - 20 && size > 14) q.font = `800 ${(size -= 1)}px Geist, Arial, sans-serif`;
            const L = q.measureText(t).width;
            q.fillText(t, centred ? (1024 - L) / 2 - 30 : 70, -spW / 2);
        }
        q.restore();
        g.drawImage(sp, s0, 0, s1 - s0, 1024);
        // front: the poster
        if (poster) g.drawImage(poster, ...crop(poster), f0, 0, f1 - f0, 1024);
        else { g.fillStyle = '#16161a'; g.fillRect(f0, 0, f1 - f0, 1024); }
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.anisotropy = 8;
        return tex;
    };
    if (assets.dvd) {
        const [y0, y1] = rowY(ROWS[2]);
        const proto = assets.dvd;
        const pb = new THREE.Box3().setFromObject(proto), psz = pb.getSize(new THREE.Vector3());
        const gapF = 0.0015;
        const k = Math.min(Math.min(0.19, (y1 - y0) * 0.9) / psz.y, (inX1 - inX0 - 0.03 - FILMS.length * gapF) / FILMS.length / psz.z);
        let x = inX0 + 0.035;                                       // clear of the shelf's side panel
        FILMS.forEach((f, i) => {
            const g = new THREE.Group(), m = proto.clone(true);
            m.scale.multiplyScalar(k);
            m.rotation.y = Math.PI / 2;                             // the spine (the model's -x side) to the room
            g.add(m);
            const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3());
            m.position.set(-c.x, -b.min.y, -c.z);
            const w = b.max.x - b.min.x, d = b.max.z - b.min.z;
            let jacket = null;
            m.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; if (o.material?.name === 'jaquette') jacket = o; } });
            if (jacket) {
                jacket.material = new THREE.MeshStandardMaterial({ roughness: 0.45, color: 0x16161a });
                const wear = (tex) => { jacket.material.map = tex; jacket.material.color.set(0xffffff); jacket.material.needsUpdate = true; };
                Promise.all([loadImg(LINKS.small(f.poster)), f.logo ? loadImg(f.logo).catch(() => null) : null])
                    .then(([im, logo]) => wear(sleeve(f, im, logo)))
                    .catch(() => wear(sleeve(f, null)));
            }
            g.position.set(x + w / 2, y0, frontZ - d / 2);                // spines flush with the shelf's front, all upright
            g.userData.shelfItem = { kind: 'film', i, color: '#101012' };
            shelfFilms.add(g); x += w + gapF;
        });
        world.add(shelfFilms);
    }
    // ---- Cam's PS4 games (shelf-data.js GAMES): the same case as the films, in PS4 blue, each
    // with its cover, a PS4 banner across the top and a black spine with the blue band. On the
    // left of the PS4's row, then the controller between them and the PS4.
    // a PS4 case as it is in the shop: the PlayStation band across the top of the cover (the real
    // band, images/room/ps4/), the art under it, the PEGI label bottom left; the spine with its
    // blue head (the PS mark over PS4), the title set in a face close to the game's logo, PEGI at
    // the foot. The faces (fonts/spines/, OFL) load once, the first time the cases are drawn.
    const SPINE_FONTS = [['Cinzel', 'cinzel-latin-400-normal', 400], ['Cinzel', 'cinzel-latin-700-normal', 700], ['Bebas Neue', 'bebas-neue-latin-400-normal', 400],
        ['Montserrat', 'montserrat-latin-300-normal', 300], ['Montserrat', 'montserrat-latin-800-normal', 800], ['Barlow Condensed', 'barlow-condensed-latin-800-italic', 800, 'italic'], ['Oswald', 'oswald-latin-700-normal', 700]];
    let caseKit = null;
    const loadCaseKit = () => caseKit ||= Promise.all([
        loadImg('images/room/ps4/band.webp'), loadImg('images/room/ps4/ps-symbol.png'), loadImg('images/room/ps4/ps4-text.png'),
        ...SPINE_FONTS.map(([fam, file, weight, style]) => new FontFace(fam, `url(fonts/spines/${file}.woff2)`, { weight: String(weight), style: style || 'normal' }).load().then((f) => document.fonts.add(f)).catch(() => {})),
    ]).then(([band, sym, txt]) => ({ band, sym, txt }));
    const pegi = (g, x, y, w, age) => {                               // the PEGI label: number on colour, the web address under it
        const h = w * 1.2, r = w * 0.06;
        g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
        g.fillStyle = age >= 18 ? '#d8001c' : age >= 12 ? '#f08a00' : '#4bad35';
        g.beginPath(); g.roundRect(x + w * 0.06, y + w * 0.06, w * 0.88, w * 0.88, r * 0.6); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `800 ${w * 0.56}px Montserrat, Geist, Arial, sans-serif`; g.fillText(String(age), x + w / 2, y + w * 0.53);
        g.fillStyle = '#111'; g.font = `700 ${w * 0.13}px Montserrat, Geist, Arial, sans-serif`; g.fillText('www.pegi.info', x + w / 2, y + w * 1.06);
        g.textAlign = 'left';
    };
    // the title down the spine, in the game's style (shelf-data.js: spine.lines)
    const spineTitle = (q, gm, W, from, to) => {
        const sp = gm.spine || {};
        const lines = sp.lines || [{ text: gm.title.toUpperCase() }];
        q.save(); q.translate(W / 2, from); q.rotate(Math.PI / 2);
        const len = to - from, gap = 16;
        const parts = lines.map((l) => {
            const font = (px) => `${l.style || ''} ${l.weight || 700} ${px}px ${l.family || sp.family || 'Montserrat'}, Geist, Arial, sans-serif`;
            const px = Math.min(W * (l.k || 0.66), 64); q.font = font(px);
            const sx = l.squash || 1;
            const w = (q.measureText(l.text).width + (l.spacing || 0) * Math.max(0, l.text.length - 1)) * sx;
            return { l, font, px, sx, w };
        });
        const total = parts.reduce((a, p) => a + p.w, 0) + (parts.length - 1) * gap;
        const fit = Math.min(1, (len * 0.94) / total);
        let at = sp.align === 'start' ? 10 : (len - total * fit) / 2;
        q.textBaseline = 'middle';
        for (const p of parts) {
            q.font = p.font(p.px * fit);
            q.fillStyle = p.l.color || sp.ink || '#fff';
            q.save(); q.translate(at, (p.l.dy || 0) * W); q.scale(p.sx, 1);
            let x = 0;
            for (const ch of p.l.spacing ? [...p.l.text] : [p.l.text]) { q.fillText(ch, x, 0); x += q.measureText(ch).width + (p.l.spacing || 0) * fit; }
            q.restore();
            at += p.w * fit + gap * fit;
        }
        q.restore();
    };
    const gameSleeve = (gm, cover, kit, logo = null, backArt = null) => {
        const c = document.createElement('canvas'); c.width = c.height = 1024;
        const g = c.getContext('2d');
        const [b0, b1] = SLEEVE.back, [s0, s1] = SLEEVE.spine, [f0, f1] = SLEEVE.front;
        const crop = (im, want = SLEEVE.aspect) => { const have = im.width / im.height; return have > want ? [(im.width - im.height * want) / 2, 0, im.height * want, im.height] : [0, (im.height - im.width / want) / 2, im.width, im.width / want]; };
        // the band's height, in the sleeve's (non-square) pixels: as wide as the cover, its own shape
        const band = kit ? Math.round(1024 * (kit.band.height / kit.band.width) * SLEEVE.aspect) : 104;
        const blueFill = (x, y, w, h) => { if (kit) g.drawImage(kit.band, kit.band.width * 0.62, 0, kit.band.width * 0.3, kit.band.height, x, y, w, h); else { g.fillStyle = '#0a52b8'; g.fillRect(x, y, w, h); } };
        const sp = gm.spine || {};
        // back: the art blurred and dark under a plain blue band, the title, studio and year
        g.fillStyle = '#101216'; g.fillRect(b0, 0, b1 - b0, 1024);
        if (backArt) g.drawImage(backArt, b0, 0, b1 - b0, 1024);       // the real back cover, when there is one
        else {
        if (cover) { g.save(); g.filter = 'blur(12px) brightness(0.32) saturate(1.2)'; g.drawImage(cover, ...crop(cover), b0 - 30, -30, b1 - b0 + 60, 1084); g.restore(); }
        blueFill(b0, 0, b1 - b0, band);
        const sx = ((b1 - b0) / 1024) / SLEEVE.aspect;
        g.save(); g.setTransform(sx, 0, 0, 1, b0 + 40, 0);
        g.textBaseline = 'top'; g.fillStyle = '#f3efe8'; g.font = '700 50px Montserrat, Geist, Arial, sans-serif';
        const words = gm.title.toUpperCase().split(' '); let line = '', y = 170;
        for (const w of words) { if (g.measureText(line + w).width > 560 && line) { g.fillText(line.trim(), 0, y); y += 58; line = ''; } line += w + ' '; }
        g.fillText(line.trim(), 0, y); y += 86;
        g.font = '400 30px Geist, Arial, sans-serif'; g.globalAlpha = 0.85;
        g.fillText(gm.studio, 0, y); g.fillText(String(gm.year), 0, y + 44);
        g.restore();
        }
        // spine: the blue head with the PS mark over PS4, the game's colour, its title, PEGI at the foot
        const spW = 77, spc = document.createElement('canvas'); spc.width = spW; spc.height = 1024;
        const q = spc.getContext('2d');
        q.fillStyle = sp.bg || '#111214'; q.fillRect(0, 0, spW, 1024);
        if (sp.coverBg && cover) {          // the cover's own sky behind the logo (God of War), so it sits as it does on the front
            const [cx, cy, cw, ch] = sp.coverBg;
            q.save(); q.filter = 'blur(10px)'; q.translate(spW, 0); q.rotate(Math.PI / 2);
            q.drawImage(cover, cx * cover.width, cy * cover.height, cw * cover.width, ch * cover.height, -20, -20, 1064, spW + 40); q.restore();
        }
        const head = 150;
        if (kit) {
            q.drawImage(kit.band, kit.band.width * 0.55, 0, kit.band.width * 0.25, kit.band.height, 0, 0, spW, head);
            const sw = spW * 0.66, sh = sw * kit.sym.height / kit.sym.width;
            q.drawImage(kit.sym, (spW - sw) / 2, 16, sw, sh);
            const tw = spW * 0.74, th = tw * kit.txt.height / kit.txt.width;
            q.drawImage(kit.txt, (spW - tw) / 2, 16 + sh + 12, tw, th);
            q.fillStyle = 'rgba(255,255,255,0.9)'; q.fillRect(0, head - 4, spW, 4);
        } else { q.fillStyle = '#0a52b8'; q.fillRect(0, 0, spW, head); }
        const foot = gm.pegi ? 92 : 24;
        if (gm.pegi) pegi(q, 14, 1024 - 82, spW - 28, gm.pegi);
        if (logo) {
            // the game's own logo (cut from its cover art: images/room/ps4/logos/), turned to run down the spine
            const from = head + 22, to = 1024 - foot - 14, len = to - from;
            const k = Math.min((len * 0.9) / logo.width, (spW * (gm.spine?.logoK || 0.8)) / logo.height);
            const lw = logo.width * k, lh = logo.height * k;
            q.save(); q.translate(spW / 2, from + (len - lw) / 2); q.rotate(Math.PI / 2);
            q.drawImage(logo, 0, -lh / 2, lw, lh); q.restore();
        } else spineTitle(q, gm, spW, head + 22, 1024 - foot - 14);
        g.drawImage(spc, s0, 0, s1 - s0, 1024);
        // front: the real band, the art under it, PEGI bottom left
        if (cover) g.drawImage(cover, ...crop(cover, SLEEVE.aspect * 1024 / (1024 - band)), f0, band, f1 - f0, 1024 - band);
        else { g.fillStyle = '#16161a'; g.fillRect(f0, 0, f1 - f0, 1024); }
        if (kit) {
            // the band, with its PlayStation logo and PS4 moved a little right (the band's plain left edge stretched to fill in)
            g.drawImage(kit.band, f0, 0, f1 - f0, band);
            const bw = kit.band.width, part = 0.5, dx = Math.round((f1 - f0) * 0.035);
            g.drawImage(kit.band, 0, 0, 3, kit.band.height, f0, 0, dx + 4, band);
            g.drawImage(kit.band, 0, 0, bw * part, kit.band.height, f0 + dx, 0, (f1 - f0) * part, band);
        } else blueFill(f0, 0, f1 - f0, band);
        if (gm.pegi) {
            const fx = ((f1 - f0) / 1024) / SLEEVE.aspect;
            g.save(); g.setTransform(fx, 0, 0, 1, f0 + 22, 0);
            pegi(g, 0, 1024 - 22 - 96 * 1.2, 96, gm.pegi);
            g.restore();
        }
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.anisotropy = 8;
        return tex;
    };
    if (assets.dvd && shelfStuff.ps4Row) {
        const { y0, ps4Left } = shelfStuff.ps4Row;
        const proto = assets.dvd;
        const psz = new THREE.Box3().setFromObject(proto).getSize(new THREE.Vector3());
        const k = 0.172 / psz.y;                                        // a PS4 case: 17.2 cm tall
        const caseBlue = new THREE.MeshStandardMaterial({ color: 0x1d4ea6, roughness: 0.35, metalness: 0.05 });
        let gx = inX0 + 0.03;
        GAMES.forEach((gm, i) => {
            const g = new THREE.Group(), m = proto.clone(true);
            m.scale.multiplyScalar(k);
            m.rotation.y = Math.PI / 2;                                 // the spine to the room
            g.add(m);
            const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3());
            m.position.set(-c.x, -b.min.y, -c.z);
            const w = b.max.x - b.min.x, d = b.max.z - b.min.z;
            let jacket = null;
            m.traverse((o) => { if (!o.isMesh) return; o.castShadow = o.receiveShadow = true; if (o.material?.name === 'jaquette') { jacket = o; o.name = 'gameJacket'; } else o.material = caseBlue; });
            if (jacket) {
                jacket.material = new THREE.MeshStandardMaterial({ roughness: 0.45, color: 0x16161a });
                const wear = (tex) => { jacket.material.map = tex; jacket.material.color.set(0xffffff); jacket.material.needsUpdate = true; };
                if (gm.cover) Promise.all([loadImg(gm.cover), loadCaseKit(), gm.spine?.logo ? loadImg(gm.spine.logo).catch(() => null) : null, gm.back ? loadImg(gm.back).catch(() => null) : null])
                    .then(([im, kit, logo, back]) => wear(gameSleeve(gm, im, kit, logo, back)))
                    .catch(() => wear(gameSleeve(gm, null, null)));
                else wear(gameSleeve(gm, null, null));
            }
            g.position.set(gx + w / 2, y0, frontZ - d / 2);
            g.userData.shelfItem = { kind: 'game', i, color: '#101012' };
            shelfStuff.games.add(g); gx += w + 0.0015;
        });
        world.add(shelfStuff.games);
        // the controller in the gap between the games and the PS4
        if (shelfStuff.pad) {
            const pb = boxOf(shelfStuff.pad), pd = pb.max.z - pb.min.z;
            shelfStuff.pad.position.set((gx + ps4Left) / 2, y0 + 0.001, frontZ - pd / 2 - 0.03);
        }
    }

    // a snake plant on the floor, in front of the window on the left wall
    const snake = assets.snake || null;
    if (snake) {
        const sz = new THREE.Box3().setFromObject(snake).getSize(new THREE.Vector3());
        snake.scale.multiplyScalar(0.8 / sz.y);
        snake.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
        world.add(snake);
        place(snake, ROOM.snakePlant || { x: 0.32, y: 0, z: 1.55 });
    }

    // ---- the right-hand side of the room: a wall (behind the chair), and the pin board on it.
    // (it faces into the room only, so from the camera's corner it never blocks the view)
    {
        const H = 3.9;
        const wallR = new THREE.Mesh(new THREE.PlaneGeometry(R.d + 0.02, H), paintMat(R.d + 0.02, H));
        // the right wall takes the light almost head-on, which washes the paint's relief out and brightens it: a touch
        // darker and a stronger relief, so it reads as the same paint as the back and left walls
        wallR.material.color.multiplyScalar(0.86); wallR.material.normalScale.set(2.6, 2.6);
        wallR.rotation.y = -Math.PI / 2;                                   // facing into the room
        wallR.position.set(4.567, H / 2, R.d / 2);
        wallR.receiveShadow = true; wallR.userData.noPick = true;
        world.add(wallR);
    }
    const cork = assets.cork || null;
    if (cork) {
        // bare: only the board itself (Cam pins his own things on it)
        const bare = []; cork.traverse((o) => { if (o.isMesh && !/Base/i.test(o.name)) bare.push(o); });
        bare.forEach((o) => o.parent.remove(o));
        cork.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
        const sz = new THREE.Box3().setFromObject(cork).getSize(new THREE.Vector3());
        cork.scale.multiplyScalar((ROOM.cork?.w ?? 2.2) / sz.x);             // a big board: 2.2 m across
        cork.rotation.y = -Math.PI / 2;                                    // its front to the room
        world.add(cork);
        place(cork, { x: 4.567 - 0.004, ax: '1', y: ROOM.cork?.y ?? 0.95, z: ROOM.cork?.z ?? Math.min(R.d - 1.25, Math.max(1.25, ROOM.chair?.z ?? 1.5)) });
        shelfStuff.cork = cork;
        // Cam's own things, pinned to it (room-config.js `pinboard`): each photo as a print with
        // a white border and a handwritten caption, held up by a pin. u/v are metres from the
        // board's centre (u to the right as you face it, v up).
        const cb = boxOf(cork), cc = cb.getCenter(new THREE.Vector3());
        const face = ROOM.corkFace ?? 4.541;
        const pins = new THREE.Group(); world.add(pins);
        // each pinned photo can be clicked on its own once you're up close to the board (hooked up below, where `click` exists)
        var pinCards = new Set(), pendingPins = [], registerPin = null;
        // the vision board: cards without a photo yet (graduation, the half marathon, Cape Town)
        const vbCard = (kind) => {
            const c = document.createElement('canvas'); c.width = 800; c.height = 600;
            const g = c.getContext('2d');
            if (kind === 'grad' || kind === 'run') {
                const gr = g.createLinearGradient(0, 0, 800, 600);
                gr.addColorStop(0, kind === 'grad' ? '#2a2e3a' : '#1f3b2f'); gr.addColorStop(1, kind === 'grad' ? '#12141b' : '#0f1f19');
                g.fillStyle = gr; g.fillRect(0, 0, 800, 600);
                g.fillStyle = g.strokeStyle = '#f3f4f8'; g.textAlign = 'center'; g.textBaseline = 'middle';
                if (kind === 'run') {
                    g.font = "230px 'The Overcook', cursive"; g.fillText('21.1', 400, 280);
                    g.font = '40px sans-serif'; g.fillText('K M', 400, 440);
                } else {
                    g.lineWidth = 9; g.lineCap = g.lineJoin = 'round'; g.translate(400, 300); g.scale(11, 11); g.translate(-12, -12);
                    g.beginPath(); g.moveTo(2, 9); g.lineTo(12, 4); g.lineTo(22, 9); g.lineTo(12, 14); g.closePath(); g.stroke();
                    g.beginPath(); g.moveTo(6, 11); g.lineTo(6, 16); g.bezierCurveTo(6, 17.5, 9, 19, 12, 19); g.bezierCurveTo(15, 19, 18, 17.5, 18, 16); g.lineTo(18, 11); g.stroke();
                    g.beginPath(); g.moveTo(22, 9); g.lineTo(22, 15); g.stroke();
                }
            } else {
                const gr = g.createLinearGradient(0, 0, 0, 600);
                gr.addColorStop(0, '#2b3a5a'); gr.addColorStop(0.7, '#e08a5a'); gr.addColorStop(1, '#f4c27a');
                g.fillStyle = gr; g.fillRect(0, 0, 800, 600);
                g.fillStyle = '#10131c'; g.beginPath(); g.moveTo(0, 600); g.lineTo(0, 430); g.lineTo(80, 420); g.lineTo(150, 390); g.lineTo(240, 350); g.lineTo(340, 330); g.lineTo(490, 320); g.lineTo(580, 340); g.lineTo(650, 380); g.lineTo(800, 400); g.lineTo(800, 600); g.closePath(); g.fill();
            }
            return c;
        };
        // one straight red string across the middle, THEN to its left and NEXT to its right
        if (ROOM.pinboardString) {
            const S = ROOM.pinboardString, len = S.u1 - S.u0;
            const str = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, len, 6), std(0xb3202a, { roughness: 0.6 }));
            str.rotation.x = Math.PI / 2;
            str.position.set(face - 0.0008, cc.y + (S.v || 0), cc.z + (S.u0 + S.u1) / 2);
            str.rotation.set(Math.PI / 2, 0, 0);
            str.rotation.order = 'XYZ';
            pins.add(str);
            [['then', S.thenU], ['next', S.nextU]].forEach(([word, u]) => {
                const W = 512, H = 160;
                const tex = canvasTex(W, H, (g) => { g.fillStyle = '#3b2a18'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = "110px 'The Overcook', 'Homemade Apple', cursive"; g.fillText(word, W / 2, H / 2); });
                document.fonts.load("40px 'The Overcook'").then(() => { tex.needsUpdate = true; }).catch(() => {});
                const m = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
                m.rotation.y = -Math.PI / 2;
                m.position.set(face - 0.001, cc.y + (S.labelV ?? 0.42), cc.z + u);
                pins.add(m);
            });
        }
        (ROOM.pinboard || []).forEach((p, k) => {
            (p.card ? Promise.resolve(vbCard(p.card)) : loadImg(p.src)).then(async (im) => {
                try { await document.fonts.load("40px 'The Overcook'"); } catch { /* the fallback hand */ }
                try { await document.fonts.load("40px 'Homemade Apple'"); } catch { /* the fallback hand */ }
                const W = 1280, pad = Math.round(W * 0.045), photoW = W - 2 * pad, photoH = Math.round(photoW * im.height / im.width);
                const capH = p.caption ? Math.round(W * 0.16) : pad;
                const H = pad + photoH + capH;
                const tex = canvasTex(W, H, (g) => {
                    g.fillStyle = '#f8f6f0'; g.fillRect(0, 0, W, H);
                    g.drawImage(im, pad, pad, photoW, photoH);
                    if (p.caption) {
                        g.fillStyle = '#2b241c'; g.textAlign = 'center'; g.textBaseline = 'middle';
                        let size = Math.round(84 * W / 900); g.font = `${size}px 'The Overcook', 'Homemade Apple', cursive`;
                        while (g.measureText(p.caption).width > W - 2 * pad && size > 18) g.font = `${(size -= 2)}px 'The Overcook', 'Homemade Apple', cursive`;
                        g.fillText(p.caption, W / 2, pad + photoH + capH * 0.52);
                    }
                });
                const w = p.w || 0.3, h = w * H / W;
                const card = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }));
                card.castShadow = false; card.receiveShadow = true;
                const g = new THREE.Group();
                g.add(card);
                const pin = new THREE.Mesh(new THREE.SphereGeometry(0.009, 16, 12), std(new THREE.Color(p.pin || '#c8322b').getHex(), { roughness: 0.35 }));
                pin.position.set(0, h / 2 - w * 0.024, 0.008); pin.castShadow = true;
                g.add(pin);
                g.rotation.set(0, -Math.PI / 2, 0);
                g.rotateZ(p.rot || 0);
                g.position.set(face - 0.0015 * (k + 1), cc.y + (p.v || 0), cc.z + (p.u || 0));
                g.userData.pin = p;
                pins.add(g);
                pinCards.add(g);
                if (registerPin) registerPin(g); else pendingPins.push(g);
            }).catch(() => {});
        });
        shelfStuff.pins = pins;
    }
    // the lava lamp, on the bedside table where the old lamp was (it glows more at night)
    let lavaGlow = null;
    if (assets.lava) {
        const lamp = assets.lava;
        let spot = null;
        bedroom.traverse((o) => { if (o.isMesh && /^Circle_Material0(10|12|15)/.test(o.name)) { spot = spot ? spot.union(boxOf(o)) : boxOf(o); o.visible = false; } });
        lamp.traverse((o) => {
            if (!o.isMesh) return;
            o.castShadow = true;
            if (o.material.transparent) o.material.depthWrite = false;     // (its own colours as they are; only the glass drawn after what's inside)
        });
        const sz = new THREE.Box3().setFromObject(lamp).getSize(new THREE.Vector3());
        lamp.scale.multiplyScalar(0.42 / sz.y);                              // ~42 cm tall
        world.add(lamp);
        const c = spot ? spot.getCenter(new THREE.Vector3()) : new THREE.Vector3(2.07, 0.5, 4.38);
        place(lamp, { x: c.x, y: spot ? spot.min.y : 0.5, z: c.z });
    }
    // blinds over the two low windows in the knee wall (02 is the clean lowered one; 03, the raised one, is unused)
    const windowBlinds = [];
    if (assets.blind) {
        let src = null;
        assets.blind.traverse((o) => { if (o.isMesh && /^02/.test(o.name)) src = o; });
        if (src) {
            src.updateWorldMatrix(true, false);
            const make = (z) => {
                const holder = new THREE.Group();
                const m = src.clone(true);
                m.matrix.copy(src.matrixWorld); m.matrix.decompose(m.position, m.quaternion, m.scale);
                holder.add(m);
                holder.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false; o.material = o.material.clone(); o.material.side = THREE.DoubleSide; o.material.color?.set(0xdcd5c6);
                } });   // off-white, not stark
                const sz = new THREE.Box3().setFromObject(holder).getSize(new THREE.Vector3());
                holder.scale.set(1.05 / sz.x, 1.55 / sz.y, 0.1 / sz.z);        // each window wide, knee-wall high, a slim depth
                holder.rotation.y = Math.PI / 2;                                 // its face into the room
                world.add(holder);
                place(holder, { x: -0.165, ax: '0', y: 0.85, z });
                windowBlinds.push(holder);
            };
            make(2.145 - 0.75); make(2.145 + 0.75);
        }
    }

    // a Persian rug on the floor, in the open middle of the room
    const persianRug = assets.rug || null;
    if (persianRug) {
        const sz = new THREE.Box3().setFromObject(persianRug).getSize(new THREE.Vector3());
        persianRug.scale.multiplyScalar((ROOM.rug?.length || 2.3) / Math.max(sz.x, sz.z));
        persianRug.rotation.y = sz.z > sz.x ? Math.PI / 2 : 0;             // its long side along the room
        persianRug.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = false; } });
        world.add(persianRug);
        place(persianRug, { x: ROOM.rug?.x ?? 2.75, y: 0.002, z: ROOM.rug?.z ?? 2.05 });
    }

    // the Jabulani, on the floor under the desk
    const ball = assets.ball || null;
    if (ball) {
        const b = new THREE.Box3().setFromObject(ball), sz = b.getSize(new THREE.Vector3());
        ball.scale.multiplyScalar(0.44 / Math.max(sz.x, sz.y, sz.z));
        ball.rotation.set(Math.PI + 0.25, 0.6, 0);
        ball.traverse((o) => {
            if (!o.isMesh) return;
            o.castShadow = o.receiveShadow = true;
            o.material.color?.multiplyScalar(0.55);            // calmer: it was glaring white
            o.material.roughness = 0.75; o.material.metalness = 0; o.material.envMapIntensity = 0.4;
        });
        world.add(ball);
        place(ball, { x: 2.5, y: 0, z: 0.45 });
    }

    const tt = assets.turntable;
    tt.scale.setScalar(0.01);                               // the model is in cm
    tt.traverse((o) => { if (/Cover/.test(o.name)) o.visible = false; });   // the lid's off (no room for it open)
    world.add(tt);
    const shelfMidZ = (shelfBox.min.z + shelfBox.max.z) / 2;
    // the record player stands on a black cube in the corner, records inside it and
    // the three mood records on the wall above
    const CUBE = { x: 0.5, w: 0.48, h: 0.42, d: 0.44 };
    const cube = new THREE.Group();
    {
        const mat = std(0x16161a, { roughness: 0.6 }), t = 0.022;
        const panel = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); cube.add(m); };
        panel(CUBE.w, t, CUBE.d, 0, CUBE.h - t / 2, 0);            // top
        panel(CUBE.w, t, CUBE.d, 0, t / 2 + 0.02, 0);              // bottom (on little feet)
        panel(t, CUBE.h - 0.02, CUBE.d, -CUBE.w / 2 + t / 2, (CUBE.h + 0.02) / 2, 0);
        panel(t, CUBE.h - 0.02, CUBE.d, CUBE.w / 2 - t / 2, (CUBE.h + 0.02) / 2, 0);
        panel(CUBE.w, CUBE.h - 0.02, t, 0, (CUBE.h + 0.02) / 2, -CUBE.d / 2 + t / 2);   // back; the front's open
        for (const fx of [-1, 1]) for (const fz of [-1, 1]) panel(0.03, 0.02, 0.03, fx * (CUBE.w / 2 - 0.03), 0.01, fz * (CUBE.d / 2 - 0.03));
        cube.position.set(CUBE.x, 0, 0.02 + CUBE.d / 2);
        world.add(cube);
    }
    {
        const tb = boxOf(tt);
        place(tt, { x: CUBE.x, y: CUBE.h, z: 0.02 + CUBE.d / 2 + Math.max(0, (CUBE.d - (tb.max.z - tb.min.z)) / 2 - 0.01) });
    }
    // the team of six, on top: three at the back, three in front. Sizes as a team:
    // the Thing biggest (and wide); Daredevil, Cyclops and the Hood about as
    // tall as him, Jubilee shorter, Jeff tiny.
    const sx0 = shelfBox.min.x, sw = shelfBox.max.x - shelfBox.min.x;
    const zBack = shelfBox.min.z + (shelfBox.max.z - shelfBox.min.z) * 0.32, zFront = shelfBox.min.z + (shelfBox.max.z - shelfBox.min.z) * 0.72;
    const daredevil = figure(assets.daredevil, 0.33, sx0 + sw * 0.14, BOOK_TOP, zBack, 0.3);
    const thing = figure(assets.thing, 0.41, sx0 + sw * 0.5, BOOK_TOP, zBack, 0.1);
    const hood = figure(assets.hood, 0.33, sx0 + sw * 0.87, BOOK_TOP, zBack, -0.25);
    const cyclops = figure(assets.cyclops, 0.33, sx0 + sw * 0.31, BOOK_TOP, zFront, 0.2);
    const jubilee = figure(assets.jubilee, 0.27, sx0 + sw * 0.68, BOOK_TOP, zFront, -0.1);
    const jeff = figure(assets.jeff, 0.11, sx0 + sw * 0.92, BOOK_TOP, shelfBox.min.z + (shelfBox.max.z - shelfBox.min.z) * 0.86, -0.4);

    const redLabel = new THREE.MeshStandardMaterial({ roughness: 0.6, map: canvasTex(128, 128, (c, w, h) => {
        c.fillStyle = '#d4202c'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; c.beginPath(); c.arc(w / 2, h / 2, w * 0.36, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#111'; c.beginPath(); c.arc(w / 2, h / 2, 4, 0, Math.PI * 2); c.fill();
    }) });
    // one vinyl record model, used everywhere: a disc `d` metres across, lying flat
    const vinylDisc = (d) => {
        const v = assets.vinyl.clone(true);
        const b = new THREE.Box3().setFromObject(v), sz = b.getSize(new THREE.Vector3());
        v.scale.multiplyScalar(d / Math.max(sz.x, sz.z));
        const b2 = new THREE.Box3().setFromObject(v), c = b2.getCenter(new THREE.Vector3());
        v.position.set(-c.x, -b2.min.y, -c.z);
        const g = new THREE.Group(); g.add(v);
        // every record's centre is red (over the model's own label)
        const label = new THREE.Mesh(new THREE.CircleGeometry(d * 0.17, 40), redLabel);
        label.rotation.x = -Math.PI / 2;
        label.position.y = new THREE.Box3().setFromObject(v).max.y + 0.0004;
        g.add(label);
        return g;
    };
    // the record on the platter (it spins while the mix plays)
    const record = new THREE.Group();
    let platter = null, platterD = 0.3;
    tt.traverse((o) => { if (/Platter$/.test(o.name)) platter = o; });
    if (platter) {
        const pb = boxOf(platter);
        platterD = Math.min(pb.max.x - pb.min.x, pb.max.z - pb.min.z) * 0.97;
        record.add(vinylDisc(platterD));
        world.add(record);
        record.position.set((pb.min.x + pb.max.x) / 2, pb.max.y + 0.001, (pb.min.z + pb.max.z) / 2);
    }
    // the tonearm: it lifts, swings over and drops the needle on the record when one plays,
    // creeps inward song by song, and lifts and swings home when the needle's lifted.
    // (in the model's own frame, z up: the arm swings about z at its pivot, tilts about x)
    let tonearm = null, armPivot = null, platterNode = null;
    tt.traverse((o) => { if (/Tone_Arm$/.test(o.name)) tonearm = o; else if (/Tone_Arm_Pivot$/.test(o.name)) armPivot = o; else if (/Platter$/.test(o.name)) platterNode = o; });
    const ARM = { swing: 0, tilt: 0 };
    // the swing that puts the stylus r from the platter's middle (r in the model's units: the record's ~0.147)
    const swingFor = (() => {
        if (!armPivot || !platterNode) return () => 0;
        const P = armPivot.position, C = platterNode.position, v = { x: 0.0068, y: -0.225 };   // the stylus, from the pivot
        return (r) => {
            let lo = -1.4, hi = 0;                                  // (it swings clockwise, in towards the middle)
            const dist = (f) => Math.hypot(P.x + v.x * Math.cos(f) - v.y * Math.sin(f) - C.x, P.y + v.x * Math.sin(f) + v.y * Math.cos(f) - C.y);
            for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; if (dist(m) > r) hi = m; else lo = m; }
            return (lo + hi) / 2;
        };
    })();
    let tonearmTick = () => {};

    const sleeves = new THREE.Group();
    world.add(sleeves);
    sleeves.position.set(CUBE.x, 0.045, 0.02 + CUBE.d / 2 + 0.01);

    // mementos: the Dux Scholar trophy, and a framed school photo
    // the trophy: a proper cup (~28 cm, so you can see it from the door), on a stepped
    // black base with an engraved plate
    const gold = new THREE.MeshStandardMaterial({ color: 0xe8be55, roughness: 0.22, metalness: 0.95, emissive: 0x3a2a08, emissiveIntensity: 0.35, side: THREE.DoubleSide });
    const ebony = std(0x121214, { roughness: 0.35 });
    const trophy = new THREE.Group();
    const tb1 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 0.11), ebony); tb1.position.y = 0.0175;
    const tb2 = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.04, 0.085), ebony); tb2.position.y = 0.055;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.026), new THREE.MeshStandardMaterial({
        roughness: 0.3, metalness: 0.8,
        map: canvasTex(256, 96, (g, w, h) => {
            g.fillStyle = '#d9b04e'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#3b2a08'; g.textAlign = 'center';
            g.font = 'italic 900 30px Lato, Georgia, serif'; g.fillText('DUX SCHOLAR', w / 2, 42);
            g.font = '500 18px Geist, Arial, sans-serif'; g.fillText('MIDRAND HIGH', w / 2, 74);
        }),
    }));
    plate.position.set(0, 0.0175, 0.0552);
    // the cup: turned on a lathe (profile from the foot up to the lip)
    const prof = [[0.0, 0.075], [0.03, 0.075], [0.026, 0.082], [0.008, 0.09], [0.007, 0.12], [0.014, 0.128], [0.007, 0.136], [0.008, 0.15],
        [0.02, 0.158], [0.04, 0.175], [0.052, 0.205], [0.055, 0.24], [0.058, 0.252], [0.054, 0.252]].map(([r, y]) => new THREE.Vector2(r, y));
    const cup = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), gold);
    const handles = [-1, 1].map((sx) => {
        const hnd = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0045, 10, 24, Math.PI * 1.15), gold);
        hnd.position.set(sx * 0.054, 0.212, 0);
        hnd.rotation.z = sx > 0 ? -Math.PI * 0.57 : Math.PI * 0.43;
        return hnd;
    });
    trophy.add(tb1, tb2, plate, cup, ...handles);
    trophy.rotation.y = 0.35;
    // (off the desk for now: the laptop's there. It goes on the bookshelf later.)

    const schoolTex = await loadTex(ROOM.album[0]?.src || 'images/academics/mhs_bg.jpg').catch(() => null);
    const frame = new THREE.Group();
    const fBack = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.13, 0.012), new THREE.MeshStandardMaterial({ color: 0x23170f, roughness: 0.5 }));
    const fPic = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.11), new THREE.MeshBasicMaterial({ map: schoolTex, toneMapped: false, color: 0xdddddd }));
    fPic.position.z = 0.0065;
    frame.add(fBack, fPic);
    frame.rotation.x = -0.18; frame.rotation.y = -0.25;
    // (the school photo's off the desk too)

    // ---- Cameron's laptop (a Legion), open on a black stand, left of the monitor ----------
    const lapStand = assets.stand, laptop = assets.laptop;
    const lapGroup = new THREE.Group();
    {
        const black = std(0x101012, { roughness: 0.45, metalness: 0.2 });
        lapStand.traverse((o) => { if (o.isMesh) o.material = black; });
        // the stand's slope runs along its x; turn it so it rises towards the wall
        const sg = new THREE.Group(); sg.add(lapStand); world.add(sg);
        const sb0 = new THREE.Box3().setFromObject(lapStand);
        sg.scale.setScalar(0.38 / (sb0.max.z - sb0.min.z));    // 38 cm between its sides
        sg.rotation.y = Math.PI / 2;
        place(sg, { x: 2.53, y: DESK.top, z: 0.04, az: '0' });
        // read the slope off the stand: the highest point in slices from front to back
        anchor.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(world.matrixWorld).invert(), v = new THREE.Vector3();
        const sb = boxOf(sg), N = 12, tops = new Array(N).fill(-1);
        lapStand.traverse((o) => {
            if (!o.isMesh) return;
            const pos = o.geometry.attributes.position, m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
            for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i).applyMatrix4(m);
                const k = Math.min(N - 1, Math.floor((v.z - sb.min.z) / (sb.max.z - sb.min.z) * N));
                tops[k] = Math.max(tops[k], v.y);
            }
        });
        if (tops[1] > tops[N - 2]) {                          // high end at the front: turn it round
            sg.rotation.y = -Math.PI / 2;
            place(sg, { x: 2.53, y: DESK.top, z: 0.04, az: '0' });
            tops.reverse();
        }
        const zAt = (k) => sb.min.z + (k + 0.5) / N * (sb.max.z - sb.min.z);
        const za = zAt(2), zb = zAt(N - 3);                    // skip the ends (the lips)
        const angle = Math.atan2(tops[2] - tops[N - 3], zb - za);   // how far it leans back
        // the laptop: 46 cm wide (room scale), its bottom front edge just behind the lip
        // (the model has a few stray points far off: measure it by where most of it is)
        const robustBox = (obj) => {
            obj.updateMatrixWorld(true);
            const xs = [], ys = [], zs = [], v = new THREE.Vector3();
            obj.traverse((o) => {
                if (!o.isMesh) return;
                const pos = o.geometry.attributes.position, step = Math.max(1, Math.floor(pos.count / 4000));
                for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); xs.push(v.x); ys.push(v.y); zs.push(v.z); }
            });
            const q = (a, f) => { a.sort((m, n) => m - n); return a[Math.floor((a.length - 1) * f)]; };
            return new THREE.Box3(new THREE.Vector3(q(xs, 0.003), q(ys, 0.003), q(zs, 0.003)), new THREE.Vector3(q(xs, 0.997), q(ys, 0.997), q(zs, 0.997)));
        };
        const lb = robustBox(laptop);
        laptop.scale.multiplyScalar(0.46 / (lb.max.x - lb.min.x));
        const lb2 = robustBox(laptop), lc = lb2.getCenter(new THREE.Vector3());
        laptop.position.set(-lc.x, -lb2.min.y, -lb2.max.z);      // pivot: bottom front edge
        lapGroup.add(laptop);
        world.add(lapGroup);
        const zf = zAt(N - 2);
        lapGroup.position.set(2.53, tops[N - 2] + 0.004, zf);
        lapGroup.rotation.x = THREE.MathUtils.clamp(angle, 0.2, ROOM.laptopTilt ?? 0.42);   // leaning back, not standing up
        lapGroup.userData.angle = angle;
        lapGroup.userData.stand = sg;
        lapGroup.updateMatrixWorld(true);
        // a stand-in for its size (for close-ups), since its own bounds include the stray points
        const hb = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.3, 0.3), new THREE.MeshBasicMaterial({ visible: false }));
        hb.position.set(2.53, DESK.top + 0.22, 0.25); world.add(hb); lapGroup.userData.box = hb;
        laptop.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    }

    // ---- MZALA: the robot desk buddy, black with green eyes, next to the PSP --------------
    const guide = createGuide();
    const robot = assets.robot;
    {
        const b = new THREE.Box3().setFromObject(robot);
        robot.scale.setScalar(0.2 / (b.max.y - b.min.y));      // a 20 cm desk buddy
    }
    robot.rotation.y = -Math.PI / 2;                         // the model faces +x: now +z (the buddy group turns him)
    const robotEyes = [];
    robot.traverse((o) => {
        if (!o.isMesh) return;
        const name = o.material?.name || '';
        if (name === 'EYES') {
            o.material = new THREE.MeshStandardMaterial({ color: 0x0a1a0e, emissive: 0x39ff7a, emissiveIntensity: 0.9, roughness: 0.4, side: THREE.DoubleSide,
                polygonOffset: true, polygonOffsetFactor: -8, polygonOffsetUnits: -8 });     // they sit a hair in front of his face: draw them on top
            o.renderOrder = 2;
            robotEyes.push(o.material);
        } else if (name === 'GLOW') {
            o.material = new THREE.MeshStandardMaterial({ color: 0x0a1a0e, emissive: 0x39ff7a, emissiveIntensity: 0.6, roughness: 0.4, side: THREE.DoubleSide });
        } else if (name === 'SCREEN') {
            o.material = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.15, metalness: 0.2, side: THREE.DoubleSide });
        } else {
            o.material = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.45, metalness: 0.35, side: THREE.DoubleSide });
        }
    });
    // the buddy group stands on the desk at his feet, centred, and turns to face where he goes
    const buddy = new THREE.Group();
    buddy.add(robot);
    world.add(buddy);
    {
        buddy.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(robot, true).applyMatrix4(new THREE.Matrix4().copy(buddy.matrixWorld).invert());
        robot.position.x -= (b.min.x + b.max.x) / 2; robot.position.z -= (b.min.z + b.max.z) / 2; robot.position.y -= b.min.y;
    }
    // a pivot at his back-bottom edge, so he can fall over backwards (click him)
    const tilt = new THREE.Group();
    {
        buddy.updateMatrixWorld(true);
        const b = new THREE.Box3().setFromObject(robot, true).applyMatrix4(new THREE.Matrix4().copy(buddy.matrixWorld).invert());
        tilt.position.z = b.min.z;
        buddy.remove(robot); tilt.add(robot); buddy.add(tilt);
        robot.position.z -= b.min.z;
    }
    const BUDDY_H = 0.2;
    buddy.position.set(2.6, DESK.top, 0.68);
    buddy.rotation.y = -0.3;
    const mixer = new THREE.AnimationMixer(robot);
    if (robot.userData.clips?.length) mixer.clipAction(robot.userData.clips[0]).play();   // his own idle (a blink)
    const guideGlow = new THREE.PointLight(0x39ff7a, 0, 70, 1);
    world.add(guideGlow);

    // ---- MZALA walks about on his end of the desk ----------------------------------------
    // between a few spots round the PSP (never through it), stops, looks at you,
    // chatters now and then; when he talks he stops and turns to you.
    const SPOTS = [[2.02, 0.68], [2.3, 0.72], [2.6, 0.7], [2.82, 0.66], [2.45, 0.62]];
    const PSP_R = pspM.x / 2 + 0.07;                         // keep clear of the PSP (its half-width + his)
    const clearOfPsp = (ax, az, bx, bz) => {
        const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
        const k = THREE.MathUtils.clamp(((pspSpot.x - ax) * dx + (pspSpot.z - az) * dz) / l2, 0, 1);
        return Math.hypot(ax + dx * k - pspSpot.x, az + dz * k - pspSpot.z) > PSP_R;
    };
    const dance = { move: null, t0: 0, home: null, lastBeat: 0 };
    // poked: he falls over (and gets back up) or gets cross (red eyes, a stomp, a shake)
    const react = { kind: null, t0: 0, said: false, thud: false, up: false, line: '' };
    const GREEN = new THREE.Color(0x39ff7a), RED = new THREE.Color(0xff2a2a);
    // his eyes flash bright green (black face, green eyes: always), k 0..1
    const faceFlash = (k) => {
        for (const m of robotEyes) { m.emissive.copy(GREEN); if (k > 0) m.emissiveIntensity = 0.9 + 2.4 * k; }
    };
    const reactTo = () => {
        if (react.kind) return;
        const r = Math.random(), kind = r < 0.25 ? 'fall' : r < 0.42 ? 'angry' : r < 0.52 ? 'sus' : r < 0.72 ? 'dodge' : 'quick';
        const pick = (a) => a[Math.floor(Math.random() * a.length)];
        const lines = GUIDE.reactions?.[kind] || [];
        Object.assign(react, { kind, t0: performance.now(), said: false, thud: false, up: false, line: lines[Math.floor(Math.random() * lines.length)] || '' });
        guide.hush();
        // the meme board: what he plays (and sometimes that's all he does: no words)
        react.meme = kind === 'fall' ? pick(['violin', 'pipe', 'sponge', 'damage', 'oof', 'wasted']) : kind === 'angry' ? pick(['siren', 'bruh', 'stopit'])
            : kind === 'sus' ? 'sus' : kind === 'dodge' ? pick(['dodge', 'dodge', 'missed']) : pick(['bonk', 'xp', 'huh', 'alert']);
        if (kind === 'quick' || kind === 'dodge' || react.meme === 'stopit' || ((kind === 'fall' || kind === 'angry') && Math.random() < 0.35)) react.line = '';
        react.side = Math.random() < 0.5 ? -1 : 1;
        if (kind === 'fall') sfx.hop(); else if (kind === 'angry') { sfx.grumble(); sfx.meme(react.meme, 4); } else sfx.meme(react.meme, 4);
    };
    // one frame of the reaction; returns [bob, done]
    const reactTick = (t, faceYou, dt) => {
        const ms = t - react.t0;
        let bob = 0;
        if (react.kind === 'fall') {
            const ease = (k) => k * k;
            if (ms < 90) { bob = Math.sin(ms / 90 * Math.PI) * 0.015; tilt.rotation.x = 0; }                  // a startled hop
            else if (ms < 400) tilt.rotation.x = -1.5 * ease((ms - 90) / 310);                                // over he goes
            else if (ms < 600) tilt.rotation.x = -1.5 + Math.sin((ms - 400) / 200 * Math.PI) * 0.12;         // a bounce
            else if (ms < 1700) tilt.rotation.x = -1.5;                                                        // lying there
            else if (ms < 2150) { const k = (ms - 1700) / 450; tilt.rotation.x = -1.5 * (1 - (1 - Math.pow(1 - k, 3))) + Math.sin(k * Math.PI) * 0.1; }
            else if (ms < 2650) { tilt.rotation.x = 0; robot.rotation.z = Math.sin((ms - 2150) * 0.04) * 0.15 * (1 - (ms - 2150) / 500); }   // shakes it off
            if (ms >= 400 && !react.thud) { react.thud = true; if (react.meme !== 'pipe') sfx.thud(); sfx.meme(react.meme, react.meme === 'violin' ? 4.5 : 3); }
            const dim = ms > 450 && ms < 1750 ? 0.15 + (Math.random() < 0.06 ? 0.8 : 0) : null;            // eyes out, a flicker
            if (dim !== null) for (const m of robotEyes) m.emissiveIntensity = dim;
            if (ms >= 2150 && !react.up) { react.up = true; sfx.chirp(2); }
            if (ms >= 900 && !react.said) { react.said = true; if (react.line) guide.say({ text: react.line }); }
            if (ms >= 2650) { tilt.rotation.x = 0; robot.rotation.z = 0; return [0, true]; }
        } else if (react.kind === 'quick') {
            // a quick one, no words: a bonk (his face flashes), a Windows XP crash, a confused
            // head tilt, or the Metal Gear "!" (he snaps round, eyes flash red)
            if (react.meme === 'bonk') {
                const k = ms < 90 ? ms / 90 : Math.max(0, 1 - (ms - 90) / 420);
                tilt.rotation.x = 0.28 * k;                                          // knocked forward a bit
                faceFlash(ms < 520 ? 1 - ms / 520 : 0);
            } else if (react.meme === 'alert') {
                turnTo(faceYou, dt, 0.06);
                if (ms < 260) bob = Math.sin(ms / 260 * Math.PI) * 0.03;             // a startled hop
                const on = ms < 900 && Math.floor(ms / 110) % 2 === 0;
                for (const m of robotEyes) { m.emissive.copy(on ? RED : GREEN); m.emissiveIntensity = on ? 2.2 : 1.2; }
            } else if (react.meme === 'xp') {
                const off = ms < 1100 && (Math.floor(ms / 90) % 3 !== 0);         // he glitches out
                for (const m of robotEyes) m.emissiveIntensity = off ? 0.05 : 1.2;
                robot.rotation.z = ms < 1100 ? (Math.random() - 0.5) * 0.04 : 0;
                if (ms >= 1100 && !react.up) { react.up = true; sfx.chirp(3); }    // rebooted
            } else {
                const k = Math.min(1, ms / 200), back = ms > 950 ? Math.min(1, (ms - 950) / 250) : 0;
                robot.rotation.z = 0.38 * k * (1 - back);                           // huh?
                turnTo(faceYou, dt, 0.03);
            }
            if (ms >= 1300) { faceFlash(0); tilt.rotation.x = 0; robot.rotation.z = 0; for (const m of robotEyes) m.emissive.copy(GREEN); return [0, true]; }
        } else if (react.kind === 'dodge') {
            // he sees it coming and steps out of the way (and back, a bit smug)
            const base = robot.userData.baseX ??= robot.position.x;
            const out = ms < 140 ? 1 - Math.pow(1 - ms / 140, 3) : ms < 750 ? 1 : Math.max(0, 1 - (ms - 750) / 380);
            robot.position.x = base + react.side * 0.075 * out;
            robot.rotation.z = -react.side * 0.22 * (ms < 140 ? ms / 140 : out) * (ms < 300 ? 1 : 0.6);
            if (ms < 140 && ms > 40) faceFlash(0.6);
            else faceFlash(0);
            if (ms >= 1150) { robot.position.x = base; robot.rotation.z = 0; return [0, true]; }
        } else if (react.kind === 'sus') {
            // sus: he turns slowly to stare you down, eyes pulsing red, a little lean in
            turnTo(faceYou, dt, 0.01);
            const k = Math.min(1, ms / 300), back = ms > 2300 ? Math.min(1, (ms - 2300) / 300) : 0;
            const pulse = 0.5 + 0.5 * Math.sin(ms * 0.012);
            for (const m of robotEyes) { m.emissive.copy(GREEN).lerp(RED, k * (1 - back) * (0.55 + 0.45 * pulse)); m.emissiveIntensity = 1.4; }
            tilt.rotation.x = Math.sin(Math.min(1, ms / 600) * Math.PI / 2) * 0.22 * (1 - back);   // leaning in
            if (!react.said && ms > 500) { react.said = true; guide.say({ text: react.line }); }
            if (ms >= 2600) { for (const m of robotEyes) m.emissive.copy(GREEN); tilt.rotation.x = 0; return [0, true]; }
        } else {
            turnTo(faceYou, dt, 0.02);
            const k = Math.min(1, ms / 200), back = ms > 1900 ? Math.min(1, (ms - 1900) / 300) : 0;
            for (const m of robotEyes) { m.emissive.copy(GREEN).lerp(RED, k * (1 - back)); m.emissiveIntensity = 1.6; }
            if (ms < 1900) robot.rotation.z = Math.sin(ms * 0.09) * 0.1;                                       // shaking with rage
            for (const at of [250, 800]) if (ms > at && ms < at + 260) bob = Math.sin((ms - at) / 260 * Math.PI) * 0.035;   // two stomps
            if (ms > 510 && ms < 560 && !react.thud) { react.thud = true; sfx.thud(); }
            if (ms > 1060 && ms < 1110 && !react.up) { react.up = true; sfx.thud(); }
            if (!react.said) { react.said = true; if (react.line) guide.say({ text: react.line }); }
            if (ms >= 2200) { for (const m of robotEyes) m.emissive.copy(GREEN); robot.rotation.z = 0; return [0, true]; }
        }
        return [bob, false];
    };
    const walk = { state: 'idle', wait: 3500, to: null, stepT: 0, phase: 0, chirpIn: 9000 };
    const camLocal = new THREE.Vector3();
    const turnTo = (heading, dt, rate = 0.006) => {
        let d = heading - buddy.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        buddy.rotation.y += d * Math.min(1, dt * rate);
        return Math.abs(d);
    };
    const walkTick = (t, dt) => {
        const inRoom = handheld.mode === 'room' || handheld.mode === 'focus';
        // where the camera is, in room metres: so he can look at you
        camLocal.copy(handheld.camera.position); world.worldToLocal(camLocal);
        const faceYou = Math.atan2(camLocal.x - buddy.position.x, camLocal.z - buddy.position.z);
        let bob = 0, sway = 0;
        if (react.kind) {
            const [b, done] = reactTick(t, faceYou, dt);
            if (done) { react.kind = null; walk.state = 'idle'; walk.wait = 2500; }
            robot.position.y += (b - (robot.userData.bob || 0)); robot.userData.bob = b;
            return;
        }
        const dancing = ui.isPlaying() && !guide.talking && inRoom;
        if (dancing) {
            // music's on: he dances. A new move every two bars (~4 s at 120 bpm), each with
            // its own little sound: bounce, sway, spin, hop, shuffle, head-bop, the robot
            walk.state = 'idle'; walk.wait = 1500;
            const beat = t * 0.00314;                          // ~120 bpm (a bounce a beat)
            const MOVES = ['bounce', 'sway', 'spin', 'hop', 'shuffle', 'bop', 'robot'];
            if (!dance.move || t - dance.t0 > 4000) {
                const prev = dance.move;
                do { dance.move = MOVES[Math.floor(Math.random() * MOVES.length)]; } while (dance.move === prev);
                dance.t0 = t; dance.home = dance.home || buddy.position.clone();
                ({ spin: sfx.whoosh, hop: sfx.pop, shuffle: sfx.scratch, robot: sfx.beepboop, bop: () => sfx.chirp(2) }[dance.move] || (() => {}))();
            }
            const k = (t - dance.t0) / 4000, B = robot.userData.baseScale ||= robot.scale.x;
            let yaw = faceYou, sq = 1, dx = 0;
            switch (dance.move) {
                case 'bounce': bob = Math.abs(Math.sin(beat)) * 0.03; sq = 1 + Math.sin(beat * 2) * 0.06; break;
                case 'sway': bob = Math.abs(Math.sin(beat)) * 0.012; sway = Math.sin(beat * 0.5) * 0.35; yaw += Math.sin(beat * 0.5) * 0.4; break;
                case 'spin': bob = Math.abs(Math.sin(beat)) * 0.015; yaw += k < 0.5 ? (k / 0.5) * Math.PI * 4 : 0; break;     // two twirls, then pose
                case 'hop': bob = Math.max(0, Math.sin(beat * 0.5)) * 0.06; sq = bob > 0.04 ? 1.08 : 0.94; break;
                case 'shuffle': dx = Math.sin(beat * 0.5) * 0.045; sway = Math.sin(beat) * 0.18; bob = Math.abs(Math.sin(beat)) * 0.01; break;
                case 'bop': robot.rotation.z = Math.sin(beat * 2) * 0.12; bob = Math.abs(Math.sin(beat)) * 0.008; break;
                case 'robot': yaw += Math.round(Math.sin(beat * 0.5) * 2) * 0.35; bob = (Math.floor(beat / Math.PI) % 2) * 0.012; break;   // stiff steps
            }
            if (dance.move !== 'bop') robot.rotation.z *= 0.8;
            buddy.rotation.y = dance.move === 'spin' || dance.move === 'robot' ? yaw : buddy.rotation.y;
            if (dance.move !== 'spin' && dance.move !== 'robot') turnTo(yaw, dt, 0.008);
            buddy.position.x = dance.home.x + dx;
            robot.scale.setScalar(B);
            robot.scale.y = B * sq;
            if (Math.floor(beat / Math.PI) !== dance.lastBeat) {     // a soft tick on the beat, now and then
                dance.lastBeat = Math.floor(beat / Math.PI);
                if (dance.lastBeat % 8 === 0) sfx.step();
            }
        } else {
            if (robot.userData.baseScale) robot.scale.setScalar(robot.userData.baseScale);
            if (dance.home) { buddy.position.x = dance.home.x; dance.home = null; dance.move = null; robot.rotation.z = 0; }
        }
        if (dancing) { /* moves above */ } else if (guide.talking) {
            walk.state = 'idle'; walk.wait = 2500;
            turnTo(faceYou, dt, 0.008);
            bob = Math.abs(Math.sin(t * 0.012)) * 0.006;       // a little bounce while he talks
        } else if (walk.state === 'idle') {
            turnTo(faceYou, dt, 0.002);
            walk.wait -= dt;
            if (walk.wait <= 0) {
                const here = [buddy.position.x, buddy.position.z];
                const options = SPOTS.filter(([x, z]) => Math.hypot(x - here[0], z - here[1]) > 0.12 && clearOfPsp(here[0], here[1], x, z));
                if (options.length) { walk.to = options[Math.floor(Math.random() * options.length)]; walk.state = 'turn'; }
                else walk.wait = 1500;
            }
        } else if (walk.state === 'turn') {
            const h = Math.atan2(walk.to[0] - buddy.position.x, walk.to[1] - buddy.position.z);
            if (turnTo(h, dt, 0.01) < 0.08) walk.state = 'walk';
        } else if (walk.state === 'walk') {
            const dx = walk.to[0] - buddy.position.x, dz = walk.to[1] - buddy.position.z, d = Math.hypot(dx, dz);
            const stepLen = Math.min(d, 0.11 * dt / 1000);    // 11 cm a second
            buddy.position.x += dx / (d || 1) * stepLen;
            buddy.position.z += dz / (d || 1) * stepLen;
            turnTo(Math.atan2(dx, dz), dt, 0.01);
            walk.phase += dt * 0.016;
            bob = Math.abs(Math.sin(walk.phase)) * 0.012;      // a waddle
            sway = Math.sin(walk.phase) * 0.12;
            walk.stepT += dt;
            if (walk.stepT > 196 && inRoom) { walk.stepT = 0; sfx.step(); }
            if (d < 0.01) { walk.state = 'idle'; walk.wait = 2500 + Math.random() * 5000; }
        }
        robot.position.y += (bob - (robot.userData.bob || 0)); robot.userData.bob = bob;
        robot.rotation.x += (sway - robot.rotation.x) * Math.min(1, dt * 0.02);   // side to side (he faces his own +x)
        // chatter now and then, even when he's not saying anything
        walk.chirpIn -= dt;
        if (walk.chirpIn <= 0) { walk.chirpIn = 8000 + Math.random() * 9000; if (inRoom && !guide.talking && !ui.isPlaying()) sfx.chirp(); }
        guideGlow.position.set(buddy.position.x, DESK.top + 0.15, buddy.position.z + 0.15);
    };

    // ---- the photo album, on the desk ------------------------------------------------------

    // ---- posters: in the bedroom's three frames, and a gallery wall on the right ----------
    const posters = {};
    const WALL = {
        back: { n: new THREE.Vector3(0, 0, 1), at: (p) => new THREE.Vector3(p.x, p.y, 0.006) },
        left: { n: new THREE.Vector3(1, 0, 0), at: (p) => new THREE.Vector3(0.006, p.y, p.z) },
        right: { n: new THREE.Vector3(-1, 0, 0), at: (p) => new THREE.Vector3(R.w - 0.006, p.y, p.z) },
    };
    // the nine frames in the pack: each one's outer size and picture-opening, measured from its geometry
    const frameSet = [], frameMat = std(0x0c0c0d, { roughness: 0.5, side: THREE.DoubleSide });      // (the pack's mouldings have some back-facing pieces)
    if (assets.frames) {
        for (let i = 0; i < 9; i++) {
            let fm = null, pm = null;
            assets.frames.traverse((o) => { if (o.isMesh && o.parent?.name === `F${i}`) { if (/^frame/.test(o.name) || o.name === `frame${i}`) fm = o; else pm = o; } });
            if (!fm || !pm) continue;
            fm.geometry.computeBoundingBox(); pm.geometry.computeBoundingBox();
            const fb = fm.geometry.boundingBox, qb = pm.geometry.boundingBox;
            frameSet.push({ geo: fm.geometry, used: 0, ow: fb.max.x - fb.min.x, minZ: fb.min.z, qw: qb.max.x - qb.min.x, qh: qb.max.y - qb.min.y, qa: (qb.max.x - qb.min.x) / (qb.max.y - qb.min.y), qcx: (qb.max.x + qb.min.x) / 2, qcy: (qb.max.y + qb.min.y) / 2, qz: qb.min.z });
        }
    }
    await Promise.all(ROOM.posters.map(async (p) => {
        let tex;
        try { tex = await loadTex(p.src); } catch { return; }
        const ia = tex.image.width / tex.image.height;
        if (p.frame) {
            // fill one of the bedroom's frames (cropped to fit, like a print)
            const m = frames[p.frame]; if (!m) return;
            const fb = boxOf(m), fa = (fb.max.x - fb.min.x) / (fb.max.y - fb.min.y);
            if (ia > fa) { tex.repeat.x = fa / ia; tex.offset.x = (1 - tex.repeat.x) / 2; }
            else { tex.repeat.y = ia / fa; tex.offset.y = (1 - tex.repeat.y) / 2; }
            m.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 });
            if (p.id) posters[p.id] = m;
            return;
        }
        if (p.fm && frameSet.length) {                         // a real frame from the pack: pick the one nearest the photo's shape
            const w = WALL[p.wall]; if (!w) return;
            let best = null, bd = 1e9;
            for (const f of frameSet) { const d = Math.abs(Math.log(f.qa / ia)) + f.used * 0.12; if (d < bd) { bd = d; best = f; } }
            best.used++;
            const sc = p.w * 1.0 / best.ow, qw = best.qw * sc, qh = best.qh * sc;
            const cw = 1024, ch = Math.max(256, Math.round(1024 * qh / qw)), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
            const g = cv.getContext('2d'); g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, cw, ch);          // dark under the moulding, so no white edge ever shows past the frame's lip
            const e = 0.055 * Math.min(cw, ch); g.fillStyle = '#f1efe8'; g.fillRect(e, e, cw - 2 * e, ch - 2 * e);          // the white mount, then the photo cropped to fit
            const m = 0.12 * Math.min(cw, ch), iw = cw - 2 * m, ih = ch - 2 * m, k = Math.max(iw / tex.image.width, ih / tex.image.height);
            g.save(); g.beginPath(); g.rect(m, m, iw, ih); g.clip();
            g.drawImage(tex.image, m + (iw - tex.image.width * k) / 2, m + (ih - tex.image.height * k) / 2, tex.image.width * k, tex.image.height * k); g.restore();
            const ct = new THREE.CanvasTexture(cv); ct.colorSpace = THREE.SRGBColorSpace; ct.anisotropy = 8;
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(qw, qh), new THREE.MeshStandardMaterial({ map: ct, roughness: 0.45 }));
            const fr = new THREE.Mesh(best.geo, frameMat);
            fr.scale.setScalar(sc); fr.position.set(-best.qcx * sc, -best.qcy * sc, -best.qz * sc); fr.castShadow = true;
            mesh.add(fr);
            const at = w.at(p);
            mesh.position.copy(at).addScaledVector(w.n, (best.qz - best.minZ) * sc + 0.004);
            mesh.lookAt(at.clone().add(w.n)); mesh.rotateZ(p.rot || 0);
            world.add(mesh);
            posters[p.id || p.src.split('/').pop().replace(/\.\w+$/, '')] = mesh;
            return;
        }
        const w = WALL[p.wall]; if (!w) return;
        const h = p.w / ia;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
        const at = w.at(p);
        mesh.position.copy(at);
        mesh.lookAt(at.clone().add(w.n));
        mesh.rotateZ(p.rot || 0);
        world.add(mesh);
        if (p.border) {                                        // a thin frame round it, 2 cm deep
            const fr = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.035, h + 0.035, 0.02), std(new THREE.Color(p.border).getHex(), { roughness: 0.45 }));
            fr.position.z = -0.0105;
            mesh.add(fr);
            mesh.position.addScaledVector(w.n, 0.016);
        }
        if (p.tape) {                                          // two bits of tape, pinned up rather than framed
            const tape = new THREE.MeshStandardMaterial({ color: 0xe9e2cf, roughness: 0.9, transparent: true, opacity: 0.85 });
            for (const sx of [-1, 1]) {
                const t = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.025), tape);
                t.position.set(sx * p.w * (0.36 + Math.random() * 0.06), h / 2 - 0.004, 0.001);
                t.rotation.z = sx * (0.35 + Math.random() * 0.4);   // never quite straight
                mesh.add(t);
            }
        }
        posters[p.id || p.src.split('/').pop().replace(/\.\w+$/, '')] = mesh;   // every poster clickable; only ids with a line get MZALA
    }));

    // the skate decks: the centrepiece over the monitor, three decks across on wall pegs
    let boards = null;
    if (ROOM.boards) {
        const B = ROOM.boards, L = B.length || 1.1, Wd = B.width || 0.25, T = 0.014;
        await Promise.all(['italic 900 40px Lato', '40px "Homemade Apple"', '20px Geist'].map((f) => document.fonts.load(f).catch(() => {})));
        boards = new THREE.Group();
        // a deck: a long rounded shape, kicked up at both ends (away from the wall)
        const shape = new THREE.Shape();
        const r = Wd / 2, hx = L / 2 - r;
        shape.moveTo(-hx, -r); shape.lineTo(hx, -r); shape.absarc(hx, 0, r, -Math.PI / 2, Math.PI / 2, false);
        shape.lineTo(-hx, r); shape.absarc(-hx, 0, r, Math.PI / 2, Math.PI * 1.5, false);
        const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 20 });
        {
            const pos = geo.attributes.position, uv = geo.attributes.uv;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i), y = pos.getY(i), ax = Math.abs(x);
                uv.setXY(i, (x + L / 2) / L, (y + r) / Wd);
                if (ax > L / 2 - 0.18) { const k = (ax - (L / 2 - 0.18)) / 0.18; pos.setZ(i, pos.getZ(i) + k * k * 0.06); }   // the kicks
            }
            geo.computeVertexNormals();
        }
        const edge = std(0xd8c39a, { roughness: 0.6 });         // maple ply at the edges
        const peg = std(0x111113, { roughness: 0.4, metalness: 0.5 });
        await Promise.all(B.decks.map(async (d, i) => {
            const tex = d.img ? await loadTex(d.img).catch(() => null) : canvasTex(1024, 268, (g, w, h) => {
                g.fillStyle = d.color; g.fillRect(0, 0, w, h);
                if (d.text) {
                    g.fillStyle = d.ink || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
                    g.font = d.script ? `${h * 0.42}px "Homemade Apple", cursive` : `italic 900 ${h * 0.56}px Lato, sans-serif`;
                    g.fillText(d.text, w / 2, h * 0.53);
                }
                if (d.small) { g.fillStyle = d.ink || '#fff'; g.font = `500 ${h * 0.09}px Geist, Arial, sans-serif`; g.textAlign = 'right'; g.fillText(d.small, w - 70, h - 26); }
            });
            const deck = new THREE.Mesh(geo, [std(0xffffff, { map: tex, roughness: 0.4 }), edge]);
            deck.position.set(0, -i * (Wd + B.gap), 0.03);
            deck.rotation.z = (i % 2 ? -1 : 1) * 0.012;           // hung by hand
            boards.add(deck);
            for (const sx of [-L * 0.34, L * 0.34]) {                    // two pegs under each deck
                const pg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.045, 10), peg);
                pg.rotation.x = Math.PI / 2; pg.position.set(sx, deck.position.y - r - 0.004, 0.022);
                boards.add(pg);
            }
        }));
        boards.position.set(B.x, B.y + (B.decks.length - 1) * (Wd + B.gap) / 2, 0);
        world.add(boards);
    }

    // frames with nothing in them come down
    const used = new Set(ROOM.posters.filter((p) => p.frame).map((p) => p.frame));
    bedroom.traverse((o) => { if (o.isMesh && /^cuadro\d?_/.test(o.name) && !used.has(o.name.split('_')[0])) o.visible = false; });

    // ---- the records (records-data.js: DISCS, the wall's playlists then the crate's albums).
    // Cameron's three playlists hang on the wall over the record player as bare records; his
    // albums are in the crate under it, in their sleeves. Click the wall to go up close, a record
    // for its card; click the crate to flip through. "Put it on" flies the record to the player.
    const REC_X = 0.49;
    const recordWall = new THREE.Group();
    const covers = new THREE.TextureLoader(); covers.setCrossOrigin('anonymous');
    const coverTex = DISCS.map(() => null), coverWaiters = DISCS.map(() => []);
    // a cover of its own for one without (Durbeezy's private): its colour, its name
    const blankCover = (d) => canvasTex(512, 512, (c, w, h) => {
        c.fillStyle = d.bg || '#d4202c'; c.fillRect(0, 0, w, h);
        c.fillStyle = '#fff'; c.textAlign = 'center';
        c.font = '800 78px Geist, Arial, sans-serif'; c.fillText(d.title.toUpperCase(), w / 2, h * 0.54);
        c.font = '500 26px Geist, Arial, sans-serif'; c.fillText(d.kind === 'playlist' ? 'P L A Y L I S T' : d.artist, w / 2, h * 0.64);
    });
    const coverDone = (i, t) => { coverTex[i] = t; coverWaiters[i].splice(0).forEach((f) => f(t)); };
    DISCS.forEach((d, i) => {
        if (!d.cover) { coverDone(i, blankCover(d)); return; }
        covers.load(d.cover, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; coverDone(i, t); }, undefined, () => coverDone(i, blankCover(d)));
    });
    const whenCover = (i, f) => { if (coverTex[i]) f(coverTex[i]); else coverWaiters[i].push(f); };
    // a record's label: the middle of its cover, round
    const albumLabel = (i) => {
        const m = new THREE.MeshStandardMaterial({ color: DISCS[i].bg || '#d4202c', roughness: 0.6 });
        whenCover(i, (t) => { m.map = t; m.color.set(0xffffff); m.needsUpdate = true; });
        return m;
    };
    // the wall's playlists all wear the same red label, with their name (as the records did)
    const playlistLabel = (i) => new THREE.MeshStandardMaterial({ roughness: 0.6, map: canvasTex(256, 256, (c, w, h) => {
        c.fillStyle = '#d4202c'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
        let size = 34; c.font = `italic 800 ${size}px Geist, Arial, sans-serif`;
        while (c.measureText(DISCS[i].title.toUpperCase()).width > 180 && size > 14) c.font = `italic 800 ${(size -= 1)}px Geist, Arial, sans-serif`;
        c.fillText(DISCS[i].title.toUpperCase(), w / 2, h * 0.34);
        c.font = '500 15px Geist, Arial, sans-serif'; c.fillText('P L A Y L I S T', w / 2, h * 0.72);
        c.fillStyle = '#000'; c.beginPath(); c.arc(w / 2, h / 2, 7, 0, Math.PI * 2); c.fill();
    }) });
    const recordDisc = (i, d) => {
        const g = vinylDisc(d);
        const lab = g.children[1];
        lab.material = albumLabel(i);   // the cover on every record, playlists too
        lab.geometry = new THREE.CircleGeometry(d * 0.19, 48);
        g.userData.rec = i;
        return g;
    };
    // each record's disc: where it lives (`sleeve`: its holder on the wall, or its sleeve in the
    // crate; `home`: its place there; `out`: which way it comes out) and its size
    const recDiscs = [];
    const STAND = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));   // a disc standing up, facing +z
    // the wall: the playlists as bare records, one above the other over the player (as they were)
    const WALL_D = 0.3, WALL_Y = [1.66, 1.29, 0.92];
    let wallN = 0;
    DISCS.forEach((r, i) => {
        if (r.kind !== 'playlist') return;
        const g = new THREE.Group();
        const disc = recordDisc(i, WALL_D);
        disc.quaternion.copy(STAND);
        g.add(disc);
        g.position.set(REC_X, WALL_Y[wallN] ?? 0.92 + wallN * 0.37, 0.016);
        g.rotation.z = wallN * 0.9 + 0.3;                         // labels at different angles
        g.userData.rec = i; disc.userData.rec = i;
        recordWall.add(g);
        recDiscs[i] = { disc, sleeve: g, home: { pos: new THREE.Vector3(), quat: STAND.clone() }, out: new THREE.Vector3(0, 0, 0.14), size: WALL_D };
        wallN++;
    });
    // the crate: the albums' sleeves standing side by side, spines out (like the books and the
    // films): a spine each with the title and artist; the cover's on the side. Click the crate
    // to go up close, a spine for its card (the cover on the left, the tracks on the right)
    const CR = { lp: 0.3, t: 0.008, gap: 0.0016 };
    const crateSleeves = [];
    const crateSpine = (r) => canvasTex(Math.round(512 * CR.t / CR.lp * 2.2), 512, (c, w, h) => {
        c.fillStyle = '#161618'; c.fillRect(0, 0, w, h);
        c.fillStyle = r.bg || '#d4202c'; c.fillRect(0, 0, w, 10);          // a strip of the album's colour at the top
        c.save(); c.translate(w / 2, 26); c.rotate(Math.PI / 2);
        c.textBaseline = 'middle'; c.fillStyle = '#f1ede6';
        let size = Math.min(w * 0.62, 22); c.font = `700 ${size}px Geist, Arial, sans-serif`;
        const label = r.title.toUpperCase();
        while (c.measureText(label).width > h * 0.62 && size > 7) c.font = `700 ${(size -= 1)}px Geist, Arial, sans-serif`;
        c.fillText(label, 0, 0);
        c.font = `500 ${Math.max(7, size * 0.8)}px Geist, Arial, sans-serif`; c.fillStyle = '#9d97a0'; c.textAlign = 'right';
        c.fillText(r.artist.toUpperCase(), h - 48, 0);
        c.restore();
    });
    const crateEdge = std(0x111113, { roughness: 0.8 });
    const STAND_X = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2));    // a disc standing up, facing +x (in its sleeve)
    {
        const nA = DISCS.filter((d) => d.kind === 'album').length;
        let x = -((nA * (CR.t + CR.gap)) / 2) - 0.03;
        DISCS.forEach((r, i) => {
            if (r.kind !== 'album') return;
            const front = new THREE.MeshStandardMaterial({ color: r.bg || '#222', roughness: 0.55 });
            whenCover(i, (t) => { front.map = t; front.color.set(0xffffff); front.needsUpdate = true; });
            const spine = new THREE.MeshStandardMaterial({ map: crateSpine(r), roughness: 0.6 });
            const g = new THREE.Group();
            // (box faces: +x the cover, -x the back, +z the spine, facing the room)
            const sl = new THREE.Mesh(new THREE.BoxGeometry(CR.t, CR.lp, CR.lp), [front, crateEdge, crateEdge, crateEdge, spine, crateEdge]);
            sl.position.y = CR.lp / 2;
            const disc = recordDisc(i, CR.lp * 0.94);
            disc.quaternion.copy(STAND_X); disc.position.set(0, CR.lp / 2, 0); disc.visible = false;
            g.add(sl, disc);
            g.position.set(x + CR.t / 2, 0, 0.02);
            g.userData.rec = i; sl.userData.rec = i;
            sleeves.add(g);
            crateSleeves.push(g);
            recDiscs[i] = { disc, sleeve: g, home: { pos: disc.position.clone(), quat: STAND_X.clone() }, out: new THREE.Vector3(0, 0.06, CR.lp * 1.02), size: CR.lp * 0.94, crate: true };
            x += CR.t + CR.gap;
        });
        // they all lean together against the crate's left wall: the first one's top on the wall,
        // each one's top on the one before (the crate's inside: 2.2 cm walls)
        const th = 0.13, wallX = -CUBE.w / 2 + 0.022, step = (CR.t + CR.gap) / Math.cos(th);
        crateSleeves.forEach((g, k) => {
            g.rotation.z = th;
            g.position.x = wallX + (CR.t / 2) * Math.cos(th) + CR.lp * Math.sin(th) + 0.001 + k * step;
        });
        for (const g of crateSleeves) g.userData.home = { pos: g.position.clone(), quat: g.quaternion.clone(), scale: 1 };
    }
    world.add(recordWall);

    const NEON = ROOM.neon;
    let neon = null;
    if (!NEON) neonGlow.visible = false;
    if (NEON) {
        await document.fonts.load(`80px ${NEON.font}`).catch(() => {});
        const draw = (glow) => (c, w, h) => {
            c.clearRect(0, 0, w, h);
            c.font = `${h * 0.5}px ${NEON.font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.lineJoin = 'round'; c.lineCap = 'round';
            if (glow) { c.shadowColor = NEON.color; c.shadowBlur = 40; c.fillStyle = NEON.color; c.fillText(NEON.text, w / 2, h * 0.55); c.fillText(NEON.text, w / 2, h * 0.55); }
            c.shadowBlur = 0; c.strokeStyle = '#ffe3e3'; c.lineWidth = 3; c.fillStyle = '#fff0f0';
            c.fillText(NEON.text, w / 2, h * 0.55);
        };
        const tube = canvasTex(1024, 320, draw(true));
        neon = new THREE.Mesh(new THREE.PlaneGeometry(NEON.w, NEON.w * 320 / 1024), new THREE.MeshBasicMaterial({ map: tube, transparent: true, depthWrite: false, toneMapped: false }));
        const at = WALL[NEON.wall].at(NEON);
        neon.position.copy(at).addScaledVector(WALL[NEON.wall].n, 0.02);
        neon.lookAt(neon.position.clone().add(WALL[NEON.wall].n));
        world.add(neon);
        neonGlow.position.copy(at).addScaledVector(WALL[NEON.wall].n, 0.35);
    }

    // ---- pop-ups ----------------------------------------------------------------------------
    const ui = createOverlays(guide);

    // ---- what you can click (in the room view) ------------------------------------------------
    let onPs3 = onPs3Option || (() => {});
    const say = (id) => guide.say(id);
    // only the figures get a hover label (pass named = true); everything else is just clickable
    // the tour: things with a line in GUIDE.lines get it from MZALA when you go up close
    const TOUR = new Map(), lastSaid = new Map();
    const tourSay = (id) => {                                 // not the same line twice in 20 s
        const now = performance.now();
        if (now - (lastSaid.get(id) ?? -1e9) < 20000) return;
        lastSaid.set(id, now); say(id);
    };
    const click = (obj, label, fn, named = false) => obj && handheld.addClickable(obj, { label: named ? label : null, onClick: () => {
        guide.poke();
        const first = focused?.obj !== obj || handheld.mode !== 'focus';
        fn();
        const id = TOUR.get(obj);
        if (id && first && !inspector.open) tourSay(id);
    } });
    const play = () => onPs3();
    for (const o of [monitor, monitorPanel, chair]) click(o, 'PS3: play on the monitor', play);
    click(buddy, `${GUIDE.name}, the desk buddy`, reactTo);
    // things you can look at: the first click walks you up to it (a close-up), and from
    // there you can pick it up and turn it over (the inspector), or just step back
    const inspector = createInspector();
    inspector.onClose(() => { sfx.chirp(2); hideComic(); if (!bioKey.get(focused?.obj)) hideBio(); });   // (still up close: the bio stays)
    const pickBtn = document.createElement('button');
    pickBtn.type = 'button'; pickBtn.className = 'room-pick'; pickBtn.hidden = true;
    pickBtn.innerHTML = '<span class="inspect__start">E</span> pick up';
    document.body.appendChild(pickBtn);
    let focused = null;                                       // { obj, pick } while in a close-up
    let backToBoard = () => false;                            // (from a single pinned photo back to the whole board: set up with the board's clicks)
    // the book / film card: the cover, Cam's take and a link out, like a library page.
    // ← → (or the buttons) go along the shelf; Esc or ✕ closes it
    // (the records section, further down, fills these in: what's on, and putting one on)
    const records = { onDeck: () => -1, nowId: () => null, play: () => {}, track: () => {} };
    const shelfCard = (() => {
        const el = document.createElement('div');
        el.className = 'shelf-card'; el.hidden = true;
        el.innerHTML = `
            <div class="shelf-card__veil"></div>
            <article class="shelf-card__box" role="dialog" aria-modal="true" aria-labelledby="shelf-card-title">
                <div class="shelf-card__art"><img class="shelf-card__cover" alt="" referrerpolicy="no-referrer"><span class="shelf-card__blank"></span></div>
                <div class="shelf-card__info">
                    <p class="shelf-card__kicker"></p>
                    <h2 class="shelf-card__title" id="shelf-card-title"></h2>
                    <p class="shelf-card__by"></p>
                    <p class="shelf-card__note"></p>
                    <p class="shelf-card__synopsis"></p>
                    <div class="shelf-card__actions"><button type="button" class="shelf-card__play"></button><a class="shelf-card__link" target="_blank" rel="noopener"></a></div>
                    <ol class="shelf-card__tracks"></ol>
                    <nav class="shelf-card__nav">
                        <button type="button" class="shelf-card__prev">‹ Previous</button>
                        <span class="shelf-card__count"></span>
                        <button type="button" class="shelf-card__next">Next ›</button>
                    </nav>
                </div>
                <button type="button" class="shelf-card__close" aria-label="Close">✕</button>
            </article>`;
        document.body.appendChild(el);
        const $ = (c) => el.querySelector(c);
        const img = $('.shelf-card__cover'), blank = $('.shelf-card__blank');
        let kind = 'book', at = 0;
        // the crate's albums (their places in DISCS), and what the records section hands over
        const ALBUMS = DISCS.map((d, k) => k).filter((k) => DISCS[k].kind === 'album');
        const listOf = (k) => (k === 'book' ? BOOKS : k === 'film' ? FILMS : ALBUMS.map((k2) => DISCS[k2]));
        const mmss = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
        const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const STATUS = { read: 'Read', 'currently-reading': 'Reading now', 'to-read': 'Want to read' };
        const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
        const line = (k, item, i) => {
            if (item.note) return item.note;
            if (k === 'film') return `Number ${i + 1} on my all-time favourites list.`;
            if (item.status === 'read') return item.rating ? `I gave this one ${item.rating} out of 5.` : 'I’ve read this one.';
            if (item.status === 'currently-reading') return 'I’m reading this one right now.';
            return 'On my to-read list. Read it already? Tell me if it’s worth it.';
        };
        const show = () => {
            const list = listOf(kind), item = list[at];
            const isAlbum = kind === 'album', di = ALBUMS[at];
            $('.shelf-card__actions').hidden = $('.shelf-card__tracks').hidden = !isAlbum;
            const a0 = $('.shelf-card__link');
            if (isAlbum) {
                el.dataset.kind = kind;
                img.hidden = false; blank.hidden = true; img.src = item.cover;
                img.onerror = () => { img.hidden = true; blank.hidden = false; blank.textContent = item.title; blank.style.background = item.bg || '#222'; };
                const on = records.onDeck() === di, playingId = on ? records.nowId() : null;
                $('.shelf-card__kicker').textContent = [on ? 'On the record player now' : 'From the crate', item.year].join('  ·  ');
                $('.shelf-card__title').textContent = item.title;
                const mins = Math.round(item.tracks.reduce((t, x) => t + x[2], 0) / 60);
                $('.shelf-card__by').textContent = `${item.artist}  ·  ${item.tracks.length} songs, ${mins} min`;
                $('.shelf-card__synopsis').hidden = true; $('.shelf-card__note').hidden = true;
                el.style.setProperty('--backdrop', 'none'); el.classList.remove('has-still');
                $('.shelf-card__play').textContent = on ? '▶ Playing: go to the player' : '▶ Put it on';
                a0.href = item.url; a0.textContent = 'On Spotify ↗';
                $('.shelf-card__tracks').innerHTML = item.tracks.map(([id, name, secs, feat], k) => `<li${id === playingId ? ' class="is-on"' : ''}><button type="button" data-k="${k}"><span class="shelf-card__n">${k + 1}</span><span class="shelf-card__song">${esc(name)}${feat ? `<small> ft. ${esc(feat)}</small>` : ''}</span><span class="shelf-card__t">${mmss(secs)}</span></button></li>`).join('');
                $('.shelf-card__count').textContent = `${at + 1} / ${list.length}`;
                return;
            }
            const src = kind === 'book' ? item.cover : item.poster;
            el.dataset.kind = kind;
            blank.textContent = item.title; blank.style.background = (kind === 'book' ? shelfBooks : shelfFilms).children[at]?.userData.shelfItem.color || '#222';
            img.hidden = !src; blank.hidden = !!src;
            if (src) { img.src = src; img.onerror = () => { img.hidden = true; blank.hidden = false; }; }
            $('.shelf-card__kicker').textContent = kind === 'book'
                ? [STATUS[item.status], item.rating ? stars(item.rating) : '', item.year].filter(Boolean).join('  ·  ')
                : ['All-time favourite #' + (at + 1)].join('  ·  ');
            $('.shelf-card__title').textContent = item.title;
            $('.shelf-card__by').textContent = kind === 'book' ? item.author + (item.pages ? `, ${item.pages} pages` : '') : `${item.year}  ·  Directed by ${item.director}`;
            // films: the film's still behind everything, and its synopsis under the credits (books: what it's about)
            el.style.setProperty('--backdrop', kind === 'film' && (item.backdrop || item.poster) ? `url("${item.backdrop || item.poster}")` : 'none');
            el.classList.toggle('has-still', kind === 'film' && !!item.backdrop);
            const syn = $('.shelf-card__synopsis');
            syn.textContent = kind === 'film' ? (item.synopsis || '') : (item.about || ''); syn.hidden = !syn.textContent;
            const note = $('.shelf-card__note');
            note.textContent = item.note ? `“${item.note}”` : ''; note.hidden = !item.note;
            const a = $('.shelf-card__link');
            a.href = kind === 'book' ? LINKS.goodreads(item) : LINKS.letterboxd(item);
            a.textContent = kind === 'book' ? 'On Goodreads ↗' : 'On Letterboxd ↗';
            $('.shelf-card__count').textContent = `${at + 1} / ${list.length}`;
            say({ text: line(kind, item, at) });
        };
        const go = (d) => { const n = listOf(kind).length; at = (at + d + n) % n; sfx.blip(); show(); };
        $('.shelf-card__play').addEventListener('click', () => { const i = ALBUMS[at]; close(); records.play(i, -1); });
        $('.shelf-card__tracks').addEventListener('click', (e) => {
            const b = e.target.closest('button[data-k]'); if (!b) return;
            const i = ALBUMS[at], k = Number(b.dataset.k);
            if (records.onDeck() === i) { records.track(i, k); show(); return; }
            close(); records.play(i, k);
        });
        const close = () => { if (el.hidden) return; el.classList.remove('is-in'); setTimeout(() => { if (!el.classList.contains('is-in')) el.hidden = true; }, 220); guide.hush(); };
        $('.shelf-card__prev').addEventListener('click', () => go(-1));
        $('.shelf-card__next').addEventListener('click', () => go(1));
        $('.shelf-card__close').addEventListener('click', close);
        $('.shelf-card__veil').addEventListener('click', close);
        addEventListener('keydown', (e) => {
            if (el.hidden) return;
            if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); else return;
            e.preventDefault(); e.stopImmediatePropagation();
        }, { capture: true });
        return {
            open: (k, i) => { kind = k; at = k === 'album' ? Math.max(0, ALBUMS.indexOf(i)) : i; el.hidden = false; requestAnimationFrame(() => el.classList.add('is-in')); sfx.chirp(2); show(); },
            refresh: () => { if (!el.hidden && kind === 'album') show(); },
            close,
            get open_() { return !el.hidden; },
        };
    })();

    // the figures' logos, top right: while you hover one, and while you're up close to one
    const figLogo = document.createElement('img');
    figLogo.className = 'fig-logo'; figLogo.alt = ''; figLogo.setAttribute('aria-hidden', 'true');
    document.body.appendChild(figLogo);
    const LOGOS = { 'Cyclops': 'cyclops', 'The Hood': 'hood', 'Jubilee': 'jubilee', 'Daredevil': 'daredevil', 'Jeff the Land Shark': 'jeff', 'The Thing': 'thing' };
    Object.values(LOGOS).forEach((n) => { new Image().src = `images/room/logos/${n}.webp`; });   // ready before the first hover
    const logoState = { hover: null, close: null, shown: null };
    const showLogo = () => {
        const inRoom = handheld.mode === 'room' || handheld.mode === 'focus' || inspector.open;
        const name = inRoom ? (logoState.hover || logoState.close) : null;
        if (name === logoState.shown) return;
        logoState.shown = name;
        if (name && LOGOS[name]) { figLogo.src = `images/room/logos/${LOGOS[name]}.webp`; figLogo.classList.add('is-in'); }
        else figLogo.classList.remove('is-in');
    };
    const figName = new Map();                                // the figure's hit box -> its name
    // the bio, while you're up close: who they are on the left (real name, a short
    // description), where they first turned up on the right (under the logo, with the cover)
    const figBio = document.createElement('section');
    figBio.className = 'fig-bio'; figBio.hidden = true;
    figBio.innerHTML = '<p class="fig-bio__meta"><b></b></p><p class="fig-bio__desc"></p>';
    const figComic = document.createElement('section');
    figComic.className = 'fig-bio fig-bio--comic'; figComic.hidden = true;
    figComic.innerHTML = '<p class="fig-bio__meta"><span></span></p><img class="fig-bio__cover" alt="" referrerpolicy="no-referrer">';
    document.body.append(figBio, figComic);
    let bioShown = null;
    // the comic cover (right) only shows once the figure is picked up, so it never sits over the music player
    const showComic = () => { figComic.hidden = false; requestAnimationFrame(() => figComic.classList.add('is-in')); };
    const hideComic = () => { figComic.classList.remove('is-in'); figComic.hidden = true; };
    const showBio = (key, comic = false) => {
        const b = ROOM.bios?.[key];
        if (!b) { hideBio(); return; }
        if (bioShown !== key || figBio.hidden) {
            bioShown = key;
            figBio.querySelector('.fig-bio__meta b').textContent = b.name;
            figBio.querySelector('.fig-bio__desc').textContent = b.about || '';
            figComic.querySelector('.fig-bio__meta span').textContent = `First seen in ${b.first}`;
            const im = figComic.querySelector('.fig-bio__cover');
            im.hidden = !b.cover; if (b.cover) { im.alt = `Cover of ${b.first}`; im.src = b.cover; im.onerror = () => { im.hidden = true; }; }
            figBio.hidden = false; requestAnimationFrame(() => figBio.classList.add('is-in'));
        }
        if (comic) showComic(); else hideComic();
    };
    const hideBio = () => { bioShown = null; figBio.classList.remove('is-in'); figBio.hidden = true; hideComic(); };
    let recHide = () => {};                                    // (the record card: set up further down)
    let crateRestore = () => {};                               // (a sleeve out of the crate goes back: further down)
    let shelfRestore = () => {}, shelfRow = null;              // (a book, film or game held out goes back: further down)
    const bioKey = new Map();                                 // a figure -> its bio (ROOM.bios), shown while you're up close
    const setFocused = (f) => {
        focused = f; pickBtn.hidden = !f?.pick;
        if (!f) recHide();
        if (!f || ![sleeves, recCorner, tt].includes(f.obj)) crateRestore();
        if (!f || f.obj !== shelfRow) shelfRestore();
        const bk = bioKey.get(f?.obj);
        if (bk) showBio(bk, inspector.open); else if (!inspector.open) hideBio();
        logoState.close = figName.get(f?.obj) || (inspector.open ? logoState.close : null);
        showLogo();
    };
    const pickUp = (obj, opts) => { guide.hush(); inspector.show(obj, opts); };
    const doPick = () => { const f = focused; if (f?.pick) f.pick(); };
    pickBtn.addEventListener('click', doPick);
    addEventListener('keydown', (e) => {
        if (!focused?.pick || inspector.open || handheld.mode !== 'focus') return;
        if (e.key === 'e' || e.key === 'E') { e.preventDefault(); doPick(); }
    });
    // look(obj, normal, pick?): close-up first; a second click on it picks it up
    const look = (obj, normal, pick = null, box = obj) => () => {
        if (focused?.obj === obj && handheld.mode === 'focus' && pick) { pick(); return; }
        focusOn(box, normal);
        setFocused({ obj, pick });
    };
    const UP = new THREE.Vector3(0, 0.55, 1);                 // from in front and a bit above (things on the desk)
    // the Rivals shelf: clicking any figure (or the shelf) first shows the whole team;
    // from there, click one to go up close, and once more (or E) to pick it up
    const team = [daredevil, thing, hood, cyclops, jubilee, jeff];
    const teamBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
    {
        const tb = new THREE.Box3(); team.forEach((h) => tb.union(boxOf(h)));      // in room metres
        tb.getCenter(teamBox.position); tb.getSize(teamBox.scale);
        teamBox.userData.noPick = true; world.add(teamBox);
    }
    const backToTeam = () => { if (!team.includes(focused?.obj)) return false; showTeam(); return true; };
    const onTeam = () => handheld.mode === 'focus' && (focused?.obj === teamBox || team.includes(focused?.obj));
    const showTeam = () => { focusOn(teamBox, new THREE.Vector3(0, 0.25, 1), 1.05); setFocused({ obj: teamBox, pick: null }); tourSay('team'); };
    const FIG = [[cyclops, 'Cyclops'], [hood, 'The Hood'], [jubilee, 'Jubilee'], [daredevil, 'Daredevil'], [jeff, 'Jeff the Land Shark'], [thing, 'The Thing']];
    const VOICE = { [cyclops.uuid]: ['cyclops', 'Cyclops'], [hood.uuid]: ['hood', 'The Hood'], [jubilee.uuid]: ['jubilee', 'Jubilee'], [daredevil.uuid]: ['daredevil', 'Daredevil'], [jeff.uuid]: ['jeff', 'Jeff'], [thing.uuid]: ['thing', 'The Thing'] };
    for (const [f, label] of FIG) { figName.set(f, label); if (VOICE[f.uuid]) bioKey.set(f, VOICE[f.uuid][0]); }
    for (const [f, label] of FIG) {
        const [vKey, vName] = VOICE[f.uuid] || [];
        const voiceKey = ROOM.voices?.[vKey] ? { key: 'v', label: 'voice line', run: () => ui.playVoice(ROOM.voices[vKey], vName) } : null;
        const close = look(f, new THREE.Vector3(0, 0.15, 1), () => { pickUp(f.userData.figure, voiceKey ? { key: voiceKey } : undefined); showBio(vKey, true); });
        click(f, label, () => {
            if (!onTeam()) { showTeam(); return; }
            const goingClose = focused?.obj !== f;
            close();
            const [key, name] = VOICE[f.uuid] || [];
            if (goingClose && key) ui.playVoice(ROOM.voices?.[key], name);   // up close: his ultimate voice line
        }, true);
    }
    // (the shelf itself is clicked further down, once the rows' close-ups exist: it goes to the level you clicked)
    click(ps3, 'PS3', look(ps3, new THREE.Vector3(0, 0.25, 1), () => pickUp(ps3, { turnTo: -0.5 })));
    const ds3Pick = () => pickUp(ds3, { turnTo: 0.35, tilt: 0.95, action: { label: '<span class="inspect__start">START</span> play on the PS3', run: play } });
    click(ds3, 'DualShock 3', look(ds3, UP, ds3Pick));
    click(keyboard, 'Keyboard', look(keyboard, UP, () => pickUp(keyboard, { tilt: 0.6 })));
    click(mouse, 'Mouse', look(mouse, UP, () => pickUp(mouse, { tilt: 0.6 })));
    click(lapGroup, 'Laptop', look(lapGroup, new THREE.Vector3(0, 0.35, 1), null, lapGroup.userData.box || lapGroup));
    if (boards) click(boards, 'Supreme decks', look(boards, new THREE.Vector3(0, 0, 1)));
    // the bookshelf's rows: a close-up of each; a game or the ball you can pick up
    const FRONT = new THREE.Vector3(0, 0.12, 1);
    if (shelfStuff.console.children.length) click(shelfStuff.console, 'PS4', look(shelfStuff.console, FRONT, shelfStuff.pad ? () => pickUp(shelfStuff.pad, { tilt: 0.6 }) : null));
    if (shelfStuff.plant) click(shelfStuff.plant, null, look(shelfStuff.plant, FRONT));
    if (shelfStuff.cork) {
        const pinView = look(shelfStuff.cork, new THREE.Vector3(-1, 0, 0));
        click(shelfStuff.cork, 'Pin board', pinView); click(shelfStuff.pins, 'Pin board', pinView);
        // the board first, then one photo: a click on a photo while you're at the board goes up close to just that
        // one (and a click on it again, or back, returns to the board). A photo clicked from further away just goes to the board.
        const NORM = new THREE.Vector3(-1, 0, 0);
        const atBoard = () => handheld.mode === 'focus' && (focused?.obj === shelfStuff.cork || pinCards.has(focused?.obj));
        const toBoard = () => { focusOn(shelfStuff.cork, NORM); setFocused({ obj: shelfStuff.cork, pick: null }); };
        backToBoard = () => { if (!pinCards.has(focused?.obj)) return false; toBoard(); return true; };
        registerPin = (g) => click(g, 'Photo', () => {
            if (!atBoard()) { toBoard(); return; }
            if (focused?.obj === g) {                      // a second click: the story behind the photo, in a new tab (or back to the board)
                const href = g.userData.pin?.href;
                if (href) { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.dataset.newtab = ''; document.body.appendChild(a); a.click(); a.remove(); }
                else toBoard();
                return;
            }
            focusOn(g, NORM, 1.12); setFocused({ obj: g, pick: null });
            if (g.userData.pin?.href) guide.say({ text: 'Click the photo again to open the story behind it.' });
        });
        pendingPins.forEach(registerPin); pendingPins.length = 0;
    }
    if (shelfStuff.jar) click(shelfStuff.jar, 'Forest in a jar', look(shelfStuff.jar, FRONT));
    if (shelfStuff.potPlant) click(shelfStuff.potPlant, null, look(shelfStuff.potPlant, FRONT));
    // books, films and games: the first click goes up close to the row, then a spine pulls that
    // one out (see shelfShow, with the records)
    const rowClose = new Map();
    for (const [row, line] of [[shelfBooks, 'books'], [shelfFilms, 'films'], [shelfStuff.games, 'games'], [shelfStuff.textbooks, 'textbooks'], [shelfStuff.notebooks, 'notebooks']]) {
        if (!row) continue;
        const close = look(row, FRONT);
        rowClose.set(row, close);
        for (const m of row.children) {
            click(m, null, () => {
                if (busy) return;
                if (focused?.obj !== row || handheld.mode !== 'focus') { close(); tourSay(line); return; }
                shelfShow(m);
            });
        }
    }
    // The bookshelf itself (its boards and sides): go to the LEVEL you clicked, not always the top one.
    // The top shelf (the Rivals team) only when you click the top shelf or one of the figures.
    {
        const levelOf = (y) => {                                // 0..3 = the rows from the bottom; 4 = the top shelf
            for (let i = 0; i < ROWS.length; i++) if (y < shelfBox.min.y + ROWS[i][1] * r + 0.03) return i;
            return ROWS.length;
        };
        const rowsHere = [[shelfBooks, 'books'], [shelfFilms, 'films'], [shelfStuff.games, 'games'], [shelfStuff.textbooks, 'textbooks'], [shelfStuff.notebooks, 'notebooks']].filter(([g]) => g && g.children.length);
        const bandBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
        bandBox.userData.noPick = true; world.add(bandBox);
        click(shelf, 'The Rivals shelf', () => {
            const p = handheld.lastPoint?.();
            if (!p) { if (!onTeam()) showTeam(); return; }
            const y = world.worldToLocal(p.clone()).y, x = world.worldToLocal(p.clone()).x;
            const lvl = levelOf(y);
            if (lvl >= ROWS.length) { if (!onTeam()) showTeam(); return; }
            const y0 = shelfBox.min.y + ROWS[lvl][0] * r - 0.02, y1 = shelfBox.min.y + ROWS[lvl][1] * r + 0.02;
            // a row of things on that level (the one nearest along the shelf), else just the level itself
            let best = null, bestD = 1e9;
            for (const [g, line] of rowsHere) {
                const b = boxOf(g), cy = (b.min.y + b.max.y) / 2;
                if (cy < y0 || cy > y1) continue;
                const d = x < b.min.x ? b.min.x - x : x > b.max.x ? x - b.max.x : 0;
                if (d < bestD) { bestD = d; best = [g, line]; }
            }
            if (best) { if (focused?.obj !== best[0] || handheld.mode !== 'focus') { rowClose.get(best[0])(); tourSay(best[1]); } return; }
            bandBox.position.set((shelfBox.min.x + shelfBox.max.x) / 2, (y0 + y1) / 2, (shelfBox.min.z + shelfBox.max.z) / 2);
            bandBox.scale.set(shelfBox.max.x - shelfBox.min.x, y1 - y0, shelfBox.max.z - shelfBox.min.z);
            focusOn(bandBox, FRONT); setFocused({ obj: bandBox, pick: null });
        });
    }
    // ---- the records: the wall up close, then a sleeve (its card on the right); or the crate
    // under the player, flipping through the albums. "Put it on": the record comes out, flies
    // over and lands on the platter, and plays. The player up close shows what's on, with the controls.
    const recCard = (() => {
        const el = document.createElement('aside');
        el.className = 'rec-card'; el.hidden = true;
        el.setAttribute('aria-live', 'polite');
        el.innerHTML = `
            <p class="rec-card__kicker"></p>
            <h2 class="rec-card__title"></h2>
            <p class="rec-card__by"></p>
            <p class="rec-card__about" hidden></p>
            <div class="rec-card__actions">
                <button type="button" class="rec-card__go"></button>
                <button type="button" class="rec-card__toggle" hidden></button>
                <a class="rec-card__link" target="_blank" rel="noopener">Spotify ↗</a>
            </div>
            <ol class="rec-card__tracks"></ol>
            <ul class="rec-card__trophies" hidden></ul>
            <div class="rec-card__tlist" hidden></div>
            <nav class="rec-card__nav">
                <button type="button" class="rec-card__prev">‹ Previous</button>
                <span class="rec-card__count"></span>
                <button type="button" class="rec-card__next">Next ›</button>
            </nav>`;
        document.body.appendChild(el);
        return el;
    })();
    const $r = (c) => recCard.querySelector(c);
    // the wall and the player together (the camera while a record flies over)
    const recCorner = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
    {
        const b = boxOf(recordWall).union(boxOf(tt)).union(boxOf(sleeves));
        b.getCenter(recCorner.position); b.getSize(recCorner.scale);
        recCorner.userData.noPick = true; world.add(recCorner);
    }
    const mmss = (n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
    const recState = { mode: null, at: 0, trophyList: -1 };                   // mode: 'wall' | 'album' (a playlist or an album) | 'player'
    const FIRST_ALBUM = DISCS.findIndex((d) => d.kind === 'album');
    let lastAlbum = FIRST_ALBUM;
    const group = (i) => DISCS.map((d, k) => k).filter((k) => DISCS[k].kind === DISCS[i].kind);
    let onDeck = -1;                                          // which record's on the platter
    const showRecCard = (on) => {
        if (on) { recCard.hidden = false; requestAnimationFrame(() => recCard.classList.add('is-in')); document.body.classList.add('rec-open'); }
        else { recCard.classList.remove('is-in'); document.body.classList.remove('rec-open'); recState.trophyList = -1; setTimeout(() => { if (!recCard.classList.contains('is-in')) recCard.hidden = true; }, 220); }
    };
    const fillTracks = (i, playingId = null) => {
        const r = DISCS[i], ol = $r('.rec-card__tracks');
        ol.innerHTML = r.tracks.map(([id, name, secs, feat], k) => `<li${id === playingId ? ' class="is-on"' : ''}><button type="button" data-k="${k}"><span class="rec-card__n">${k + 1}</span><span class="rec-card__song">${name.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}${feat ? `<small> ft. ${feat.replace(/[&<>]/g, '')}</small>` : ''}</span><span class="rec-card__t">${secs ? mmss(secs) : ''}</span></button></li>`).join('');
    };
    // a book, film or game held out: its card (no cover: you're holding it; a film's still behind)
    const STATUS = { read: 'Read', 'currently-reading': 'Reading now', 'to-read': 'Want to read' };
    const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
    const shelfData = (kind) => ({ book: BOOKS, film: FILMS, game: GAMES, textbook: TEXTBOOKS, notebook: ROOM.modules || [] }[kind]);
    const renderShelf = () => {
        const { kind, i } = recState.shelf, about = $r('.rec-card__about'), a = $r('.rec-card__link');
        const item = shelfData(kind)[i];
        recCard.dataset.mode = 'shelf';
        delete a.dataset.live;
        $r('.rec-card__go').hidden = true; $r('.rec-card__toggle').hidden = true; $r('.rec-card__tracks').hidden = true; $r('.rec-card__trophies').hidden = true;
        if (kind !== 'game' || recState.trophyList !== i) hideTrophyList();
        $r('.rec-card__nav').hidden = false;
        $r('.rec-card__title').textContent = item.title;
        if (kind === 'book') {
            $r('.rec-card__kicker').textContent = '2026 reading list';
            $r('.rec-card__by').textContent = item.author + (item.pages ? `  ·  ${item.pages} pages` : '');
            about.textContent = item.about || ''; a.removeAttribute('href');                 // (no link: just the book)
        } else if (kind === 'film') {
            $r('.rec-card__kicker').textContent = `All-time favourite #${i + 1}`;
            $r('.rec-card__by').textContent = `${item.year}  ·  Directed by ${item.director}`;
            about.textContent = item.synopsis || ''; a.href = LINKS.letterboxd(item); a.textContent = 'Letterboxd ↗';
        } else if (kind === 'textbook') {
            $r('.rec-card__kicker').textContent = 'Textbooks';
            $r('.rec-card__by').textContent = [item.author, item.edition].filter(Boolean).join('  ·  ');
            about.textContent = item.about || ''; a.removeAttribute('href');
        } else if (kind === 'notebook') {
            const ps = item.projects || [];
            $r('.rec-card__kicker').textContent = '2026 module';
            $r('.rec-card__title').textContent = item.code;
            $r('.rec-card__by').textContent = ps.map((p) => p.title).join('  ·  ') || 'Projects to come';
            about.textContent = ps.map((p) => p.about).filter(Boolean).join('\n\n');
            const link = ps.find((p) => p.link)?.link;
            if (link) { a.href = link; a.textContent = 'Live ↗'; a.dataset.live = ''; } else a.removeAttribute('href');
        } else {
            // the trophies instead of a summary: by grade, then the full list (trophy-list.js)
            $r('.rec-card__kicker').textContent = ['PS4', item.year, item.trophy].filter(Boolean).join('  ·  ');
            $r('.rec-card__by').textContent = item.studio;
            about.textContent = '';
            about.hidden = true;
            const tl = $r('.rec-card__trophies');
            tl.innerHTML = countsHTML(item);
            tl.hidden = false;
            a.removeAttribute('href');
            const go = $r('.rec-card__go'); go.hidden = false; go.textContent = 'View trophy list';
            if (recState.trophyList === i) showTrophyList(item, i);
        }
        about.hidden = !about.textContent; a.hidden = !a.getAttribute('href');
        const still = kind === 'film' ? (item.backdrop || '') : '';
        recCard.classList.toggle('has-still', !!still);
        recCard.style.setProperty('--rec-still', still ? `url("${still}")` : 'none');
        recCard.style.setProperty('--rec-bg', kind === 'game' ? '#0a3d8f' : kind === 'book' ? (item.spine?.bg || '#333') : kind === 'textbook' ? item.bg : kind === 'notebook' ? '#2a2a2e' : '#222');
        const list = recState.shelf.row.children;
        $r('.rec-card__count').textContent = `${i + 1} / ${list.length}`;
    };
    const renderRec = () => {
        const mode = recState.mode;
        $r('.rec-card__about').hidden = true; recCard.classList.remove('has-still');
        $r('.rec-card__trophies').hidden = true;
        if (mode === 'shelf') { renderShelf(); return; }
        $r('.rec-card__go').hidden = false;
        recCard.dataset.mode = mode || '';
        const i = mode === 'player' ? onDeck : recState.at;
        const go = $r('.rec-card__go'), toggle = $r('.rec-card__toggle');
        $r('.rec-card__nav').hidden = mode !== 'album';
        if (mode === 'player' && i < 0) {
            $r('.rec-card__kicker').textContent = 'The record player';
            $r('.rec-card__title').textContent = 'Nothing on';
            $r('.rec-card__by').textContent = 'Put on a playlist from the wall, or an album from the crate under the player.';
            go.textContent = 'Flip through the crate'; toggle.hidden = true; $r('.rec-card__link').hidden = true;
            $r('.rec-card__tracks').innerHTML = '';
            return;
        }
        const r = DISCS[i];
        const mins = Math.round(r.tracks.reduce((a, t) => a + t[2], 0) / 60);
        $r('.rec-card__title').textContent = r.title;
        $r('.rec-card__by').textContent = r.kind === 'playlist'
            ? (r.tracks.length ? `My playlist  ·  ${r.tracks.length} songs, shuffled` : 'My playlist  ·  plays on Spotify')
            : `${r.artist}  ·  ${r.year}  ·  ${r.tracks.length} songs, ${mins} min`;
        $r('.rec-card__link').hidden = true;                          // (Spotify lives in the player only)
        recCard.style.setProperty('--rec-bg', r.bg || '#333');
        $r('.rec-card__tracks').hidden = false;
        if (mode === 'player') {
            const st = ui.nowPlaying();
            $r('.rec-card__kicker').textContent = st.playing ? 'Now playing' : 'On the record player';
            go.textContent = '■ Lift the needle';
            toggle.hidden = false; toggle.textContent = st.playing ? '❚❚ Pause' : '▶ Play';
            fillTracks(i, st.trackId);
        } else {
            const on = onDeck === i;
            $r('.rec-card__kicker').textContent = on ? 'On the record player now' : r.kind === 'playlist' ? 'All-time favourites' : 'From the crate';
            go.textContent = on ? '▶ Playing: go to the player' : '▶ Put it on';
            toggle.hidden = true;
            fillTracks(i, on ? ui.nowPlaying().trackId : null);
            $r('.rec-card__tracks').hidden = r.kind === 'album';      // (a crate album: you're holding the sleeve; no list)
            const g = group(i);
            $r('.rec-card__count').textContent = `${g.indexOf(i) + 1} / ${g.length}`;
        }
    };
    ui.onChange(() => { if (recState.mode === 'album' || recState.mode === 'player') renderRec(); });
    // the camera: the wall, a sleeve (on the left of the screen, the card on the right), the player
    const isNarrow = () => innerWidth < 760;
    const wallView = () => {
        recState.mode = 'wall'; showRecCard(false);
        focusOn(recordWall, new THREE.Vector3(0, 0.08, 1), 1.02);
        setFocused({ obj: recordWall, pick: null });
    };
    const albumView = (i) => {
        recState.mode = 'album'; recState.at = i;
        if (DISCS[i].kind === 'playlist') {
            focusOn(recDiscs[i].sleeve, new THREE.Vector3(0, 0.05, 1), isNarrow() ? 1.5 : 1.3, isNarrow() ? 0 : 0.5);
            setFocused({ obj: recordWall, pick: null });
        } else {
            // an album: its sleeve comes out of the crate and turns to show you its cover
            lastAlbum = i;
            crateShow(i);
            renderRec(); showRecCard(true); sfx.blip();
            return;
        }
        renderRec(); showRecCard(true);
        sfx.blip();
    };
    // the record player up close: the record spinning, and the player in the corner (no card)
    const playerView = () => {
        recState.mode = 'player';
        showRecCard(false);
        focusOn(tt, new THREE.Vector3(0, 0.95, 0.75), isNarrow() ? 1.35 : 1.15, isNarrow() ? 0 : 0.25);
        setFocused({ obj: tt, pick: null });
        if (onDeck >= 0) ui.showPlayer();
        else say({ text: 'Nothing on yet. Pick a playlist off the wall, or an album from the crate under the player.' });
    };
    const onRecords = () => handheld.mode === 'focus' && focused?.obj === recordWall;
    for (const g of recordWall.children) {
        if (g.userData.rec == null) continue;
        click(g, null, () => {
            if (busy) return;
            if (!onRecords()) { wallView(); tourSay('records'); return; }   // (the wall's playlists)
            albumView(g.userData.rec);
        });
    }
    // the crate under the player: the first click goes up close, then a spine opens its card
    const onCrate = () => handheld.mode === 'focus' && focused?.obj === sleeves;
    const crateView = () => { recState.mode = null; showRecCard(false); focusOn(sleeves, new THREE.Vector3(0, 0.3, 1), isNarrow() ? 1.6 : 1.25); setFocused({ obj: sleeves, pick: null }); };
    for (const g of crateSleeves) click(g, null, () => {
        if (busy) return;
        if (!onCrate()) { crateView(); tourSay('crate'); return; }
        albumView(g.userData.rec);
    });
    Object.assign(records, {
        onDeck: () => onDeck,
        nowId: () => ui.nowPlaying().trackId,
        play: (i, k) => { pendingTrack = k; putOn(i); },
        track: (i, k) => ui.playRecord(i, k),
    });
    ui.onChange(() => shelfCard.refresh());
    click(tt, null, () => { if (!busy) playerView(); });

    // put it on: the old record goes back in its sleeve, the new one flies over
    let busy = false;
    const poseOf = (obj) => { world.attach(obj); return { pos: obj.position.clone(), quat: obj.quaternion.clone(), scale: obj.scale.x }; };
    const sleevePose = (i, out = 0) => {
        const { sleeve, home } = recDiscs[i];
        sleeve.updateWorldMatrix(true, false); world.updateWorldMatrix(true, false);
        const p = home.pos.clone().addScaledVector(recDiscs[i].out, out);
        const pos = world.worldToLocal(sleeve.localToWorld(p));
        const quat = world.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(sleeve.getWorldQuaternion(new THREE.Quaternion())).multiply(home.quat);
        return { pos, quat, scale: 1 };
    };
    const homePose = (i, out = 0) => sleevePose(i, out);
    const discOf = (i) => recDiscs[i].disc;
    const platterPose = (i) => ({ pos: record.position.clone(), quat: record.quaternion.clone(), scale: platterD / recDiscs[i].size });
    const setPose = (o, a, b, e, lift = 0) => {
        o.position.lerpVectors(a.pos, b.pos, e); o.position.y += Math.sin(e * Math.PI) * lift;
        o.quaternion.slerpQuaternions(a.quat, b.quat, e);
        o.scale.setScalar(a.scale + (b.scale - a.scale) * e);
    };
    const tweens = new Set();
    const tween = (ms, fn) => new Promise((res) => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) ms = 1; tweens.add({ t0: performance.now(), ms, fn, res }); });
    handheld.onFrame((t) => {
        for (const tw of tweens) {
            const k = Math.min(1, (performance.now() - tw.t0) / tw.ms);
            tw.fn(ease(k), k);
            if (k >= 1) { tweens.delete(tw); tw.res(); }
        }
    });
    // ---- the crate: click a spine and its sleeve slides out and turns its cover to you (held up
    // in front of the crate); Previous / Next puts it back and pulls out the next one
    const SHOW = { pos: new THREE.Vector3(0, 0.37, 0.6), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.06, -Math.PI / 2, 0, 'YXZ')), scale: 1 };
    const showSpot = new THREE.Mesh(new THREE.BoxGeometry(CR.lp * 1.1, CR.lp * 1.1, 0.05), new THREE.MeshBasicMaterial({ visible: false }));
    showSpot.position.copy(SHOW.pos).add(new THREE.Vector3(0, CR.lp / 2, 0)).add(sleeves.position); showSpot.userData.noPick = true;
    world.add(showSpot);                                        // (not in the crate's group: it'd stretch the crate's close-up)
    let shown = -1, crateBusy = false, crateWant = -1;
    const outOf = (h) => ({ pos: h.pos.clone().add(new THREE.Vector3(0, 0.015, CR.lp * 1.15)), quat: new THREE.Quaternion(), scale: 1 });
    const sleeveOut = async (i) => {
        const g = recDiscs[i].sleeve, h = g.userData.home, o = outOf(h);
        sfx.blip();
        await tween(320, (e) => setPose(g, h, o, e));                   // slides out of the crate
        await tween(560, (e) => setPose(g, o, SHOW, e, 0.06));          // up, and round to face you
        shown = i;
    };
    const sleeveBack = async () => {
        if (shown < 0) return;
        const i = shown, g = recDiscs[i].sleeve, h = g.userData.home, o = outOf(h);
        shown = -1;
        const now = { pos: g.position.clone(), quat: g.quaternion.clone(), scale: 1 };
        await tween(420, (e) => setPose(g, now, o, e, 0.04));           // down and round
        await tween(260, (e) => setPose(g, o, h, e));                   // back in its slot
    };
    const crateShow = async (i) => {
        crateWant = i;
        focusOn(showSpot, new THREE.Vector3(0, 0.12, 1), isNarrow() ? 1.7 : 1.45, isNarrow() ? 0 : 0.42);
        setFocused({ obj: sleeves, pick: null });
        if (crateBusy) return;
        crateBusy = true;
        while (crateWant >= 0 && crateWant !== shown) {
            const want = crateWant;
            await sleeveBack();
            await sleeveOut(want);
        }
        crateBusy = false;
    };
    crateRestore = () => { crateWant = -1; if (!crateBusy) sleeveBack(); };
    // ---- the shelves, the same way: a book, film or game slides out, comes up and turns its
    // cover to you, held in front of its row; Previous / Next swaps it for the next one
    const shelfSpot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), new THREE.MeshBasicMaterial({ visible: false }));
    shelfSpot.userData.noPick = true; world.add(shelfSpot);
    let shelfShown = null, shelfBusy = false, shelfWant = null;
    const SHELF_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.05, -Math.PI / 2, 0, 'YXZ'));   // its front (+x) to you
    const pullPoses = (obj) => {
        const ud = obj.userData;
        if (!ud.home) ud.home = { pos: obj.position.clone(), quat: obj.quaternion.clone(), scale: obj.scale.x };
        obj.updateWorldMatrix(true, true);
        const bw = new THREE.Box3().setFromObject(obj), cW = bw.getCenter(new THREE.Vector3());
        const cL = obj.worldToLocal(cW.clone()).multiplyScalar(obj.scale.x);             // its middle, from its origin
        const pb = new THREE.Box3().copy(bw).applyMatrix4(new THREE.Matrix4().copy(obj.parent.matrixWorld).invert());
        const depth = pb.max.z - pb.min.z, row = obj.parent;
        const rb = new THREE.Box3().setFromObject(row).applyMatrix4(new THREE.Matrix4().copy(row.parent.matrixWorld).invert());
        // where it's held: in front of the middle of the shelf, a little above its row
        const T = new THREE.Vector3((shelfBox.min.x + shelfBox.max.x) / 2, pb.min.y + 0.17, frontZ + 0.42);
        const out = { pos: ud.home.pos.clone().add(new THREE.Vector3(0, 0.008, depth * 1.08)), quat: ud.home.quat.clone(), scale: ud.home.scale };
        const show = { pos: T.clone().sub(cL.clone().applyQuaternion(SHELF_Q)), quat: SHELF_Q.clone(), scale: ud.home.scale };
        return { home: ud.home, out, show, T, rb };
    };
    const shelfOut = async (obj) => {
        const { home, out, show } = pullPoses(obj);
        sfx.blip();
        await tween(300, (e) => setPose(obj, home, out, e));                 // slides off the shelf
        await tween(560, (e) => setPose(obj, out, show, e, 0.05));           // up, and round to face you
        shelfShown = obj;
    };
    const shelfBack = async () => {
        if (!shelfShown) return;
        const obj = shelfShown; shelfShown = null;
        const { home, out } = pullPoses(obj);
        const now = { pos: obj.position.clone(), quat: obj.quaternion.clone(), scale: obj.scale.x };
        await tween(420, (e) => setPose(obj, now, out, e, 0.04));
        await tween(260, (e) => setPose(obj, out, home, e));                 // back in its place
    };
    const shelfShow = async (obj) => {
        const it = obj.userData.shelfItem, row = obj.parent;
        shelfWant = obj; shelfRow = row;
        recState.mode = 'shelf'; recState.shelf = { kind: it.kind, i: it.i, row };
        const { T } = pullPoses(obj);
        shelfSpot.position.copy(T);
        focusOn(shelfSpot, new THREE.Vector3(0, 0.1, 1), isNarrow() ? 1.9 : 1.5, isNarrow() ? 0 : 0.42);
        setFocused({ obj: row, pick: null });
        renderRec(); showRecCard(true);
        const item = shelfData(it.kind)[it.i];
        if (it.kind === 'notebook') say({ text: `${item.code}. One of my modules this year.` });
        else if (it.kind === 'textbook') say({ text: `${item.title}. One of my textbooks.` });
        else say({ text: item.note || (it.kind === 'film' ? `Number ${it.i + 1} on my all-time favourites list.` : it.kind === 'game' ? `${item.title}. ${item.line || 'One of mine on the PS4.'}` : item.status === 'read' ? (item.rating ? `I gave this one ${item.rating} out of 5.` : 'I’ve read this one.') : item.status === 'currently-reading' ? 'I’m reading this one right now.' : 'On my to-read list.') });
        if (shelfBusy) return;
        shelfBusy = true;
        try {
            while (shelfWant && shelfWant !== shelfShown) {
                const want = shelfWant;
                await shelfBack();
                await shelfOut(want);
            }
        } catch (err) { console.error('shelf pull', err); }
        shelfBusy = false;
    };
    shelfRestore = () => { shelfWant = null; if (!shelfBusy) shelfBack(); if (recState.mode === 'shelf') { recState.mode = null; showRecCard(false); } };
    const putBack = async (i) => {                            // the record on the platter back in its sleeve (or the crate)
        const d = recDiscs[i].disc;
        const a = poseOf(d), out = homePose(i, 1), home = homePose(i, 0);
        await tween(1000, (e) => setPose(d, a, out, e, 0.25));
        await tween(380, (e) => setPose(d, out, home, e));
        recDiscs[i].sleeve.attach(d);
        d.position.copy(recDiscs[i].home.pos); d.quaternion.copy(recDiscs[i].home.quat); d.scale.setScalar(1);
        if (recDiscs[i].crate) d.visible = false;                // back in its sleeve
    };
    const putOn = async (i) => {
        if (busy) return;
        if (onDeck === i) { playerView(); return; }
        busy = true;
        showRecCard(false);
        sfx.chirp(2);
        // step back so you can see the wall and the player
        focusOn(recCorner, new THREE.Vector3(0.15, 0.25, 1), 1.0);
        setFocused({ obj: recCorner, pick: null });
        recState.mode = 'flight';
        const prev = onDeck;
        ui.stopRecord();
        // whatever's on comes off: a record back to its sleeve, the plain red one just lifts away
        const off = prev >= 0 ? putBack(prev) : (async () => {
            const old = record.children.slice();
            const y0 = record.position.y;
            await tween(500, (e) => { for (const o of old) { o.position.y = e * 0.12; o.scale.setScalar(Math.max(0.001, 1 - e)); } });
            old.forEach((o) => record.remove(o)); record.position.y = y0;
        })();
        await new Promise((r) => setTimeout(r, prev >= 0 ? 500 : 250));
        const d = discOf(i);
        d.visible = true;
        const home = poseOf(d), out = homePose(i, 1);
        await tween(520, (e) => setPose(d, home, out, e));             // out of the sleeve
        if (shown === i) { crateWant = -1; sleeveBack(); }              // (a crate sleeve: back in the crate)
        const land = platterPose(i), above = { ...land, pos: land.pos.clone().add(new THREE.Vector3(0, 0.09, 0)) };
        await off;
        await tween(1150, (e) => setPose(d, out, above, e, 0.18));      // over to the player, turning flat
        await tween(380, (e) => setPose(d, above, land, e));            // down onto the platter
        record.attach(d); d.position.set(0, 0, 0); d.quaternion.identity();
        onDeck = i;
        sfx.blip();
        ui.playRecord(i, pendingTrack); pendingTrack = -1;
        busy = false;
        playerView();
        tourSay('needle');
    };
    tonearmTick = (dt) => {
        if (!tonearm) return;
        const st = ui.nowPlaying(), on = onDeck >= 0 && !busy, n = on ? Math.max(1, DISCS[onDeck].tracks.length) : 1;
        // where it should be: home (no record, or the needle's lifted), or over the groove for this song
        const k = st.track >= 0 ? st.track : 0;
        const want = on && !st.stopped && (st.playing || st.track >= 0 || ui.isPlaying()) ? swingFor(0.14 - 0.075 * Math.min(1, k / Math.max(1, n - 1))) : 0;
        const down = on && st.playing && Math.abs(ARM.swing - want) < 0.01;
        const tiltWant = down ? 0 : -0.07;                         // (lifted while it moves, or paused)
        const f = Math.min(1, dt * 0.006);
        ARM.tilt += (tiltWant - ARM.tilt) * f * 1.6;
        if (ARM.tilt < -0.05 || Math.abs(ARM.swing - want) < 0.01) ARM.swing += (want - ARM.swing) * f * (down ? 0.2 : 1);   // swings only once it's up
        tonearm.rotation.z = ARM.swing; tonearm.rotation.x = ARM.tilt;
    };
    // a game's full trophy list, in the card itself (under the counts, scrolling); the button toggles it
    const hideTrophyList = () => {
        recState.trophyList = -1;
        const box = $r('.rec-card__tlist'); box.hidden = true; box.innerHTML = '';
        recCard.classList.remove('is-trophies');
        if (recState.mode === 'shelf' && recState.shelf?.kind === 'game') $r('.rec-card__go').textContent = 'View trophy list';
    };
    const showTrophyList = (game, i) => {
        recState.trophyList = i;
        recCard.classList.add('is-trophies');
        $r('.rec-card__go').textContent = 'Back to summary';
        const box = $r('.rec-card__tlist');
        box.hidden = false; box.innerHTML = '<p class="tl-in__loading">Loading trophies…</p>';
        trophyListHTML(game).then((html) => { if (recState.trophyList === i) { box.innerHTML = html; box.scrollTop = 0; } })
            .catch(() => { if (recState.trophyList === i) box.innerHTML = '<p class="tl-in__loading">The trophy list couldn’t load just now.</p>'; });
    };
    $r('.rec-card__go').addEventListener('click', () => {
        if (recState.mode === 'shelf' && recState.shelf?.kind === 'game') {
            const i = recState.shelf.i;
            if (recState.trophyList === i) hideTrophyList(); else showTrophyList(GAMES[i], i);
            return;
        }
        if (recState.mode === 'album') putOn(recState.at);
        else if (recState.mode === 'player') {
            if (onDeck < 0) { albumView(lastAlbum); return; }
            ui.stopRecord(); renderRec();
        }
    });
    $r('.rec-card__toggle').addEventListener('click', () => { ui.toggleRecord(); });
    $r('.rec-card__tracks').addEventListener('click', (e) => {
        const b = e.target.closest('button[data-k]'); if (!b) return;
        const k = Number(b.dataset.k);
        if (recState.mode === 'player') ui.playRecord(onDeck, k);
        else if (recState.mode === 'album' && onDeck === recState.at) ui.playRecord(onDeck, k);
        else if (recState.mode === 'album') { pendingTrack = k; putOn(recState.at); }
    });
    let pendingTrack = -1;
    const recStep = (dir) => {
        if (busy) return;
        if (recState.mode === 'shelf') {
            const kids = [...recState.shelf.row.children].sort((a, b) => a.userData.shelfItem.i - b.userData.shelfItem.i), n = kids.length;
            shelfShow(kids[(recState.shelf.i + dir + n) % n]);
            return;
        }
        if (recState.mode !== 'album') return;
        const g = group(recState.at); albumView(g[(g.indexOf(recState.at) + dir + g.length) % g.length]);
    };
    $r('.rec-card__prev').addEventListener('click', () => recStep(-1));
    $r('.rec-card__next').addEventListener('click', () => recStep(1));
    addEventListener('keydown', (e) => {
        if (recCard.hidden || (recState.mode !== 'album' && recState.mode !== 'shelf') || handheld.mode !== 'focus') return;
        if (e.key === 'ArrowLeft') recStep(-1); else if (e.key === 'ArrowRight') recStep(1); else return;
        e.preventDefault(); e.stopImmediatePropagation();
    }, { capture: true });
    // back (the arrow / Esc): out of a sleeve to the wall; out of the crate or the player to the room
    recHide = () => { if (recState.mode && recState.mode !== 'flight') { recState.mode = null; showRecCard(false); } };
    const recBack = () => {
        if (busy) return true;
        if (recState.mode === 'shelf') {                                      // the thing back on the shelf; the row up close
            const row = recState.shelf.row;
            recState.mode = null; showRecCard(false);
            shelfWant = null; shelfBack();
            focusOn(row, FRONT); setFocused({ obj: row, pick: null });
            return true;
        }
        if (recState.mode === 'album' && DISCS[recState.at].kind === 'playlist') { wallView(); return true; }   // a record: back to the wall
        if (recState.mode === 'album') { crateWant = -1; sleeveBack(); crateView(); return true; }         // a sleeve: back in the crate
        if (recState.mode) { recState.mode = null; showRecCard(false); }
        return false;
    };

    [[ps3, 'ps3'], [ds3, 'ds3'], [keyboard, 'keyboard'], [mouse, 'mouse'], [lapGroup, 'laptop'], [boards, 'boards'], [shelfStuff.console, 'ps2'], [ball, 'ball']]
        .forEach(([o, id]) => o && TOUR.set(o, id));
    if (ball) click(ball, 'Jabulani', look(ball, new THREE.Vector3(0, 0.6, 1), () => pickUp(ball)));
    // the PSP (viewer.js handles its clicks; main.js asks here first): close-up, then pick it up
    const pspBox = new THREE.Mesh(new THREE.BoxGeometry(pspM.x, pspM.y, pspM.z), new THREE.MeshBasicMaterial({ visible: false }));
    pspBox.position.copy(pspSpot); pspBox.userData.noPick = true; world.add(pspBox);
    let pickPsp = () => {};
    handheld.onFrame(() => { if (handheld.mode !== 'focus' && focused) setFocused(null); showLogo(); });
    const clickPsp = () => {
        if (focused?.obj === pspBox && handheld.mode === 'focus') { setFocused(null); onFocus(false); return false; }   // second click: main.js picks it up
        focusOn(pspBox, new THREE.Vector3(0, 0.35, 1), 1.6);
        tourSay('psp');
        setFocused({ obj: pspBox, pick: () => { setFocused(null); onFocus(false); pickPsp(); } });
        return true;
    };
    const LABELS = { bowen: 'Jarrod Bowen #20', cyclops: 'Cyclops', jozi: 'Midrand water tower', eightball: 'Stüssy 8 ball', sobukwe: 'Robert Sobukwe, by Sindiso Nyoni', spiderman: 'Spider-Man', mandela: 'Nelson Mandela', authenticity: 'Authenticity is magnetic', kalam: 'Dr A. P. J. Abdul Kalam', indentured: 'Indentured labourers arriving', biko: 'Steve Biko', goku: 'Goku', sisyphus: 'Sisyphus', twelfth: '12th Fail', stillhere: 'Still here despite it all', jordan: 'Michael Jordan' };
    for (const [id, mesh] of Object.entries(posters)) {
        const n = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.getWorldQuaternion(new THREE.Quaternion()))
            .transformDirection(new THREE.Matrix4().copy(world.matrixWorld).invert());
        click(mesh, LABELS[id] || null, look(mesh, n));
        if (GUIDE.lines[id]) TOUR.set(mesh, id);
    }
    handheld.setPspLabel(null);
    // the cards' pictures: fetched quietly once the room's settled, so they open straight away
    setTimeout(() => {
        const urls = [...BOOKS.map((b) => b.cover), ...FILMS.map((f) => f.poster), ...FILMS.map((f) => f.backdrop), ...Object.values(ROOM.bios || {}).map((b) => b.cover)].filter(Boolean);
        let i = 0;
        const next = () => { if (i >= urls.length) return; const im = new Image(); im.referrerPolicy = 'no-referrer'; im.onload = im.onerror = next; im.src = urls[i++]; };
        for (let k = 0; k < 4; k++) next();                       // four at a time
    }, 2500);

    // ---- the XMB's two homes -------------------------------------------------------------------
    // the monitor's screen, for viewer.useScreen(): where it is (centre, facing
    // +z, 1 unit = 1 px), the page's size on it, and swapping in the hole
    const PX = 1600, PY = Math.round(PX * SCREEN.h / SCREEN.w);
    const pxScale = SCREEN.w / PX;                           // metres per px
    const local = new THREE.Matrix4().compose(SCREEN.centre, new THREE.Quaternion(), new THREE.Vector3(pxScale, pxScale, pxScale));
    const out = new THREE.Matrix4();
    const monitorScreen = {
        worldMatrix: () => { world.updateMatrixWorld(); return out.multiplyMatrices(world.matrixWorld, local); },
        holderW: PX, holderH: PY,
        el: { left: 0, top: 0, width: PX, height: PY },
        activate: (on) => { monitorPanel.material = on ? monitorHole : monitorStandby; },
    };

    // while you hold the PSP, the room behind it dims (a veil 40 cm behind it)
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(900, 600), new THREE.MeshBasicMaterial({ color: 0x050308, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    veil.position.set(0, 0, -40);
    veil.userData.noPick = true;
    veil.renderOrder = 1;
    scene.add(veil);

    // ---- day and night: the real sky over Johannesburg (South African time), not a setting.
    // The walls stay black whatever the time; what changes is the light coming in from outside
    // (the sun through the skylights by day, golden at either end, a cool moonlight at night),
    // the sky in the windows, and the lamps and screens inside (bright at night, low by day).
    // ?time=HH:MM (SAST) previews another time of day.
    const D2R = Math.PI / 180;
    const sunOverJoburg = (date) => {                           // NOAA's approximation, good to a degree or so
        const lat = -26.2 * D2R, lon = 28.04;
        const n = date.getTime() / 86400000 + 2440587.5 - 2451545.0;
        const L = 280.46 + 0.9856474 * n, g = (357.528 + 0.9856003 * n) * D2R;
        const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R, eps = (23.439 - 0.0000004 * n) * D2R;
        const dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
        const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
        const ha = (gmst * 15 + lon) * D2R - ra;
        const el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha));
        const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));   // from the south, west +
        return { el, az };
    };
    const previewAt = (() => {
        const m = /^(\d{1,2}):(\d{2})$/.exec(new URLSearchParams(location.search).get('time') || '');
        if (!m) return null;
        const d = new Date(); d.setUTCHours(+m[1] - 2, +m[2], 0, 0);   // SAST is UTC+2, all year
        return d;
    })();
    const smooth = (a, b, x) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const C = (h) => new THREE.Color(h);
    const SKY = { night: C(0x070a16), dusk: C(0xd9784e), day: C(0x93bde6) };
    const SUN = { low: C(0xffa25a), high: C(0xfff1dc) };
    const moon = new THREE.DirectionalLight(0x9fb2ff, 0);       // night: moonlight through the same windows
    moon.position.set(-2.8, 4.2, 3.0); moon.target.position.set(2.4, 0, 1.4);
    world.add(moon, moon.target);
    const lampShade = recolour['Material.015'];
    // the walls, trim and floor: always the same colours day and night
    roomMats.walls.color.setHex(WALLC); roomMats.trim.color.setHex(0x131316);
    { roomMats.trim.map = oak.map; roomMats.trim.color.setHex(0xe0b070); roomMats.trim.roughness = 0.55; roomMats.trim.needsUpdate = true; }
    if (roomMats.floor) roomMats.floor.color.setHex(0xc7a383);                // (the oak, warmed: it read almost white)
    const sky = { day: -1, dusk: 0, el: 0, az: 0 };
    const lightFor = (date) => {
        const { el, az } = sunOverJoburg(date);
        return { el, az, day: smooth(-6 * D2R, 8 * D2R, el), dusk: Math.max(0, 1 - Math.abs(el - 1 * D2R) / (9 * D2R)) };
    };
    const tmpA = new THREE.Color();
    const applySky = (L, k) => {
        for (const key of ['day', 'dusk', 'el', 'az']) sky[key] = sky[key] < -0.5 && key === 'day' ? L[key] : sky[key] + (L[key] - sky[key]) * k;
        const d = sky.day, n = 1 - d, dusk = sky.dusk;
        hemi.color.setHex(0xc9c2ff).lerp(tmpA.setHex(0xe4ecff), d);
        hemi.intensity = 0.8 + 0.75 * d;
        sun.intensity = 3.4 * d * (0.55 + 0.45 * Math.min(1, Math.max(0, sky.el) / (25 * D2R)));
        sun.color.copy(SUN.high).lerp(SUN.low, Math.min(1, dusk * 1.4));
        // the sun swings across the windows on the left: higher at noon, round to the side as it sets
        sun.position.set(-2.6, 0.8 + 4.4 * Math.sin(Math.max(0.05, sky.el)), 2.2 + 2.4 * Math.sin(sky.az));
        moon.intensity = SEALED ? 0 : 0.45 * n;
        if (SEALED) sun.intensity = 0;
        ceiling.intensity = 0.45 - 0.15 * d; screenGlow.intensity = 0.9 - 0.5 * d; deskLight.intensity = 3.2 - 1.6 * d;
        neonGlow.intensity = 0.9 - 0.7 * d; lampGlow.intensity = 0.8 * n;
        if (neon) neon.material.opacity = 1 - 0.45 * d;
        lampShade.emissiveIntensity = 0.2 + 1.0 * n;
        if (lavaGlow) lavaGlow.emissiveIntensity = 0.25 + 0.9 * n;
        skyMat.color.copy(SKY.night).lerp(SKY.day, d).lerp(SKY.dusk, Math.min(0.85, dusk));
        if (sunDisc) {
            sunDisc.material.color.copy(SUN.high).lerp(SUN.low, Math.min(1, dusk * 1.2));
            sunDisc.visible = !SEALED && sky.el > -2 * D2R;
            moonDisc.visible = !SEALED && sky.el < -4 * D2R;
            const up = (e) => THREE.MathUtils.clamp(e / (60 * D2R), 0, 1);
            // (the two dormer windows are either side of z 1.95: keep each one in a pane)
            const pane = (sgn, a) => 1.95 + (sgn >= 0 ? 0.8 : -0.8) + 0.12 * Math.sin(a);
            sunDisc.position.set(-0.3, 0.98 + 0.65 * up(sky.el), pane(Math.sin(sky.az), sky.az));
            moonDisc.position.set(-0.3, 1.5, pane(-Math.sin(sky.az), -sky.az));
        }
    };
    // what you see through the skylights and the windows: a plain sky, day or night
    // (brighter towards the horizon)
    const skyGrad = canvasTex(4, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9a9a9a'); g.addColorStop(0.7, '#e6e6e6'); g.addColorStop(1, '#ffffff'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    const skyMat = new THREE.MeshBasicMaterial({ map: skyGrad, color: 0x070a16, side: THREE.DoubleSide, toneMapped: false });
    const skyKnee = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.4), skyMat);
    skyKnee.position.set(-0.35, 1.0, 1.95); skyKnee.rotation.y = Math.PI / 2;
    // the roof slopes up from (x -0.16, y 1.98) to (x 1.14, y 3.77): a plane just outside it
    const skyRoof = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.0), skyMat);
    {
        const up = new THREE.Vector3(1.3, 1.79, 0).normalize(), along = new THREE.Vector3(0, 0, 1), out = new THREE.Vector3().crossVectors(along, up);
        skyRoof.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(along, up, out));
        skyRoof.position.set(0.49, 2.875, 1.95).addScaledVector(out, 0.35);
    }
    skyKnee.userData.noPick = skyRoof.userData.noPick = true;
    world.add(skyKnee, skyRoof);
    // glass: a clear pane just inside the sky, so the windows have something in them (a faint
    // sheen and the room's reflection, a little smudge)
    const smudge = canvasTex(256, 256, (c, w, h) => {
        c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
        for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.05})`; c.beginPath(); c.ellipse(Math.random() * w, Math.random() * h, 2 + Math.random() * 14, 1 + Math.random() * 5, Math.random() * 3, 0, Math.PI * 2); c.fill(); }
    });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xd8e6ef, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.14, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.6, depthWrite: false, roughnessMap: smudge, side: THREE.DoubleSide });
    for (const sky of [skyKnee, skyRoof]) {
        const pane = new THREE.Mesh(sky.geometry, glassMat);
        pane.quaternion.copy(sky.quaternion); pane.position.copy(sky.position);
        pane.position.add(new THREE.Vector3(0, 0, 1).applyQuaternion(sky.quaternion).multiplyScalar(0.1));    // towards the room (still outside the wall)
        pane.userData.noPick = true; pane.renderOrder = 2; pane.userData.glass = true;
        world.add(pane);
    }
    // the sun (or the moon) in the window: a soft glowing disc just inside the sky
    const discTex = canvasTex(128, 128, (c, w, h) => {
        const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        g.addColorStop(0, '#fff'); g.addColorStop(0.42, '#fff'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    const disc = (r, color) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(r, r), new THREE.MeshBasicMaterial({ map: discTex, color, transparent: true, depthWrite: false, toneMapped: false }));
        m.rotation.y = Math.PI / 2; m.userData.noPick = true; m.visible = false; world.add(m); return m;
    };
    const sunDisc = disc(0.55, 0xfff1dc), moonDisc = disc(0.3, 0xdfe6ff);
    // the sun and the moon themselves (models), in front of their glow
    const body = (model, d, glowing) => {
        if (!model) return null;
        const b = new THREE.Box3().setFromObject(model), sz = b.getSize(new THREE.Vector3());
        model.scale.multiplyScalar(d / Math.max(sz.x, sz.y, sz.z));
        model.traverse((o) => {
            if (!o.isMesh) return;
            const m = o.material;
            o.material = glowing ? new THREE.MeshBasicMaterial({ map: m.map || m.emissiveMap || null, color: 0xffffff, toneMapped: false })
                : new THREE.MeshBasicMaterial({ map: m.map || null, color: 0xd8dde8, toneMapped: false });
            o.userData.noPick = true;
        });
        const g = new THREE.Group(); g.add(model);
        const c = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()); model.position.sub(c);
        return g;
    };
    const sunBody = body(assets.sun, 0.2, true), moonBody = body(assets.moon, 0.15, false);
    // ---- the windows are sealed: the openings walled over (flush with the wall and the roof
    // slope, in the wall's black), no frames, no sky, glass, sun or moon, and no light from
    // outside. The lamps and screens still follow the time of day.
    const STRAIGHT = true, straightExtras = [];       // the left wall runs straight up (no slope)
    const SEALED = true;
    if (SEALED) {
        bedroom.traverse((o) => { if (o.isMesh && /^Cube\d*_marco/.test(o.name)) o.visible = false; });
        skyKnee.visible = skyRoof.visible = false;
        world.traverse((o) => { if (o.userData.glass) o.visible = false; });
        const panel = (w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paintMat(w, h)); m.receiveShadow = true; world.add(m); return m; };
        // the left wall, floor to top, as one clean painted panel (the model's own left wall and its
        // window openings are hidden): wooden window frames with a sill around each blind, and a skirting
        {
            const H = 3.9, LX = -0.168;
            const lw = new THREE.Mesh(new THREE.PlaneGeometry(R.d + 0.04, H), paintMat(R.d + 0.04, H));
            lw.rotation.y = Math.PI / 2; lw.position.set(LX, H / 2, R.d / 2); lw.receiveShadow = true; lw.userData.noPick = true; world.add(lw);
            const wood = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), roomMats.trim); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = false; m.userData.noPick = true; world.add(m); return m; };
            world.updateMatrixWorld(true);
            for (const hd of windowBlinds) {
                const bb = new THREE.Box3().setFromObject(hd), lo = world.worldToLocal(bb.min.clone()), hi = world.worldToLocal(bb.max.clone());
                const y0 = Math.min(lo.y, hi.y), y1 = Math.max(lo.y, hi.y), z0 = Math.min(lo.z, hi.z), z1 = Math.max(lo.z, hi.z), t = 0.06, dp = 0.06, x = LX + dp / 2;
                wood(dp, t, z1 - z0 + 2 * t, x, y1 + t / 2, (z0 + z1) / 2);                 // head
                wood(dp, t, z1 - z0 + 2 * t, x, y0 - t / 2, (z0 + z1) / 2);                 // bottom rail
                wood(dp, y1 - y0, t, x, (y0 + y1) / 2, z0 - t / 2);                          // jambs
                wood(dp, y1 - y0, t, x, (y0 + y1) / 2, z1 + t / 2);
                wood(0.14, 0.03, z1 - z0 + 2 * t + 0.1, LX + 0.07, y0 - t - 0.015, (z0 + z1) / 2);   // the sill, proud of the frame
            }
        }
        // close the back wall's two ends: a narrow painted patch behind each corner, so no dark seam shows
        for (const [x0, x1] of [[-0.17, 0.25], [4.3, 4.567]]) {
            const cp = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 3.9), paintMat(x1 - x0, 3.9, THREE.DoubleSide));
            cp.position.set((x0 + x1) / 2, 1.95, 0.0015); cp.receiveShadow = true; cp.userData.noPick = true; world.add(cp);
        }
        // a wooden skirting right round the room (the back one is the model's own)
        {
            const SH = 0.11, ST = 0.024;
            const sk = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, SH, d), roomMats.trim); m.position.set(x, SH / 2, z); m.receiveShadow = true; m.userData.noPick = true; world.add(m); };
            sk(ST, R.d, -0.168 + ST / 2, R.d / 2);                 // left
            sk(ST, R.d, 4.567 - ST / 2, R.d / 2);                  // right
            { const m = new THREE.Mesh(new THREE.BoxGeometry(4.567 + 0.168 - 2 * ST, SH, ST), roomMats.trim); m.position.set((4.567 - 0.168) / 2, SH / 2, ST / 2); m.receiveShadow = true; m.userData.noPick = true; world.add(m); }   // back, between the two
        }
        // above the low windows: the roof slope as ONE clean panel (no skylight openings or
        // reveals). The slope's own faces come out of the room's mesh...
        {
            const S = new THREE.Vector3(1.79, -1.3, 0).normalize();          // the slope's normal (into the room)
            const slopeX = (y) => -0.16 + (y - 1.98) * (1.3 / 1.79);
            world.updateMatrixWorld(true);
            const inv = new THREE.Matrix4().copy(world.matrixWorld).invert();
            const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
            bedroom.traverse((o) => {
                if (!o.isMesh || !/^cuarto/.test(o.name)) return;
                const g = o.geometry, pos = g.attributes.position;
                const M = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
                const idx = g.index ? g.index.array : null, tri = idx ? idx.length / 3 : pos.count / 3;
                const keep = [];
                let cut = 0;
                for (let t = 0; t < tri; t++) {
                    const i0 = idx ? idx[3 * t] : 3 * t, i1 = idx ? idx[3 * t + 1] : 3 * t + 1, i2 = idx ? idx[3 * t + 2] : 3 * t + 2;
                    a.fromBufferAttribute(pos, i0).applyMatrix4(M); b.fromBufferAttribute(pos, i1).applyMatrix4(M); c.fromBufferAttribute(pos, i2).applyMatrix4(M);
                    n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)).normalize();
                    const cy = (a.y + b.y + c.y) / 3, cx = (a.x + b.x + c.x) / 3;
                    const cz = (a.z + b.z + c.z) / 3;
                    const gableEnd = !STRAIGHT && Math.abs(n.z) > 0.9 && (cz < 0.06 || cz > R.d - 0.06);      // (the end walls stay)
                    const onSlope = cy > 1.97 && cx < slopeX(cy) + 0.35 && !gableEnd;              // the slope and the skylights' reveals
                    if (onSlope) { cut++; continue; }
                    keep.push(i0, i1, i2);
                }
                if (cut) { g.setIndex(keep); g.computeBoundingSphere(); }
            });
        }
        // ...and one flat panel in their place, at the roof's angle, from the knee wall up
        // (just inside where the roof's own surface was)
        if (STRAIGHT) {
            const TOP = 3.9;
            // the triangle the slope used to cut off, filled on the back and front gables
            const sh = new THREE.Shape(); sh.moveTo(-0.16, 1.9); sh.lineTo(0.6, 1.9); sh.lineTo(1.6, TOP); sh.lineTo(-0.16, TOP); sh.closePath();
            for (const [z, k] of [[-0.01, 'back'], [R.d + 0.01, 'front']]) {
                const t = new THREE.Mesh(new THREE.ShapeGeometry(sh), paintMat(2, 2, THREE.DoubleSide)); t.position.z = z; t.receiveShadow = true; t.userData.noPick = true; world.add(t); straightExtras.push({ mesh: t, k });
            }
        } else
        {
            const a = new THREE.Vector2(-0.16, 1.98), b = new THREE.Vector2(1.14, 3.77), len = a.distanceTo(b) + 0.5;
            const roofMat = paintMat(R.d, a.distanceTo(b) + 0.5, THREE.FrontSide);   // seen from inside only: from above it's open
            const r = new THREE.Mesh(new THREE.PlaneGeometry(R.d, len), roofMat);
            const up = new THREE.Vector3(b.x - a.x, b.y - a.y, 0).normalize(), along = new THREE.Vector3(0, 0, 1);
            const out = new THREE.Vector3().crossVectors(along, up);
            r.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(along.clone().negate(), up, out.clone().negate()));
            r.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, R.d / 2).addScaledVector(out, -0.122).addScaledVector(up, -0.18);
            r.receiveShadow = true; r.userData.noPick = true;
            world.add(r);
        }
    }
    // ---- the cutaway: from above and outside, the near walls open up. The room's one wall mesh is split
    // into its left wall, its near (open-side) gable and its back wall; each hides while the camera is
    // beyond it, so a high camera looks straight into the room, like a dolls'-house cutaway.
    {
        const shells = [];
        const capMat = new THREE.MeshStandardMaterial({ color: roomMats.walls.color, emissive: roomMats.walls.color, emissiveIntensity: 0.55, roughness: 1 });
        world.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(world.matrixWorld).invert();
        const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
        bedroom.traverse((o) => {
            if (!o.isMesh || !/^cuarto_Material01[46]_0$/.test(o.name) || !o.geometry.index) return;      // (the walls, and the trim along their edges)
            const g = o.geometry, pos = g.attributes.position, idx = g.index.array;
            const M = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
            // the room's walls came without texture coordinates: paint them by where they stand, a tile per
            // 1.5 m, projected along each face's dominant axis, so the grain runs on across the panels and corners
            if (!g.attributes.uv && g.attributes.normal) {
                const nrm = g.attributes.normal, uv = new Float32Array(pos.count * 2), N3 = new THREE.Matrix3().getNormalMatrix(M), pv = new THREE.Vector3(), nv = new THREE.Vector3();
                for (let i = 0; i < pos.count; i++) {
                    pv.fromBufferAttribute(pos, i).applyMatrix4(M); nv.fromBufferAttribute(nrm, i).applyMatrix3(N3);
                    const ax = Math.abs(nv.x), ay = Math.abs(nv.y), az = Math.abs(nv.z);
                    if (ax >= ay && ax >= az) { uv[2 * i] = pv.z / 1.5; uv[2 * i + 1] = pv.y / 1.5; }
                    else if (ay >= az) { uv[2 * i] = pv.x / 1.5; uv[2 * i + 1] = pv.z / 1.5; }
                    else { uv[2 * i] = pv.x / 1.5; uv[2 * i + 1] = pv.y / 1.5; }
                }
                g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
            }
            const groups = { left: [], front: [], back: [] }, rest = [];
            for (let t = 0; t < idx.length; t += 3) {
                a.fromBufferAttribute(pos, idx[t]).applyMatrix4(M); b.fromBufferAttribute(pos, idx[t + 1]).applyMatrix4(M); c.fromBufferAttribute(pos, idx[t + 2]).applyMatrix4(M);
                n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)).normalize();
                const cx = (a.x + b.x + c.x) / 3, cz = (a.z + b.z + c.z) / 3;
                const k = cz > R.d - 0.12 ? 'front' : cz < 0.12 ? 'back' : cx < 0.2 ? 'left' : null;      // (by where it sits, so a wall's edges go with it)
                (k ? groups[k] : rest).push(idx[t], idx[t + 1], idx[t + 2]);
            }
            // the end faces of the back and front walls (their thickness, seen edge-on from the cutaway) get their own
            // softly self-lit paint, so they never read as black lines at the corners
            for (const k of ['back', 'front']) {
                const caps = [], keep = [];
                for (let t = 0; t < groups[k].length; t += 3) {
                    const i0 = groups[k][t], i1 = groups[k][t + 1], i2 = groups[k][t + 2];
                    a.fromBufferAttribute(pos, i0).applyMatrix4(M); b.fromBufferAttribute(pos, i1).applyMatrix4(M); c.fromBufferAttribute(pos, i2).applyMatrix4(M);
                    n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a)).normalize();
                    (o.name === 'cuarto_Material014_0' && Math.abs(n.x) > 0.9 ? caps : keep).push(i0, i1, i2);
                }
                groups[k] = keep; groups[k + 'Caps'] = caps;
            }
            delete groups.left;                                        // the left wall is rebuilt as a clean panel
            if (o.name === 'cuarto_Material016_0') delete groups.back;      // (the back skirting is rebuilt below to match the others)
            for (const [k, list] of Object.entries(groups)) {
                if (!list.length) continue;
                const ng = new THREE.BufferGeometry();
                for (const name of Object.keys(g.attributes)) ng.setAttribute(name, g.attributes[name]);
                ng.setIndex(list);
                const m = new THREE.Mesh(ng, /Caps$/.test(k) ? capMat : o.material);
                m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale);
                m.receiveShadow = o.receiveShadow; m.castShadow = o.castShadow;
                m.name = o.name + '_' + k;
                o.parent.add(m);
                shells.push({ mesh: m, k: k.replace('Caps', '') });
            }
            g.setIndex(rest);
        });
        shells.push(...straightExtras);
        const cam = new THREE.Vector3();
        handheld.onFrame(() => {
            if (!shells.length) return;
            cam.copy(handheld.camera.position); world.worldToLocal(cam);
            for (const { mesh, k } of shells) mesh.visible = k === 'left' ? cam.x > -0.1 : k === 'front' ? cam.z < R.d + 0.1 : cam.z > -0.1;
        });
    }
    if (sunBody) { sunDisc.add(sunBody); sunBody.position.z = 0.02; }
    if (moonBody) { moonDisc.add(moonBody); moonBody.position.z = 0.02; }
    sunDisc.scale.setScalar(1); moonDisc.material.opacity = 0.55;
    // check the sky every half minute; blend into it
    let skyTarget = lightFor(previewAt || new Date());
    applySky(skyTarget, 1);
    setInterval(() => { skyTarget = lightFor(previewAt || new Date()); }, 30000);
    handheld.onFrame((t, dt) => applySky(skyTarget, Math.min(1, dt * 0.002)));

    // ---- his speech bubble follows him on screen (or docks in the corner when he's out of view)
    const headPt = new THREE.Vector3(), ndc = new THREE.Vector3();
    const bubbleTick = () => {
        if (!guide.showing) return;
        headPt.set(buddy.position.x, DESK.top + BUDDY_H + 0.03, buddy.position.z);
        world.localToWorld(headPt);
        ndc.copy(headPt).project(handheld.camera);
        const r = handheld.renderer.domElement.getBoundingClientRect();
        const inView = (handheld.mode === 'room' || handheld.mode === 'focus') && ndc.z < 1 && Math.abs(ndc.x) < 0.96 && ndc.y < 0.9 && ndc.y > -0.96;
        guide.place(inView ? { x: r.left + (ndc.x + 1) / 2 * r.width, y: r.top + (1 - ndc.y) / 2 * r.height } : null);
    };

    // ---- animation ------------------------------------------------------------------------------
    let pick = null;            // the room moving while you pick the PSP up / put it down
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    handheld.onFrame((t, dt) => {
        guide.tick(t);
        walkTick(t, dt);
        bubbleTick();
        guideGlow.intensity = guide.glow * 0.6;
        // his eyes brighten and flicker while he talks
        const eye = guide.talking ? 1.4 + Math.sin(t * 0.03) * 0.4 : ui.isPlaying() ? 1.1 + Math.abs(Math.sin(t * 0.00314)) * 0.9 : 0.9;
        if (!react.kind) for (const m of robotEyes) m.emissiveIntensity += (eye - m.emissiveIntensity) * Math.min(1, dt * 0.01);
        mixer.update(dt / 1000);
        if (ui.isPlaying() && record.children.length) record.rotation.y -= dt * 0.0035;   // 33⅓ rpm
        tonearmTick(dt);
        const veilWant = handheld.mode === 'immersive' ? 0.62 : 0;
        veil.material.opacity += (veilWant - veil.material.opacity) * Math.min(1, dt * 0.005);
        veil.visible = veil.material.opacity > 0.01;
        if (pick) {
            const k = Math.min(1, (t - pick.t0) / pick.ms), e = ease(k);
            anchor.position.lerpVectors(pick.from, pick.to, e);
            if (k >= 1) { const d = pick.done; pick = null; d(); }
        }
    });
    const moveRoom = (to, ms) => new Promise((done) => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) ms = 1;
        pick = { from: anchor.position.clone(), to: to.clone(), t0: performance.now(), ms, done };
    });

    // ---- camera framings --------------------------------------------------------------------------
    // the room: from above the open corner, looking down into the corner with the desk (the near walls open up: see 'the cutaway')
    const roomTarget = new THREE.Vector3(2.85, 1.5, 1.1);
    const roomDir = new THREE.Vector3(-0.5, 0.6, 0.75).normalize();
    const fit = (far) => {
        const fovT = Math.tan(THREE.MathUtils.degToRad(handheld.camera.fov) / 2);
        return Math.max(1.6 / fovT, 2.15 / (fovT * handheld.camera.aspect)) * (far ? 1.35 : 1);
    };
    const roomView = (far = false) => () => {
        const d = fit(far);
        const pos = roomTarget.clone().addScaledVector(roomDir, d);
        if (far) pos.y += 0.8;
        const az = Math.atan2(roomDir.x, roomDir.z);
        // the turn is locked at the left wall: the camera can't go round behind it (it stays on the room's side, x >= 0)
        const rh = d * Math.cos(Math.asin(roomDir.y));
        const leftStop = Math.asin(Math.max(-1, Math.min(1, (0.1 - roomTarget.x) / rh)));
        const minAz = Math.min(az, Math.max(az - 0.6, leftStop));
        return {
            pos: toScene(pos), target: toScene(roomTarget),
            limits: { minDistance: d * K * 0.22, maxDistance: d * K * 1.2, minAzimuth: minAz, maxAzimuth: az + 0.55, minPolar: 0.7, maxPolar: 1.62, near: 2, far: 4000 },
        };
    };
    // the desk: sitting in front of the monitor
    const deskView = () => {
        const fovT = Math.tan(THREE.MathUtils.degToRad(handheld.camera.fov) / 2);
        const fill = handheld.camera.aspect < 1 ? 0.96 : 0.86;
        const d = Math.max((SCREEN.h / 2 / fill) / fovT + 0.06, (SCREEN.w / 2 / fill) / (fovT * handheld.camera.aspect));
        const target = SCREEN.centre.clone();
        const pos = target.clone().add(new THREE.Vector3(0, 0.02, d));
        return {
            pos: toScene(pos), target: toScene(target),
            limits: { minDistance: d * K * 0.6, maxDistance: d * K * 1.8, minAzimuth: -0.6, maxAzimuth: 0.6, minPolar: 1.2, maxPolar: 1.9, near: 2, far: 4000 },
        };
    };
    handheld.addView('room', roomView(false));
    handheld.addView('roomFar', roomView(true));

    // a close-up: walk up to a poster, the decks or the laptop and look straight at it,
    // close enough that it fills most of the screen. Esc / "step back" (main.js) goes back.
    let focusTarget = null, focusPos = null, onFocus = () => {};
    handheld.addView('focus', () => {
        const c = focusTarget || boxOf(shelf).getCenter(new THREE.Vector3());
        const pos = focusPos || c.clone().add(new THREE.Vector3(0, 0.06, 0.62));
        const d = pos.distanceTo(c) * K;
        return {
            pos: toScene(pos), target: toScene(c),
            limits: { minDistance: d * 0.45, maxDistance: d * 1.6, minAzimuth: -Math.PI, maxAzimuth: Math.PI, minPolar: 0.6, maxPolar: 2.2, near: 1, far: 4000 },
        };
    });
    // shift: move the thing left on screen by that much of half the screen (a card goes on the right)
    const focusOn = (obj, normal = new THREE.Vector3(0, 0, 1), room = 1, shift = 0) => {
        const b = boxOf(obj), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3());
        const fovT = Math.tan(THREE.MathUtils.degToRad(handheld.camera.fov) / 2);
        const n = normal.clone().normalize();
        // its size across the view: the box's extent, ignoring its depth along the normal
        const across = Math.max(sz.x * (1 - Math.abs(n.x)), sz.z * (1 - Math.abs(n.z)), 0.05);
        const d = (Math.max((sz.y / 2) / (fovT * 0.82), (across / 2) / (fovT * handheld.camera.aspect * 0.82)) + 0.05) * room;
        focusTarget = c;
        if (shift) {
            const right = new THREE.Vector3(n.z, 0, -n.x).normalize();
            focusTarget = c.clone().addScaledVector(right, d * fovT * handheld.camera.aspect * shift);
        }
        focusPos = focusTarget.clone().addScaledVector(n, d);
        guide.hush();
        handheld.setMode('focus', 1200);
        onFocus(true);
    };
    // back: the arrow (main.js) and Esc. The innermost thing first: a card, the thing
    // you're holding, a sleeve, then the close-up
    const back = () => {
        if (shelfCard.open_) { shelfCard.close(); return true; }
        if (inspector.open) { inspector.close(); return true; }
        if (recBack()) return true;
        return unfocus();
    };
    const unfocus = () => {
        if (handheld.mode !== 'focus') return false;
        if (backToTeam()) return true;                         // from one figure: back to the whole team
        if (backToBoard()) return true;                        // from one pinned photo: back to the board
        setFocused(null);
        handheld.setMode('room', 1300);
        onFocus(false);
        return true;
    };
    handheld.addView('monitor', deskView);

    // the guide's idle nudge, only while you're looking at the room
    let idle = 0, nudged = false;
    handheld.onFrame((t, dt) => {
        if (handheld.mode !== 'room' || guide.talking) { idle = 0; return; }
        idle += dt;
        if (!nudged && idle > GUIDE.idleSeconds * 1000) { nudged = true; say('nudge'); }
    });

    // where something is (scene coordinates): handy in the console and for tests
    if (snake) click(snake, null, look(snake, new THREE.Vector3(0.6, 0.3, 1)));
    const things = { ...posters, snake, plant: shelfStuff.plant, monitor: monitorPanel, ps3, ds3, robot: buddy, turntable: tt, sleeves, laptop: lapGroup, boards, cyclops, hood, jubilee, daredevil, jeff, thing, bookshelf: shelf, desk, chair, games: shelfStuff.games, console: shelfStuff.console, books: shelfBooks, films: shelfFilms, ball, records: recordWall, recCorner };
    const where = (name) => {
        if (name === 'psp') return new THREE.Vector3();
        return things[name] ? new THREE.Box3().setFromObject(things[name]).getCenter(new THREE.Vector3()) : null;
    };

    return {
        guide,
        say,
        hush: () => guide.hush(),
        where,
        monitorScreen,
        onPs3: (fn) => { onPs3 = fn; },
        onFocus: (fn) => { onFocus = fn; },        // fn(true) on a close-up, fn(false) back to the room
        unfocus,
        back,
        poke: reactTo,
        peek: (x, y, z, nx, ny, nz, size = 1.6) => {            // (debug) a close-up of any spot in the room
            const b = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial({ visible: false }));
            b.position.set(x, y, z); b.userData.noPick = true; world.add(b);
            focusOn(b, new THREE.Vector3(nx, ny, nz));
        },
        openShelf: (k, i) => shelfCard.open(k, i),
        records: { wall: () => wallView(), album: (i) => albumView(i), play: (i) => putOn(i), player: () => playerView() },
        sleeves: () => { const out = []; world.traverse((m) => { if (m.name === 'gameJacket' && m.material.map?.image?.toDataURL) out.push(m.material.map.image.toDataURL('image/jpeg', 0.85)); }); return out; },
        uvSpan: (re) => { let o = null; world.traverse((m) => { if (!o && m.isMesh && new RegExp(re).test(m.name + '|' + (m.material?.name || ''))) o = m; }); if (!o) return null;
            const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, out = {};
            for (let i = 0; i < P.count; i++) { const n = [N.getX(i), N.getY(i), N.getZ(i)], a = n.map(Math.abs), d = a.indexOf(Math.max(...a)), k = 'xyz'[d] + (n[d] > 0 ? '+' : '-');
                const r = out[k] ||= { n: 0, u: [9, -9], v: [9, -9], p: [[9, -9], [9, -9], [9, -9]] }; r.n++;
                const u = U.getX(i), v = U.getY(i); r.u = [Math.min(r.u[0], u), Math.max(r.u[1], u)]; r.v = [Math.min(r.v[0], v), Math.max(r.v[1], v)];
                [P.getX(i), P.getY(i), P.getZ(i)].forEach((q, j) => { r.p[j] = [Math.min(r.p[j][0], q), Math.max(r.p[j][1], q)]; }); }
            for (const r of Object.values(out)) { r.u = r.u.map((x) => Math.round(x * 1024)); r.v = r.v.map((x) => Math.round(x * 1024)); r.p = r.p.map((q) => q.map((x) => +x.toFixed(3))); }
            return [o.name, o.material?.name, out]; },
        meshBoxes: (re) => { const out = []; world.traverse((o) => { if (o.isMesh && new RegExp(re).test(o.name + '|' + (o.material?.name || ''))) { const b = boxOf(o); out.push([o.name, o.material?.name, b.min.toArray().map((v) => +v.toFixed(3)), b.max.toArray().map((v) => +v.toFixed(3))]); } }); return out; },
        ray: (ox, oy, oz, dx, dy, dz) => { anchor.updateMatrixWorld(true); const o = world.localToWorld(new THREE.Vector3(ox, oy, oz)), d = world.localToWorld(new THREE.Vector3(ox + dx, oy + dy, oz + dz)).sub(o).normalize(); const rc = new THREE.Raycaster(o, d); rc.camera = handheld.camera; return rc.intersectObjects(world.children, true).filter((h) => h.object.visible).slice(0, 4).map((h) => [h.object.name, h.object.material?.name, world.worldToLocal(h.point.clone()).toArray().map((v) => +v.toFixed(3))]); },
        cam: () => world.worldToLocal(handheld.camera.position.clone()).toArray().map((v) => +v.toFixed(2)),
        stuffBox: (k) => { const o = shelfStuff[k]; if (!o) return null; const b = boxOf(o); return [b.min.toArray().map((v) => +v.toFixed(3)), b.max.toArray().map((v) => +v.toFixed(3)), o.visible, o.parent?.type]; },
        shelfInfo: () => ({ shown: shelfShown?.userData.shelfItem, pos: shelfShown?.position.toArray().map((v) => +v.toFixed(3)), home: shelfShown?.userData.home?.pos.toArray().map((v) => +v.toFixed(3)), spot: shelfSpot.position.toArray().map((v) => +v.toFixed(3)), busy: shelfBusy }),
        shelf: (kind, i) => { const row = kind === 'book' ? shelfBooks : kind === 'film' ? shelfFilms : kind === 'textbook' ? shelfStuff.textbooks : kind === 'notebook' ? shelfStuff.notebooks : shelfStuff.games; const m = row.children.find((c) => c.userData.shelfItem?.i === i); if (m) shelfShow(m); },
        probeUp: (x, z = 0.05, y = 2.2) => {                  // (debug) how high the wall goes at x
            anchor.updateMatrixWorld(true);
            const o = world.localToWorld(new THREE.Vector3(x, y, z)), up = world.localToWorld(new THREE.Vector3(x, y + 1, z)).sub(o).normalize();
            const hit = new THREE.Raycaster(o, up).intersectObject(bedroom, true).find((h) => h.object.visible);
            return hit ? world.worldToLocal(hit.point.clone()).y : null;
        },
        hoverFigure: (label) => { logoState.hover = label && LOGOS[label] ? label : null; showLogo(); },
        focus: (name) => { const o = things[name]; if (o) { focusOn(o.userData?.box || o, new THREE.Vector3(0, 0.35, 1)); } },
        showTeam: () => showTeam(),
        clickPsp,                                  // true: handled (a close-up); false: pick it up
        onPickPsp: (fn) => { pickPsp = fn; },
        pickUp: (ms = 1400) => moveRoom(HELD, ms),
        putDown: (ms = 1400) => moveRoom(REST, ms),
        setTheme: () => {},                        // (the time of day decides now)
        sky: () => ({ ...sky, el: sky.el / D2R }),
        // the room's open: he says hello (a chime and a chatter; on your first click if sound can't start yet)
        hello: () => sfx.whenUnlocked(() => { sfx.ready(); setTimeout(() => sfx.chirp(4), 380); }),
        debug: () => ({ lapAngle: lapGroup.userData.angle, walk: { ...walk }, pos: buddy.position.toArray(), showing: guide.showing, talking: guide.talking }),
        inspect: (name) => (name === 'ds3' ? pickUp(ds3, { turnTo: 0.35, tilt: 0.95, action: { label: '<span class="inspect__start">START</span> play on the PS3', run: play } }) : (pickUp(things[name]?.userData?.figure || things[name]), showBio(name, true))),
        closeOverlays: () => { ui.closeAll(); ui.stopVoice(); inspector.close(); },
        overlayOpen: () => ui.isOpen() || inspector.open,
    };
}

// ============================================================================
// MZALA: the guide. The robot on the desk is his body; what he says shows in a
// caption (the face below is drawn too, for a screen, though none uses it now). He talks in typed lines
// (and in little computer blips, or a voice clip if there is one).
// ============================================================================
function createGuide() {
    const W = 512, H = 384;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;

    // his speech bubble: over his head when you can see him, docked in the
    // bottom-left corner (with a little face) when you can't
    const cap = document.createElement('div');
    cap.className = 'mz-bubble';
    cap.setAttribute('role', 'status');
    cap.setAttribute('aria-live', 'polite');
    cap.innerHTML = `<span class="mz-bubble__face" aria-hidden="true"><i></i><i></i></span><p class="mz-bubble__text"></p>`;
    cap.hidden = true;
    document.body.appendChild(cap);
    const capText = cap.querySelector('.mz-bubble__text');
    let anchored = null;
    const place = (at) => {
        if (!at) {
            if (anchored !== false) { cap.classList.add('is-docked'); cap.style.left = cap.style.top = ''; cap.style.removeProperty('--tail'); anchored = false; }
            return;
        }
        if (anchored !== true) { cap.classList.remove('is-docked'); anchored = true; }
        const half = Math.min(cap.offsetWidth / 2, innerWidth / 2 - 8);
        const x = Math.min(innerWidth - half - 8, Math.max(half + 8, at.x));
        cap.style.left = `${x.toFixed(1)}px`;
        cap.style.top = `${Math.max(cap.offsetHeight + 12, at.y - 10).toFixed(1)}px`;
        cap.style.setProperty('--tail', `${(at.x - x).toFixed(1)}px`);
    };

    let line = '', shown = 0, talking = false, showing = false, mouth = 0, blinkAt = 2000, lookX = 0, lookY = 0, glow = 0;
    let voice = null, analyser = null, typeTimer = null, hideTimer = null, lastT = 0;
    let ac = null;
    const audio = () => (ac ||= new (window.AudioContext || window.webkitAudioContext)());
    const blip = () => sfx.blip();
    // follow the mouse with his eyes
    addEventListener('pointermove', (e) => { lookX = (e.clientX / innerWidth - 0.5) * 2; lookY = (e.clientY / innerHeight - 0.5) * 2; });

    const hush = () => {
        clearInterval(typeTimer); clearTimeout(hideTimer);
        if (voice) { voice.pause(); voice = null; }
        talking = false; cap.classList.remove('is-in');
        setTimeout(() => { if (!talking) { cap.hidden = true; showing = false; } }, 300);
    };
    const say = (id) => {
        const l = typeof id === 'string' ? GUIDE.lines[id] : id; if (!l) return;
        hush();
        line = l.text; shown = 0; talking = true;
        cap.hidden = false; capText.textContent = ''; showing = true;
        requestAnimationFrame(() => cap.classList.add('is-in'));
        let ms = 32;
        if (l.voice) {
            voice = new Audio(`audio/guide/${id}.mp3`);
            voice.addEventListener('loadedmetadata', () => { ms = Math.max(18, (voice.duration * 1000 * 0.92) / line.length); });
            try {
                const a = audio(); const src = a.createMediaElementSource(voice);
                analyser = a.createAnalyser(); analyser.fftSize = 256; src.connect(analyser).connect(a.destination);
            } catch { analyser = null; }
            voice.play().catch(() => { voice = null; analyser = null; });
            voice.addEventListener('ended', () => { voice = null; });
        }
        const step = () => {
            shown = Math.min(line.length, shown + 1);
            capText.textContent = line.slice(0, shown);
            if (!voice && shown % 3 === 0 && /\w/.test(line[shown - 1] || '')) blip();
            if (shown >= line.length) {
                clearInterval(typeTimer);
                const wait = () => { if (voice) return setTimeout(wait, 200); talking = false; hideTimer = setTimeout(hush, Math.max(4200, l.text.length * 55)); };
                wait();
            }
        };
        typeTimer = setInterval(step, ms);
    };

    // drawing
    const P = '#5dff9a';
    const draw = (t) => {
        g.fillStyle = '#031208'; g.fillRect(0, 0, W, H);
        const flick = 0.92 + Math.sin(t * 0.05) * 0.03 + Math.random() * 0.03;
        g.save(); g.globalAlpha = flick;
        g.shadowColor = P; g.shadowBlur = 14; g.strokeStyle = P; g.fillStyle = P; g.lineWidth = 5; g.lineCap = 'round';
        // head: a rounded frame
        g.beginPath(); g.roundRect(106, 54, 300, 250, 46); g.stroke();
        // antenna
        g.beginPath(); g.moveTo(256, 54); g.lineTo(256, 26); g.stroke();
        g.beginPath(); g.arc(256, 20, 7 + (talking ? Math.sin(t * 0.02) * 2 : 0), 0, Math.PI * 2); g.fill();
        // eyes: square, they follow you and blink
        const blinking = t > blinkAt && t < blinkAt + 120;
        if (t > blinkAt + 120) blinkAt = t + 2500 + Math.random() * 3500;
        for (const ex of [196, 316]) {
            g.lineWidth = 5; g.strokeRect(ex - 34, 112, 68, blinking ? 6 : 58);
            if (!blinking) g.fillRect(ex - 12 + lookX * 14, 129 + lookY * 10, 24, 24);
        }
        // brows lift when he talks
        const lift = talking ? 4 + Math.sin(t * 0.008) * 3 : 0;
        g.lineWidth = 5;
        g.beginPath(); g.moveTo(166, 96 - lift); g.lineTo(224, 100 - lift); g.stroke();
        g.beginPath(); g.moveTo(288, 100 - lift); g.lineTo(346, 96 - lift); g.stroke();
        // mouth: an oscilloscope line, loud when he talks
        let level = 0;
        if (analyser) { const d = new Uint8Array(analyser.frequencyBinCount); analyser.getByteTimeDomainData(d); level = Math.max(...d.map((v) => Math.abs(v - 128))) / 128 * 2.2; }
        else if (talking) level = 0.35 + Math.abs(Math.sin(t * 0.03)) * 0.6;
        mouth += (level - mouth) * 0.35;
        g.lineWidth = 4; g.beginPath();
        for (let x = 176; x <= 336; x += 4) {
            const k = (x - 176) / 160, env = Math.sin(k * Math.PI);
            const y = 238 + Math.sin(x * 0.18 + t * 0.03) * 22 * mouth * env + Math.sin(x * 0.07 - t * 0.02) * 4 * env;
            x === 176 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
        g.restore();
        // header and footer text
        g.fillStyle = P; g.font = '20px "VCR OSD Mono", ui-monospace, monospace'; g.globalAlpha = 0.85;
        g.fillText(`${GUIDE.name}.EXE`, 18, 34);
        if (Math.floor(t / 600) % 2 === 0) { g.fillStyle = '#ff5050'; g.beginPath(); g.arc(470, 27, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = P; }
        g.fillText(talking ? '> talking…' : '> click me', 18, H - 18);
        g.globalAlpha = 1;
        // scanlines + vignette
        g.fillStyle = 'rgba(0,0,0,0.28)';
        for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
        const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.65)');
        g.fillStyle = v; g.fillRect(0, 0, W, H);
    };
    const api = {
        texture,
        dirty: true,
        drawFace: false,
        get talking() { return talking; },
        get glow() { return glow; },
        get showing() { return showing; },
        place,
        say,
        hush,
        poke: () => {},
        tick: (t) => {
            if (t - lastT < 33) { api.dirty = false; return; }          // ~30 fps is plenty for a CRT
            lastT = t;
            glow += ((talking ? 1 : 0.55) - glow) * 0.1;
            if (!api.drawFace) return;                                 // (only when a screen shows his face)
            draw(t);
            api.dirty = true;
        },
    };
    return api;
}

// ============================================================================
// The pop-ups: the record player's deck (Spotify), the figures' voice lines and the photo album.
// ============================================================================
function createOverlays(guide) {
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // ---- YouTube's iframe API, loaded once for the deck and the voice lines
    let ytPromise = null;
    const ytReady = () => ytPromise ||= new Promise((resolve, reject) => {
        if (window.YT?.Player) { resolve(window.YT); return; }
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
        s.onerror = reject;
        document.head.appendChild(s);
        setTimeout(() => reject(new Error('YouTube API timed out')), 8000);
    });

    // ---- a figure's voice line: a little card, bottom left, with the clip in it
    // (YouTube's player has to stay visible while it plays, at least 200 × 200)
    const voiceCard = document.createElement('aside');
    voiceCard.className = 'voice-card';
    voiceCard.hidden = true;
    voiceCard.innerHTML = `<div class="voice-card__clip"><div></div></div><div class="voice-card__bar"><b></b><button type="button" class="room-x" aria-label="Stop">×</button></div>`;
    document.body.appendChild(voiceCard);
    let voicePlayer = null, voiceTimer = 0, resumeMusic = false;
    const stopVoice = () => {
        clearTimeout(voiceTimer);
        try { voicePlayer?.destroy(); } catch { /* fine */ }
        voicePlayer = null;
        voiceCard.classList.remove('is-in');
        setTimeout(() => { if (!voicePlayer) voiceCard.hidden = true; }, 250);
        if (resumeMusic) { resumeMusic = false; ctrl?.resume?.(); }
    };
    voiceCard.querySelector('.room-x').addEventListener('click', stopVoice);
    let voiceAudio = null;
    const playVoice = async (v, name) => {
        if (!v?.youtube && !v?.file) return;
        stopVoice();
        voiceAudio?.pause();
        // a sound file of his own (audio/voices/...): just play it, no card
        if (v.file) {
            const ok = await new Promise((res) => {
                voiceAudio = new Audio(v.file); voiceAudio.volume = sfx.volume;
                voiceAudio.addEventListener('canplaythrough', () => res(true), { once: true });
                voiceAudio.addEventListener('error', () => res(false), { once: true });
                voiceAudio.load();
            });
            if (ok) {
                if (playing && ctrl) { resumeMusic = true; ctrl.pause(); }
                const done = () => { voiceAudio?.pause(); if (resumeMusic) { resumeMusic = false; ctrl?.resume?.(); } };
                voiceAudio.onended = done;
                if (v.end) voiceAudio.ontimeupdate = () => { if (voiceAudio.currentTime >= v.end) { voiceAudio.ontimeupdate = null; done(); } };
                voiceAudio.currentTime = v.start || 0;
                voiceAudio.play().catch(() => {});
                return;
            }
            if (!v.youtube) return;
        }
        if (playing && ctrl) { resumeMusic = true; ctrl.pause(); }
        voiceCard.querySelector('b').textContent = name;
        voiceCard.querySelector('.voice-card__clip').innerHTML = '<div></div>';
        voiceCard.hidden = false;
        requestAnimationFrame(() => voiceCard.classList.add('is-in'));
        const start = v.start || 0, end = v.end || 0;
        try {
            const YT = await ytReady();
            voicePlayer = new YT.Player(voiceCard.querySelector('.voice-card__clip div'), {
                host: 'https://www.youtube-nocookie.com', videoId: v.youtube, width: 200, height: 200,
                playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 0, start, ...(end ? { end } : {}) },
                events: {
                    onReady: (e) => e.target.playVideo(),
                    onStateChange: (e) => { if (e.data === 0) voiceTimer = setTimeout(stopVoice, 600); },   // ended
                },
            });
        } catch {
            voiceCard.querySelector('.voice-card__clip').innerHTML = `<iframe title="${esc(name)} voice line" width="200" height="200" frameborder="0" allow="autoplay; encrypted-media" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube)}?autoplay=1&controls=0&rel=0&start=${start}${end ? `&end=${end}` : ''}"></iframe>`;
            voiceTimer = setTimeout(stopVoice, ((end || start + 8) - start) * 1000 + 1500);
        }
    };

    // ---- music: a record sleeve, bottom right. Cameron's Spotify playlists: the sleeve
    // shows the cover of what's playing, the record slides out and spins, and the small
    // Spotify player underneath has the controls (it plays 30 s previews unless you're
    // signed in to Spotify in this browser).
    // the records (records-data.js): albums, played in order, song by song
    // (playlists shuffle; albums play in order)
    const MIXES = DISCS.map((r) => ({ spotify: r.id, kind: r.kind, seq: r.kind === 'album', title: r.title, by: r.artist, color: r.bg, cover: r.cover, tracks: r.tracks.map((t) => t[0]).join(' ') }));
    const listeners = new Set();
    const changed = () => listeners.forEach((f) => { try { f(); } catch { /* fine */ } });
    const deck = document.createElement('aside');
    deck.className = 'room-deck';
    deck.hidden = true;
    deck.setAttribute('aria-label', 'The record player');
    deck.innerHTML = `
        <button type="button" class="deck__hide" aria-label="Close the player (the music keeps playing)">✕ close</button>
        <div class="deck__art">
            <div class="deck__disc" aria-hidden="true"><span><img alt="" hidden></span></div>
            <div class="deck__sleeve"><img alt=""></div>
        </div>
        <div class="deck__meta">
            <span class="deck__now">currently playing</span>
            <b class="deck__title"></b>
            <span class="deck__by"></span>
            <div class="deck__ctl">
                <button type="button" class="deck__prev" aria-label="Previous song"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2h2v12H3zM14 2v12L6 8z"/></svg></button>
                <button type="button" class="deck__play" aria-label="Play">▶ play</button>
                <button type="button" class="deck__pause" aria-label="Pause">❚❚ pause</button>
                <button type="button" class="deck__next" aria-label="Next song"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11 2h2v12h-2zM2 2v12l8-6z"/></svg></button>
                <button type="button" class="deck__close" aria-label="Lift the needle (stop)"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v10H3z"/></svg></button>
            </div>
            <div class="deck__spotify" title="Playing on Spotify"><div></div><img class="deck__art-color" alt=""></div>
        </div>`;
    document.body.appendChild(deck);
    const cover = deck.querySelector('.deck__sleeve img');
    // the Spotify box is greyscale; its little album art gets the colour copy laid over it
    const artColor = deck.querySelector('.deck__art-color');
    new MutationObserver(() => { if (cover.src) artColor.src = cover.src; }).observe(cover, { attributes: true, attributeFilter: ['src'] });
    const disc = deck.querySelector('.deck__disc');
    const titleEl = deck.querySelector('.deck__title'), byEl = deck.querySelector('.deck__by');
    let playing = false, ctrl = null, loaded = false, mixIdx = 0, lastTrack = '';
    // shuffle: each playlist's songs in a random order, one at a time
    let order = [], pos = 0, ending = false;
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    // at: which song to start on (its place in the list), or -1 (the top; a playlist, anywhere)
    const startMix = (at = -1) => {
        const m = current(), all = m.tracks ? m.tracks.split(/\s+/).filter(Boolean) : [];
        order = all.slice();
        if (m.seq) { pos = Math.max(0, Math.min(at, order.length - 1)); return; }
        shuffle(order); pos = 0;
        if (at >= 0 && all[at]) { order.splice(order.indexOf(all[at]), 1); order.unshift(all[at]); }
    };
    const nowUri = () => (order.length ? `spotify:track:${order[pos]}` : `spotify:${current().kind || 'playlist'}:${current().spotify}`);
    const current = () => MIXES[mixIdx] || {};
    const playBtn = deck.querySelector('.deck__play');
    const setPlaying = (on) => { if (playing !== on) { playing = on; deck.classList.toggle('is-playing', on); if (on) playBtn.classList.remove('is-nudge'); changed(); } };
    // start the loaded song. Spotify's embed ignores a play() sent before it has finished loading (right after
    // loadUri, or on the first load), so ask again a few times until it takes. If the browser is blocking
    // autoplay it never does, and the play button pulses instead, so one click starts it.
    let playTok = 0;
    const kickPlay = () => {
        const tok = ++playTok;
        playBtn.classList.remove('is-nudge');
        const go = (n) => {
            if (tok !== playTok || !ctrl || stopped || playing) return;
            ctrl.play();
            if (n >= 5) { playBtn.classList.add('is-nudge'); return; }
            setTimeout(() => go(n + 1), [400, 700, 1100, 1600, 2200][n]);
        };
        go(0);
    };
    // covers and names from Spotify's oEmbed (no sign-in needed)
    const oembed = (kind, id) => fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/${kind}/${id}`)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const showMix = () => {
        const m = current();
        titleEl.textContent = m.title || 'Playlist';
        byEl.textContent = m.by || m.artist || '';
        disc.style.setProperty('--label', m.color || '#d4202c');
        // the record's middle is the cover, as on the 3D record; only one without a cover shows its name
        const lab = disc.querySelector('span'), labImg = lab.querySelector('img');
        const setLabel = (src) => {
            [...lab.childNodes].forEach((n) => n.nodeType === 3 && n.remove());
            if (src) { labImg.src = src; labImg.hidden = false; }
            else { labImg.hidden = true; labImg.removeAttribute('src'); lab.append(document.createTextNode(m.title || '')); }
        };
        setLabel(m.cover || null);
        lastTrack = '';
        if (m.cover) cover.src = m.cover;
        else oembed(m.kind || 'playlist', m.spotify).then((o) => { if (o?.thumbnail_url && current() === m) { setLabel(o.thumbnail_url); if (!lastTrack) cover.src = o.thumbnail_url; } });
        if (order.length) showTrack(nowUri());          // a song's on: its cover, not the playlist's
    };
    // the song that's playing: its own cover on the sleeve, its name under the title
    const showTrack = (uri) => {
        const id = /^spotify:track:(\w+)/.exec(uri || '')?.[1];
        if (!id || uri === lastTrack) return;
        lastTrack = uri;
        changed();
        // an album's song: its name from the record's own list (the cover's the album's)
        const k = DISCS[mixIdx]?.tracks.findIndex((t) => t[0] === id);
        if (k >= 0) byEl.textContent = DISCS[mixIdx].tracks[k][1];
        if (current().seq && k >= 0) return;
        oembed('track', id).then((o) => {
            if (lastTrack !== uri || !o) return;
            if (o.thumbnail_url) cover.src = o.thumbnail_url;
            if (o.title) byEl.textContent = o.title;
        });
    };
    let spotifyApi = null;
    const spotifyReady = () => new Promise((resolve, reject) => {
        if (spotifyApi) { resolve(spotifyApi); return; }
        window.onSpotifyIframeApiReady = (api) => { spotifyApi = api; resolve(api); };
        const s = document.createElement('script');
        s.src = 'https://open.spotify.com/embed/iframe-api/v1'; s.async = true;
        s.onerror = reject;
        document.head.appendChild(s);
        setTimeout(() => reject(new Error('Spotify timed out')), 8000);
    });
    const slot = deck.querySelector('.deck__spotify');
    let startAt = -1, endTimer = 0, lastPos = 0, lastDur = 0;
    const loadPlayer = (auto) => {
        if (loaded) return; loaded = true;
        startMix(startAt);
        const uri = nowUri();
        if (order.length) showTrack(uri);
        spotifyReady().then((api) => {
            api.createController(slot.firstElementChild, { uri, width: '100%', height: 80 }, (c) => {
                ctrl = c;
                c.addListener('playback_update', (e) => {
                    const d = e.data;
                    setPlaying(!d.isPaused && !d.isBuffering);
                    if (!order.length) showTrack(d.playingURI);
                    // a song's finished: on to the next one. Spotify's updates come about once a second and the
                    // player just stops at the end, so one that lands in the last second is easily missed:
                    // a timer set for the song's end backs it up, and so does spotting that it stopped at the end.
                    if (order.length && d.duration > 0) {
                        clearTimeout(endTimer);
                        const left = d.duration - d.position;
                        if (!d.isPaused && left <= 1500 && !ending) { ending = true; nextSong(); }
                        else if (!d.isPaused) endTimer = setTimeout(() => { if (!ending && !stopped) { ending = true; nextSong(); } }, Math.max(0, left) + 700);
                        else if (lastDur === d.duration && lastPos >= d.duration - 4000 && (d.position <= 500 || d.position >= d.duration - 300) && !ending && !stopped) { ending = true; nextSong(); }
                        lastPos = d.position; lastDur = d.duration;
                    }
                });
                if (auto) {
                    c.addListener('ready', kickPlay);
                    setTimeout(() => { if (!playing && !stopped && !playTok) kickPlay(); }, 2500);   // (in case 'ready' came before the listener)
                }
            });
        }, () => {
            slot.innerHTML = `<iframe title="On Spotify" src="https://open.spotify.com/embed/${current().kind || 'playlist'}/${encodeURIComponent(current().spotify)}?theme=0" width="100%" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media" loading="lazy"></iframe>`;
        });
    };
    const showDeck = (on, auto = false) => {
        if (on) { showMix(); loadPlayer(auto); deck.hidden = false; requestAnimationFrame(() => deck.classList.add('is-in')); }
        else { deck.classList.remove('is-in'); setTimeout(() => { deck.hidden = true; }, 250); }
        return on;
    };
    const nextSong = (step = 1) => {
        if (!order.length) return;
        if (step < 0) pos = (pos - 1 + order.length) % order.length;
        else { pos = (pos + 1) % order.length; if (pos === 0 && !current().seq) shuffle(order); }   // round again (a playlist in a new order)
        lastTrack = '';
        clearTimeout(endTimer); lastPos = lastDur = 0;
        showTrack(nowUri());
        if (ctrl) { ctrl.loadUri(nowUri()); kickPlay(); }
        setTimeout(() => { ending = false; }, 2500);
    };
    const playMix = (id, at = -1) => {
        stopped = false;
        const i = MIXES.findIndex((m) => m.spotify === id);
        mixIdx = i < 0 ? 0 : i;
        clearTimeout(endTimer); lastPos = lastDur = 0;
        if (!loaded) { startAt = at; showDeck(true, true); return; }
        showDeck(true);
        startMix(at);
        if (order.length) showTrack(nowUri());
        if (ctrl) { ctrl.loadUri(nowUri()); kickPlay(); }
        else { const f = slot.querySelector('iframe'); if (f) f.src = `https://open.spotify.com/embed/${current().kind || 'playlist'}/${encodeURIComponent(current().spotify)}?theme=0`; }
    };
    playBtn.addEventListener('click', () => { if (!ctrl) return; if (deck.dataset.started) ctrl.resume(); else { ctrl.play(); deck.dataset.started = '1'; } });
    deck.querySelector('.deck__pause').addEventListener('click', () => { playTok++; clearTimeout(endTimer); ctrl?.pause(); setPlaying(false); });
    // ‹ › : the previous / next song (a new record: pick one off the wall or out of the crate)
    deck.querySelector('.deck__next').addEventListener('click', () => { if (order.length) nextSong(1); });
    deck.querySelector('.deck__prev').addEventListener('click', () => { if (order.length) nextSong(-1); else ctrl?.seek?.(0); });
    // ■ stop: the music stops, the needle lifts and goes home (the record stays on; play starts it again)
    let stopped = false;
    const stopRecord = () => { playTok++; clearTimeout(endTimer); ctrl?.pause(); ctrl?.seek?.(0); setPlaying(false); stopped = true; changed(); };
    deck.querySelector('.deck__close').addEventListener('click', stopRecord);
    playBtn.addEventListener('click', () => { stopped = false; playBtn.classList.remove('is-nudge'); changed(); });
    // ✕ close: the player goes away (the music keeps playing); click the record player to bring it back
    deck.querySelector('.deck__hide').addEventListener('click', () => showDeck(false));

    // ---- modal shell shared by the album and Cyclops ----
    const modal = document.createElement('dialog');
    modal.className = 'room-modal';
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', () => { modal.innerHTML = ''; });

    // ---- photo album ----
    let page = 0;
    const openAlbum = () => {
        const items = ROOM.album.filter(Boolean);
        if (!items.length) return;
        page = 0;
        modal.className = 'room-modal room-album';
        modal.innerHTML = `
            <figure class="room-album__page">
                <img alt="">
                <figcaption></figcaption>
            </figure>
            <div class="room-album__nav">
                <button type="button" data-step="-1" aria-label="Previous photo">‹</button>
                <span class="room-album__count"></span>
                <button type="button" data-step="1" aria-label="Next photo">›</button>
            </div>
            <button type="button" class="room-x" aria-label="Close the album">×</button>`;
        const img = modal.querySelector('img'), cap = modal.querySelector('figcaption'), count = modal.querySelector('.room-album__count');
        const show = () => {
            const it = items[page]; img.src = it.src; img.alt = it.caption || ''; cap.textContent = it.caption || '';
            count.textContent = `${page + 1} / ${items.length}`;
        };
        modal.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => { page = (page + Number(b.dataset.step) + items.length) % items.length; show(); }));
        modal.querySelector('.room-x').addEventListener('click', () => modal.close());
        modal.onkeydown = (e) => {
            if (e.key === 'ArrowRight') { page = (page + 1) % items.length; show(); }
            if (e.key === 'ArrowLeft') { page = (page - 1 + items.length) % items.length; show(); }
        };
        show();
        modal.showModal();
    };

    return {
        toggleMusic: () => { if (deck.hidden) return showDeck(true, true); ctrl?.pause(); setPlaying(false); return showDeck(false); },
        playMix,
        // the record player: record i (DISCS), from song k (-1: the top, or anywhere for a playlist)
        playRecord: (i, k = -1) => { const was = mixIdx; playMix(MIXES[i].spotify, k); if (was !== mixIdx || true) changed(); },
        stopRecord,
        toggleRecord: () => { if (!ctrl) return; stopped = false; if (playing) { ctrl.pause(); setPlaying(false); } else { if (deck.dataset.started) ctrl.resume(); else { ctrl.play(); deck.dataset.started = '1'; } } },
        nowPlaying: () => ({ rec: mixIdx, playing, stopped, track: order.length ? pos : -1, trackId: order.length ? order[pos] : null }),
        showPlayer: () => { if (loaded) showDeck(true); },
        onChange: (f) => listeners.add(f),
        playVoice,
        stopVoice,
        isPlaying: () => playing && (!!ctrl || !deck.hidden),
        openAlbum,
        isOpen: () => modal.open,
        closeAll: () => { if (modal.open) modal.close(); },
    };
}
