// Minimal site scripting
(function(){
  var y = new Date().getFullYear();
  var el = document.getElementById('year');
  if(el) el.textContent = y;

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var target = document.querySelector(this.getAttribute('href'));
      if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
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
      // focus the close button for accessibility
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

    // Close interactions
    close.addEventListener('click', closeLb);
    lb.addEventListener('click', function(e){ if(e.target === lb) closeLb(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });

    return {open: open, close: closeLb, element: lb};
  }

  var lightbox = createLightbox();
  // Only attach lightbox handlers to gallery images, not download cards.
  document.querySelectorAll('.screen-card img').forEach(function(i){
    i.addEventListener('click', function(e){
      // prefer an explicit high-res target via data-full when present
      var src = this.getAttribute('data-full') || this.src || this.getAttribute('data-src');
      if(!src) return;
      lightbox.open(src, this.alt || 'Screenshot');
    });
  });

  // --- Screenshots grow as they scroll toward the center of the viewport ---
  // (only the large showcase shots -- the boxed thumbnails would show gaps around a shrunk image)
  var growEls = Array.prototype.slice.call(document.querySelectorAll('.showcase-media img'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        var scale = 0.8 + 0.2 * progress;
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

  // --- "More screens" carousel (mirrors the app's own card carousels: peeking cards + dot paging) ---
  (function(){
    var carousel = document.querySelector('.carousel');
    if(!carousel) return;
    var track = carousel.querySelector('.carousel-track');
    var prevBtn = carousel.querySelector('.carousel-btn.prev');
    var nextBtn = carousel.querySelector('.carousel-btn.next');
    var dotsWrap = document.querySelector('.carousel-dots');
    var cards = Array.prototype.slice.call(track.children);
    if(!cards.length) return;

    var dots = [];

    function step(){
      // one card's width plus the track's gap
      var trackStyle = window.getComputedStyle(track);
      var gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '16');
      return cards[0].getBoundingClientRect().width + gap;
    }

    function maxScroll(){
      return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    // Dots represent actual scroll positions ("pages"), not one per card --
    // with several cards peeking at once, a 1-per-card dot count made most
    // dots unreachable and out of sync with what was really on screen.
    function buildDots(){
      var pageCount = Math.max(1, Math.round(maxScroll() / step()) + 1);
      if(pageCount === dots.length) return;
      dotsWrap.innerHTML = '';
      dots = [];
      for(var i = 0; i < pageCount; i++){
        (function(i){
          var dot = document.createElement('button');
          dot.className = 'dot';
          dot.type = 'button';
          dot.setAttribute('aria-label', 'Go to screenshot page ' + (i + 1));
          dot.addEventListener('click', function(){
            track.scrollTo({left: Math.min(i * step(), maxScroll()), behavior: 'smooth'});
          });
          dotsWrap.appendChild(dot);
          dots.push(dot);
        })(i);
      }
    }

    function updateUI(){
      var ms = maxScroll();
      var atStart = track.scrollLeft <= 4;
      var atEnd = track.scrollLeft >= ms - 4;
      if(prevBtn) prevBtn.disabled = atStart;
      if(nextBtn) nextBtn.disabled = ms <= 4 || atEnd;

      // active dot = how many card-widths we've scrolled past, clamped to what's actually reachable
      var index = Math.round(track.scrollLeft / step());
      index = Math.max(0, Math.min(dots.length - 1, index));
      dots.forEach(function(d, i){ d.classList.toggle('active', i === index); });
    }

    function refresh(){
      buildDots();
      updateUI();
    }

    if(prevBtn) prevBtn.addEventListener('click', function(){
      track.scrollBy({left: -step(), behavior: 'smooth'});
    });
    if(nextBtn) nextBtn.addEventListener('click', function(){
      track.scrollBy({left: step(), behavior: 'smooth'});
    });

    var ticking = false;
    track.addEventListener('scroll', function(){
      if(!ticking){
        window.requestAnimationFrame(function(){ updateUI(); ticking = false; });
        ticking = true;
      }
    }, {passive: true});
    window.addEventListener('resize', refresh);

    refresh();
    // card images loading in can change scrollWidth/clientWidth after the first pass
    window.addEventListener('load', refresh);
  })();

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
    }, {threshold: 0.15, rootMargin: '0px 0px -40px 0px'});
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('visible'); });
  }

})();
