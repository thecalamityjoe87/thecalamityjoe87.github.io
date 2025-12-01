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
      img.src = '';
    }

    // Close interactions
    close.addEventListener('click', closeLb);
    lb.addEventListener('click', function(e){ if(e.target === lb) closeLb(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && lb.classList.contains('open')) closeLb(); });

    return {open: open, close: closeLb, element: lb};
  }

  var lightbox = createLightbox();
  // Only attach lightbox handlers to gallery images, not download cards.
  document.querySelectorAll('.card:not(.download-item) img').forEach(function(i){
    i.addEventListener('click', function(e){
      // prefer an explicit high-res target via data-full when present
      var src = this.getAttribute('data-full') || this.src || this.getAttribute('data-src');
      if(!src) return;
      lightbox.open(src, this.alt || 'Screenshot');
    });
  });

})();
