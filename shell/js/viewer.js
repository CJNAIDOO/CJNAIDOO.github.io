// CamStation Portable — 3D handheld viewer.
// Loads a GLB (as an ArrayBuffer), turns it to face the camera, punches the
// screen out of the WebGL canvas and lines an HTML element up behind the hole,
// so a live page (the XMB iframe) shows on the device's screen.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Decode embedded textures straight from the GLB bytes with createImageBitmap,
// so no blob:/data: URL has to be fetched (keeps it working under strict CSPs).
class InlineTextures {
  constructor(parser) { this.parser = parser; this.name = 'INLINE_TEXTURES'; }
  async loadTexture(index) {
    const json = this.parser.json;
    const def = json.textures[index];
    const img = json.images[def.source];
    if (img.bufferView === undefined) return null;
    const view = await this.parser.getDependency('bufferView', img.bufferView);
    const bmp = await createImageBitmap(new Blob([view], { type: img.mimeType }), { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
    const tex = new THREE.Texture(bmp);
    tex.flipY = false;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }
}

export async function createHandheld({ container, glb, screenEl, screenUV, onKey, screenWidthPx = 1280, topInset = 0 }) {
  const W = () => container.clientWidth, H = () => container.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const css = new CSS3DRenderer();
  for (const [el, z] of [[css.domElement, 0], [renderer.domElement, 1]]) {
    Object.assign(el.style, { position: 'absolute', inset: '0', zIndex: z });
    container.appendChild(el);
  }
  renderer.domElement.style.pointerEvents = 'none';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;          // a dark room: reflections, not floodlight
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(-5, 7, 6);
  // two grazing lights from behind, so a black PSP on a black page is
  // separated from it by its own outline
  const edgeL = new THREE.DirectionalLight(0xffffff, 4.2);
  edgeL.position.set(-11, 3, -5);
  const edgeR = new THREE.DirectionalLight(0xffffff, 3.6);
  edgeR.position.set(11, 4, -6);
  // a light that sweeps across the face once the PSP has landed
  const sweep = new THREE.DirectionalLight(0xffffff, 0);
  sweep.position.set(-14, 5, 9);
  scene.add(key, edgeL, edgeR, sweep);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  const loader = new GLTFLoader();
  loader.register((parser) => new InlineTextures(parser));
  const gltf = await new Promise((res, rej) => loader.parse(glb, '', res, rej));
  const model = gltf.scene;
  model.updateMatrixWorld(true);

  let screenMesh = null;
  const buttons = {};
  const drop = [];
  model.traverse((o) => { if (o.name === 'ground') drop.push(o); });
  drop.forEach((o) => o.removeFromParent());
  model.updateMatrixWorld(true);
  model.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name.startsWith('screen_low')) screenMesh = o;
    const m = o.name.match(/^button(\d+)_low/);
    if (m) buttons[+m[1]] = o;
    if (o.material && o.material.emissiveMap) {
      o.material.emissiveMap = null;
      o.material.emissive.set(0x000000);
      o.material.needsUpdate = true;
    }
  });

  // ---- screen geometry: fit position = O + u*A + v*B over the screen mesh ----
  const pos = screenMesh.geometry.attributes.position, uv = screenMesh.geometry.attributes.uv;
  const n = pos.count, pts = [], uvs = [];
  for (let i = 0; i < n; i++) {
    pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(screenMesh.matrixWorld));
    uvs.push([uv.getX(i), uv.getY(i)]);
  }
  // least squares for each coordinate: [1 u v] * [o a b]^T = p
  const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < n; i++) {
    const r = [1, uvs[i][0], uvs[i][1]], p = [pts[i].x, pts[i].y, pts[i].z];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) M[a][b] += r[a] * r[b];
    for (let a = 0; a < 3; a++) for (let c = 0; c < 3; c++) R[a][c] += r[a] * p[c];
  }
  const Minv = new THREE.Matrix3().set(...M.flat()).invert();
  const sol = [0, 1, 2].map((c) => new THREE.Vector3(R[0][c], R[1][c], R[2][c]).applyMatrix3(Minv)); // per coordinate: (o,a,b)
  const O = new THREE.Vector3(sol[0].x, sol[1].x, sol[2].x);
  const A = new THREE.Vector3(sol[0].y, sol[1].y, sol[2].y);
  const B = new THREE.Vector3(sol[0].z, sol[1].z, sol[2].z);
  const at = (u, v) => O.clone().addScaledVector(A, u).addScaledVector(B, v);

  // Outward normal, device right (towards the face buttons), device up
  const bbox = new THREE.Box3().setFromObject(model, true);
  const center = bbox.getCenter(new THREE.Vector3());
  let normal = new THREE.Vector3().crossVectors(A, B).normalize();
  if (normal.dot(at(0.5 * (screenUV.u0 + screenUV.u1), 0.5 * (screenUV.v0 + screenUV.v1)).sub(center)) < 0) normal.negate();
  const dpadC = new THREE.Box3().setFromObject(buttons[1]).getCenter(new THREE.Vector3());
  const faceC = new THREE.Box3().setFromObject(buttons[5]).getCenter(new THREE.Vector3());
  // "right" is the screen's own horizontal (its texture's u direction), so the
  // screen sits perfectly level; the D-pad -> face buttons line is only used
  // to tell which way round that is (the buttons aren't exactly level).
  const right = A.clone(); right.addScaledVector(normal, -right.dot(normal)).normalize();
  if (right.dot(faceC.sub(dpadC)) < 0) right.negate();
  const up = new THREE.Vector3().crossVectors(normal, right).normalize();

  // Rotate the device so it faces the camera (+z), up is +y
  const basis = new THREE.Matrix4().makeBasis(right, up, normal); // columns
  const toFront = basis.clone().transpose();                        // inverse rotation
  const pivot = new THREE.Group();
  pivot.add(model);
  model.applyMatrix4(toFront);
  model.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(model, true);
  const c2 = b2.getCenter(new THREE.Vector3());
  model.position.sub(c2);
  model.updateMatrixWorld(true);
  scene.add(pivot);
  const size = b2.getSize(new THREE.Vector3());

  const xf = (p) => p.clone().applyMatrix4(toFront).sub(c2); // world(original) -> pivot space

  // screen rectangles in pivot space
  const rectOf = (u0, v0, u1, v1) => {
    const cs = [at(u0, v0), at(u1, v0), at(u0, v1), at(u1, v1)].map(xf);
    const xs = cs.map((c) => c.x), ys = cs.map((c) => c.y), zs = cs.map((c) => c.z);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), z: zs.reduce((a, b) => a + b) / 4 };
  };
  const meshPts = pts.map(xf);
  const full = { x0: Math.min(...meshPts.map((p) => p.x)), x1: Math.max(...meshPts.map((p) => p.x)), y0: Math.min(...meshPts.map((p) => p.y)), y1: Math.max(...meshPts.map((p) => p.y)), z: Math.max(...meshPts.map((p) => p.z)) };
  const disp = rectOf(screenUV.u0, screenUV.v0, screenUV.u1, screenUV.v1);

  // ---- punch the screen out of the canvas ----
  screenMesh.material = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, blending: THREE.NoBlending, depthWrite: true });

  // faint glass sheen drawn over the hole
  const sheenCanvas = document.createElement('canvas');
  sheenCanvas.width = 512; sheenCanvas.height = 256;
  const g = sheenCanvas.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 512, 256);
  grad.addColorStop(0, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.36, 'rgba(255,255,255,0.12)');
  grad.addColorStop(0.362, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256);
  const sheenTex = new THREE.CanvasTexture(sheenCanvas);
  sheenTex.colorSpace = THREE.SRGBColorSpace;
  const sheen = new THREE.Mesh(
    new THREE.PlaneGeometry(full.x1 - full.x0, full.y1 - full.y0),
    new THREE.MeshBasicMaterial({ map: sheenTex, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false })
  );
  sheen.position.set((full.x0 + full.x1) / 2, (full.y0 + full.y1) / 2, full.z + 0.004);
  sheen.renderOrder = 2;
  pivot.add(sheen);

  // ---- HTML screen behind the hole ----
  const PX = screenWidthPx;                          // width the page on the screen is laid out at (CSS px)
  const unitsPerPx = (disp.x1 - disp.x0) / PX;
  const fullWpx = (full.x1 - full.x0) / unitsPerPx, fullHpx = (full.y1 - full.y0) / unitsPerPx;
  const dispHpx = (disp.y1 - disp.y0) / unitsPerPx;
  const holder = document.createElement('div');
  Object.assign(holder.style, { width: fullWpx + 'px', height: fullHpx + 'px', background: '#000', position: 'relative', backfaceVisibility: 'hidden' });
  Object.assign(screenEl.style, { position: 'absolute', left: ((disp.x0 - full.x0) / unitsPerPx) + 'px', top: ((full.y1 - disp.y1) / unitsPerPx) + 'px', width: PX + 'px', height: dispHpx + 'px', border: '0' });
  holder.appendChild(screenEl);
  const cssObj = new CSS3DObject(holder);
  cssObj.scale.setScalar(unitsPerPx);
  cssObj.position.set((full.x0 + full.x1) / 2, (full.y0 + full.y1) / 2, disp.z);
  pivot.add(cssObj);

  // ---- the studio: a glossy floor just under the PSP ----
  // The floor itself is the page behind (shell/css: .studio). Here: the PSP's
  // reflection in it (a mirrored copy that fades with depth) and a soft
  // contact shadow where it stands.
  const floorY = -size.y / 2 - size.y * 0.004;
  const mirror = new THREE.Matrix4().makeTranslation(0, floorY, 0)
    .multiply(new THREE.Matrix4().makeScale(1, -1, 1))
    .multiply(new THREE.Matrix4().makeTranslation(0, -floorY, 0));
  const studio = { strength: 0.28, shadow: 0.7, uniforms: { uFloorY: { value: floorY }, uFade: { value: size.y * 0.5 }, uStrength: { value: 0 } } };
  const reflection = new THREE.Group();
  reflection.matrixAutoUpdate = false;
  const mirrored = model.clone(true);                // shares the geometry, not the materials
  mirrored.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name.startsWith('screen_low')) { o.visible = false; return; }   // the screen is a hole: leave it out
    const fade = (m) => {
      const c = m.clone();
      c.transparent = true;
      c.depthWrite = false;
      c.depthFunc = THREE.LessEqualDepth;            // only the nearest surface (see the depth pass below)
      c.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, studio.uniforms);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nvarying float vWy;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvWy = (modelMatrix * vec4(transformed, 1.0)).y;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying float vWy;\nuniform float uFloorY;\nuniform float uFade;\nuniform float uStrength;')
          .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.a *= uStrength * clamp(1.0 - (uFloorY - vWy) / uFade, 0.0, 1.0);');
      };
      return c;
    };
    o.material = Array.isArray(o.material) ? o.material.map(fade) : fade(o.material);
  });
  // a depth-only copy drawn first, so the faded reflection shows only its
  // nearest surfaces (not the back of the PSP through the front)
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
  const mirroredDepth = model.clone(true);
  mirroredDepth.traverse((o) => {
    if (!o.isMesh) return;
    if (o.name.startsWith('screen_low')) { o.visible = false; return; }
    o.material = depthOnly;
  });
  reflection.add(mirroredDepth, mirrored);
  scene.add(reflection);

  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 64;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(128, 32, 0, 128, 32, 128);
    r.addColorStop(0, 'rgba(0,0,0,0.9)'); r.addColorStop(0.45, 'rgba(0,0,0,0.35)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.setTransform(1, 0, 0, 0.25, 0, 24); g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x * 1.15, size.z * 6),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = floorY + size.y * 0.002;
  contact.renderOrder = -1;
  scene.add(contact);

  const updateStudio = (t) => {
    pivot.updateMatrixWorld();
    reflection.matrix.multiplyMatrices(mirror, pivot.matrixWorld);
    reflection.matrixWorldNeedsUpdate = true;
    // only while the camera is above the floor, and once the PSP has landed
    const aboveFloor = THREE.MathUtils.clamp((camera.position.y - floorY) / (size.y * 0.35), 0, 1);
    const landed = THREE.MathUtils.clamp(1 - pivot.position.length() / (size.x * 0.6), 0, 1)
      * THREE.MathUtils.clamp(pivot.scale.x, 0, 1);
    studio.uniforms.uStrength.value = studio.strength * aboveFloor * landed;
    contact.material.opacity = studio.shadow * aboveFloor * landed;
    contact.position.x = pivot.position.x; contact.position.z = pivot.position.z;
    // the light breathes, slowly
    key.intensity = 0.9 * (1 + 0.08 * Math.sin(t * 0.0006));
  };

  // ---- camera + controls ----
  // Two framings, both dead-front:
  //   overview  - the PSP floating in the middle of the page (intro)
  //   immersive - the PSP filling the window (the site itself)
  let mode = 'overview';
  const fovHalfTan = () => Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  // immersive leaves room round the PSP for the studio floor and its reflection
  const fillFor = (m) => (m === 'immersive' ? (W() < 640 ? 0.9 : 0.8) : (W() < 640 ? 0.84 : 0.66));
  // immersive keeps clear of the top menu (and the same again underneath,
  // so the PSP stays centred) when the window is short enough to need it
  const insetPx = () => (typeof topInset === 'function' ? topInset() : topInset);
  const distanceFor = (m) => {
    const f = fillFor(m);
    const fh = m === 'immersive' ? f * Math.max(0.6, (H() - 2 * insetPx()) / H()) : f;
    const h = (size.y * 0.5 / fh) / fovHalfTan();
    const w = (size.x * 0.5 / f) / (fovHalfTan() * camera.aspect);
    return Math.max(h, w) + size.z * 0.5;
  };
  const angleFor = (m) => ({ phi: Math.PI / 2 - (m === 'immersive' ? 0.03 : 0.02), theta: 0 });
  const applyLimits = () => {
    const near = distanceFor('immersive'), far = distanceFor('overview');
    controls.minDistance = near * 0.6;
    controls.maxDistance = far * 1.4;
    camera.near = near / 20; camera.far = far * 6;
    camera.updateProjectionMatrix();
  };
  const place = () => {
    const d = distanceFor(mode), a = angleFor(mode);
    camera.position.setFromSphericalCoords(d, a.phi, a.theta);
    camera.lookAt(0, 0, 0);
    applyLimits();
  };
  const resize = () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
    css.setSize(W(), H());
    applyLimits();
  };
  const controls = new OrbitControls(camera, container);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.rotateSpeed = 0.6;
  // Full turn in every direction: spin all the way round, and over the top/bottom
  controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
  controls.minPolarAngle = 0.02; controls.maxPolarAngle = Math.PI - 0.02;
  controls.target.set(0, 0, 0);

  // ---- buttons: press animation + key mapping ----
  const pressable = [];
  const rest = new Map();
  for (const [num, mesh] of Object.entries(buttons)) {
    rest.set(mesh, mesh.position.clone());
    pressable.push(mesh);
  }
  const inward = (mesh) => {
    // pivot-space -z expressed in the mesh parent's local space
    const p = mesh.parent;
    const m = new THREE.Matrix4().copy(p.matrixWorld).invert();
    const a = new THREE.Vector3(0, 0, 0).applyMatrix4(pivot.matrixWorld).applyMatrix4(m);
    const b = new THREE.Vector3(0, 0, -1).applyMatrix4(pivot.matrixWorld).applyMatrix4(m);
    return b.sub(a).normalize();
  };
  const press = (mesh) => {
    if (!mesh) return;
    const depth = 0.12 * (size.x / 16.8);
    mesh.position.copy(rest.get(mesh)).addScaledVector(inward(mesh), depth);
    clearTimeout(mesh.userData.t);
    mesh.userData.t = setTimeout(() => mesh.position.copy(rest.get(mesh)), 130);
  };

  // which D-pad mesh is which direction (by position in the facing frame)
  const dirOf = (nums) => {
    const cs = nums.map((k) => ({ k, c: new THREE.Box3().setFromObject(buttons[k]).getCenter(new THREE.Vector3()) }));
    const by = (f) => cs.reduce((a, b) => (f(b.c) > f(a.c) ? b : a)).k;
    return { up: by((c) => c.y), down: by((c) => -c.y), right: by((c) => c.x), left: by((c) => -c.x) };
  };
  model.updateMatrixWorld(true);
  const dpad = dirOf([1, 2, 3, 4]);
  const face = dirOf([5, 6, 7, 8]);   // bottom = ✕, right = ○
  const bottomRow = [9, 10, 11, 12, 13, 14, 15].sort((a, b) => new THREE.Box3().setFromObject(buttons[a]).getCenter(new THREE.Vector3()).x - new THREE.Box3().setFromObject(buttons[b]).getCenter(new THREE.Vector3()).x);
  const actions = new Map([
    [buttons[dpad.up], 'ArrowUp'], [buttons[dpad.down], 'ArrowDown'],
    [buttons[dpad.left], 'ArrowLeft'], [buttons[dpad.right], 'ArrowRight'],
    [buttons[bottomRow[0]], 'Home'],
    [buttons[face.down], 'Enter'], [buttons[face.right], 'Escape'],
  ]);
  const keyToMesh = {
    ArrowUp: buttons[dpad.up], ArrowDown: buttons[dpad.down], ArrowLeft: buttons[dpad.left], ArrowRight: buttons[dpad.right],
    Enter: buttons[face.down], Escape: buttons[face.right],
  };

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pick = (e) => {
    const r = container.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(pivot, true).find((h) => h.object.visible && h.object !== sheen);
    return hit ? hit.object : null;
  };
  container.addEventListener('pointerdown', (e) => {
    const obj = pick(e);
    if (obj && pressable.includes(obj)) {
      controls.enabled = false;
      press(obj);
      const action = actions.get(obj);
      if (action) onKey(action);
      const done = () => { controls.enabled = true; window.removeEventListener('pointerup', done); };
      window.addEventListener('pointerup', done);
    }
  });
  container.addEventListener('pointermove', (e) => {
    if (e.buttons) return;
    const obj = pick(e);
    container.style.cursor = obj && actions.has(obj) ? 'pointer' : obj ? 'grab' : '';
  });

  // ---- motion: the entrance, and smooth flights between framings ----
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bez = (x1, y1, x2, y2) => {          // cubic-bezier, like CSS
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = ((ax * t + bx) * t + cx) * t - x, d = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(e) < 1e-6 || d === 0) break;
        t = clamp01(t - e / d);
      }
      return ((ay * t + by) * t + cy) * t;
    };
  };
  const POP = bez(0.22, 0.86, 0.28, 1.0);     // emerges quickly, settles
  const GLIDE = bez(0.40, 0.02, 0.05, 1.0);   // eases in, long tail into place

  let flight = null, entrance = null, glint = null;
  const startGlint = () => { glint = { t0: performance.now(), ms: reduce ? 1 : 1300 }; };
  const tickGlint = (now) => {
    const p = clamp01((now - glint.t0) / glint.ms);
    const e = ease(p);
    sweep.position.set(lerp(-14, 14, e), lerp(6, 3, e), 9);
    sweep.intensity = 2.6 * Math.sin(p * Math.PI);
    if (p >= 1) { sweep.intensity = 0; glint = null; }
  };
  const flyTo = (m, ms = 1600) => {
    mode = m;
    const from = new THREE.Spherical().setFromVector3(camera.position);
    const a = angleFor(m);
    let dTheta = a.theta - from.theta;
    dTheta = ((dTheta + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    flight = { from, to: { radius: distanceFor(m), phi: a.phi, theta: from.theta + dTheta }, t0: performance.now(), ms: reduce ? 1 : ms };
    controls.enabled = false;
    return new Promise((res) => { flight.done = res; });
  };
  const jumpTo = (m) => {
    mode = m; flight = null;
    pivot.position.set(0, 0, 0); pivot.rotation.set(0, 0, 0); pivot.scale.setScalar(1);
    edgeL.intensity = 4.2; edgeR.intensity = 3.6;
    entrance = null;
    place();
    controls.enabled = true;
    controls.update();
    controls.saveState();
  };
  // pops out of nothing, glides forward, and the rotation resolves last, so
  // it is already the right size when it squares up (lands dead-front)
  const k = size.x / 10;
  const enter = () => {
    entrance = { t0: performance.now(), D: reduce ? 0.28 : 1 };
    controls.enabled = false;
    return new Promise((res) => { entrance.done = res; });
  };
  const tickEntrance = (now) => {
    const e = now - entrance.t0, D = entrance.D;
    const pScl = POP(clamp01(e / (1500 * D)));
    const pPos = GLIDE(clamp01((e - 60) / (2200 * D)));
    const pRot = GLIDE(clamp01(e / (2400 * D)));
    pivot.position.set(0, lerp(-2.4 * k, 0, pPos), lerp(-9.5 * k, 0, pPos));
    pivot.rotation.set(lerp(0.38, 0, pRot), lerp(-2.75, 0, pRot), lerp(-0.2, 0, pRot));
    pivot.scale.setScalar(lerp(0.14, 1, pScl));
    // the edges light up as it arrives
    edgeL.intensity = 4.2 * pPos;
    edgeR.intensity = 3.6 * pPos;
    if (pScl === 1 && pPos === 1 && pRot === 1) {
      const done = entrance.done;
      entrance = null;
      controls.enabled = true;
      controls.update();
      controls.saveState();
      done();
    }
  };

  // start in the entrance's first pose (tiny, turned away, far back). The
  // PSP stays "visible" so the XMB iframe is in the page and loads now.
  pivot.position.set(0, -2.4 * k, -9.5 * k);
  pivot.rotation.set(0.38, -2.75, -0.2);
  pivot.scale.setScalar(0.14);
  edgeL.intensity = 0; edgeR.intensity = 0;
  resize();
  place();
  controls.update();
  controls.saveState();
  let firstResize = true;
  new ResizeObserver(() => {
    if (firstResize) { firstResize = false; return; }
    resize();
    if (!flight) camera.position.setLength(distanceFor(mode));
  }).observe(container);

  // Rendering can be paused while the PSP isn't on screen (during the mark),
  // so the page's own animation gets the whole frame. It always renders once,
  // which puts the XMB iframe into the page so it starts loading.
  let active = true, renderedOnce = false;
  const tick = (t) => {
    if (!active && renderedOnce) { requestAnimationFrame(tick); return; }
    renderedOnce = true;
    if (entrance) tickEntrance(t);
    if (glint) tickGlint(t);
    if (flight) {
      const k = Math.min(1, (t - flight.t0) / flight.ms), e = ease(k);
      const { from, to } = flight;
      camera.position.setFromSphericalCoords(
        from.radius + (to.radius - from.radius) * e,
        from.phi + (to.phi - from.phi) * e,
        from.theta + (to.theta - from.theta) * e);
      camera.lookAt(0, 0, 0);
      if (k >= 1) {
        const done = flight.done;
        flight = null;
        controls.enabled = true;
        controls.update();
        controls.saveState();
        done();
      }
    } else {
      controls.update();
    }
    updateStudio(t);
    renderer.render(scene, camera);
    css.render(scene, camera);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    press: (keyName) => press(keyToMesh[keyName]),
    setMode: (m) => flyTo(m),
    jumpTo,
    enter,
    glint: startGlint,
    setActive: (on) => { active = on; },
    resetView: () => flyTo(mode, 900),
    get mode() { return mode; },
    // studio lighting: 'dark' or 'light' (reflection and shadow strength, room light)
    setStudioTheme: (theme) => {
      const light = theme === 'light';
      studio.strength = light ? 0.16 : 0.28;
      studio.shadow = light ? 0.35 : 0.7;
      scene.environmentIntensity = light ? 0.8 : 0.55;
    },
    floorY,
    renderer, camera, controls, pivot, info: { dpad, face, bottomRow, size, disp, full },
  };
}
