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

if (stage && !reduced && webglOK()) {
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
    g.fillStyle = '#5b5a34'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 9000, ['#4a4f2a', '#6b6a3c', '#7a6a45', '#3f4423'], 2.2);
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
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'gate__gl';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x7a5a52, 22, 70);
  const camera = new THREE.PerspectiveCamera(45, 1, .05, 400);

  // Sky dome: deep indigo overhead, saffron at the horizon, a low sun behind the courtyard.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sun: { value: new THREE.Vector3(-.25, .06, -1).normalize() } },
    vertexShader: 'varying vec3 d; void main(){ d = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 d; uniform vec3 sun;
      void main(){
        float h = d.y;
        vec3 top = vec3(.09,.10,.24), mid = vec3(.52,.27,.28), hor = vec3(.90,.55,.32);
        vec3 c = mix(hor, mid, smoothstep(.0,.18,h));
        c = mix(c, top, smoothstep(.15,.6,h));
        float s = max(dot(d, sun), 0.);
        c += vec3(1.,.75,.4) * pow(s, 60.) * .6 + vec3(1.,.55,.25) * pow(s, 8.) * .12;
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
  scene.environmentIntensity = .55;

  // Lights
  scene.add(new THREE.HemisphereLight(0xffd6ae, 0x3a2418, .7));
  const sun = new THREE.DirectionalLight(0xffa860, 1.8);
  sun.position.set(8, 9, -34);
  sun.target.position.set(0, 0, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 });
  sun.shadow.bias = -.0005;
  scene.add(sun, sun.target);
  const front = new THREE.DirectionalLight(0xffe2c4, .9);
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
  const DW = 1.7, DH = 2.7, T = .5, WH = 5.2, WW = 16;
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
  // a row of small ones along the inside path, for the walk in
  for (let i = 0; i < 6; i++) { addDiya(-1.05, -1.6 - i * 1.4, i % 3 === 0); addDiya(1.05, -1.6 - i * 1.4, false); }

  /* --- courtyard: path, pool, cottages, neem trees, festoon lights --- */
  const pathM = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 8), new THREE.MeshStandardMaterial({ map: stonePath(), roughness: .9 }));
  pathM.rotation.x = -Math.PI / 2; pathM.position.set(0, .006, -4.4); pathM.receiveShadow = true; scene.add(pathM);

  const poolZ = -12;
  const cope = new THREE.MeshStandardMaterial({ color: 0xd9ccb0, roughness: .7 });
  [[7.4, .5, 0, -2.25], [7.4, .5, 0, 2.25], [.5, 4, -3.45, 0], [.5, 4, 3.45, 0]].forEach(([w, d, x, z]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, .14, d), cope);
    b.position.set(x, .07, poolZ + z); b.receiveShadow = b.castShadow = true; scene.add(b);
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4),
    new THREE.MeshStandardMaterial({ color: 0x1b5f6a, roughness: .38, metalness: 0, envMapIntensity: .7 }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, .05, poolZ); scene.add(water);

  const lime = new THREE.MeshStandardMaterial({ map: limewash(), roughness: .95 });
  const tileRoof = new THREE.MeshStandardMaterial({ color: 0x9c4a2c, roughness: .8, flatShading: true });
  const lit = new THREE.MeshStandardMaterial({ color: 0x2a1a10, emissive: 0xffa94d, emissiveIntensity: 2.2 });
  const doorDark = new THREE.MeshStandardMaterial({ color: 0x3c2414, roughness: .8 });
  const cottage = (x, z, rot, s = 1) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; g.scale.setScalar(s);
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 2.6), lime);
    body.position.y = 1.1; body.castShadow = body.receiveShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.55, 1.4, 4, 1), tileRoof);
    roof.rotation.y = Math.PI / 4; roof.scale.set(1.15, 1, .95); roof.position.y = 2.2 + .7; roof.castShadow = true;
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, .3, 3), new THREE.MeshStandardMaterial({ color: 0x8a3524, roughness: .8 }));
    plinth.position.y = .15; plinth.receiveShadow = true;
    const door = new THREE.Mesh(new THREE.PlaneGeometry(.75, 1.5), doorDark); door.position.set(0, 1.05, 1.301);
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(.5, .55), lit); w1.position.set(-1, 1.3, 1.301);
    const w2 = w1.clone(); w2.position.x = 1;
    const band = new THREE.Mesh(new THREE.BoxGeometry(3.22, .14, 2.62), new THREE.MeshStandardMaterial({ color: 0x9b2b1e, roughness: .8 }));
    band.position.y = 2.1;
    g.add(body, roof, plinth, door, w1, w2, band);
    scene.add(g);
  };
  cottage(-7.2, -10.5, Math.PI / 2.4);
  cottage(7.2, -10.5, -Math.PI / 2.4);
  cottage(-5.6, -18, Math.PI / 6);
  cottage(5.6, -18, -Math.PI / 6);
  cottage(0, -20.5, 0, 1.1);

  const bark = new THREE.MeshStandardMaterial({ color: 0x4a3426, roughness: 1 });
  const leafM = [0x3b5326, 0x46602c, 0x31481f].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true }));
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
  [[-9.5, -5, 1.2], [9.8, -6, 1.3], [-11, -14.5, 1.4], [11, -14, 1.2], [-3.4, -24, 1.3], [3.6, -25, 1.5], [-12.5, -22, 1.5], [12.5, -22, 1.4], [-4.5, -5.5, .8], [4.6, -6.2, .85]]
    .forEach(([x, z, s]) => tree(x, z, s));

  // festoon strings strung across the courtyard
  const bulbCols = [0xffd36b, 0xff8c3a, 0xff5c7a, 0xfff1c4];
  const bulbGeo = new THREE.SphereGeometry(.04, 8, 6);
  const bulbMats = bulbCols.map(c => new THREE.MeshBasicMaterial({ color: c }));
  const strings = [[[-5.5, 3.3, -3.2], [5.5, 3.3, -3.2]], [[-6.5, 3.6, -7], [6.5, 3.6, -15]], [[6.5, 3.6, -7], [-6.5, 3.6, -15]]];
  const bulbs = [];
  strings.forEach(([a, b]) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), n = 34;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = A.clone().lerp(B, t);
      p.y -= Math.sin(t * Math.PI) * .7;
      pts.push(p);
      if (i % 2 === 0) { const m = new THREE.Mesh(bulbGeo, bulbMats[(i / 2) % 4]); m.position.copy(p); m.position.y -= .05; scene.add(m); bulbs.push(m); }
    }
    const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .006, 4), new THREE.MeshBasicMaterial({ color: 0x1a120c }));
    scene.add(wire);
  });
  // a couple of poles for the strings
  [[-5.5, -3.2], [5.5, -3.2], [-6.5, -7], [6.5, -7], [-6.5, -15], [6.5, -15]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.04, .05, 3.7, 6), bark); p.position.set(x, 1.85, z); scene.add(p);
  });

  /* --- post-processing: a soft bloom so flames and bulbs glow --- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .38, .45, .92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* --- camera path driven by scroll --- */
  const posPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.55, 7.6), new THREE.Vector3(0, 1.5, 4.2), new THREE.Vector3(0, 1.55, 1.4),
    new THREE.Vector3(0, 1.65, -1.6), new THREE.Vector3(0, 2.4, -3.6), new THREE.Vector3(0, 3.3, -5)
  ]);
  const tgtPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.45, 0), new THREE.Vector3(0, 1.4, -1), new THREE.Vector3(0, 1.4, -5),
    new THREE.Vector3(0, 1.2, -10), new THREE.Vector3(0, .9, -13), new THREE.Vector3(0, .7, -14)
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
    const t = clock.getElapsedTime();
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
    const sway = 1 - p * .6;
    camera.position.x += pointer.sx * .35 * sway + Math.sin(t * .35) * .04;
    camera.position.y += -pointer.sy * .14 * sway + Math.sin(t * .5) * .02;
    look.x += pointer.sx * .12;
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
    bulbs.forEach((b, i) => { b.visible = Math.sin(t * 2 + i * 1.3) > -.97; });

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
