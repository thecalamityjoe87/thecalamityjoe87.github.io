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

  // --- Feature tour: load YouTube only when asked, so the page stays fast and cookie-free until then ---
  document.querySelectorAll('.video-facade').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id = btn.getAttribute('data-video');
      // YouTube refuses embeds from pages with no origin to report (Error 153), as when the
      // page is opened straight from disk, so play it on YouTube itself instead.
      if(location.protocol === 'file:'){
        window.open('https://www.youtube.com/watch?v=' + id, '_blank', 'noopener');
        return;
      }
      var frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
      frame.title = 'Lithium Drums feature tour';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.allowFullscreen = true;
      btn.parentNode.replaceChild(frame, btn);
      frame.focus();
    });
  });

  // --- Features: a hit travels down the cable as you scroll, lighting each stage it reaches ---
  (function(){
    var wrap = document.getElementById('feature-path');
    if(!wrap || reduceMotion) return; // otherwise every stage simply shows lit
    var cable = wrap.querySelector('.path-cable');
    var stages = Array.prototype.slice.call(wrap.querySelectorAll('.stage'));
    var nodes = stages.map(function(st){ return st.querySelector('.stage-node'); });
    wrap.classList.add('armed');
    var ticking = false;
    function update(){
      ticking = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var hitY = vh * 0.62;
      var c = cable.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (hitY - c.top) / c.height));
      wrap.style.setProperty('--p', p.toFixed(4));
      var y = c.top + p * c.height;
      nodes.forEach(function(n, i){
        var r = n.getBoundingClientRect();
        stages[i].classList.toggle('lit', r.top + r.height / 2 <= y + 1);
      });
    }
    function onScroll(){ if(!ticking){ ticking = true; window.requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
    update();
  })();

  // --- Sound presets: filter by style, like the Grooves page's chips ---
  (function(){
    var chips = Array.prototype.slice.call(document.querySelectorAll('.preset-filter .chip-btn'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.preset-card'));
    chips.forEach(function(chip){
      chip.addEventListener('click', function(){
        var f = chip.getAttribute('data-filter');
        chips.forEach(function(c){
          var on = c === chip;
          c.classList.toggle('active', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        cards.forEach(function(card){
          card.hidden = !(f === 'all' || card.getAttribute('data-group') === f);
        });
      });
    });
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
