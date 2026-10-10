  /* ---------- Scroll reveal ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealIO = ('IntersectionObserver' in window && !reduceMotion)
    ? new IntersectionObserver(entries=>{
        entries.forEach(en=>{
          if(en.isIntersecting){ en.target.classList.add('in'); revealIO.unobserve(en.target); }
        });
      }, {threshold:0.12, rootMargin:'0px 0px -6% 0px'})
    : null;

  function reveal(els, step = 90, base = 0, cycle = 0){
    Array.from(els).forEach((el, i)=>{
      if(el.dataset.revealed) return;
      el.dataset.revealed = '1';
      el.classList.add('reveal');
      if(!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (base + (cycle ? i % cycle : i) * step) + 'ms');
      if(revealIO) revealIO.observe(el); else el.classList.add('in');
    });
  }

  /* fade-in each time a document is opened */
  function revealPanel(p){
    Array.from(p.children).forEach(el=>{
      el.classList.remove('in');
      delete el.dataset.revealed;
      el.style.removeProperty('--d');
      if(revealIO) revealIO.unobserve(el);
    });
    reveal(p.children, 70, 0, 3);
  }
  reveal(document.querySelectorAll('.reveal'));   /* hero, sidebar, footer */

  /* ---------- parallax ----------s */
  const plxReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let plxLayers = [], plxTicking = false;
  function plxCollect(){
    plxLayers = Array.from(document.querySelectorAll('[data-plx]')).map(el=>{
      const ref = el.closest('[data-plx-scope]') || el.parentElement;
      return {el, ref, mode: el.dataset.plxMode || 'view', speed: parseFloat(el.dataset.plx) || 0, max: el.dataset.plxMax ? parseFloat(el.dataset.plxMax) : 80};
    });
  }
  function plxUpdate(){
    plxTicking = false;
    if(plxReduce) return;
    const vh = window.innerHeight, k = window.innerWidth <= 640 ? 0.6 : 1, cache = new Map();
    plxLayers.forEach(l=>{
      if(l.mode === 'scroll'){      
        const y = Math.max(-l.max, Math.min(l.max, l.speed * window.pageYOffset * k));
        l.el.style.translate = '0 ' + y.toFixed(1) + 'px';
        return;
      }
      let r = cache.get(l.ref);
      if(!r){ r = l.ref.getBoundingClientRect(); cache.set(l.ref, r); }
      if(!r.height || r.bottom < -300 || r.top > vh + 300) return;
      const offset = (r.top + r.height/2) - vh/2;
      const y = Math.max(-l.max, Math.min(l.max, -offset * l.speed * k));
      l.el.style.translate = '0 ' + y.toFixed(1) + 'px';
    });
  }
  function plxRequest(){ if(!plxTicking){ plxTicking = true; requestAnimationFrame(plxUpdate); } }
  window.addEventListener('scroll', plxRequest, {passive:true});
  window.addEventListener('resize', plxRequest);
  window.addEventListener('load', plxRequest);

  document.querySelectorAll('.panel > h2, .panel > .updated').forEach(el=>{ el.dataset.plx = '-0.03'; el.dataset.plxMax = '8'; });
  plxCollect(); plxUpdate();

  /* ---------- Tabs ---------- */
  const TABS = {
    'privacy':          'privacy',
    'privacy-policy':   'privacy',
    'terms':            'terms',
    'terms-of-service': 'terms',
    'kyc-aml':          'aml',
    'aml':              'aml'
  };
  const panels = {
    privacy: document.getElementById('panel-privacy'),
    terms:   document.getElementById('panel-terms'),
    aml:     document.getElementById('panel-aml')
  };
  const heroSub = document.getElementById('heroSub');
  const sideLinks = document.querySelectorAll('.side a[data-tab]');
  let current = null;

  function showTab(key, opts){
    opts = opts || {};
    if(!panels[key]) key = 'privacy';
    Object.keys(panels).forEach(k => { panels[k].hidden = (k !== key); });
    sideLinks.forEach(a => {
      if(a.dataset.tab === key) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    const p = panels[key];
    heroSub.textContent = p.dataset.hero;
    document.title = 'Legal | ' + p.dataset.title + ' | Greatiby';
    if(opts.scroll && current !== key){
      
      const top = document.querySelector('.legal-main').getBoundingClientRect().top + window.scrollY - 24;
      if(window.scrollY > top) window.scrollTo({top: top, behavior:'smooth'});
    }
    current = key;
    revealPanel(p);
  }

  document.querySelectorAll('a[data-tab]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const key = a.dataset.tab;
      history.pushState(null, '', a.getAttribute('href'));
      showTab(key, {scroll:true});
    });
  });

  window.addEventListener('hashchange', () => {
    showTab(TABS[location.hash.replace('#','')] || 'privacy');
  });

  showTab(TABS[location.hash.replace('#','')] || 'privacy');

  /* ---------- Back to top ---------- */
  document.getElementById('toTop').addEventListener('click', () => {
    window.scrollTo({top:0, behavior:'smooth'});
  });

  /* ---------- Keep the hero tucked exactly under the sticky header (no gap at any width) ---------- */
  (function(){
    const hdr = document.querySelector('header');
    if(!hdr) return;
    function syncNavHeight(){
      const cs = getComputedStyle(hdr);
      const h = hdr.getBoundingClientRect().height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
      document.documentElement.style.setProperty('--nav-h', h + 'px');
    }
    syncNavHeight();
    window.addEventListener('resize', syncNavHeight);
    window.addEventListener('load', syncNavHeight);
    if('ResizeObserver' in window){ new ResizeObserver(syncNavHeight).observe(hdr); }
  })();

  /* ---------- Mobile menu ---------- */
  function openMenu(){
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  function closeMenu(){
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  document.getElementById('currentYear').textContent = new Date().getFullYear();
