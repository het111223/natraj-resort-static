// 3D entrance for Hotel Natraj & Resort.
// A haveli gateway in a limewashed wall; scrolling opens the doors and walks
// the camera through into the courtyard at dusk. All textures are painted
// on canvases here, so nothing extra has to be downloaded.
//
// Build: npx esbuild src/scene.js --bundle --minify --format=iife --outfile=js/scene.js

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const gate = document.getElementById('gate');
const stage = gate && gate.querySelector('.gate__stage');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The doors still open as you scroll when the OS asks for reduced motion;
// only the drifting camera and mouse parallax are switched off.
if (stage && webglOK()) {
  document.fonts.load('600 120px Rasa').catch(() => {}).finally(start);
}

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

/* ---------------- helpers ---------------- */

const rand = mulberry(7);
function mulberry(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function canvasTex(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

function speckle(g, w, h, n, colors, rMax) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(rand() * colors.length) | 0];
    g.beginPath();
    g.arc(rand() * w, rand() * h, rand() * rMax, 0, 6.283);
    g.fill();
  }
}

/* ---------------- textures ---------------- */

function limewash() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#eadcc0'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = rand() * w, y = rand() * h, r = 20 + rand() * 90;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const c = rand() < .5 ? '170,130,80' : '255,250,235';
      gr.addColorStop(0, `rgba(${c},${.025 + rand() * .035})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    speckle(g, w, h, 3000, ['rgba(120,90,50,.08)', 'rgba(255,255,255,.12)'], 1.4);
  }, { repeat: [7, 3] });
}

function tiles(n) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#8a3524'; g.fillRect(0, 0, w, h);
    const s = w / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = `hsl(${8 + rand() * 6},${48 + rand() * 10}%,${30 + rand() * 6}%)`;
      g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
    }
    speckle(g, w, h, 4000, ['rgba(0,0,0,.08)', 'rgba(255,200,170,.06)'], 2);
    g.strokeStyle = 'rgba(40,15,8,.6)'; g.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  }, { repeat: [n, n] });
}

function courtyardGround() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#3f5a2a'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 9000, ['#36502a', '#4b6a34', '#557a3a', '#2f4522'], 2.2);
  }, { repeat: [14, 14] });
}

function stonePath() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#b9a789'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 1500, ['rgba(0,0,0,.08)', 'rgba(255,255,255,.1)'], 1.5);
    g.strokeStyle = 'rgba(70,55,40,.5)'; g.lineWidth = 3;
    g.strokeRect(1, 1, w - 2, h - 2);
  }, { repeat: [1, 6] });
}

// Door leaf: teak with three raised panels, carved rosettes and brass bosses.
function doorLeaf(mirror) {
  return canvasTex(512, 1024, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, w, 0);
    grd.addColorStop(0, '#4f2b18'); grd.addColorStop(.5, '#6a3b22'); grd.addColorStop(1, '#55301b');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    // grain
    for (let i = 0; i < 160; i++) {
      const x = rand() * w;
      g.strokeStyle = `rgba(${rand() < .5 ? '25,10,4' : '150,95,55'},${.08 + rand() * .12})`;
      g.lineWidth = .5 + rand() * 1.8;
      g.beginPath(); g.moveTo(x, 0);
      for (let y = 0; y <= h; y += 32) g.lineTo(x + Math.sin(y * .01 + i) * 4, y);
      g.stroke();
    }
    const px = 70, pw = w - 140, rows = [[70, 250], [380, 330], [770, 190]];
    rows.forEach(([y, ph]) => {
      g.fillStyle = 'rgba(30,12,4,.35)'; g.fillRect(px - 10, y - 10, pw + 20, ph + 20);
      g.fillStyle = '#5c321c'; g.fillRect(px, y, pw, ph);
      g.strokeStyle = 'rgba(255,200,140,.25)'; g.lineWidth = 4;
      g.beginPath(); g.moveTo(px, y + ph); g.lineTo(px, y); g.lineTo(px + pw, y); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.5)';
      g.beginPath(); g.moveTo(px + pw, y); g.lineTo(px + pw, y + ph); g.lineTo(px, y + ph); g.stroke();
      // rosette
      const cx = px + pw / 2, cy = y + ph / 2, R = Math.min(pw, ph) * .36;
      g.save(); g.translate(cx, cy);
      g.strokeStyle = '#2b1309'; g.lineWidth = 3; g.fillStyle = '#6e3e22';
      for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.ellipse(0, -R * .5, R * .17, R * .5, 0, 0, 6.283); g.fill(); g.stroke(); }
      g.setLineDash([5, 7]); g.beginPath(); g.arc(0, 0, R * 1.12, 0, 6.283); g.stroke(); g.setLineDash([]);
      const b = g.createRadialGradient(-R * .06, -R * .06, 1, 0, 0, R * .2);
      b.addColorStop(0, '#fbe3a0'); b.addColorStop(.6, '#c4953f'); b.addColorStop(1, '#6b4a14');
      g.fillStyle = b; g.beginPath(); g.arc(0, 0, R * .2, 0, 6.283); g.fill();
      g.restore();
    });
    // brass strip on the meeting edge
    const ex = mirror ? 0 : w - 26;
    const s = g.createLinearGradient(ex, 0, ex + 26, 0);
    s.addColorStop(0, '#7d5a1d'); s.addColorStop(.5, '#d9ae5a'); s.addColorStop(1, '#7d5a1d');
    g.fillStyle = s; g.fillRect(ex, 0, 26, h);
    for (let y = 18; y < h; y += 40) {
      const st = g.createRadialGradient(ex + 11, y - 2, 1, ex + 13, y, 9);
      st.addColorStop(0, '#fff1c0'); st.addColorStop(.5, '#d1a54e'); st.addColorStop(1, '#5d4012');
      g.fillStyle = st; g.beginPath(); g.arc(ex + 13, y, 8, 0, 6.283); g.fill();
    }
  });
}

function ajrakh() {
  return canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#1d2b49'; g.fillRect(0, 0, w, h);
    for (let x = 32; x < w; x += 64) {
      g.save(); g.translate(x, h / 2);
      g.fillStyle = '#9b2b1e';
      g.fillRect(-14, -14, 28, 28); g.rotate(Math.PI / 4); g.fillRect(-14, -14, 28, 28);
      g.fillStyle = '#f4ecdd'; g.beginPath(); g.arc(0, 0, 7, 0, 6.283); g.fill();
      g.fillStyle = '#1d2b49'; g.beginPath(); g.arc(0, 0, 3, 0, 6.283); g.fill();
      g.restore();
      g.fillStyle = '#d8992a'; g.beginPath(); g.arc(x + 32, h / 2, 4, 0, 6.283); g.fill();
    }
    g.fillStyle = '#d8992a'; g.fillRect(0, 0, w, 4); g.fillRect(0, h - 4, w, 4);
  }, { repeat: [4, 1] });
}

// Kutchi lippan: raised white clay lines on earth, with mirror positions returned.
function lippan() {
  const W = 360, H = 540, cols = 3, rows = 5, m = 24, mirrors = [];
  const tex = canvasTex(W, H, (g) => {
    g.fillStyle = '#a5633b'; g.fillRect(0, 0, W, H);
    speckle(g, W, H, 1500, ['rgba(0,0,0,.08)', 'rgba(255,220,180,.06)'], 1.6);
    g.strokeStyle = '#f5eee0'; g.lineWidth = 6; g.lineJoin = 'round';
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowOffsetX = 2; g.shadowOffsetY = 3; g.shadowBlur = 2;
    g.strokeRect(10, 10, W - 20, H - 20); g.strokeRect(m, m, W - 2 * m, H - 2 * m);
    const cw = (W - 2 * m) / cols, ch = (H - 2 * m) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = m + c * cw + cw / 2, y = m + r * ch + ch / 2;
      [[cw / 2, ch / 2], [cw / 3.3, ch / 3.3]].forEach(([a, b]) => {
        g.beginPath(); g.moveTo(x, y - b); g.lineTo(x + a, y); g.lineTo(x, y + b); g.lineTo(x - a, y); g.closePath(); g.stroke();
      });
      mirrors.push([x / W, y / H, 11 / W]);
      if (r > 0 && c > 0) mirrors.push([(m + c * cw) / W, (m + r * ch) / H, 7 / W]);
    }
    g.shadowColor = 'transparent';
    mirrors.forEach(([x, y, r]) => { g.fillStyle = '#f5eee0'; g.beginPath(); g.arc(x * W, y * H, r * W + 4, 0, 6.283); g.fill(); });
  });
  return { tex, mirrors, aspect: W / H };
}

function rangoli() {
  return canvasTex(1024, 1024, (g, w) => {
    g.translate(w / 2, w / 2);
    const powder = (x, y, r, c, n = 26) => {
      g.fillStyle = c;
      for (let i = 0; i < n; i++) {
        const a = rand() * 6.283, d = rand() * r;
        g.globalAlpha = .6 + rand() * .4;
        g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, .8 + rand() * 1.6, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1;
    };
    const petals = (n, r, len, wid, c, rot = 0) => {
      for (let i = 0; i < n; i++) {
        g.save(); g.rotate(i * 6.283 / n + rot);
        g.fillStyle = c; g.beginPath(); g.ellipse(0, -(r + len), wid, len, 0, 0, 6.283); g.fill();
        for (let k = 0; k < 30; k++) powder((rand() - .5) * wid * 1.6, -(r + len) + (rand() - .5) * len * 1.8, 4, c, 3);
        g.restore();
      }
    };
    petals(8, 0, 120, 44, '#f2ad1d');
    petals(8, 0, 90, 28, '#d42a3c', Math.PI / 8);
    petals(16, 150, 85, 28, '#2f63c4');
    petals(16, 150, 55, 14, '#f6f0e2');
    petals(24, 270, 70, 24, '#ee6a1c', Math.PI / 24);
    petals(24, 270, 40, 10, '#f6f0e2', Math.PI / 24);
    g.fillStyle = '#3a9a48'; g.beginPath(); g.arc(0, 0, 34, 0, 6.283); g.fill();
    g.fillStyle = '#f6f0e2'; g.beginPath(); g.arc(0, 0, 13, 0, 6.283); g.fill();
    for (let i = 0; i < 64; i++) { const a = i * 6.283 / 64; powder(Math.cos(a) * 470, Math.sin(a) * 470, 7, '#f6f0e2', 30); }
  });
}

function textTex(txt, color, w = 256, h = 512, vertical = true) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = color;
    g.font = '600 120px Rasa, "Noto Serif Gujarati", serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (vertical) { g.translate(w / 2, h / 2); g.rotate(Math.PI / 2); g.fillText(txt, 0, 0); }
    else g.fillText(txt, w / 2, h / 2);
  });
}

function glowTex() {
  return canvasTex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,220,150,1)'); r.addColorStop(.25, 'rgba(255,160,60,.55)'); r.addColorStop(1, 'rgba(255,120,30,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
}

/* ---------------- scene ---------------- */

function start() {
  const mobile = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'gate__gl';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a1626, 30, 95);
  const camera = new THREE.PerspectiveCamera(45, 1, .05, 400);

  // Sky dome: deep indigo overhead, saffron at the horizon, a low sun behind the courtyard.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {},
    vertexShader: 'varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 d;
      void main(){
        float h = d.y;
        vec3 top = vec3(.012,.018,.06), mid = vec3(.05,.05,.14), hor = vec3(.26,.13,.16);
        vec3 c = mix(hor, mid, smoothstep(.0,.18,h));
        c = mix(c, top, smoothstep(.15,.6,h));
        vec3 q = floor(d * 380.);
        float st = fract(sin(dot(q, vec3(12.9898,78.233,45.164))) * 43758.5453);
        c += vec3(.9,.92,1.) * step(.9965, st) * smoothstep(.05,.4,h) * .9;
        c = mix(c, vec3(.35,.22,.2), smoothstep(0.,-.15,h));
        gl_FragColor = vec4(c,1.);
      }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 48, 24), skyMat);
  scene.add(sky);

  // Environment light for the brass, mirrors and pool, baked from the sky.
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat));
  scene.environment = pm.fromScene(envScene, .04).texture;
  scene.environmentIntensity = .35;

  // Lights
  scene.add(new THREE.HemisphereLight(0x6d7bb0, 0x2a1810, .55));
  const sun = new THREE.DirectionalLight(0x9fb2e8, .55);  // moonlight
  sun.position.set(-14, 22, 10);
  sun.target.position.set(0, 0, -12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 });
  sun.shadow.bias = -.0005;
  scene.add(sun, sun.target);
  const front = new THREE.DirectionalLight(0xffd2a0, .35);
  front.position.set(-4, 6, 12);
  scene.add(front);

  /* --- ground --- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({ map: courtyardGround(), roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const fore = new THREE.Mesh(new THREE.PlaneGeometry(16, 12),
    new THREE.MeshStandardMaterial({ map: tiles(6), roughness: .55, metalness: 0 }));
  fore.rotation.x = -Math.PI / 2;
  fore.position.set(0, .004, 6.25);
  fore.receiveShadow = true;
  scene.add(fore);

  const rg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2),
    new THREE.MeshStandardMaterial({ map: rangoli(), transparent: true, roughness: .95, polygonOffset: true, polygonOffsetFactor: -2 }));
  rg.rotation.x = -Math.PI / 2;
  rg.position.set(0, .01, 1.85);
  rg.receiveShadow = true;
  scene.add(rg);

  /* --- wall with the doorway cut out --- */
  const DW = 1.7, DH = 2.7, T = .5, WH = 4.0, WW = 30;
  const wallMat = new THREE.MeshStandardMaterial({ map: limewash(), roughness: .95 });
  const wallPiece = (w, h, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, T), wallMat);
    m.position.set(x, y, 0); m.castShadow = m.receiveShadow = true; scene.add(m);
  };
  const side = (WW - DW) / 2;
  wallPiece(side, WH, -(DW / 2 + side / 2), WH / 2);
  wallPiece(side, WH, DW / 2 + side / 2, WH / 2);
  wallPiece(DW, WH - DH, 0, DH + (WH - DH) / 2);
  // coping on top of the wall, and a stone skirting at the bottom
  const stone = new THREE.MeshStandardMaterial({ color: 0x6d5a48, roughness: .85 });
  const coping = new THREE.Mesh(new THREE.BoxGeometry(WW + .2, .16, T + .16), new THREE.MeshStandardMaterial({ color: 0x9b2b1e, roughness: .8 }));
  coping.position.set(0, WH + .08, 0); scene.add(coping);
  [-1, 1].forEach(s => {
    const sk = new THREE.Mesh(new THREE.BoxGeometry(side, .28, .06), stone);
    sk.position.set(s * (DW / 2 + side / 2), .14, T / 2 + .03); sk.receiveShadow = true; scene.add(sk);
  });

  /* --- door frame, lintel and threshold --- */
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a2a17, roughness: .7 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc8984a, metalness: 1, roughness: .28 });
  const FP = .2;
  [-1, 1].forEach(s => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(FP, DH, T + .14), wood);
    post.position.set(s * (DW / 2 + FP / 2 - .001), DH / 2, 0); post.castShadow = true; scene.add(post);
    const bead = new THREE.Mesh(new THREE.BoxGeometry(.035, DH - .05, .03), brass);
    bead.position.set(s * (DW / 2 + .02), DH / 2, T / 2 + .085); scene.add(bead);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(DW + FP * 2 + .5, .42, T + .3), [
    wood, wood, wood, wood,
    new THREE.MeshStandardMaterial({ map: ajrakh(), roughness: .8 }), wood
  ]);
  lintel.position.set(0, DH + .21, .02); lintel.castShadow = true; scene.add(lintel);
  const lbrass = new THREE.Mesh(new THREE.BoxGeometry(DW + FP * 2 + .5, .035, .04), brass);
  lbrass.position.set(0, DH + .015, T / 2 + .17); scene.add(lbrass);
  const step = new THREE.Mesh(new THREE.BoxGeometry(DW + FP * 2 + .3, .12, T + .7), stone);
  step.position.set(0, .06, .15); step.receiveShadow = step.castShadow = true; scene.add(step);

  /* --- door leaves, hinged at the posts, opening inward --- */
  const leaves = [];
  [-1, 1].forEach(s => {
    const pivot = new THREE.Group();
    pivot.position.set(s * DW / 2, .12, -.05);
    const leafW = DW / 2 - .005, leafH = DH - .14;
    const tex = doorLeaf(s > 0);
    const face = new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 2.2, roughness: .62 });
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, leafH, .09), [wood, wood, wood, wood, face, face]);
    leaf.position.set(-s * leafW / 2, leafH / 2, 0);
    leaf.castShadow = leaf.receiveShadow = true;
    pivot.add(leaf);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.065, .012, 10, 28), brass);
    ring.position.set(-s * (leafW - .17), leafH * .5, .065);
    pivot.add(ring);
    const boss = new THREE.Mesh(new THREE.SphereGeometry(.022, 16, 10), brass);
    boss.position.set(-s * (leafW - .17), leafH * .5 + .07, .055);
    pivot.add(boss);
    scene.add(pivot);
    leaves.push({ pivot, s });
  });

  /* --- toran: cloth flags on a cord, moving in the breeze --- */
  const flags = [];
  const toranW = DW + 1.0, nFlags = 13;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, toranW, 6), new THREE.MeshStandardMaterial({ color: 0x3a2416 }));
  cord.rotation.z = Math.PI / 2; cord.position.set(0, DH - .02, T / 2 + .22); scene.add(cord);
  const flagShape = new THREE.Shape(); flagShape.moveTo(-.085, 0); flagShape.lineTo(.085, 0); flagShape.lineTo(0, -.24); flagShape.closePath();
  const inShape = new THREE.Shape(); inShape.moveTo(-.045, -.005); inShape.lineTo(.045, -.005); inShape.lineTo(0, -.11); inShape.closePath();
  const fGeo = new THREE.ShapeGeometry(flagShape), iGeo = new THREE.ShapeGeometry(inShape);
  const fCols = [0xd42a3c, 0x1d2b49, 0x3a9a48, 0xee6a1c];
  for (let i = 0; i < nFlags; i++) {
    const p = new THREE.Group();
    p.position.set(-toranW / 2 + .1 + i * (toranW - .2) / (nFlags - 1), DH - .02, T / 2 + .23);
    const f = new THREE.Mesh(fGeo, new THREE.MeshStandardMaterial({ color: fCols[i % 4], side: THREE.DoubleSide, roughness: .9 }));
    const inner = new THREE.Mesh(iGeo, new THREE.MeshStandardMaterial({ color: 0xf2ad1d, side: THREE.DoubleSide, roughness: .9 }));
    inner.position.z = .002;
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.018, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2ad1d, roughness: .4 }));
    bead.position.y = -.27;
    p.add(f, inner, bead); f.castShadow = true;
    scene.add(p); flags.push(p);
  }

  /* --- Shubh / Labh painted in kumkum, and lippan panels --- */
  [['શુભ', -1], ['લાભ', 1]].forEach(([t, s]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.64, .32),
      new THREE.MeshStandardMaterial({ map: textTex(t, '#a8261a', 512, 256, false), transparent: true, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.set(s * (DW / 2 + 1.55), 2.75, T / 2 + .002);
    scene.add(m);
  });
  const lip = lippan();
  const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xe8eef2, metalness: 1, roughness: .06, envMapIntensity: 1.6 });
  const mirrors = [];
  [-1, 1].forEach(s => {
    const h = 1.75, w = h * lip.aspect;
    const g = new THREE.Group();
    g.position.set(s * (DW / 2 + 1.55), 1.55, T / 2 + .015);
    const board = new THREE.Mesh(new THREE.BoxGeometry(w + .1, h + .1, .03), new THREE.MeshStandardMaterial({ color: 0xf1e7d4, roughness: .9 }));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: lip.tex, roughness: .85 }));
    face.position.z = .017;
    g.add(board, face);
    lip.mirrors.forEach(([x, y, r]) => {
      const mm = new THREE.Mesh(new THREE.CircleGeometry(r * w, 20), mirrorMat);
      mm.position.set((x - .5) * w, (.5 - y) * h, .02);
      mm.rotation.set((rand() - .5) * .5, (rand() - .5) * .5, 0); // hand-set, never quite flat
      g.add(mm); mirrors.push(mm);
    });
    scene.add(g);
  });

  /* --- diyas: clay lamps that actually light the scene --- */
  const glow = glowTex();
  const diyas = [];
  const bowlPts = [[0, 0], [.05, 0], [.085, .02], [.1, .045], [.092, .05], [.07, .03], [0, .03]].map(p => new THREE.Vector2(p[0], p[1]));
  const bowlGeo = new THREE.LatheGeometry(bowlPts, 24);
  const clay = new THREE.MeshStandardMaterial({ color: 0xa4482a, roughness: .8, side: THREE.DoubleSide });
  const addDiya = (x, z, light) => {
    const g = new THREE.Group(); g.position.set(x, .12, z);
    const bowl = new THREE.Mesh(bowlGeo, clay); bowl.scale.set(1, 1, .8); bowl.castShadow = true;
    const flame = new THREE.Mesh(new THREE.SphereGeometry(.02, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
    flame.scale.set(1, 2.6, 1); flame.position.set(.06, .1, 0);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffb066, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    halo.scale.set(.5, .5, .5); halo.position.copy(flame.position);
    g.add(bowl, flame, halo);
    let pl = null;
    if (light) { pl = new THREE.PointLight(0xff9440, 2.2, 5, 1.6); pl.position.set(.06, .2, 0); g.add(pl); }
    scene.add(g);
    diyas.push({ flame, halo, pl, seed: rand() * 100 });
  };
  addDiya(-(DW / 2 + .45), .75, true);
  addDiya(DW / 2 + .45, .75, true);
  // diyas around the rangoli, and a row along the path to the building
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    addDiya(Math.cos(a) * 1.22, 1.85 + Math.sin(a) * 1.22, false);
  }
  for (let i = 0; i < 13; i++) { addDiya(-1.15, -1.6 - i * 1.6, !mobile && i % 5 === 2); addDiya(1.15, -1.6 - i * 1.6, false); }

  /* =========================================================
     Hotel Natraj & Resort, modelled from a photo of the property:
     two-storey block with mustard pillars, Rajasthani arched railing
     on the roof, a domed chhatri, gold carved panels by the entrance,
     an arcaded wing on the left, the pool and chhatri lamps on the right,
     the high-mast light and the big lawn in front.
     ========================================================= */
  const BZ = -26;            // front face of the main block
  const BW = 20, BD = 10, GF = 4, FF = 3.6, BH = GF + FF;
  const cream = new THREE.MeshStandardMaterial({ map: limewash(), color: 0xe9dcc6, roughness: .9 });
  const ochre = new THREE.MeshStandardMaterial({ color: 0xd99a2b, roughness: .6 });
  const maroon = new THREE.MeshStandardMaterial({ color: 0x8e2a1d, roughness: .7 });
  const glassLit = new THREE.MeshStandardMaterial({ color: 0x1a1008, emissive: 0xffb05a, emissiveIntensity: .9, roughness: .3 });
  const glassDim = new THREE.MeshStandardMaterial({ color: 0x141820, emissive: 0xffa040, emissiveIntensity: .35, roughness: .2, metalness: .3 });
  const frameW = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: .6 });
  const add = (geo, mat, x, y, z, shadow = true) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    if (shadow) { m.castShadow = true; m.receiveShadow = true; }
    scene.add(m); return m;
  };

  // lawn path
  const pathM = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 26), new THREE.MeshStandardMaterial({ map: stonePath(), roughness: .9 }));
  pathM.material.map.repeat.set(1, 18);
  pathM.rotation.x = -Math.PI / 2; pathM.position.set(0, .006, -13); pathM.receiveShadow = true; scene.add(pathM);

  // main block
  add(new THREE.BoxGeometry(BW, BH, BD), cream, 0, BH / 2, BZ - BD / 2);
  add(new THREE.BoxGeometry(BW + .6, .35, BD + .6), ochre, 0, GF, BZ - BD / 2);          // floor band
  add(new THREE.BoxGeometry(BW + .4, .3, BD + .4), ochre, 0, BH + .15, BZ - BD / 2);     // roof band
  add(new THREE.BoxGeometry(BW + 1, .4, BD + 1), new THREE.MeshStandardMaterial({ color: 0x9a8a74, roughness: .9 }), 0, .2, BZ - BD / 2); // plinth
  // entrance canopy
  add(new THREE.BoxGeometry(8, .3, 2.2), ochre, 0, GF - .25, BZ + 1.1);
  // mustard pillars running full height
  [-5.4, -1.9, 1.9, 5.4].forEach(x => add(new THREE.BoxGeometry(.6, BH, .6), ochre, x, BH / 2, BZ + .3));
  // gold carved panels either side of the entrance
  const goldPanel = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#e3b25a'); gr.addColorStop(.5, '#b8862f'); gr.addColorStop(1, '#8a5f1c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6a4512'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.beginPath(); g.moveTo(50, h - 30); g.lineTo(50, 110); g.quadraticCurveTo(w / 2, 10, w - 50, 110); g.lineTo(w - 50, h - 30); g.stroke();
    g.save(); g.translate(w / 2, 140);
    for (let k = 0; k < 10; k++) { g.rotate(Math.PI / 5); g.beginPath(); g.ellipse(0, -28, 9, 26, 0, 0, 6.283); g.stroke(); }
    g.restore();
    g.fillStyle = '#fff0c0'; g.beginPath(); g.arc(w / 2, 140, 10, 0, 6.283); g.fill();
  });
  const gpMat = new THREE.MeshStandardMaterial({ map: goldPanel, bumpMap: goldPanel, bumpScale: 3, metalness: .7, roughness: .35 });
  [-3.65, 3.65].forEach(x => add(new THREE.BoxGeometry(2.2, 2.6, .15), gpMat, x, 1.75, BZ + .1));
  // glass entrance, lit lobby inside
  add(new THREE.BoxGeometry(2.8, 2.9, .1), glassLit, 0, 1.85, BZ + .05, false);
  add(new THREE.BoxGeometry(.08, 2.9, .14), frameW, 0, 1.85, BZ + .08, false);
  // ground floor windows on the wings of the block
  [-8.4, 8.4].forEach(x => {
    add(new THREE.BoxGeometry(2, 1.8, .1), glassDim, x, 2, BZ + .05, false);
    add(new THREE.BoxGeometry(2.2, .12, .2), frameW, x, 3, BZ + .1, false);
  });
  // first floor: a row of windows with white frames
  for (let i = 0; i < 8; i++) {
    const x = -8.75 + i * 2.5;
    if (Math.abs(x) < .1) continue;
    add(new THREE.BoxGeometry(1.25, 1.55, .1), i % 3 === 1 ? glassDim : glassLit, x, 5.8, BZ + .05, false);
    add(new THREE.BoxGeometry(1.45, .1, .16), frameW, x, 6.62, BZ + .08, false);
    add(new THREE.BoxGeometry(1.45, .1, .16), frameW, x, 4.98, BZ + .08, false);
    add(new THREE.BoxGeometry(.06, 1.55, .14), frameW, x, 5.8, BZ + .08, false);
  }

  // Rajasthani railing of little arches round the roof
  const railTex = canvasTex(512, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#f6eee0'; g.fillRect(0, 0, w, h);
    const n = 8, aw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * aw;
      g.fillStyle = '#d98a2b';
      g.beginPath(); g.moveTo(x + 8, h - 10); g.lineTo(x + 8, 52); g.quadraticCurveTo(x + aw / 2, 6, x + aw - 8, 52); g.lineTo(x + aw - 8, h - 10); g.closePath(); g.fill();
      g.globalCompositeOperation = 'destination-out';
      g.beginPath(); g.moveTo(x + 15, h - 14); g.lineTo(x + 15, 56); g.quadraticCurveTo(x + aw / 2, 18, x + aw - 15, 56); g.lineTo(x + aw - 15, h - 14); g.closePath(); g.fill();
      g.globalCompositeOperation = 'source-over';
    }
    g.fillStyle = '#c0582a'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
  });
  railTex.wrapS = THREE.RepeatWrapping;
  const railMat = (len) => {
    const t = railTex.clone(); t.needsUpdate = true; t.repeat.set(len / 3, 1);
    return new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: .5, side: THREE.DoubleSide, roughness: .8 });
  };
  const RH = 1.1, RY = BH + .3 + RH / 2;
  add(new THREE.PlaneGeometry(BW, RH), railMat(BW), 0, RY, BZ - .1, false);
  add(new THREE.PlaneGeometry(BW, RH), railMat(BW), 0, RY, BZ - BD + .1, false);
  [-1, 1].forEach(s => { const m = add(new THREE.PlaneGeometry(BD, RH), railMat(BD), s * (BW / 2 - .1), RY, BZ - BD / 2, false); m.rotation.y = Math.PI / 2; });

  // sign on the roof, as on the real building
  const roofSign = canvasTex(1024, 192, (g, w, h) => {
    g.fillStyle = '#f7efe1'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#c0582a'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#b3201b'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '700 104px Rasa, Georgia, serif'; g.fillText('NATRAJ', w / 2 - 110, h / 2 + 6);
    g.font = '600 46px Rasa, Georgia, serif'; g.fillText('HOTEL &', w / 2 + 245, h / 2 - 24); g.fillText('RESORT', w / 2 + 245, h / 2 + 30);
  });
  add(new THREE.BoxGeometry(6.4, 1.2, .2), [maroon, maroon, maroon, maroon, new THREE.MeshStandardMaterial({ map: roofSign, emissive: 0xffffff, emissiveMap: roofSign, emissiveIntensity: .35 }), maroon], 0, BH + 1.1, BZ + .05, false);

  // chhatri: domed pavilion on four pillars
  const chhatri = (x, y, z, s) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, .25, 2.4), ochre); base.position.y = .12; g.add(base);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, 1.5, 10), cream); p.position.set(a * .95, 1, b * .95); g.add(p);
    });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.6, .18, 2.6), ochre); slab.position.y = 1.82; g.add(slab);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe0902e, roughness: .5 }));
    dome.position.y = 1.9; dome.scale.y = 1.15; g.add(dome);
    const kalash = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 10), brass); kalash.position.y = 3.3; g.add(kalash);
    const spike = new THREE.Mesh(new THREE.ConeGeometry(.05, .45, 8), brass); spike.position.y = 3.6; g.add(spike);
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    scene.add(g); return g;
  };
  chhatri(0, BH + .3, BZ - 3, 1.1);
  [[-BW / 2 + .6, BZ - .6], [BW / 2 - .6, BZ - .6]].forEach(([x, z]) => chhatri(x, BH + .3, z, .45));

  // left wing: single storey with an arcade of arches
  const arcade = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#efe6d6'; g.fillRect(0, 0, w, h);
    const n = 6, aw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * aw;
      g.fillStyle = '#2a1a10';
      g.beginPath(); g.moveTo(x + 24, h); g.lineTo(x + 24, 110); g.quadraticCurveTo(x + aw / 2, 40, x + aw - 24, 110); g.lineTo(x + aw - 24, h); g.fill();
      g.fillStyle = 'rgba(255,170,80,.55)';
      g.fillRect(x + aw / 2 - 18, 150, 36, 60);
      g.strokeStyle = '#d99a2b'; g.lineWidth = 8;
      g.beginPath(); g.moveTo(x + 24, h); g.lineTo(x + 24, 110); g.quadraticCurveTo(x + aw / 2, 40, x + aw - 24, 110); g.lineTo(x + aw - 24, h); g.stroke();
    }
    g.fillStyle = '#d99a2b'; g.fillRect(0, 0, w, 16);
  });
  const wingX = -BW / 2 - 8.5, wingZ = BZ + 2;
  add(new THREE.BoxGeometry(16, 3.4, 7), [cream, cream, cream, cream, new THREE.MeshStandardMaterial({ map: arcade, emissive: 0xffffff, emissiveMap: arcade, emissiveIntensity: .12, roughness: .9 }), cream], wingX, 1.7, wingZ - 3.5);
  for (let i = 0; i < 7; i++) {
    const x = wingX - 7.5 + i * 2.5;
    add(new THREE.CylinderGeometry(.12, .16, .5, 8), ochre, x, 3.65, wingZ - .1);
    add(new THREE.SphereGeometry(.2, 12, 8, 0, 6.283, 0, Math.PI / 2), ochre, x, 3.9, wingZ - .1);
  }

  // pool on the right with chhatri lamp posts
  const poolX = 16, poolZ = BZ + 9;
  const cope = new THREE.MeshStandardMaterial({ color: 0xd9ccb0, roughness: .7 });
  [[10.6, .6, 0, -3.3], [10.6, .6, 0, 3.3], [.6, 7.2, -5.3, 0], [.6, 7.2, 5.3, 0]].forEach(([w, d, x, z]) => add(new THREE.BoxGeometry(w, .2, d), cope, poolX + x, .1, poolZ + z));
  const water = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), new THREE.MeshStandardMaterial({ color: 0x14606e, emissive: 0x0b4d5c, emissiveIntensity: .6, roughness: .15 }));
  water.rotation.x = -Math.PI / 2; water.position.set(poolX, .08, poolZ); scene.add(water);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a1a08, emissive: 0xffc062, emissiveIntensity: 3 });
  const lampPost = (x, z) => {
    add(new THREE.BoxGeometry(.45, 2.6, .45), ochre, x, 1.3, z);
    add(new THREE.BoxGeometry(.5, .5, .5), lampMat, x, 2.85, z, false);
    add(new THREE.BoxGeometry(.7, .1, .7), ochre, x, 3.15, z);
    add(new THREE.SphereGeometry(.34, 14, 8, 0, 6.283, 0, Math.PI / 2), ochre, x, 3.2, z);
  };
  [-5.5, -1.8, 1.8, 5.5].forEach(dx => lampPost(poolX + dx, poolZ - 4.2));
  const poolLight = new THREE.PointLight(0xffb060, 14, 14, 1.6); poolLight.position.set(poolX, 3, poolZ - 3.5); scene.add(poolLight);

  // the high-mast light on the lawn
  add(new THREE.CylinderGeometry(.12, .25, 15, 10), new THREE.MeshStandardMaterial({ color: 0x8c8c88, metalness: .6, roughness: .5 }), -11, 7.5, BZ + 12);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.9, .08, 8, 24), new THREE.MeshStandardMaterial({ color: 0x777, metalness: .6, roughness: .5 }));
  ring.rotation.x = Math.PI / 2; ring.position.set(-11, 15, BZ + 12); scene.add(ring);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * 6.283;
    add(new THREE.BoxGeometry(.35, .2, .25), new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0xfff1d6, emissiveIntensity: 2.5 }), -11 + Math.cos(a) * .9, 14.85, BZ + 12 + Math.sin(a) * .9, false);
  }

  // night uplights washing the facade
  [-6, 6].forEach(x => {
    const sp = new THREE.SpotLight(0xffc27a, 28, 20, .65, .7, 1.4);
    sp.position.set(x, .4, BZ + 7); sp.target.position.set(x * .8, 5, BZ); scene.add(sp, sp.target);
  });

  /* --- trees round the edge of the lawn --- */
  const bark = new THREE.MeshStandardMaterial({ color: 0x3e2c20, roughness: 1 });
  const leafM = [0x2c4220, 0x34502a, 0x26391b].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true }));
  const tree = (x, z, s) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13, .22, 2.4, 8), bark);
    trunk.position.y = 1.2; trunk.rotation.z = (rand() - .5) * .15; trunk.castShadow = true; g.add(trunk);
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.7 + rand() * .6, 1), leafM[i % 3]);
      b.position.set((rand() - .5) * 2.2, 2.6 + rand() * 1.2, (rand() - .5) * 2.2);
      b.scale.y = .75; b.castShadow = true; g.add(b);
    }
    scene.add(g);
  };
  [[-6, -4, 1.1], [6.5, -4.5, 1.2], [-8, -9, 1.3], [8.5, -10, 1.2], [-24, -34, 1.8], [-14, -38, 1.7], [14, -38, 1.8], [24, -32, 1.6], [-30, -22, 1.8], [28, -16, 1.6], [0, -42, 2], [-7, -40, 1.6], [7, -41, 1.7]]
    .forEach(([x, z, s]) => tree(x, z, s));

  /* =========================================================
     Diwali
     ========================================================= */
  // fairy lights: thousands of glowing points, each twinkling on its own
  const white = canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.2, 'rgba(255,255,255,.8)'); r.addColorStop(.5, 'rgba(255,255,255,.18)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }, { srgb: false });
  const pointMats = [];
  const lightPoints = (pts, cols, size, twinkle = 1) => {
    const n = pts.length / 3, geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    geo.setAttribute('tint', new THREE.Float32BufferAttribute(cols, 3));
    geo.setAttribute('phase', new THREE.Float32BufferAttribute(Array.from({ length: n }, () => rand() * 6.283), 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, size: { value: size }, scale: { value: 400 }, map: { value: white }, tw: { value: twinkle } },
      vertexShader: `attribute float phase; attribute vec3 tint; varying vec3 vC; varying float vA; uniform float time, size, scale, tw;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vC = tint;
          vA = mix(1., .45 + .55 * (.5 + .5 * sin(time * 2.3 + phase * 7.)), tw);
          gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA;
        void main(){ float a = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(vC * vA * 1.6, a * vA); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    pointMats.push(mat);
    const p = new THREE.Points(geo, mat); p.frustumCulled = false; scene.add(p); return p;
  };
  const warm = [[1, .78, .38], [1, .62, .22], [1, .88, .6]], festive = [[1, .8, .3], [1, .35, .45], [.45, .8, 1], [.55, 1, .45], [1, .6, .2]];
  const pts = [], cols = [];
  const pushLine = (a, b, step, pal) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), n = Math.max(1, Math.round(A.distanceTo(B) / step));
    for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); pts.push(p.x, p.y, p.z); cols.push(...pal[(rand() * pal.length) | 0]); }
  };
  // outline the building
  const fz = BZ + .35;
  pushLine([-BW / 2, BH + .3 + RH, fz - .4], [BW / 2, BH + .3 + RH, fz - .4], .22, warm);
  pushLine([-BW / 2 - .3, GF + .2, fz], [BW / 2 + .3, GF + .2, fz], .22, warm);
  pushLine([-BW / 2 - .2, BH + .32, fz], [BW / 2 + .2, BH + .32, fz], .22, warm);
  [-5.4, -1.9, 1.9, 5.4].forEach(x => pushLine([x, .4, BZ + .62], [x, BH, BZ + .62], .2, warm));
  pushLine([-4, GF - .08, BZ + 2.22], [4, GF - .08, BZ + 2.22], .15, warm);
  // jhalar: curtains of lights hanging down the first floor
  for (let x = -BW / 2 + .4; x <= BW / 2 - .3; x += .45) {
    if (Math.abs(x) < 3.3) continue;
    const len = 1.2 + (Math.abs(Math.sin(x * 3.1)) * 1.4);
    pushLine([x, BH + .25, fz], [x, BH + .25 - len, fz], .16, festive);
  }
  // round the chhatri dome
  for (let i = 0; i < 40; i++) { const a = i / 40 * 6.283; pts.push(Math.cos(a) * 1.4, BH + .3 + 2.1, BZ - 3 + Math.sin(a) * 1.4); cols.push(...warm[i % 3]); }
  // wing roof edge and the pool fence
  pushLine([wingX - 8, 3.45, wingZ + .05], [wingX + 8, 3.45, wingZ + .05], .25, warm);
  pushLine([poolX - 5.6, .9, poolZ - 4.2], [poolX + 5.6, .9, poolZ - 4.2], .25, festive);
  // garlands of lights strung over the lawn from the gate towards the building
  [[-5, 3.8, -2, -5.5, 4.8, -20], [5, 3.8, -2, 5.5, 4.8, -20]].forEach(([x1, y1, z1, x2, y2, z2]) => {
    for (let i = 0; i <= 90; i++) {
      const t = i / 90, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t, y = y1 + (y2 - y1) * t - Math.sin(t * Math.PI * 4) ** 2 * .6;
      pts.push(x, y, z); cols.push(...festive[i % 5]);
    }
    for (let k = 0; k <= 4; k++) {
      const t = k / 4, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t, y = y1 + (y2 - y1) * t;
      add(new THREE.CylinderGeometry(.04, .05, y, 6), bark, x, y / 2, z);
    }
  });
  lightPoints(pts, cols, mobile ? .2 : .17);

  // akash kandils: star lanterns hanging from the canopy and at the gate
  const kandils = [];
  const kandil = (x, y, z, color) => {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8, roughness: .6, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(.28, 0), mat); body.scale.set(1, 1.25, 1); g.add(body);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(.2, 0), new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0xffc04a, emissiveIntensity: 2 }));
    star.rotation.y = Math.PI / 4; star.scale.set(1.5, .5, 1.5); g.add(star);
    for (let i = 0; i < 6; i++) {
      const tail = new THREE.Mesh(new THREE.PlaneGeometry(.035, .5), mat);
      tail.position.set(Math.cos(i) * .1, -.55, Math.sin(i) * .1); g.add(tail);
    }
    const cordM = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 1, 4), new THREE.MeshBasicMaterial({ color: 0x222 })); cordM.position.y = .8; g.add(cordM);
    scene.add(g); kandils.push(g);
  };
  [-3.2, -1.1, 1.1, 3.2].forEach((x, i) => kandil(x, GF - 1.4, BZ + 2.1, [0xd42a3c, 0xee6a1c, 0xd42a3c, 0xee6a1c][i]));
  kandil(-(DW / 2 + .75), DH + .1, T / 2 + .5, 0xd42a3c);
  kandil(DW / 2 + .75, DH + .1, T / 2 + .5, 0xee6a1c);

  // marigold garlands (genda phool) swagged across the gate and down the posts
  const mari = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.045, 1), new THREE.MeshStandardMaterial({ roughness: .9 }), 900);
  let mi = 0; const dummy = new THREE.Object3D(), cO = new THREE.Color(0xf08a12), cY = new THREE.Color(0xf7c21c);
  const flower = (x, y, z, k) => { dummy.position.set(x, y, z); dummy.rotation.set(rand() * 3, rand() * 3, 0); dummy.updateMatrix(); mari.setMatrixAt(mi, dummy.matrix); mari.setColorAt(mi, (k % 7 < 4) ? cO : cY); mi++; };
  const gz = T / 2 + .3;
  for (let sw = 0; sw < 3; sw++) {
    const x0 = -1.35 + sw * .9, x1 = x0 + .9;
    for (let i = 0; i <= 18; i++) { const t = i / 18; flower(x0 + (x1 - x0) * t, DH + .02 - Math.sin(t * Math.PI) * .28, gz, i); }
  }
  [-1, 1].forEach(s => { for (let i = 0; i < 40; i++) flower(s * (DW / 2 + .12), DH - i * .066, gz - .05, i); });
  // and along the top of the signboard
  for (let i = 0; i <= 60; i++) { const t = i / 60; flower(-2.1 + 4.2 * t, 4.95 - Math.sin(t * Math.PI * 3) ** 2 * .12, T / 2 + .2, i); }
  mari.count = mi; mari.instanceMatrix.needsUpdate = true; mari.instanceColor.needsUpdate = true;
  scene.add(mari);

  // the resort's name over the gate
  const gateSign = canvasTex(1024, 300, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8e2a1d'); gr.addColorStop(1, '#6e1d13');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e0b157'; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28);
    g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60);
    g.fillStyle = '#ffe6a8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 92px Rasa, "Noto Serif Gujarati", serif'; g.fillText('હોટેલ નટરાજ', w / 2, 112);
    g.font = '600 52px Rasa, Georgia, serif'; g.fillText('HOTEL NATRAJ & RESORT', w / 2, 210);
  });
  add(new THREE.BoxGeometry(4.3, 1.26, .18), [wood, wood, wood, wood,
    new THREE.MeshStandardMaterial({ map: gateSign, emissive: 0xffffff, emissiveMap: gateSign, emissiveIntensity: .4, roughness: .7 }), wood],
    0, 4.35, T / 2 + .12, false);
  const sl = new THREE.SpotLight(0xffd9a0, 6, 7, .5, .8, 1.5); sl.position.set(0, 2.6, 3.4); sl.target.position.set(0, 4.3, .2); scene.add(sl, sl.target);
  const sp2 = [], sc2 = [];
  for (let i = 0; i <= 44; i++) { const t = i / 44; sp2.push(-2.2 + 4.4 * t, 3.68, T / 2 + .25); sc2.push(...warm[i % 3]); }
  lightPoints(sp2, sc2, .14);

  /* --- fireworks over the resort --- */
  const FW = mobile ? 1800 : 3600;
  const fwPos = new Float32Array(FW * 3), fwCol = new Float32Array(FW * 3), fwA = new Float32Array(FW);
  const fwVel = new Float32Array(FW * 3), fwLife = new Float32Array(FW), fwMax = new Float32Array(FW), fwKind = new Uint8Array(FW);
  const fwGeo = new THREE.BufferGeometry();
  fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3).setUsage(THREE.DynamicDrawUsage));
  fwGeo.setAttribute('tint', new THREE.BufferAttribute(fwCol, 3).setUsage(THREE.DynamicDrawUsage));
  fwGeo.setAttribute('alpha', new THREE.BufferAttribute(fwA, 1).setUsage(THREE.DynamicDrawUsage));
  const fwMat = new THREE.ShaderMaterial({
    uniforms: { scale: { value: 400 }, map: { value: white } },
    vertexShader: `attribute vec3 tint; attribute float alpha; varying vec3 vC; varying float vA; uniform float scale;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vC = tint; vA = alpha; gl_PointSize = .75 * scale / -mv.z * (alpha > 0. ? 1. : 0.); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ float a = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(vC * 2., a * vA); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  pointMats.push(fwMat);
  const fw = new THREE.Points(fwGeo, fwMat); fw.frustumCulled = false; scene.add(fw);
  const fwPal = [[1, .75, .3], [1, .3, .35], [.4, 1, .5], [.5, .7, 1], [1, .45, .9], [1, .95, .7]];
  let fwNext = 0;
  const free = () => { for (let i = 0; i < FW; i++) { fwNext = (fwNext + 1) % FW; if (fwLife[fwNext] <= 0) return fwNext; } return -1; };
  const launch = () => {
    const i = free(); if (i < 0) return;
    fwKind[i] = 1;
    fwPos.set([(rand() - .5) * 40, 2, BZ - 12 - rand() * 10], i * 3);
    fwVel.set([(rand() - .5) * 3, 19 + rand() * 5, 0], i * 3);
    fwCol.set([1, .8, .5], i * 3);
    fwLife[i] = fwMax[i] = .85 + rand() * .3;
  };
  const burst = (x, y, z) => {
    const c1 = fwPal[(rand() * fwPal.length) | 0], c2 = fwPal[(rand() * fwPal.length) | 0];
    const n = mobile ? 110 : 200, sp = 7 + rand() * 4;
    for (let k = 0; k < n; k++) {
      const i = free(); if (i < 0) return;
      const u = rand() * 2 - 1, a = rand() * 6.283, r = Math.sqrt(1 - u * u), v = sp * (.85 + rand() * .15);
      fwKind[i] = 2;
      fwPos.set([x, y, z], i * 3);
      fwVel.set([r * Math.cos(a) * v, u * v, r * Math.sin(a) * v], i * 3);
      fwCol.set(k % 3 ? c1 : c2, i * 3);
      fwLife[i] = fwMax[i] = 1.4 + rand() * .9;
    }
  };
  let fwTimer = 0;
  const stepFireworks = (dt) => {
    fwTimer -= dt;
    if (fwTimer <= 0) { launch(); if (rand() < .35) launch(); fwTimer = .45 + rand() * .7; }
    const drag = Math.exp(-1.3 * dt);
    for (let i = 0; i < FW; i++) {
      if (fwLife[i] <= 0) { fwA[i] = 0; continue; }
      fwLife[i] -= dt;
      const j = i * 3;
      if (fwKind[i] === 2) { fwVel[j] *= drag; fwVel[j + 1] = fwVel[j + 1] * drag - 3.2 * dt; fwVel[j + 2] *= drag; }
      else fwVel[j + 1] -= 9 * dt;
      fwPos[j] += fwVel[j] * dt; fwPos[j + 1] += fwVel[j + 1] * dt; fwPos[j + 2] += fwVel[j + 2] * dt;
      const f = Math.max(0, fwLife[i] / fwMax[i]);
      fwA[i] = fwKind[i] === 1 ? .9 : Math.pow(f, 1.4) * (.75 + Math.random() * .25);
      if (fwLife[i] <= 0) { fwA[i] = 0; if (fwKind[i] === 1) burst(fwPos[j], fwPos[j + 1], fwPos[j + 2]); }
    }
    fwGeo.attributes.position.needsUpdate = true;
    fwGeo.attributes.alpha.needsUpdate = true;
    fwGeo.attributes.tint.needsUpdate = true;
  };

  /* --- post-processing: a soft bloom so flames and bulbs glow --- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .38, .45, .92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* --- camera path driven by scroll --- */
  const posPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.55, 7.8), new THREE.Vector3(0, 1.5, 4.4), new THREE.Vector3(0, 1.55, 1.2),
    new THREE.Vector3(0, 1.6, -2.2), new THREE.Vector3(0, 1.7, -4), new THREE.Vector3(0, 1.75, -4.6)
  ]);
  const tgtPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.25, 0), new THREE.Vector3(0, 2.0, -2), new THREE.Vector3(0, 2.6, -12),
    new THREE.Vector3(0, 4.8, -22), new THREE.Vector3(0, 8.2, -26), new THREE.Vector3(0, 8.8, -26)
  ]);

  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', e => {
    pointer.x = e.clientX / window.innerWidth * 2 - 1;
    pointer.y = e.clientY / window.innerHeight * 2 - 1;
  }, { passive: true });

  let progress = 0;
  function readScroll() {
    const total = gate.offsetHeight - window.innerHeight;
    progress = Math.min(1, Math.max(0, (window.scrollY - gate.offsetTop) / total));
  }
  window.addEventListener('scroll', readScroll, { passive: true });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    // narrow screens get a wider lens so the whole gateway fits
    camera.fov = camera.aspect < .8 ? 64 : camera.aspect < 1.2 ? 54 : 44;
    camera.updateProjectionMatrix();
    pointMats.forEach(m => { m.uniforms.scale.value = renderer.domElement.height / 2 / Math.tan(camera.fov * Math.PI / 360); });
  }
  window.addEventListener('resize', resize);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(stage);

  canvas.addEventListener('click', () => {
    window.scrollTo({ top: gate.offsetTop + gate.offsetHeight - window.innerHeight, behavior: 'smooth' });
  });

  const clock = new THREE.Clock();
  const look = new THREE.Vector3();
  let running = false;
  function loop() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }
  function frame() {
    running = false;
    if (!visible) return;
    const dt = clock.getDelta(); const t = clock.elapsedTime;
    const p = progress;

    // doors swing inward over the first part of the scroll
    const open = smooth(.03, .42, p) * 1.85;
    leaves.forEach(({ pivot, s }) => { pivot.rotation.y = -s * open; });

    // walk along the path
    const u = smooth(0, 1, p) * .6 + p * .4;
    camera.position.copy(posPath.getPointAt(u));
    look.copy(tgtPath.getPointAt(u));
    pointer.sx += (pointer.x - pointer.sx) * .05;
    pointer.sy += (pointer.y - pointer.sy) * .05;
    const sway = reduced ? 0 : 1 - p * .6;
    camera.position.x += pointer.sx * .35 * sway + Math.sin(t * .35) * .04 * sway;
    camera.position.y += -pointer.sy * .14 * sway + Math.sin(t * .5) * .02 * sway;
    look.x += pointer.sx * .12 * sway;
    camera.lookAt(look);

    // breeze in the toran
    flags.forEach((f, i) => {
      f.rotation.x = .12 + Math.sin(t * 1.7 + i * .55) * .14;
      f.rotation.z = Math.sin(t * 1.1 + i * .9) * .05;
    });
    // flickering flames
    diyas.forEach(d => {
      const k = .85 + Math.sin(t * 11 + d.seed) * .07 + Math.sin(t * 23.7 + d.seed * 2) * .05 + (Math.random() - .5) * .04;
      d.flame.scale.set(1, 2.6 * k, 1);
      d.halo.material.opacity = .75 + (k - .85) * 2;
      if (d.pl) d.pl.intensity = 2.2 * k;
    });
    pointMats.forEach(m => { if (m.uniforms.time) m.uniforms.time.value = t; });
    kandils.forEach((k, i) => { k.rotation.y = Math.sin(t * .6 + i) * .4; k.rotation.z = Math.sin(t * 1.1 + i * 2) * .04; });
    stepFireworks(Math.min(dt, .05));

    composer.render();
    loop();
  }

  stage.appendChild(canvas);
  resize();
  readScroll();
  // first frame drawn: hide the flat CSS fallback
  composer.render();
  gate.classList.add('is-3d');
  loop();
}
