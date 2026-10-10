  /* Post data */
  const CATS = ['Product Updates','Inside the news','Crypto News','Featured Business'];
  const posts = Array.from({length:96},(_,i)=>({
    id:i,
    cat: i < 12 ? 'Product Updates' : CATS[i % 4],
    date:'Aug 5, 2026',
    title:'Lorem Ipsum lorem ipsum title here',
    excerpt:'Lorem ipsum dolor sit amet dolo dolorsi consectetur. Iaculis amet ipsum sit amet consectetur adipiscing elit.'
  }));
  const PER_PAGE = 12;
  let state = {cat:'all', q:'', page:1};

  const grid = document.getElementById('grid');
  const pager = document.getElementById('pager');

  function filtered(){
    const q = state.q.trim().toLowerCase();
    return posts.filter(p =>
      (state.cat==='all' || p.cat===state.cat) &&
      (!q || (p.title+' '+p.excerpt+' '+p.cat).toLowerCase().includes(q))
    );
  }

  function renderPosts(){
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if(state.page > pages) state.page = pages;
    const slice = list.slice((state.page-1)*PER_PAGE, state.page*PER_PAGE);

    grid.innerHTML = slice.length ? slice.map(p => `
    <a href="blog_opened.html?id=${p.id}" class="card">
      <div class="thumb"></div>
      <div class="meta"><span class="pill">${p.cat}</span><span class="pill date">${p.date}</span></div>
      <h3>${p.title}</h3>
      <p>${p.excerpt}</p>
    </a>`).join('') : '<div class="empty">No articles match your search.</div>';

    reveal(grid.querySelectorAll('.card'), 90, 0, 3);
    if(typeof plxCards === 'function') plxCards();
    renderPager(pages);
  }

  function pageList(total, cur){
    if(total <= 5) return Array.from({length:total},(_,i)=>i+1);
    if(cur <= 3) return [1,2,3,'…',total];
    if(cur >= total-2) return [1,'…',total-2,total-1,total];
    return [1,'…',cur,'…',total];
  }

  function renderPager(total){
    if(total <= 1 && !filtered().length){ pager.innerHTML=''; return; }
    const cur = state.page;
    let html = `<button data-p="prev" aria-label="Previous page" ${cur===1?'disabled':''}><i class="fa-solid fa-chevron-left" style="font-size:10px"></i></button>`;
    pageList(total,cur).forEach(n=>{
      html += n==='…' ? '<span class="dots-t">...</span>'
        : `<button data-p="${n}" class="${n===cur?'active':''}" ${n===cur?'aria-current="page"':''}>${n}</button>`;
    });
    html += `<button data-p="next" aria-label="Next page" ${cur===total?'disabled':''}><i class="fa-solid fa-chevron-right" style="font-size:10px"></i></button>`;
    pager.innerHTML = html;
  }

  pager.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b || b.disabled) return;
    const total = Math.max(1, Math.ceil(filtered().length / PER_PAGE));
    const v = b.dataset.p;
    state.page = v==='prev' ? Math.max(1,state.page-1) : v==='next' ? Math.min(total,state.page+1) : +v;
    renderPosts();
    document.querySelector('.main').scrollIntoView({behavior:'smooth'});
  });

  /* tabs */
  document.getElementById('tabs').addEventListener('click', e=>{
    const t = e.target.closest('.tab'); if(!t) return;
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    state.cat = t.dataset.cat; state.page = 1;
    renderPosts();
  });

  /* search */
  const ps = document.getElementById('postSearch');
  function runSearch(){ state.q = ps.value; state.page = 1; renderPosts(); }
  document.getElementById('postSearchBtn').addEventListener('click', runSearch);
  ps.addEventListener('keydown', e=>{ if(e.key==='Enter') runSearch(); });
  ps.addEventListener('input', ()=>{ if(!ps.value){ runSearch(); } });

  /* ---------- Live coin rates ---------- */
    (function(){
      const card = document.getElementById('liveCoinCard');
      const list = card ? card.querySelector('.coin-list') : null;
      const timeEl = document.getElementById('coinUpdatedTime');
      if(!card || !list || !timeEl) return;

      const COIN_POLL_MS = 10000;
      const BASELINE_MS = 10 * 60 * 1000;
      const RATE_MS = 60 * 60 * 1000;
      const UNIVERSE_MS = 5 * 60 * 1000;
      const CHANGE_WINDOW = '1d';                       
      const NGN_RATE_OVERRIDE = 0;                       
      const BINANCE = 'https://data-api.binance.vision/api/v3/';
      const FX_URLS = [
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
        'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json'
      ];
      const ICON_URL = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/';
      const RATE_MULTIPLIER = {buy:1.03, sell:0.97, price:1};
      const DASH = '\u2014';
      const MAX_RESULTS = 8, DEBOUNCE_MS = 150;
      // Display names for coins
      const NAMES = {BTC:'Bitcoin',ETH:'Ethereum',BNB:'BNB',SOL:'Solana',XRP:'XRP',USDT:'Tether',USDC:'USD Coin',DOGE:'Dogecoin',ADA:'Cardano',TRX:'TRON',TON:'Toncoin',AVAX:'Avalanche',SHIB:'Shiba Inu',DOT:'Polkadot',LINK:'Chainlink',BCH:'Bitcoin Cash',LTC:'Litecoin',NEAR:'NEAR Protocol',POL:'Polygon',MATIC:'Polygon',UNI:'Uniswap',ICP:'Internet Computer',APT:'Aptos',ETC:'Ethereum Classic',XLM:'Stellar',ATOM:'Cosmos',FIL:'Filecoin',HBAR:'Hedera',ARB:'Arbitrum',OP:'Optimism',VET:'VeChain',INJ:'Injective',SUI:'Sui',PEPE:'Pepe',AAVE:'Aave',MKR:'Maker',RUNE:'THORChain',ALGO:'Algorand',GRT:'The Graph',FTM:'Fantom',SAND:'The Sandbox',MANA:'Decentraland',AXS:'Axie Infinity',EOS:'EOS',XTZ:'Tezos',THETA:'Theta Network',FLOW:'Flow',CRV:'Curve DAO',SNX:'Synthetix',LDO:'Lido DAO',IMX:'Immutable',TIA:'Celestia',SEI:'Sei',WLD:'Worldcoin',FET:'Fetch.ai',RENDER:'Render',JUP:'Jupiter',WIF:'dogwifhat',BONK:'Bonk',FLOKI:'Floki',ENA:'Ethena',PENDLE:'Pendle',ONDO:'Ondo',TAO:'Bittensor',STX:'Stacks',KAS:'Kaspa',XMR:'Monero',DASH:'Dash',ZEC:'Zcash',NOT:'Notcoin',DOGS:'Dogs',CAKE:'PancakeSwap',COMP:'Compound',SUSHI:'SushiSwap',YFI:'yearn.finance',BAT:'Basic Attention Token',ENJ:'Enjin Coin',CHZ:'Chiliz',GALA:'Gala',ONE:'Harmony',ZIL:'Zilliqa',QTUM:'Qtum',IOTA:'IOTA',NEO:'NEO',KAVA:'Kava',EGLD:'MultiversX',AR:'Arweave',LUNC:'Terra Classic',TRUMP:'Official Trump',WBTC:'Wrapped Bitcoin',FDUSD:'First Digital USD',TUSD:'TrueUSD'};
      const NAME_ORDER = Object.keys(NAMES);

      let rateMode = 'buy';                            
      let fetching = false, lastUpdate = null, backoffUntil = 0;
      let usdNgn = NGN_RATE_OVERRIDE > 0 ? NGN_RATE_OVERRIDE : 0, rateAt = 0;
      const baseline = {};                                
      let baselineAt = 0, baselineBusy = false;
      let universe = null, universeAt = 0, universePromise = null;  

      const rows = () => Array.from(card.querySelectorAll('.coin-row[data-symbol]'));
      const pairOf = sym => sym + 'USDT';
      const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      function timeoutFetch(url, ms){
        const ctrl = new AbortController();
        const t = setTimeout(()=>ctrl.abort(), ms || 8000);
        return fetch(url, {signal: ctrl.signal}).finally(()=>clearTimeout(t));   
      }
      function noteLimit(res){                           
        if(res.status === 429 || res.status === 418){
          const wait = parseInt(res.headers.get('retry-after'), 10);
          backoffUntil = Date.now() + (wait > 0 ? wait : 30) * 1000;
        }
      }

      // ----- rendering -----
      function renderRow(row){
        const raw = parseFloat(row.dataset.raw);
        if(!raw) return;
        const val = raw * RATE_MULTIPLIER[rateMode];
        const priceEl = row.querySelector('.coin-price');
        const fmt = val >= 100 ? {maximumFractionDigits: 2} : val >= 1 ? {maximumFractionDigits: 4} : {maximumSignificantDigits: 4};
        priceEl.textContent = '\u20A6' + val.toLocaleString('en-NG', fmt);
        const chgEl = row.querySelector('.coin-chg');
        const base = baseline[row.dataset.symbol], usd = parseFloat(row.dataset.usd);
        if(chgEl && base && usd){
          const pct = (usd - base) / base * 100;
          const txt = pct.toFixed(2);
          const zero = parseFloat(txt) === 0;
          chgEl.textContent = (pct > 0 && !zero ? '+' : '') + (zero ? '0.00' : txt) + '%';
          chgEl.classList.toggle('pos', !zero && pct > 0);
          chgEl.classList.toggle('neg', !zero && pct < 0);
        }
      }
      function clearChg(row){
        const chgEl = row.querySelector('.coin-chg');
        if(chgEl){ chgEl.textContent = ''; chgEl.classList.remove('pos','neg'); }
      }
      
      function addChgLine(row){
        const priceEl = row.querySelector('.coin-price');
        if(!priceEl || row.querySelector('.coin-chg')) return;
        const wrap = document.createElement('div');
        wrap.className = 'coin-right';
        priceEl.parentNode.insertBefore(wrap, priceEl);
        wrap.appendChild(priceEl);
        const chg = document.createElement('div');
        chg.className = 'coin-chg';
        wrap.appendChild(chg);
      }
      function setPrice(row, usd){
        row.dataset.usd = usd;
        row.dataset.raw = usd * usdNgn;
        renderRow(row);
      }
      function goOffline(){
        rows().forEach(row=>{
          const priceEl = row.querySelector('.coin-price');
          priceEl.textContent = DASH;
          clearChg(row);
        });
        timeEl.textContent = 'Network not available';
      }
      function markUnavailable(){
        rows().forEach(row=>{
          if(row.dataset.raw) return;                    
          const priceEl = row.querySelector('.coin-price');
          priceEl.textContent = DASH;
          clearChg(row);
        });
      }
      function showLastUpdateTime(){
        timeEl.textContent = lastUpdate
          ? lastUpdate.toLocaleTimeString('en-NG', {hour:'2-digit', minute:'2-digit', second:'2-digit'})
          : 'Not updated yet';
      }

      async function ensureRate(){
        if(NGN_RATE_OVERRIDE > 0) return;
        if(usdNgn && Date.now() - rateAt < RATE_MS) return;
        for(const url of FX_URLS){
          try{
            const res = await timeoutFetch(url, 8000);
            if(!res.ok) continue;
            const r = (await res.json())?.usd?.ngn;
            if(r > 0){ usdNgn = r; rateAt = Date.now(); return; }
          }catch(err){  }
        }
        if(!usdNgn) throw new Error('could not load the USD/NGN rate');
        rateAt = Date.now() - (RATE_MS - 5 * 60 * 1000);  // keep the old rate, retry in 5 minutes
      }

      // ----- Binance -----
      async function binancePrices(pairs){
        let res = await timeoutFetch(BINANCE + 'ticker/price?symbols=' + encodeURIComponent(JSON.stringify(pairs)), 10000);
        noteLimit(res);
        if(!res.ok && Date.now() >= backoffUntil){       
          res = await timeoutFetch(BINANCE + 'ticker/price', 15000);
          noteLimit(res);
        }
        if(!res.ok) throw new Error('Binance HTTP ' + res.status);
        const map = {};
        (await res.json()).forEach(t => { map[t.symbol] = parseFloat(t.price); });
        return map;
      }

      // 24-hour reference prices
      async function fetchBaselines(list){
        const periodic = !list;
        if(periodic){ if(baselineBusy) return; baselineBusy = true; baselineAt = Date.now(); }  
        try{
          const syms = (list || rows()).map(r => r.dataset.symbol).filter(s => s !== 'USDT').map(pairOf);
          if(!syms.length) return;
          const res = await timeoutFetch(BINANCE + 'ticker?type=MINI&windowSize=' + CHANGE_WINDOW + '&symbols=' + encodeURIComponent(JSON.stringify(syms)), 12000);
          noteLimit(res);
          if(!res.ok) throw new Error('HTTP ' + res.status);
          (await res.json()).forEach(t=>{
            const open = parseFloat(t.openPrice);
            if(open > 0) baseline[t.symbol.replace(/USDT$/, '')] = open;
          });
          if(navigator.onLine !== false) rows().forEach(renderRow);       // show the % changes
        }catch(err){
          console.warn('Greatiby: could not load the 24-hour reference prices \u2014', err);
        }finally{
          if(periodic) baselineBusy = false;
        }
      }

      // ----- live prices -----
      async function fetchPrices(){
        if(fetching) return;
        if(navigator.onLine === false){ goOffline(); return; }
        if(Date.now() < backoffUntil){ if(lastUpdate) showLastUpdateTime(); return; }   // rate-limited: wait it out
        fetching = true;
        try{
          await ensureRate();
          const list = rows();
          const pairs = list.map(r => r.dataset.symbol).filter(s => s !== 'USDT').map(pairOf);
          const px = pairs.length ? await binancePrices(pairs) : {};
          let got = 0;
          list.forEach(row=>{
            const sym = row.dataset.symbol;
            const usd = sym === 'USDT' ? 1 : px[pairOf(sym)];
            if(usd > 0){ setPrice(row, usd); got++; }
          });
          if(!got) throw new Error('no prices returned');
          lastUpdate = new Date();
          timeEl.textContent = 'Just now';
          if(Date.now() - baselineAt > BASELINE_MS) fetchBaselines();    
        }catch(err){
          if(navigator.onLine === false) goOffline();
          else{
            markUnavailable();
            if(lastUpdate) showLastUpdateTime();
            else timeEl.textContent = 'Unable to load prices \u2014 retrying';
            console.warn('Greatiby: could not fetch live coin prices \u2014', err);
          }
        }finally{
          fetching = false;
        }
      }

      // ----- tabs -----
      const tabButtons = document.querySelectorAll('.rate-tabs .rt');
      tabButtons.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          tabButtons.forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          rateMode = RATE_MULTIPLIER[btn.dataset.t] ? btn.dataset.t : 'buy';
          if(navigator.onLine !== false) rows().forEach(renderRow);       
        });
      });

      // ----- search -----
      const searchInput = document.getElementById('coinSearchInput');
      const emptyEl = document.getElementById('coinEmpty');
      let searchTimer = null, searchSeq = 0;
      const baseRows = () => rows().filter(r => !r.classList.contains('remote'));
      const clearRemote = () => rows().filter(r => r.classList.contains('remote')).forEach(r => r.remove());

      async function loadUniverse(){
        if(universe && Date.now() - universeAt < UNIVERSE_MS) return universe;
        if(universePromise) return universePromise;
        universePromise = (async()=>{
          const res = await timeoutFetch(BINANCE + 'ticker/price', 15000);
          noteLimit(res);
          if(!res.ok) throw new Error('Binance HTTP ' + res.status);
          const map = {};
          (await res.json()).forEach(t=>{
            if(t.symbol.length > 4 && t.symbol.endsWith('USDT')){
              const p = parseFloat(t.price);
              if(p > 0) map[t.symbol.slice(0, -4)] = p;
            }
          });
          universe = map; universeAt = Date.now();
          return map;
        })().finally(()=>{ universePromise = null; });
        return universePromise;
      }
      function findCoins(q){
        const have = new Set(baseRows().map(r => r.dataset.symbol));
        const hits = [];
        for(const sym in universe){
          if(have.has(sym)) continue;
          const s = sym.toLowerCase(), name = (NAMES[sym] || '').toLowerCase();
          const score = (s === q || name === q) ? 0 : (s.startsWith(q) || name.startsWith(q)) ? 1 : (s.includes(q) || name.includes(q)) ? 2 : -1;
          if(score < 0) continue;
          const idx = NAME_ORDER.indexOf(sym);
          hits.push({sym, score, pop: idx < 0 ? 9999 : idx});
        }
        hits.sort((a,b)=> a.score - b.score || a.pop - b.pop || a.sym.localeCompare(b.sym));
        return hits.slice(0, MAX_RESULTS).map(h => h.sym);
      }
      function setIcon(icon, sym){
        const letter = ()=>{
          let h = 0; for(const ch of sym) h = (h * 31 + ch.charCodeAt(0)) % 360;
          icon.textContent = sym.charAt(0);
          icon.style.background = 'hsl(' + h + ' 45% 42%)';
          icon.style.fontWeight = '700';
        };
        const img = new Image();
        img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
        img.onerror = letter;                          
        img.src = ICON_URL + sym.toLowerCase() + '.png';
        icon.appendChild(img);
      }
      function buildRemoteRow(sym){
        const row = document.createElement('div');
        row.className = 'coin-row remote';
        row.dataset.symbol = sym;
        row.innerHTML =
          '<div class="coin-left"><span class="coin-icon remote"></span><div><div class="coin-name">' + esc(NAMES[sym] || sym) +
          '</div><div class="coin-sym">' + esc(sym) + '</div></div></div><div class="coin-right"><div class="coin-price">' + DASH + '</div><div class="coin-chg"></div></div>';
        setIcon(row.querySelector('.coin-icon'), sym);
        return row;
      }

      function showEmpty(msg){
        if(!emptyEl) return;
        emptyEl.textContent = msg || '';
        emptyEl.hidden = !msg;
      }
      function filterBase(q){
        baseRows().forEach(row=>{
          const name = row.querySelector('.coin-name')?.textContent.toLowerCase() || '';
          const sym = row.querySelector('.coin-sym')?.textContent.toLowerCase() || '';
          row.hidden = !!q && !(name.includes(q) || sym.includes(q));
        });
      }
      const anyVisible = () => !!card.querySelector('.coin-row:not([hidden])');

      async function runSearch(q){
        const seq = ++searchSeq;
        if(navigator.onLine === false){ showEmpty('Network not available'); return; }
        try{
          await loadUniverse();
          if(seq !== searchSeq) return;                
          await ensureRate();
          if(seq !== searchSeq) return;
          clearRemote();
          const added = findCoins(q).map(sym=>{
            const row = buildRemoteRow(sym);
            list.insertBefore(row, emptyEl);
            setPrice(row, universe[sym]);
            return row;
          });
          showEmpty(anyVisible() ? '' : 'No coin found for \u201C' + q + '\u201D');
          if(added.length) fetchBaselines(added);         // % change for the new rows
        }catch(err){
          if(seq !== searchSeq) return;
          console.warn('Greatiby: coin search failed \u2014', err);
          showEmpty(anyVisible() ? '' : 'Search is unavailable right now \u2014 please try again in a moment');
        }
      }

      if(searchInput){
        searchInput.addEventListener('focus', ()=>{ loadUniverse().catch(()=>{}); });   // warm the coin list
        searchInput.addEventListener('input', ()=>{
          const q = searchInput.value.trim().toLowerCase();
          clearTimeout(searchTimer);
          searchSeq++;                                     
          if(!q){                                          // back to the default list
            clearRemote();
            baseRows().forEach(r => r.hidden = false);
            showEmpty('');
              return;
          }
          filterBase(q);                                   // instant, no network
          clearRemote();
          showEmpty(anyVisible() ? '' : 'Searching\u2026');
          searchTimer = setTimeout(()=>runSearch(q), DEBOUNCE_MS);
        });
      }

      rows().forEach(addChgLine);

      function pollWhileVisible(el, task, ms){
        let timer = null, inView = false;
        function start(){ if(timer || !inView || document.hidden) return; task(); timer = setInterval(task, ms); }
        function stop(){ if(timer){ clearInterval(timer); timer = null; } }
        if('IntersectionObserver' in window){
          new IntersectionObserver(entries=>{
            entries.forEach(en=>{ inView = en.isIntersecting; if(inView) start(); else stop(); });
          }, {threshold:0}).observe(el);
        }else{ inView = true; start(); }
        document.addEventListener('visibilitychange', ()=>{ if(document.hidden) stop(); else start(); });
        return { refreshNow: ()=>{ if(timer) task(); } };
      }

      const poller = pollWhileVisible(card, fetchPrices, COIN_POLL_MS);
      window.addEventListener('offline', goOffline);
      window.addEventListener('online',  ()=>{ backoffUntil = 0; poller.refreshNow(); });
    })();

    /* ---------- Scroll reveal animation ---------- */
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
    document.querySelectorAll('.hero .reveal').forEach(el=>{
      el.dataset.revealed = '1';
      if(revealIO) revealIO.observe(el); else el.classList.add('in');
    });
  }
  function revealStatic(){
    reveal(document.querySelectorAll('.side > *'), 100);
    reveal(document.querySelectorAll('#pager'));
    reveal(document.querySelectorAll('.trust-banner .tb-icon, .trust-banner h2, .trust-banner p, .trust-banner .photo-frame'), 110);
    reveal(document.querySelectorAll('footer .footer-cta'));
    reveal(document.querySelectorAll('footer .footer-cols > *'), 90);
    reveal(document.querySelectorAll('footer .footer-bottom'));
  }

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

  /* post cards drift at different speeds per column, so the grid has depth without overlapping */
  function plxCards(){
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const speeds = [0.05, -0.03, 0.08];
    grid.querySelectorAll('.card').forEach((c,i)=>{
      c.style.translate = '';
      if(cols > 1 && !plxReduce){
        c.dataset.plx = speeds[i % cols]; c.dataset.plxRef = 'self'; c.dataset.plxMax = '36';
      }else{
        delete c.dataset.plx; delete c.dataset.plxRef; delete c.dataset.plxMax;
      }
    });
    plxCollect(); plxRequest();
  }

  window.addEventListener('scroll', plxRequest, {passive:true});
  window.addEventListener('resize', ()=>{ plxCards(); });
  window.addEventListener('load', plxRequest);

  /* MOBILE MENU */
  function openMenu(){
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  function closeMenu(){
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  renderPosts();
  revealHero();
  revealStatic();
  plxCollect(); plxCards(); plxUpdate();

  const yearEl = document.getElementById('currentYear');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }
