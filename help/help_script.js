  document.documentElement.classList.add('js');

  const yearEl = document.getElementById('currentYear');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  function openMenu(){
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  function closeMenu(){
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  document.querySelectorAll('.faq-question').forEach(function(btn){
    btn.addEventListener('click', function(){
      var item = btn.closest('.faq-item');
      var answer = item.querySelector('.faq-answer');
      var isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(function(openItem){
        if(openItem !== item){
          openItem.classList.remove('open');
          openItem.querySelector('.faq-answer').style.maxHeight = null;
        }
      });

      if(isOpen){
        item.classList.remove('open');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  document.querySelectorAll('.tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  (function(){
    var groups = [
      '.eyebrow','.hero h1','.hero p','.search-bar',
      '.tabs','.faq-item',
      '.cta-section h2','.cta-section p','.btn-contact',
      '.footer-cta h2','.store-buttons',
      '.footer-cols > div','.footer-brand-mobile','.footer-bottom'
    ];
    var els = document.querySelectorAll(groups.join(','));
    var counts = new Map();
    els.forEach(function(el){
      var parent = el.parentElement;
      var i = counts.get(parent) || 0;
      counts.set(parent, i + 1);
      el.classList.add('reveal');
      el.style.setProperty('--d', (Math.min(i, 6) * 0.09) + 's');
    });
    if(!('IntersectionObserver' in window) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
      els.forEach(function(el){ el.classList.remove('reveal'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var el = entry.target;
          el.classList.add('in');
          io.unobserve(el);
          
          var delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
          setTimeout(function(){ el.classList.remove('reveal','in'); }, (0.7 + delay) * 1000 + 150);
        }
      });
    }, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });
    els.forEach(function(el){ io.observe(el); });
  })();

  (function(){
    var nav = document.querySelector('.navbar');
    if(!nav) return;
    function syncNavHeight(){
      document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
    }
    syncNavHeight();
    window.addEventListener('resize', syncNavHeight);
    window.addEventListener('load', syncNavHeight);
    if('ResizeObserver' in window){ new ResizeObserver(syncNavHeight).observe(nav); }
  })();

  /* PARALLAX EFFECT */
  (function(){
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce || !('translate' in document.documentElement.style)) return;

    var layers = [
      /* background */
      { sel:'.hero-bg',           k: 0.25,  mode:'scroll', max:190 },
      { sel:'.footer-blob',       k: 0.30,  mode:'view',   max:70  },
      /* foreground hero */
      { sel:'.hero .eyebrow',     k:-0.075, mode:'scroll', max:60 },
      { sel:'.hero h1',           k:-0.065, mode:'scroll', max:55 },
      { sel:'.hero p',            k:-0.05,  mode:'scroll', max:45 },
      { sel:'.search-bar',        k:-0.03,  mode:'scroll', max:30 },
      /* foreground "Still have a question?" */
      { sel:'.cta-section h2',    k:-0.06,  mode:'view',   max:36 },
      { sel:'.cta-section p',     k:-0.045, mode:'view',   max:28 },
      { sel:'.btn-contact',       k:-0.03,  mode:'view',   max:20 },
      /* foreground footer */
      { sel:'.footer-cta h2',     k:-0.05,  mode:'view',   max:34 },
      { sel:'.store-buttons',     k:-0.03,  mode:'view',   max:22 }
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
