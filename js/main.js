(function () {
  var IMG = 'https://natrajhotel.co.in/images/uploads/';
  var ORIGIN = 'Hotel Natraj & Resort, Delwad, Gandhinagar-Mahudi Highway Road, Ta. Mansa, Dist. Gandhinagar, Gujarat';

  // Mobile menu
  var navBtn = document.querySelector('.navbtn');
  var nav = document.getElementById('nav');
  navBtn.addEventListener('click', function () {
    var open = navBtn.getAttribute('aria-expanded') === 'true';
    navBtn.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('is-open', !open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      navBtn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });

  // Cottage tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      var next = tabs[(i + d + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });

  // Cottage photo thumbnails
  document.querySelectorAll('[data-pics]').forEach(function (box) {
    var main = box.querySelector('.room__main');
    var btns = box.querySelectorAll('.room__thumbs button');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        main.src = b.querySelector('img').src;
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
  });

  // Gallery
  var gallery = [
    ['The grounds', ['586/3468_738hotel_natraj_resort_img__7_.jpg', '586/3468_3hotel_natraj_resort_img__12_.jpg', '586/3468_3hotel_natraj_resort_img__13_.jpg']],
    ['Restaurant', ['586/3468_613hotel_natraj_resort_restaurant_img__1_.jpg', '586/3468_286hotel_natraj_resort_restaurant_img__2_.jpg', '586/3468_451hotel_natraj_resort_restaurant_img__3_.jpg', '586/3468_155hotel_natraj_resort_restaurant_img__4_.jpg']],
    ['Modern Cottage', ['586/3468_178hotel_natraj_resort_modern_cottage__4_.jpg', '586/3468_543hotel_natraj_resort_modern_cottage__5_.jpg', '586/3468_986hotel_natraj_resort_modern_cottage__11_.jpg']],
    ['Modern, with balcony', ['586/3468_52hotel_natraj_resort_modern_cottage_with_balcony__2_.jpg', '586/3468_172hotel_natraj_resort_modern_cottage_with_balcony__4_.jpg', '586/3468_586hotel_natraj_resort_modern_cottage_with_balcony__7_.jpg']],
    ['Village Cottage', ['586/3468_225hotel_natraj_resort_village_cottage__3_.jpg', '586/3468_679hotel_natraj_resort_village_cottage__4_.jpg', '586/3468_555hotel_natraj_resort_village_cottage__6_.jpg', '586/3468_123hotel_natraj_resort_village_cottage__11_.jpg']],
    ['Village, with balcony', ['586/3468_368hotel_natraj_resort_village_cottage_with_balcony__1_.JPG', '586/3468_247hotel_natraj_resort_village_cottage_with_balcony__2_.JPG', '586/3468_531hotel_natraj_resort_village_cottage_with_balcony__7_.jpg']],
    ['Game zone', ['586/3468_316hotel_natraj_resort_gaming_zone_img__2_.jpg', '586/3468_871hotel_natraj_resort_gaming_zone_img__4_.jpg', '586/3468_949hotel_natraj_resort_gaming_zone_img__5_.jpg']]
  ];
  var photos = [];
  gallery.forEach(function (g) {
    g[1].forEach(function (src) { photos.push({ cat: g[0], src: IMG + src }); });
  });

  var grid = document.getElementById('galGrid');
  var filter = document.getElementById('galFilter');
  var shown = photos;

  function renderGallery(cat) {
    shown = cat ? photos.filter(function (p) { return p.cat === cat; }) : photos;
    grid.innerHTML = '';
    shown.forEach(function (p, i) {
      var b = document.createElement('button');
      b.className = 'gal__item';
      b.setAttribute('aria-label', 'Open photo: ' + p.cat);
      b.innerHTML = '<img loading="lazy" alt="' + p.cat + '" src="' + p.src + '">';
      b.addEventListener('click', function () { openLb(i); });
      grid.appendChild(b);
    });
  }
  ['All'].concat(gallery.map(function (g) { return g[0]; })).forEach(function (name, i) {
    var c = document.createElement('button');
    c.textContent = name;
    c.setAttribute('aria-pressed', String(i === 0));
    c.addEventListener('click', function () {
      filter.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      renderGallery(i === 0 ? null : name);
    });
    filter.appendChild(c);
  });
  renderGallery(null);

  // Lightbox
  var lb = document.getElementById('lb');
  var lbImg = lb.querySelector('img');
  var lbCap = lb.querySelector('.lb__cap');
  var cur = 0;
  function show(i) {
    cur = (i + shown.length) % shown.length;
    lbImg.src = shown[cur].src;
    lbImg.alt = shown[cur].cat;
    lbCap.textContent = shown[cur].cat + '  ·  ' + (cur + 1) + ' / ' + shown.length;
  }
  function openLb(i) {
    show(i);
    if (typeof lb.showModal === 'function') lb.showModal();
    else lb.setAttribute('open', '');
  }
  lb.querySelector('.lb__x').addEventListener('click', function () { lb.close(); });
  lb.querySelector('.lb__prev').addEventListener('click', function () { show(cur - 1); });
  lb.querySelector('.lb__next').addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });

  // Nearby sights
  var sights = [
    ['Swaminarayan Akshardham', 'અક્ષરધામ', '586/753a1.jpeg'],
    ['Adalaj Stepwell', 'અડાલજની વાવ', '586/609a5.jpg'],
    ['Indroda Nature Park', 'ઇન્દ્રોડા પાર્ક', '586/883a4.jpg'],
    ['Sarita Udyan', 'સરિતા ઉદ્યાન', '586/593a2.jpg'],
    ['Punit Van', 'પુનિત વન', '586/82a3.png']
  ];
  var list = document.getElementById('sights');
  sights.forEach(function (s) {
    var url = 'https://www.google.com/maps/dir/?api=1&origin=' + encodeURIComponent(ORIGIN) +
      '&destination=' + encodeURIComponent(s[0] + ', Gandhinagar, Gujarat');
    var li = document.createElement('li');
    li.innerHTML = '<img loading="lazy" alt="" src="' + IMG + s[2] + '">' +
      '<div><b>' + s[0] + '</b><span lang="gu">' + s[1] + '</span></div>' +
      '<a href="' + url + '" target="_blank" rel="noopener">Route</a>';
    list.appendChild(li);
  });

  // Header edge once scrolled
  var head = document.querySelector('.head');
  window.addEventListener('scroll', function () {
    head.classList.toggle('is-stuck', window.scrollY > 40);
  }, { passive: true });
})();
