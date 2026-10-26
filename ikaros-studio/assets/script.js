// Minimal site scripting
(function(){
  var y = new Date().getFullYear();
  var el = document.getElementById('year');
  if(el) el.textContent = y;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var target = document.querySelector(this.getAttribute('href'));
      if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });

  // --- Hero transport readout: counts bars and beats like the app's LCD at the tempo shown ---
  (function(){
    var pos = document.getElementById('lcd-pos');
    if(!pos || reduceMotion) return;
    var bpm = 84, beatsPerBar = 4, bars = 8, beat = 0;
    setInterval(function(){
      beat = (beat + 1) % (bars * beatsPerBar);
      var bar = Math.floor(beat / beatsPerBar) + 1;
      pos.textContent = (bar < 10 ? '0' : '') + bar + '.' + (beat % beatsPerBar + 1);
    }, 60000 / bpm);
  })();

  // --- Point visitors at the download for the system they're on ---
  (function(){
    var ua = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent || '';
    ua = ua.toLowerCase();
    if(/android|iphone|ipad|ipod/.test((navigator.userAgent || '').toLowerCase())) return; // no desktop build to suggest
    var os = /win/.test(ua) ? 'windows' : /mac/.test(ua) ? 'mac' : /linux|x11|cros/.test(ua) ? 'linux' : '';
    var card = os && document.querySelector('.download-item[data-os="' + os + '"]');
    if(!card) return;
    card.classList.add('primary');
    var badge = document.createElement('span');
    badge.className = 'download-badge';
    badge.textContent = 'For your system';
    card.insertBefore(badge, card.firstChild);
  })();

  // --- Lightbox for screenshots ---
  function createLightbox(){
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role','dialog');
    lb.setAttribute('aria-hidden','true');

    var inner = document.createElement('div'); inner.className = 'lightbox__inner';
    var img = document.createElement('img'); img.className = 'lightbox__img'; img.alt = '';
    var close = document.createElement('button'); close.className = 'lightbox__close'; close.title = 'Close'; close.innerHTML = '&times;';
    var caption = document.createElement('div'); caption.className = 'lightbox__caption';

    inner.appendChild(img);
    inner.appendChild(close);
    inner.appendChild(caption);
    lb.appendChild(inner);
    document.body.appendChild(lb);

    function open(src, alt){
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
      // wait for the close fade to finish before dropping the image
      setTimeout(function(){
        if(!lb.classList.contains('open')) img.src = '';
      }, 220);
    }

    close.addEventListener('click', closeLb);
    lb.addEventListener('click', function(e){ if(e.target === lb || e.target === inner) closeLb(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });

    return {open: open, close: closeLb, element: lb};
  }

  var lightbox = createLightbox();
  document.querySelectorAll('.screen-card img').forEach(function(i){
    i.addEventListener('click', function(){
      var src = this.getAttribute('data-full') || this.currentSrc || this.src;
      if(!src) return;
      lightbox.open(src, this.alt || 'Screenshot');
    });
  });

  // --- Screenshots grow as they scroll toward the center of the viewport ---
  var growEls = Array.prototype.slice.call(document.querySelectorAll('.showcase-media img'));
  if(growEls.length && !reduceMotion){
    var growTicking = false;
    function updateGrow(){
      var vh = window.innerHeight || document.documentElement.clientHeight;
      growEls.forEach(function(img){
        var rect = img.getBoundingClientRect();
        if(rect.bottom < -200 || rect.top > vh + 200) return; // skip far-offscreen work
        var center = rect.top + rect.height / 2;
        var raw = 1 - Math.abs(center - vh / 2) / (vh / 2);
        var progress = Math.min(1, Math.max(0, raw));
        var scale = 0.88 + 0.12 * progress;
        img.style.setProperty('--grow-scale', scale.toFixed(4));
      });
      growTicking = false;
    }
    function onGrowScroll(){
      if(!growTicking){
        window.requestAnimationFrame(updateGrow);
        growTicking = true;
      }
    }
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
