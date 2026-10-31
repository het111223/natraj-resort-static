// Entrance: the doors open and the camera walks through as the visitor scrolls.
(function () {
  var gate = document.getElementById('gate');
  if (!gate) return;

  var world = gate.querySelector('.gate__world');
  var doorway = gate.querySelector('.gate__doorway');
  var frame = gate.querySelector('.gate__frame');
  var left = gate.querySelector('.leaf--l');
  var right = gate.querySelector('.leaf--r');
  var beyond = gate.querySelector('.gate__beyond img');
  var welcome = gate.querySelector('.gate__welcome');
  var hint = gate.querySelector('.gate__hint');
  var skip = gate.querySelector('.gate__skip');

  // Floor rangoli in front of the door, drawn as SVG.
  (function floorRangoli() {
    var host = document.getElementById('floorRangoli');
    var out = ['<svg viewBox="-100 -100 200 200" aria-hidden="true">'];
    var rings = [
      { n: 8, r: 0, len: 30, w: 11, c: '#f2ad1d' },
      { n: 8, r: 0, len: 22, w: 7, c: '#d42a3c', rot: 22.5 },
      { n: 16, r: 36, len: 22, w: 8, c: '#2f63c4' },
      { n: 16, r: 36, len: 14, w: 4, c: '#f6f0e2' },
      { n: 24, r: 64, len: 18, w: 7, c: '#ee6a1c', rot: 7.5 },
      { n: 24, r: 64, len: 10, w: 3, c: '#f6f0e2', rot: 7.5 }
    ];
    rings.forEach(function (g) {
      for (var i = 0; i < g.n; i++) {
        var a = (360 / g.n) * i + (g.rot || 0);
        out.push('<ellipse cx="0" cy="' + -(g.r + g.len) + '" rx="' + g.w + '" ry="' + g.len +
          '" fill="' + g.c + '" transform="rotate(' + a + ')"/>');
      }
    });
    out.push('<circle r="8" fill="#3a9a48"/><circle r="3" fill="#f6f0e2"/>');
    for (var i = 0; i < 48; i++) {
      var a = i * 7.5 * Math.PI / 180;
      out.push('<circle cx="' + (95 * Math.cos(a)).toFixed(1) + '" cy="' + (95 * Math.sin(a)).toFixed(1) + '" r="2.4" fill="#f6f0e2"/>');
    }
    out.push('</svg>');
    host.innerHTML = out.join('');
  })();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('past-gate');
    return;
  }

  var maxScale = 3;
  function measure() {
    world.style.transform = 'none';
    var r = frame.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    // big enough that the doorway swallows the whole screen
    maxScale = Math.max(vw / r.width, vh / r.height) * 1.25;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    world.style.transformOrigin = cx + 'px ' + cy + 'px';
    update();
  }

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  var ticking = false;
  function update() {
    ticking = false;
    var total = gate.offsetHeight - window.innerHeight;
    var p = clamp((window.scrollY - gate.offsetTop) / total);

    var open = ease(clamp(p / .5));
    var zoom = ease(clamp((p - .3) / .65));

    left.style.transform = 'rotateY(' + (-108 * open) + 'deg)';
    right.style.transform = 'rotateY(' + (108 * open) + 'deg)';
    // leaves darken as they turn away from the light
    left.style.filter = right.style.filter = 'brightness(' + (1 - open * .45) + ')';

    var s = 1 + (maxScale - 1) * zoom;
    world.style.transform = 'scale(' + s + ')';
    world.style.opacity = String(1 - clamp((p - .82) / .12));
    world.style.visibility = p > .95 ? 'hidden' : 'visible';

    beyond.style.transform = 'scale(' + (1.15 - .15 * zoom) + ')';
    welcome.style.opacity = String(clamp((p - .62) / .25));
    welcome.style.transform = 'translateY(' + (20 - 20 * clamp((p - .62) / .25)) + 'px)';
    hint.style.opacity = String(1 - clamp(p * 6));
    skip.style.opacity = String(1 - clamp(p * 4));
    document.body.classList.toggle('past-gate', p >= .98);
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', measure);

  // a click or tap on the door walks you in
  frame.addEventListener('click', function () {
    window.scrollTo({ top: gate.offsetTop + gate.offsetHeight - window.innerHeight, behavior: 'smooth' });
  });

  measure();
})();
