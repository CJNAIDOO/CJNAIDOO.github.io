// Liquid "metallic paint" on Cameron's name: a vanilla-JS port of React Bits' MetallicPaint
// (https://reactbits.dev, MIT + Commons Clause; shaders and the Poisson shading unchanged,
// apart from the small-canvas blur being a setting). WebGL2 only: createMetallicPaint()
// returns null without it, and the caller shows the plain name instead.
//
//   const paint = createMetallicPaint(el, { lines: ['CAMERON', 'NAIDOO'], fontFamily: "'Prince Valiant'" });
//   paint.setLines([...]); paint.destroy();

const WORKING_SIZE = 512;
const MAX_SIDE = 2048;
const MAX_PIXELS = 2560 * 1600 * 2;

const VERTEX = `#version 300 es
layout(location = 0) in vec2 a_position;
uniform vec2 u_resolution;
uniform float u_imageAspect;
uniform float u_scale;
uniform float u_rotation;
out vec2 v_imageUV;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  vec2 uv = a_position * 0.5;
  float r = u_rotation * 3.14159265358979323846 / 180.0;
  mat2 turn = mat2(cos(r), sin(r), -sin(r), cos(r));
  vec2 imageBox;
  imageBox.x = min(u_resolution.x / u_imageAspect, u_resolution.y) * u_imageAspect;
  imageBox.y = imageBox.x / u_imageAspect;
  v_imageUV = uv * (u_resolution / imageBox) / u_scale;
  v_imageUV.x *= u_imageAspect;
  v_imageUV = turn * v_imageUV;
  v_imageUV.x /= u_imageAspect;
  v_imageUV += 0.5;
  v_imageUV.y = 1.0 - v_imageUV.y;
}`;

const FRAGMENT = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_colorBack;
uniform vec4 u_colorTint;
uniform float u_softness;
uniform float u_repetition;
uniform float u_shiftRed;
uniform float u_shiftBlue;
uniform float u_distortion;
uniform float u_contour;
uniform float u_angle;
uniform vec2 u_tilt;
uniform float u_reveal;
uniform float u_light;
uniform float u_smallBlur;

in vec2 v_imageUV;

out vec4 fragColor;

#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float getColorChanges(float c1, float c2, float stripe, vec3 w, float blur, float bump, float tint) {
  float ch = mix(c2, c1, smoothstep(0.0, 2.0 * blur, stripe));
  float border = w[0];
  ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripe));
  bump = smoothstep(0.2, 0.8, bump);
  border = w[0] + 0.4 * (1.0 - bump) * w[1];
  ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripe));
  border = w[0] + 0.5 * (1.0 - bump) * w[1];
  ch = mix(ch, c2, smoothstep(border, border + 2.0 * blur, stripe));
  border = w[0] + w[1];
  ch = mix(ch, c1, smoothstep(border, border + 2.0 * blur, stripe));
  float gradientT = (stripe - w[0] - w[1]) / w[2];
  float gradient = mix(c1, c2, smoothstep(0.0, 1.0, gradientT));
  ch = mix(ch, gradient, smoothstep(border, border + 0.5 * blur, stripe));
  ch = mix(ch, 1.0 - min(1.0, (1.0 - ch) / max(tint, 0.0001)), u_colorTint.a);
  return ch;
}

float getImgFrame(vec2 uv, float th) {
  float frame = 1.0;
  frame *= smoothstep(0.0, th, uv.y);
  frame *= 1.0 - smoothstep(1.0 - th, 1.0, uv.y);
  frame *= smoothstep(0.0, th, uv.x);
  frame *= 1.0 - smoothstep(1.0 - th, 1.0, uv.x);
  return frame;
}

float blurEdge3x3(sampler2D tex, vec2 uv, vec2 dudx, vec2 dudy, float radius, float centerSample) {
  vec2 texel = 1.0 / vec2(textureSize(tex, 0));
  vec2 r = radius * texel;
  float sum = 4.0 * centerSample;
  sum += 2.0 * textureGrad(tex, uv + vec2(0.0, -r.y), dudx, dudy).r;
  sum += 2.0 * textureGrad(tex, uv + vec2(0.0, r.y), dudx, dudy).r;
  sum += 2.0 * textureGrad(tex, uv + vec2(-r.x, 0.0), dudx, dudy).r;
  sum += 2.0 * textureGrad(tex, uv + vec2(r.x, 0.0), dudx, dudy).r;
  sum += textureGrad(tex, uv + vec2(-r.x, -r.y), dudx, dudy).r;
  sum += textureGrad(tex, uv + vec2(r.x, -r.y), dudx, dudy).r;
  sum += textureGrad(tex, uv + vec2(-r.x, r.y), dudx, dudy).r;
  sum += textureGrad(tex, uv + vec2(r.x, r.y), dudx, dudy).r;
  return sum / 16.0;
}

void main() {
  const float firstFrameOffset = 2.8;
  float t = 0.3 * (u_time + firstFrameOffset);

  vec2 uv = v_imageUV;
  vec2 dudx = dFdx(v_imageUV);
  vec2 dudy = dFdy(v_imageUV);
  vec4 img = textureGrad(u_image, uv, dudx, dudy);

  float cycleWidth = u_repetition;

  vec2 rotatedUV = uv - vec2(0.5);
  float angle = (-u_angle + 70.0) * PI / 180.0;
  float cosA = cos(angle);
  float sinA = sin(angle);
  rotatedUV = vec2(rotatedUV.x * cosA - rotatedUV.y * sinA, rotatedUV.x * sinA + rotatedUV.y * cosA) + vec2(0.5);

  float edge = blurEdge3x3(u_image, uv, dudx, dudy, 6.0, img.r);
  edge = pow(edge, 1.6);
  edge *= smoothstep(0.0, 0.4, u_contour);

  float opacity = img.g * getImgFrame(v_imageUV, 0.0);
  float depth = img.r;

  float diagBLtoTR = rotatedUV.x - rotatedUV.y;
  float diagTLtoBR = rotatedUV.x + rotatedUV.y;

  vec3 color1 = mix(vec3(0.98, 0.98, 1.0), vec3(0.9, 0.9, 0.93), u_light);
  vec3 color2 = vec3(0.1, 0.1, 0.1 + 0.1 * smoothstep(0.7, 1.3, diagTLtoBR));

  vec2 gradUV = uv - 0.5 - u_tilt * vec2(0.18, -0.12);
  float dist = length(gradUV + vec2(0.0, 0.2 * diagBLtoTR));
  gradUV = rotate(gradUV, (0.25 - 0.2 * diagBLtoTR) * PI);
  float direction = gradUV.x;

  float bump = pow(1.8 * dist, 1.2);
  bump = 1.0 - bump;
  bump *= pow(uv.y, 0.3);

  float thinStrip1 = 0.12 / cycleWidth * (1.0 - 0.4 * bump);
  float thinStrip2 = 0.07 / cycleWidth * (1.0 + 0.4 * bump);
  float wideStrip = 1.0 - thinStrip1 - thinStrip2;

  float noise = snoise(uv - t);
  edge += (1.0 - edge) * u_distortion * noise;

  direction += diagBLtoTR;
  direction -= 2.0 * noise * diagBLtoTR * (smoothstep(0.0, 1.0, edge) * (1.0 - smoothstep(0.0, 1.0, edge)));
  direction *= mix(1.0, 1.0 - edge, smoothstep(0.5, 1.0, u_contour));
  direction -= 1.7 * edge * smoothstep(0.5, 1.0, u_contour);
  direction += 0.2 * pow(u_contour, 4.0) * (1.0 - smoothstep(0.0, 1.0, edge));

  bump *= clamp(pow(uv.y, 0.1), 0.3, 1.0);
  direction *= 0.1 + (1.1 - edge) * bump;
  direction *= 0.4 + 0.6 * (1.0 - smoothstep(0.5, 1.0, edge));
  direction += 0.18 * (smoothstep(0.1, 0.2, uv.y) * (1.0 - smoothstep(0.2, 0.4, uv.y)));
  direction += 0.03 * (smoothstep(0.1, 0.2, 1.0 - uv.y) * (1.0 - smoothstep(0.2, 0.4, 1.0 - uv.y)));
  direction *= 0.5 + 0.5 * pow(uv.y, 2.0);
  direction *= cycleWidth;
  direction -= t + dot(u_tilt, vec2(0.35, 0.2));

  float colorDispersion = clamp(1.0 - bump, 0.0, 1.0);
  float dispersionRed = colorDispersion;
  dispersionRed += 0.03 * bump * noise;
  dispersionRed += 5.0 * (smoothstep(-0.1, 0.2, uv.y) * (1.0 - smoothstep(0.1, 0.5, uv.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 1.0, bump)));
  dispersionRed -= diagBLtoTR;

  float dispersionBlue = colorDispersion * 1.3;
  dispersionBlue += (smoothstep(0.0, 0.4, uv.y) * (1.0 - smoothstep(0.1, 0.8, uv.y))) * (smoothstep(0.4, 0.6, bump) * (1.0 - smoothstep(0.4, 0.8, bump)));
  dispersionBlue -= 0.2 * edge;

  dispersionRed *= u_shiftRed / 20.0;
  dispersionBlue *= u_shiftBlue / 20.0;

  float softness = 0.05 * u_softness;
  float blur = softness + 0.5 * smoothstep(1.0, 10.0, u_repetition) * smoothstep(0.0, 1.0, edge);
  float smallCanvas = 1.0 - smoothstep(100.0, 500.0, min(u_resolution.x, u_resolution.y));
  blur += u_smallBlur * smallCanvas * smoothstep(0.0, 1.0, edge);
  float rExtraBlur = softness * (0.05 + 0.1 * (u_shiftRed / 20.0) * bump);
  float gExtraBlur = softness * 0.05 / max(0.001, abs(1.0 - diagBLtoTR));

  vec3 w = vec3(thinStrip1 * cycleWidth, thinStrip2 * cycleWidth, wideStrip);
  w[1] -= 0.02 * smoothstep(0.0, 1.0, edge + bump);
  float stripeR = fract(direction + dispersionRed);
  float r = getColorChanges(color1.r, color2.r, stripeR, w, blur + fwidth(stripeR) + rExtraBlur, bump, u_colorTint.r);
  float stripeG = fract(direction);
  float g = getColorChanges(color1.g, color2.g, stripeG, w, blur + fwidth(stripeG) + gExtraBlur, bump, u_colorTint.g);
  float stripeB = fract(direction - dispersionBlue);
  float b = getColorChanges(color1.b, color2.b, stripeB, w, blur + fwidth(stripeB), bump, u_colorTint.b);

  vec3 sheen = mix(vec3(1.0), u_colorTint.rgb, 0.45 * u_colorTint.a);
  r *= sheen.r;
  g *= sheen.g;
  b *= sheen.b;

  float rim = smoothstep(0.78, 1.0, depth) * u_light;
  r *= 1.0 - rim * 0.62;
  g *= 1.0 - rim * 0.62;
  b *= 1.0 - rim * 0.58;

  float pour = u_reveal * 1.25 - 0.1;
  opacity *= smoothstep(1.0 - pour, 1.15 - pour, depth) * smoothstep(0.0, 0.25, u_reveal);

  vec3 color = vec3(r, g, b) * opacity;
  vec3 back = u_colorBack.rgb * u_colorBack.a;
  color += back * (1.0 - opacity);
  opacity += u_colorBack.a * (1.0 - opacity);
  color += 1.0 / 256.0 * (fract(sin(dot(0.014 * gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453123) - 0.5);
  fragColor = vec4(color, opacity);
}`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mkCanvas = (w, h) => {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
};

const parseColor = (() => {
  let context = null;
  return (value, fallback) => {
    context ??= mkCanvas(1, 1).getContext('2d', { willReadFrequently: true });
    if (!context) return fallback;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillStyle = String(value);
    context.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255, a / 255];
  };
})();


// the name, set in its font on a transparent canvas: one line, or several centred
const drawLines = async (lines, fontFamily, fontWeight) => {
    const size = 320;
    const font = `${fontWeight} ${size}px ${fontFamily}`;
    try { await document.fonts?.load(font, lines.join(' ')); } catch { return null; }
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = font;
    const ms = lines.map((t) => probe.measureText(t));
    const asc = Math.max(...ms.map((m) => m.actualBoundingBoxAscent || size * 0.8));
    const desc = Math.max(...ms.map((m) => m.actualBoundingBoxDescent || size * 0.2));
    const widths = ms.map((m) => (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width));
    const lineH = (asc + desc) * 1.02, pad = size * 0.12;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(Math.max(...widths) + pad * 2);
    canvas.height = Math.ceil(lineH * lines.length + pad * 2);
    const ctx = canvas.getContext('2d');
    ctx.font = font; ctx.fillStyle = '#000'; ctx.textBaseline = 'alphabetic';
    lines.forEach((t, k) => ctx.fillText(t, (canvas.width - widths[k]) / 2 + (ms[k].actualBoundingBoxLeft || 0), pad + asc + k * lineH));
    return canvas;
};

const solvePoisson = (mask, width, height) => {
  const interior = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!mask[i]) continue;
      const boundary =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        !mask[i - 1] ||
        !mask[i + 1] ||
        !mask[i - width] ||
        !mask[i + width] ||
        !mask[i - width - 1] ||
        !mask[i - width + 1] ||
        !mask[i + width - 1] ||
        !mask[i + width + 1];
      if (!boundary) interior.push(i);
    }
  }
  const field = new Float32Array(width * height);
  const red = [];
  const black = [];
  interior.forEach(i => (((i % width) + Math.floor(i / width)) % 2 === 0 ? red.push(i) : black.push(i)));
  const relax = list => {
    for (let k = 0; k < list.length; k++) {
      const i = list[k];
      const sum = field[i + 1] + field[i - 1] + field[i - width] + field[i + width];
      field[i] = 1.9 * ((0.01 + sum) / 4) - 0.9 * field[i];
    }
  };
  for (let iteration = 0; iteration < 40; iteration++) {
    relax(red);
    relax(black);
  }
  let peak = 0;
  interior.forEach(i => {
    if (field[i] > peak) peak = field[i];
  });
  return { field, peak: peak || 1 };
};

const processShape = (input) => {
  // a canvas, or the raw pixels of one (ImageData, from the page to the worker)
  let source = input;
  if (typeof ImageData !== 'undefined' && input instanceof ImageData) { source = mkCanvas(input.width, input.height); source.getContext('2d', { willReadFrequently: true }).putImageData(input, 0, 0); }
  const width = source.width;
  const height = source.height;
  const fit = WORKING_SIZE / Math.min(width, height);
  const workW = Math.max(2, Math.round(width * fit));
  const workH = Math.max(2, Math.round(height * fit));

  const small = mkCanvas(workW, workH);
  const smallCtx = small.getContext('2d', { willReadFrequently: true });
  smallCtx.drawImage(source, 0, 0, workW, workH);
  const smallData = smallCtx.getImageData(0, 0, workW, workH).data;
  const mask = new Uint8Array(workW * workH);
  for (let i = 0; i < mask.length; i++) mask[i] = smallData[i * 4 + 3] > 0 ? 1 : 0;

  const { field, peak } = solvePoisson(mask, workW, workH);
  const gradient = smallCtx.createImageData(workW, workH);
  for (let i = 0; i < mask.length; i++) {
    const p = i * 4;
    const value = mask[i] ? 255 * (1 - field[i] / peak) : 255;
    gradient.data[p] = value;
    gradient.data[p + 1] = value;
    gradient.data[p + 2] = value;
    gradient.data[p + 3] = mask[i] ? 255 : 0;
  }
  smallCtx.putImageData(gradient, 0, 0);

  const out = mkCanvas(width, height);
  const outCtx = out.getContext('2d', { willReadFrequently: true });
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(small, 0, 0, workW, workH, 0, 0, width, height);
  const result = outCtx.getImageData(0, 0, width, height);
  const original = source.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, width, height).data;
  for (let i = 0; i < result.data.length; i += 4) {
    const alpha = original[i + 3];
    if (alpha === 0) {
      result.data[i] = 255;
      result.data[i + 1] = 0;
    } else {
      result.data[i] = result.data[i + 3] === 0 ? 0 : result.data[i];
      result.data[i + 1] = alpha;
    }
    result.data[i + 2] = 255;
    result.data[i + 3] = 255;
  }
  return result;
};

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};


export const DEFAULTS = {
    lines: ['Cameron'], fontFamily: 'system-ui, sans-serif', fontWeight: 400,
    color: '#ffffff', backgroundColor: 'transparent', density: 2, softness: 0.1, dispersion: 0.3,
    distortion: 0.07, edgeBend: 0.6, angle: 70, speed: 1, scale: 0.6, rotation: 0, mouseTilt: 0.5,
    lightMode: false, intro: true, paused: false, dpr: undefined, minRatio: 2, smallBlur: 1, maxPixels: MAX_PIXELS, fps: 60, reduce: false,
};

// The renderer itself, the same on the page and in a worker (metallic-worker.js): a WebGL2
// canvas (a page canvas or an OffscreenCanvas), the shape, the frame loop. Returns null
// without WebGL2.
export function createPaintCore(canvas, s, { onReady } = {}) {
    let gl = null;
    try { gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false }); } catch { gl = null; }
    if (!gl) return null;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const raf = typeof requestAnimationFrame === 'function' ? (f) => requestAnimationFrame(f) : (f) => setTimeout(() => f(performance.now()), 16);
    const caf = typeof cancelAnimationFrame === 'function' ? (id) => cancelAnimationFrame(id) : (id) => clearTimeout(id);

    const tint = parseColor(s.color, [1, 1, 1, 1]), back = parseColor(s.backgroundColor, [0, 0, 0, 0]);
    const u = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) { const info = gl.getActiveUniform(program, i); if (info) u[info.name] = gl.getUniformLocation(program, info.name); }
    const vao = gl.createVertexArray(), buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(u.u_image, 0);

    const reduce = !!s.reduce;
    const st = { raf: 0, last: 0, time: 0, visible: true, hidden: false, pending: true, hasImage: false, imageAspect: 1, width: 0, height: 0,
        revealStart: -1, reveal: s.intro && !reduce ? 0 : 1, tiltX: 0, tiltY: 0, vX: 0, vY: 0, tX: 0, tY: 0, alive: true, ready: false };

    const draw = () => {
        if (st.pending || !st.hasImage) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); return; }
        gl.useProgram(program);
        gl.uniform2f(u.u_resolution, st.width, st.height);
        gl.uniform1f(u.u_time, st.time);
        gl.uniform1f(u.u_imageAspect, st.imageAspect);
        gl.uniform1f(u.u_scale, s.scale);
        gl.uniform1f(u.u_rotation, s.rotation);
        gl.uniform4f(u.u_colorBack, back[0], back[1], back[2], back[3]);
        gl.uniform4f(u.u_colorTint, tint[0], tint[1], tint[2], tint[3]);
        gl.uniform1f(u.u_softness, s.softness);
        gl.uniform1f(u.u_repetition, s.density);
        gl.uniform1f(u.u_shiftRed, s.dispersion);
        gl.uniform1f(u.u_shiftBlue, s.dispersion);
        gl.uniform1f(u.u_distortion, s.distortion);
        gl.uniform1f(u.u_contour, s.edgeBend);
        gl.uniform1f(u.u_angle, s.angle);
        gl.uniform2f(u.u_tilt, st.tiltX, st.tiltY);
        gl.uniform1f(u.u_reveal, st.reveal);
        gl.uniform1f(u.u_light, s.lightMode ? 1 : 0);
        gl.uniform1f(u.u_smallBlur, s.smallBlur);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const minGap = 1000 / Math.max(1, s.fps) - 2;
    let lastDraw = 0;
    const frame = (now) => {
        st.raf = 0;
        if (!st.alive) return;
        if (now - lastDraw < minGap) { st.raf = raf(frame); return; }   // (a frame-rate cap: cheaper)
        lastDraw = now;
        const dt = st.last ? Math.min(0.05, (now - st.last) / 1000) : 1 / 60;
        st.last = now;
        const moving = !s.paused && !reduce && s.speed !== 0;
        if (moving) st.time += dt * s.speed;
        let busy = moving;
        if (st.reveal < 1 && !st.pending) {
            if (st.revealStart < 0) st.revealStart = now;
            const p = clamp((now - st.revealStart) / 1600, 0, 1);
            st.reveal = 1 - (1 - p) ** 3;
            if (moving) st.time += dt * 2.4 * (1 - p) ** 2;
            busy = true;
        }
        const k = 60, damp = 14, steps = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / steps;
        for (let i = 0; i < steps; i++) {
            st.vX += (k * (st.tX * s.mouseTilt - st.tiltX) - damp * st.vX) * h;
            st.vY += (k * (st.tY * s.mouseTilt - st.tiltY) - damp * st.vY) * h;
            st.tiltX += st.vX * h; st.tiltY += st.vY * h;
        }
        if (Math.abs(st.tX * s.mouseTilt - st.tiltX) > 0.0005 || Math.abs(st.tY * s.mouseTilt - st.tiltY) > 0.0005 || Math.abs(st.vX) + Math.abs(st.vY) > 0.0005) busy = true;
        draw();
        if (busy && st.visible && !st.hidden) st.raf = raf(frame);
        else st.last = 0;
    };
    const wake = () => { if (!st.raf && st.alive && st.visible && !st.hidden) st.raf = raf(frame); };
    return {
        get ready() { return st.ready; },
        size(w, h) {
            w = Math.max(1, w | 0); h = Math.max(1, h | 0);
            if (w === st.width && h === st.height) return;
            st.width = w; st.height = h; canvas.width = w; canvas.height = h;
            gl.viewport(0, 0, w, h); draw();
        },
        pending() { st.pending = true; draw(); },
        shape(src) {                                   // a canvas or ImageData with the shape in black
            if (!st.alive) return;
            const data = processShape(src);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            st.imageAspect = data.width / data.height;
            st.hasImage = true; st.pending = false;
            draw(); wake();
            if (!st.ready) { st.ready = true; onReady?.(); }
        },
        tilt(x, y) { st.tX = x; st.tY = y; wake(); },
        visible(v) { st.visible = v; wake(); },
        hidden(h) { st.hidden = h; if (h) { caf(st.raf); st.raf = 0; } else wake(); },
        paused(p) { s.paused = !!p; wake(); },
        lost() { st.alive = false; caf(st.raf); },
        destroy() {
            if (!st.alive) return;
            st.alive = false; caf(st.raf);
            gl.deleteTexture(texture); gl.deleteBuffer(buffer); gl.deleteVertexArray(vao); gl.deleteProgram(program);
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        },
    };
}

// Off the page's thread when it can be (opts.worker): the canvas goes to a worker
// (OffscreenCanvas), which draws on its own, so the page building the room doesn't stall it.
let workerOk;
const canWorker = () => (workerOk ??= (() => {
    try {
        if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || !('transferControlToOffscreen' in HTMLCanvasElement.prototype)) return false;
        const gl = new OffscreenCanvas(1, 1).getContext('webgl2');
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
        return !!gl;
    } catch { return false; }
})());
const workerFor = (canvas, s, onReady, onFail) => {
    // its own worker, or (opts.sharedWorker + opts.workerTag) one shared with the rest of the loading
    // screen (intro-worker.js), messages tagged with who they're for
    const shared = s.sharedWorker || null, tag = s.workerTag || 'paint';
    let w = shared;
    if (!w) { try { w = new Worker(new URL('./metallic-worker.js?v=93', import.meta.url), { type: 'module' }); } catch { return null; } }
    const off = canvas.transferControlToOffscreen();
    const { tiltTarget, shape, sharedWorker, workerTag, ...plain } = s;
    const post = (m, t) => w.postMessage(shared ? { ...m, to: tag } : m, t || []);
    const onMsg = (e) => {
        const d = e.data || {};
        if (shared && d.from !== tag) return;
        if (d.type === 'ready') onReady(); else if (d.type === 'fail') onFail();
    };
    w.addEventListener('message', onMsg);
    if (!shared) w.onerror = () => onFail();
    post({ type: 'init', canvas: off, opts: plain }, [off]);
    let st = { ready: false };
    return {
        get ready() { return st.ready; },
        size: (wd, ht) => post({ type: 'size', w: wd, h: ht }),
        pending: () => post({ type: 'pending' }),
        shape: (src) => {
            const c = src.getContext ? src : null;
            const data = c ? c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height) : src;
            post({ type: 'shape', data });
        },
        tilt: (x, y) => post({ type: 'tilt', x, y }),
        visible: (v) => post({ type: 'visible', v }),
        hidden: (h) => post({ type: 'hidden', h }),
        paused: (p) => post({ type: 'paused', p }),
        lost: () => {},
        destroy: () => { post({ type: 'destroy' }); w.removeEventListener('message', onMsg); if (!shared) setTimeout(() => w.terminate(), 50); },
        _mark: () => { st.ready = true; },
    };
};

export function createMetallicPaint(container, opts = {}) {
    const s = { ...DEFAULTS, ...opts };
    s.reduce = matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const canvas = document.createElement('canvas');
    canvas.className = 'metallic-paint-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    let ready = false, onReady = null;
    const fireReady = () => { if (ready) return; ready = true; core?._mark?.(); onReady?.(); };
    let core = null, canvasNow = canvas, lastSrc = null, fellBack = false;
    // if the worker can't draw (no GPU in workers, or it stalls), the page draws it after all
    const fallBack = () => {
        if (fellBack || ready || !alive) return;
        fellBack = true;
        core?.destroy();
        const c = canvas.cloneNode(false);
        const main = createPaintCore(c, s, { onReady: fireReady });
        if (!main) return;
        canvasNow.replaceWith(c); canvasNow = c; core = main;
        c.addEventListener('webglcontextlost', onLost);
        width = 0; height = 0; resize();
        if (lastSrc) core.shape(lastSrc);
    };
    if (s.worker && canWorker()) core = workerFor(canvas, s, fireReady, () => fallBack());
    if (!core) core = createPaintCore(canvas, s, { onReady: fireReady });
    if (!core) return null;
    container.appendChild(canvas);

    let width = 0, height = 0, alive = true;
    const resize = () => {
        const rect = container.getBoundingClientRect();
        const base = s.dpr ?? Math.min(devicePixelRatio || 1, 2);
        let ratio = Math.max(base, s.minRatio);
        const pixels = rect.width * rect.height * ratio * ratio;
        if (pixels > s.maxPixels) ratio *= Math.sqrt(s.maxPixels / pixels);
        const w = Math.max(1, Math.round(rect.width * ratio)), h = Math.max(1, Math.round(rect.height * ratio));
        if (w === width && h === height) return;
        width = w; height = h; core.size(w, h);
    };
    const onVis = () => core.hidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    const tiltFrom = s.tiltTarget || container;
    const onMove = (e) => {
        const r = tiltFrom.getBoundingClientRect();
        core.tilt(clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.2, 1.2), clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1.2, 1.2));
    };
    const onLeave = () => core.tilt(0, 0);
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    const io = new IntersectionObserver((es) => core.visible(es.some((e) => e.isIntersecting)));
    io.observe(container);
    const onLost = (e) => { e.preventDefault(); core.lost(); };
    canvas.addEventListener('webglcontextlost', onLost);
    tiltFrom.addEventListener('pointermove', onMove);
    tiltFrom.addEventListener('pointerleave', onLeave);

    let job = 0;
    const setLines = (lines) => {
        const mine = ++job;
        core.pending();
        // a shape instead of words (opts.shape(): a canvas with the shape in black), e.g. a button
        return (s.shape ? Promise.resolve(s.shape()) : drawLines(lines, s.fontFamily, s.fontWeight)).then((src) => {
            if (mine !== job || !alive || !src) return false;
            resize(); lastSrc = src; core.shape(src);
            if (s.worker && !fellBack && !ready) setTimeout(() => { if (!ready) fallBack(); }, s.workerWait ?? 3500);
            return true;
        }).catch(() => false);
    };
    resize();
    setLines(s.lines);

    return {
        get canvas() { return canvasNow; },
        get ready() { return ready; },
        onReady(fn) { if (ready) fn(); else onReady = fn; },
        setLines,
        setPaused(p) { core.paused(p); },
        destroy() {
            if (!alive) return;
            alive = false;
            ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis);
            canvasNow.removeEventListener('webglcontextlost', onLost);
            tiltFrom.removeEventListener('pointermove', onMove);
            tiltFrom.removeEventListener('pointerleave', onLeave);
            core.destroy();
            canvasNow.remove();
        },
    };
}
