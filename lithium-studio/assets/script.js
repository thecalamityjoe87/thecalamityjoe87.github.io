// Minimal site scripting
(function(){
  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var target = document.querySelector(this.getAttribute('href'));
      if(target){ e.preventDefault(); target.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block:'start'}); }
    });
  });

  // --- Hero transport readout: counts bars and beats like the app's LCD, at the tempo shown ---
  (function(){
    var pos = document.getElementById('lcd-pos');
    if(!pos || reduceMotion) return;
    var bpm = 120, beatsPerBar = 4, bars = 16, beat = (10 - 1) * beatsPerBar + 2; // starts at 10.3
    setInterval(function(){
      beat = (beat + 1) % (bars * beatsPerBar);
      var bar = Math.floor(beat / beatsPerBar) + 1;
      pos.textContent = (bar < 10 ? '0' : '') + bar + '.' + (beat % beatsPerBar + 1);
    }, 60000 / bpm);
  })();

  // --- Features: a playhead runs through the arrangement, one region per feature ---
  (function(){
    var arr = document.getElementById('arr');
    if(!arr) return;
    var tracks = arr.querySelector('.arr-tracks');
    var regions = Array.prototype.slice.call(arr.querySelectorAll('.region'));
    var feats = Array.prototype.slice.call(arr.querySelectorAll('.feat'));
    var playBtn = document.getElementById('arr-play');
    var posEl = document.getElementById('arr-pos');
    var countEl = document.getElementById('arr-count');
    var BARS = parseInt(getComputedStyle(tracks).getPropertyValue('--bars'), 10) || 24;
    var SLOT = BARS / feats.length;          // bars per feature
    var barMs = 4 * 60000 / 90;              // a 4/4 bar at 90 BPM
    var pos = 0, current = -1, playing = false, touched = false, last = 0;
    var byIndex = [];
    regions.forEach(function(r){ byIndex[+r.getAttribute('data-i')] = r; });

    function pad(n){ return (n < 10 ? '0' : '') + n; }
    function render(){
      tracks.style.setProperty('--p', (pos / BARS).toFixed(5));
      var bar = Math.floor(pos) + 1, beat = Math.floor((pos % 1) * 4) + 1;
      posEl.textContent = pad(bar) + '.' + beat;
      var i = Math.min(feats.length - 1, Math.floor(pos / SLOT));
      if(i === current) return;
      current = i;
      feats.forEach(function(f, k){ f.classList.toggle('on', k === i); });
      regions.forEach(function(r){
        var on = r === byIndex[i];
        r.classList.toggle('on', on);
        r.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      countEl.textContent = pad(i + 1) + '/' + pad(feats.length);
    }
    function tick(t){
      if(!playing) return;
      if(last) pos = (pos + (t - last) / barMs) % BARS;
      last = t;
      render();
      requestAnimationFrame(tick);
    }
    function setPlaying(on){
      if(on === playing) return;
      playing = on;
      arr.classList.toggle('playing', on);
      playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
      if(on){ last = 0; requestAnimationFrame(tick); }
    }
    function jump(i){
      i = (i + feats.length) % feats.length;
      pos = i * SLOT + 0.001;
      render();
    }

    playBtn.addEventListener('click', function(){ touched = true; setPlaying(!playing); });
    arr.querySelectorAll('[data-step]').forEach(function(b){
      b.addEventListener('click', function(){ touched = true; setPlaying(false); jump(current + (+b.getAttribute('data-step'))); });
    });
    regions.forEach(function(r){
      r.addEventListener('click', function(){ touched = true; setPlaying(false); jump(+r.getAttribute('data-i')); });
    });

    render();

    // Start playing when the arrangement comes into view, until the visitor takes over
    if(!reduceMotion && 'IntersectionObserver' in window){
      new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ if(!touched) setPlaying(true); }
          else setPlaying(false);
        });
      }, {threshold: 0.45}).observe(arr);
    }
  })();

  // --- Point visitors at the download for the system they're on ---
  (function(){
    var ua = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
    ua = ua.toLowerCase();
    if(/android|iphone|ipad|ipod/.test((navigator.userAgent || '').toLowerCase())) return; // no build to suggest
    var os = /win/.test(ua) ? 'windows' : /mac/.test(ua) ? 'mac' : /linux|x11|cros/.test(ua) ? 'linux' : '';
    var card = os && document.querySelector('.download-item[data-os="' + os + '"]');
    if(!card) return;
    card.classList.add('primary');
    var badge = document.createElement('span');
    badge.className = 'download-badge';
    badge.textContent = 'For your system';
    card.insertBefore(badge, card.firstChild);
  })();

  // --- Header tabs light up for the section in view, like the app's page tabs ---
  (function(){
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-tabs a'));
    if(!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function(l){ byId[l.getAttribute('href').slice(1)] = l; });
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        links.forEach(function(l){ l.classList.remove('active'); });
        var l = byId[entry.target.id];
        if(l) l.classList.add('active');
      });
    }, {rootMargin: '-45% 0px -50% 0px'});
    document.querySelectorAll('main section').forEach(function(s){ obs.observe(s); });
  })();

  // --- Lightbox for screenshots ---
  function createLightbox(){
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role','dialog');
    lb.setAttribute('aria-modal','true');
    lb.setAttribute('aria-hidden','true');

    var inner = document.createElement('div'); inner.className = 'lightbox__inner';
    var img = document.createElement('img'); img.className = 'lightbox__img'; img.alt = '';
    var close = document.createElement('button'); close.className = 'lightbox__close'; close.type = 'button'; close.setAttribute('aria-label','Close'); close.innerHTML = '&times;';
    var caption = document.createElement('div'); caption.className = 'lightbox__caption';

    inner.appendChild(img);
    inner.appendChild(close);
    inner.appendChild(caption);
    lb.appendChild(inner);
    document.body.appendChild(lb);

    var lastFocus = null;

    function open(src, alt){
      lastFocus = document.activeElement;
      img.src = src;
      img.alt = alt || '';
      caption.textContent = alt || '';
      lb.classList.add('open');
      lb.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
      close.focus();
    }

    function closeLb(){
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
      if(lastFocus && lastFocus.focus) lastFocus.focus();
      // wait for the close fade to finish before dropping the image
      setTimeout(function(){
        if(!lb.classList.contains('open')) img.removeAttribute('src');
      }, 220);
    }

    close.addEventListener('click', closeLb);
    lb.addEventListener('click', function(e){ if(e.target === lb || e.target === inner) closeLb(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });

    return {open: open};
  }

  var lightbox = createLightbox();
  document.querySelectorAll('.screen-card img').forEach(function(i){
    // reachable from the keyboard too
    i.setAttribute('tabindex','0');
    i.setAttribute('role','button');
    function show(){
      var src = i.getAttribute('data-full') || i.currentSrc || i.src;
      if(src) lightbox.open(src, i.alt || 'Screenshot');
    }
    i.addEventListener('click', show);
    i.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); show(); }
    });
  });

  // --- Screenshots grow as they scroll toward the center of the viewport ---
  var growEls = Array.prototype.slice.call(document.querySelectorAll('.showcase-media img'));
  if(growEls.length && !reduceMotion){
    var growTicking = false;
    var updateGrow = function(){
      var vh = window.innerHeight || document.documentElement.clientHeight;
      growEls.forEach(function(img){
        var rect = img.getBoundingClientRect();
        if(rect.bottom < -200 || rect.top > vh + 200) return; // skip far-offscreen work
        var center = rect.top + rect.height / 2;
        var progress = Math.min(1, Math.max(0, 1 - Math.abs(center - vh / 2) / (vh / 2)));
        img.style.setProperty('--grow-scale', (0.9 + 0.1 * progress).toFixed(4));
      });
      growTicking = false;
    };
    var onGrowScroll = function(){
      if(!growTicking){ window.requestAnimationFrame(updateGrow); growTicking = true; }
    };
    window.addEventListener('scroll', onGrowScroll, {passive:true});
    window.addEventListener('resize', onGrowScroll);
    updateGrow();
  }

  // --- Reveal-on-scroll ---
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }
})();
