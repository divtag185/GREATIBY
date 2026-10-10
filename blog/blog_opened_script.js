  /* ---------- Post data ---------- */
  const CATS = ['Product Updates','Inside the news','Crypto News','Featured Business'];
  const posts = Array.from({length:96},(_,i)=>({
    id:i,
    cat: i < 12 ? 'Product Updates' : CATS[i % 4],
    date:'Aug 5, 2026',
    title:'Lorem Ipsum lorem ipsum title here',
    excerpt:'Lorem ipsum dolor sit amet dolo dolorsi consectetur. Iaculis amet ipsum sit amet consectetur adipiscing elit.'
  }));

  const params = new URLSearchParams(location.search);
  const currentId = Number.isInteger(+params.get('id')) && params.get('id') !== null && params.get('id') !== '' ? +params.get('id') : -1;
  const selfPage = decodeURIComponent(location.pathname.split('/').pop() || '') || 'blog_opened.html';

  function renderTrending(){
    const pool = posts.filter(p=>p.id !== currentId);
    const start = currentId >= 0 ? (currentId % pool.length) : 0;
    const picks = [0,1,2].map(k => pool[(start + k) % pool.length]);
    document.getElementById('trendGrid').innerHTML = picks.map(p => `
    <a href="${selfPage}?id=${p.id}" class="t-card">
      <div class="t-thumb"><div class="media" data-plx="0.08" data-plx-ref="parent" data-plx-scale="1.14"></div></div>
      <div class="t-meta"><span class="t-pill">${p.cat}</span><span class="t-pill date">${p.date}</span></div>
      <h3>${p.title}</h3>
      <p>${p.excerpt}</p>
    </a>`).join('');
  }

  /* ---------- Scroll animation ---------- */
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
      el.style.setProperty('--d', (base + (cycle ? i % cycle : i) * step) + 'ms');
      if(revealIO) revealIO.observe(el); else el.classList.add('in');
    });
  }
  function revealHero(){
    document.querySelectorAll('.art-zone .reveal').forEach(el=>{
      el.dataset.revealed = '1';
      if(revealIO) revealIO.observe(el); else el.classList.add('in');
    });
  }
  function revealStatic(){
    /* article content fades in block by block */
    reveal(document.querySelectorAll('.art-body > *, .art-foot'), 0);
    reveal(document.querySelectorAll('.trend-head, .trend-grid .t-card'), 90, 0, 3);
    reveal(document.querySelectorAll('.trust-banner .tb-icon, .trust-banner h2, .trust-banner p, .trust-banner .photo-frame'), 110);
    reveal(document.querySelectorAll('footer .footer-cta'));
    reveal(document.querySelectorAll('footer .footer-cols > *'), 90);
    reveal(document.querySelectorAll('footer .footer-bottom'));
  }

  /* ---------- Multi-layer parallax ---------- */
  const plxReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let plxLayers = [], plxTicking = false;

  function plxCollect(){
    plxLayers = Array.from(document.querySelectorAll('[data-plx]')).map(el=>{
      const mode = el.dataset.plxRef || 'scope';
      const ref = mode==='self' ? el : mode==='parent' ? el.parentElement : (el.closest('[data-plx-scope]') || el.parentElement);
      const sc = parseFloat(el.dataset.plxScale) || 0;
      return {el, ref, sc, speed: parseFloat(el.dataset.plx) || 0, max: el.dataset.plxMax ? parseFloat(el.dataset.plxMax) : 80};
    });
  }
  function plxUpdate(){
    plxTicking = false;
    if(plxReduce) return;
    const vh = window.innerHeight, k = window.innerWidth <= 640 ? 0.6 : 1, cache = new Map();
    plxLayers.forEach(l=>{
      let r = cache.get(l.ref);
      if(!r){ r = l.ref.getBoundingClientRect(); cache.set(l.ref, r); }
      if(!r.height || r.bottom < -300 || r.top > vh + 300) return;      
      const offset = (r.top + r.height/2) - vh/2;                       
      let max = l.max;
      if(l.sc) max = ((l.sc - 1) / 2) * r.height * 0.96;               
      const y = Math.max(-max, Math.min(max, -offset * l.speed * k));
      l.el.style.translate = '0 ' + y.toFixed(1) + 'px';
    });
  }
  function plxRequest(){ if(!plxTicking){ plxTicking = true; requestAnimationFrame(plxUpdate); } }

  function plxTag(sel, speed, max){
    document.querySelectorAll(sel).forEach(el=>{
      if(el.dataset.plx) return;
      el.dataset.plx = speed; el.dataset.plxRef = 'self'; el.dataset.plxMax = max;
    });
  }
  function plxTextLayers(){
    plxTag('.art-body > p, .art-body > h2', -0.04, 14);
    plxTag('.art-quote', -0.04, 14);
    plxTag('.art-fig figcaption', -0.04, 8);
    plxTag('.art-foot', -0.03, 10);
    plxTag('.trend-head', -0.04, 8);
    plxTag('.t-card .t-meta, .t-card h3, .t-card p', -0.045, 10);
  }

  /* ---------- Mobile menu ---------- */
  function openMenu(){
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  function closeMenu(){
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  function setHeaderOffset(){
    const h = document.querySelector('header'), cs = getComputedStyle(h);
    document.documentElement.style.setProperty('--hdr', (h.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)) + 'px');
  }

  /* ---------- Back to top ---------- */
  const toTop = document.getElementById('toTop');
  toTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior: plxReduce ? 'auto' : 'smooth'}));

  /* ---------- Share ---------- */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>toastEl.classList.remove('show'), 2200);
  }
  document.getElementById('shareBtn').addEventListener('click', async ()=>{
    const data = {title: document.title, url: location.href};
    try{
      if(navigator.share){ await navigator.share(data); return; }
    }catch(err){ if(err && err.name === 'AbortError') return; }
    try{ await navigator.clipboard.writeText(location.href); toast('Link copied'); }
    catch(err){ toast('Copy the link from your address bar'); }
  });

  window.addEventListener('scroll', plxRequest, {passive:true});
  window.addEventListener('resize', ()=>{ setHeaderOffset(); plxCollect(); plxRequest(); });
  window.addEventListener('load', ()=>{ setHeaderOffset(); plxRequest(); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(setHeaderOffset);

  renderTrending();
  setHeaderOffset();
  revealHero();
  revealStatic();
  plxTextLayers();
  plxCollect(); plxUpdate();

  const yearEl = document.getElementById('currentYear');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }
