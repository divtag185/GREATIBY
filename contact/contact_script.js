  function openMenu(){
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  function closeMenu(){
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  const yearEl = document.getElementById('currentYear');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  // SCROLL ANIMATION
  const revealEls = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if(prefersReducedMotion){
    revealEls.forEach(el => el.classList.add('visible'));
  } else if('IntersectionObserver' in window){
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  const form = document.getElementById('contactForm');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const btn = form.querySelector('.submit-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Message Sent ✓';
    btn.style.background = '#5f705c';
    setTimeout(() => {
      form.reset();
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2200);
  });

  (function(){
    var hdr = document.querySelector('header');
    if(!hdr) return;
    function syncNavHeight(){
      var cs = getComputedStyle(hdr);
      var h = hdr.getBoundingClientRect().height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      document.documentElement.style.setProperty('--nav-h', h + 'px');
    }
    syncNavHeight();
    window.addEventListener('resize', syncNavHeight);
    window.addEventListener('load', syncNavHeight);
    if('ResizeObserver' in window){ new ResizeObserver(syncNavHeight).observe(hdr); }
  })();

  // PARALLAX EFFECT
  (function(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce || !('translate' in document.documentElement.style)) return;

    var layers = [
      /* background */
      { sel:'.hero-bg',          k: 0.25,  mode:'scroll', max:190 },
      { sel:'.footer-blob',      k: 0.30,  mode:'view',   max:70  },
      /* foreground  hero */
      { sel:'.hero .badge',      k:-0.075, mode:'scroll', max:60 },
      { sel:'.hero-content h1',  k:-0.065, mode:'scroll', max:55 },
      /* foreground  footer */
      { sel:'.footer-cta h2',    k:-0.05,  mode:'view',   max:34 },
      { sel:'.store-buttons',    k:-0.03,  mode:'view',   max:22 }
    ];

    var items = [], vh = 0, sy = 0, scale = 1, ticking = false;
    layers.forEach(function(l){
      document.querySelectorAll(l.sel).forEach(function(el){
        items.push({ el:el, k:l.k, mode:l.mode, max:l.max, y:0, center:0 });
      });
    });
    if(!items.length) return;

    function clamp(v, m){ return Math.max(-m, Math.min(m, v)); }

    function measure(){
      vh = window.innerHeight;
      sy = window.pageYOffset;
      scale = window.innerWidth <= 980 ? 0.6 : 1;   
      items.forEach(function(it){
        if(it.mode !== 'view') return;
        var r = it.el.getBoundingClientRect();
        it.center = r.top + sy - it.y + r.height/2;   
      });
    }

    function update(){
      ticking = false;
      sy = window.pageYOffset;
      var vc = sy + vh/2;
      items.forEach(function(it){
        var raw = it.mode === 'scroll' ? sy : (vc - it.center);
        var y = clamp(it.k * raw * scale, it.max);
        if(Math.abs(y - it.y) > 0.05){
          it.y = y;
          it.el.style.translate = '0 ' + y.toFixed(2) + 'px';
        }
      });
    }

    function request(){
      if(!ticking){ ticking = true; window.requestAnimationFrame(update); }
    }
    function remeasure(){ measure(); update(); }

    window.addEventListener('scroll', request, { passive:true });
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    if(document.fonts && document.fonts.ready){ document.fonts.ready.then(remeasure); }
    if('ResizeObserver' in window){ new ResizeObserver(remeasure).observe(document.body); }
    remeasure();
  })();
