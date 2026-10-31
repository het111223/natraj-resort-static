// Rangoli floor: whatever you draw is mirrored around the centre, in powder.
(function () {
  var canvas = document.getElementById('rangCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var tip = document.getElementById('rangTip');
  var sizeSel = document.getElementById('rangSize');
  var symSel = document.getElementById('rangSym');
  var FLOOR = '#7e3020';

  var W = 0, dpr = 1, drawn = false, autoRun = 0;

  function color() {
    return document.querySelector('input[name="rc"]:checked').value;
  }

  // Red-oxide floor with a little mottling, then faint chalk guide circles.
  function paintFloor() {
    ctx.fillStyle = FLOOR;
    ctx.fillRect(0, 0, W, W);
    for (var i = 0; i < 2600; i++) {
      ctx.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.06)' : 'rgba(255,200,170,.05)';
      var r = Math.random() * 3 * dpr;
      ctx.beginPath();
      ctx.arc(Math.random() * W, Math.random() * W, r, 0, 6.283);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(246,240,226,.14)';
    ctx.lineWidth = dpr;
    ctx.setLineDash([2 * dpr, 6 * dpr]);
    [.15, .3, .45].forEach(function (f) {
      ctx.beginPath();
      ctx.arc(W / 2, W / 2, W * f, 0, 6.283);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  function setup() {
    var keep = drawn ? canvas.toDataURL() : null;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(canvas.clientWidth * dpr);
    canvas.width = canvas.height = W;
    paintFloor();
    if (keep) {
      var img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, W, W); };
      img.src = keep;
    }
  }

  // One pinch of powder at (x, y), relative to the centre, copied N ways and mirrored.
  function pinch(x, y, c, size) {
    var n = +symSel.value;
    var cx = W / 2, cy = W / 2;
    ctx.fillStyle = c;
    for (var k = 0; k < 7; k++) {
      var a = Math.random() * 6.283, d = Math.random() * size * dpr;
      var px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      var r = (.5 + Math.random() * .9) * dpr * (size > 8 ? 1.4 : 1);
      ctx.globalAlpha = .55 + Math.random() * .45;
      for (var i = 0; i < n; i++) {
        var t = (6.283 / n) * i, co = Math.cos(t), si = Math.sin(t);
        ctx.beginPath();
        ctx.arc(cx + px * co - py * si, cy + px * si + py * co, r, 0, 6.283);
        ctx.arc(cx + px * co + py * si, cy + px * si - py * co, r, 0, 6.283);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function line(x0, y0, x1, y1, c, size) {
    var dist = Math.hypot(x1 - x0, y1 - y0);
    var steps = Math.max(1, Math.ceil(dist / (1.6 * dpr)));
    for (var i = 1; i <= steps; i++) {
      var t = i / steps;
      pinch(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, c, size);
    }
  }

  function markDrawn() {
    if (!drawn) { drawn = true; tip.classList.add('is-gone'); }
  }

  // --- drawing with mouse / finger ---
  var last = null;
  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * dpr - W / 2, y: (e.clientY - r.top) * dpr - W / 2 };
  }
  canvas.addEventListener('pointerdown', function (e) {
    autoRun++;
    canvas.setPointerCapture(e.pointerId);
    last = pos(e);
    pinch(last.x, last.y, color(), +sizeSel.value);
    markDrawn();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!last) return;
    var p = pos(e);
    line(last.x, last.y, p.x, p.y, color(), +sizeSel.value);
    last = p;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
    canvas.addEventListener(ev, function () { last = null; });
  });

  // --- "Make one for me": builds a design ring by ring, as a person would ---
  var PALETTE = ['#f6f0e2', '#f2ad1d', '#ee6a1c', '#d42a3c', '#e2558e', '#3a9a48', '#2f63c4'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function plan() {
    var R = W * .47, strokes = [];
    var n = +symSel.value, sector = Math.PI / n; // one mirrored half-sector
    var r = R * .06;
    // centre bud
    strokes.push({ c: pick(PALETTE), size: 9, pts: arc(0, 0, r, 0, sector, 6) });
    while (r < R * .9) {
      var band = R * (.1 + Math.random() * .1);
      var c = pick(PALETTE), kind = Math.floor(Math.random() * 4);
      if (kind === 0) { // petal
        strokes.push({ c: c, size: 6, pts: petal(r, r + band, sector) });
        strokes.push({ c: pick(PALETTE), size: 3, pts: petal(r + band * .2, r + band * .75, sector * .55) });
      } else if (kind === 1) { // ring of dots
        for (var i = 0; i <= 2; i++) {
          var a = sector * i / 2, rr = r + band / 2;
          strokes.push({ c: c, size: 6, pts: [[rr * Math.cos(a), rr * Math.sin(a)]] });
        }
      } else if (kind === 2) { // wave
        var pts = [];
        for (var j = 0; j <= 16; j++) {
          var t = j / 16, a2 = sector * t;
          var rr2 = r + band / 2 + Math.sin(t * Math.PI) * band * .4;
          pts.push([rr2 * Math.cos(a2), rr2 * Math.sin(a2)]);
        }
        strokes.push({ c: c, size: 4, pts: pts });
      } else { // solid band
        strokes.push({ c: c, size: 10, pts: arc(0, 0, r + band / 2, 0, sector, 10) });
        strokes.push({ c: '#f6f0e2', size: 1.6, pts: arc(0, 0, r + band / 2, 0, sector, 10) });
      }
      r += band;
    }
    strokes.push({ c: '#f6f0e2', size: 2, pts: arc(0, 0, R * .93, 0, sector, 12) });
    return strokes;
  }
  function arc(cx, cy, r, a0, a1, steps) {
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var a = a0 + (a1 - a0) * i / steps;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }
  function petal(r0, r1, half) {
    var pts = [];
    for (var i = 0; i <= 14; i++) {
      var t = i / 14;
      var rr = r0 + (r1 - r0) * Math.sin(t * Math.PI / 2);
      var a = half * (1 - t) * Math.sin(t * Math.PI) * 1.2;
      pts.push([rr * Math.cos(a), rr * Math.sin(a)]);
    }
    return pts;
  }

  function autoDraw() {
    var run = ++autoRun;
    paintFloor();
    markDrawn();
    var strokes = plan(), s = 0, i = 0;
    (function step() {
      if (run !== autoRun) return;
      for (var k = 0; k < 3 && s < strokes.length; k++) {
        var st = strokes[s], p = st.pts;
        if (p.length === 1) { pinch(p[0][0], p[0][1], st.c, st.size); s++; i = 0; continue; }
        line(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], st.c, st.size);
        i++;
        if (i >= p.length - 1) { s++; i = 0; }
      }
      if (s < strokes.length) requestAnimationFrame(step);
    })();
  }

  document.getElementById('rangAuto').addEventListener('click', autoDraw);
  document.getElementById('rangClear').addEventListener('click', function () {
    autoRun++;
    paintFloor();
    drawn = false;
    tip.classList.remove('is-gone');
  });

  // --- save / share, with a small signature at the bottom ---
  function exportBlob(cb) {
    var out = document.createElement('canvas');
    var pad = Math.round(W * .1);
    out.width = W; out.height = W + pad;
    var o = out.getContext('2d');
    o.fillStyle = '#5a2216';
    o.fillRect(0, 0, out.width, out.height);
    o.drawImage(canvas, 0, 0);
    o.fillStyle = '#f4ecdd';
    o.font = '500 ' + Math.round(pad * .34) + 'px Rasa, Georgia, serif';
    o.textAlign = 'center';
    o.fillText('Hotel Natraj & Resort · Delwad, Gujarat', W / 2, W + pad * .62);
    out.toBlob(cb, 'image/png');
  }
  document.getElementById('rangSave').addEventListener('click', function () {
    exportBlob(function (b) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'my-rangoli-natraj.png';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
  });

  var shareBtn = document.getElementById('rangShare');
  try {
    var probe = new File([''], 'x.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [probe] })) shareBtn.hidden = false;
  } catch (e) {}
  shareBtn.addEventListener('click', function () {
    exportBlob(function (b) {
      var f = new File([b], 'my-rangoli-natraj.png', { type: 'image/png' });
      navigator.share({ files: [f], text: 'I made this rangoli for Hotel Natraj & Resort 🪔' }).catch(function () {});
    });
  });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { if (Math.round(canvas.clientWidth * dpr) !== W) setup(); }, 200);
  });
  setup();
})();
