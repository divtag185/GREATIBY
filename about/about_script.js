  if('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.documentElement.classList.add('js-reveal');
  }

  function toggleCultureMore(){
    const more = document.getElementById('cultureMore');
    const btn = document.getElementById('cultureReadMore');
    const isOpen = more.classList.toggle('expanded');
    btn.innerHTML = isOpen
      ? 'Read Less <i class="fa-solid fa-arrow-up"></i>'
      : 'Read More <i class="fa-solid fa-arrow-right"></i>';
  }

  function toggleFounderMore(){
    const more = document.getElementById('founderMore');
    const btn = document.getElementById('founderReadMore');
    const isOpen = more.classList.toggle('expanded');
    btn.style.display = isOpen ? 'none' : '';
    if(!isOpen){ btn.scrollIntoView({behavior:'smooth', block:'center'}); }
  }

  function openMenu(){
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  function closeMenu(){
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  const backToTopBtn = document.getElementById('backToTop');
  window.addEventListener('scroll', ()=>{
    if(window.scrollY > window.innerHeight * 0.6){
      backToTopBtn.classList.add('visible');
    }else{
      backToTopBtn.classList.remove('visible');
    }
  });
  backToTopBtn.addEventListener('click', ()=>{
    window.scrollTo({top:0, behavior:'smooth'});
  });

  const yearEl = document.getElementById('currentYear');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  /* PAALLAX */
  (function(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    
    const layers = [
      // slow bg
      ['.footer-blob', 0.14],
      ['.mv-card .watermark', 0.09],
      // medium bg
      ['.hero-visual', 0.04],
      ['.promo-card', 0.05],
      ['.mv-card', 0.03],
      ['.trust-card', 0.03],
      ['.founder-photo', 0.05],
      ['.culture-photo', 0.05],
      ['.trust-banner .photo-frame', 0.05],
      // Fast bg
      ['.hero-grid > div:first-child', -0.03],
      ['.hero-qr-float', -0.09],
      ['.stats-row', -0.03],
      ['.welcome-grid > div:first-child', -0.03],
      ['.mv-card .mv-icon', -0.05],
      ['.mv-card h3', -0.05],
      ['.mv-card p', -0.05],
      ['.center-head', -0.03],
      ['.trust-card .tc-icon', -0.06],
      ['.founder-grid > div:not(.photo-frame)', -0.03],
      ['.culture-grid > div:not(.photo-frame)', -0.03],
      ['.trust-banner .tb-icon', -0.03],
      ['.trust-banner h2', -0.03],
      ['.trust-banner .wrap > p', -0.03],
      ['.footer-cta h2', -0.03],
      ['.store-buttons', -0.03]
    ];

    const items = [];
    layers.forEach(([sel, k]) => {
      document.querySelectorAll(sel).forEach(el => {
        el.setAttribute('data-plx', '');
        items.push({el, k, y:null});
      });
    });

    const hero = document.querySelector('.hero');
    const HERO_K = 0.14, MAX = 120;
    let heroY = null, ticking = false;

    const clamp = (v) => Math.max(-MAX, Math.min(MAX, v));

    function update(){
      ticking = false;
      const vc = window.innerHeight / 2;
      const f = window.innerWidth <= 768 ? 0.6 : 1;   

      if(hero){
        const r = hero.getBoundingClientRect();
        const y = Math.round(clamp(-((r.top + r.height/2) - vc) * HERO_K * f) * 10) / 10;
        if(y !== heroY){ heroY = y; hero.style.setProperty('--bgy', y + 'px'); }
      }

      items.forEach(it => {
        const r = it.el.getBoundingClientRect();
        if(!r.height) return;                       
        const base = r.top - (it.y || 0) + r.height/2;
        const y = Math.round(clamp(-(base - vc) * it.k * f) * 10) / 10;
        if(y !== it.y){ it.y = y; it.el.style.setProperty('--py', y + 'px'); }
      });
    }

    function request(){
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener('scroll', request, {passive:true});
    window.addEventListener('resize', request);
    window.addEventListener('load', request);
    update();
  })();

  /* Ppause phone animation whn offscreen */
  (function(){
    const phone = document.querySelector('.hero-phone-img');
    const hero = document.querySelector('.hero');
    if(!phone || !hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(entries => {
      phone.classList.toggle('is-paused', !entries[0].isIntersecting);
    }).observe(hero);
  })();

  /* scroll animation */
  (function(){
    if(!document.documentElement.classList.contains('js-reveal')) return;

    const groups = [
      ['.stats-row', 0, 0],
      ['.welcome-grid > *', 0, 0.15],
      ['.mv-card', 0, 0.15],
      ['.center-head', 0, 0],
      ['.trust-card', 0, 0.12],
      ['.founder-grid > *', 0, 0.15],
      ['.culture-grid > *', 0, 0.15],
      ['.trust-banner .wrap > *', 0, 0.1],
      ['.footer-cta', 0, 0],
      ['.footer-cols', 0, 0],
      ['.footer-brand-mobile', 0, 0],
      ['.footer-bottom', 0, 0]
    ];

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, {threshold:0.05, rootMargin:'0px 0px -6% 0px'});

    groups.forEach(([sel, base, step]) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.setProperty('--rd', (base + i * step).toFixed(2) + 's');
        io.observe(el);
      });
    });
  })();
