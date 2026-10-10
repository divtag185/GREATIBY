  /* =====================================================================
     Mobile menu open/close
  ===================================================================== */
  function openMenu(){
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  function closeMenu(){
    document.getElementById('mobileMenu').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }

  /* =====================================================================
     Rates card: Buy Rates / Sell Rates / Crypto Price tabs
  ===================================================================== */
  (function(){
    const card = document.getElementById('liveCoinCard');
    const timeEl = document.getElementById('coinUpdatedTime');
    if(!card || !timeEl) return;

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

    // ----- USD -> NGN rate 
    async function ensureRate(){
      if(NGN_RATE_OVERRIDE > 0) return;
      if(usdNgn && Date.now() - rateAt < RATE_MS) return;
      for(const url of FX_URLS){
        try{
          const res = await timeoutFetch(url, 8000);
          if(!res.ok) continue;
          const r = (await res.json())?.usd?.ngn;
          if(r > 0){ usdNgn = r; rateAt = Date.now(); return; }
        }catch(err){ /* try the next mirror */ }
      }
      if(!usdNgn) throw new Error('could not load the USD/NGN rate');
      rateAt = Date.now() - (RATE_MS - 5 * 60 * 1000);  // keep the old rate, retry in 5 minutes
    }

    // ----- Binance -----
    async function binancePrices(pairs){
      let res = await timeoutFetch(BINANCE + 'ticker/price?symbols=' + encodeURIComponent(JSON.stringify(pairs)), 10000);
      noteLimit(res);
      if(!res.ok && Date.now() >= backoffUntil){        // most likely one pair was delisted: use the full list
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
      if(periodic){ if(baselineBusy) return; baselineBusy = true; baselineAt = Date.now(); }   // also throttles retries
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
        if(navigator.onLine !== false) rows().forEach(renderRow);       
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
      if(Date.now() < backoffUntil){ if(lastUpdate) showLastUpdateTime(); return; }   
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
    const tabButtons = document.querySelectorAll('.tabs button');
    tabButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        tabButtons.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        rateMode = RATE_MULTIPLIER[btn.dataset.tab] ? btn.dataset.tab : 'buy';
        if(navigator.onLine !== false) rows().forEach(renderRow);       // re-price with the new mode
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

    function refreshBorders(){
      const visible = card.querySelectorAll('.coin-row:not([hidden])');
      card.querySelectorAll('.coin-row').forEach(r => r.classList.remove('no-border'));
      if(visible.length) visible[visible.length - 1].classList.add('no-border');
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
          card.insertBefore(row, emptyEl);
          setPrice(row, universe[sym]);
          return row;
        });
        showEmpty(anyVisible() ? '' : 'No coin found for \u201C' + q + '\u201D');
        refreshBorders();
        if(added.length) fetchBaselines(added);        
      }catch(err){
        if(seq !== searchSeq) return;
        console.warn('Greatiby: coin search failed \u2014', err);
        showEmpty(anyVisible() ? '' : 'Search is unavailable right now \u2014 please try again in a moment');
        refreshBorders();
      }
    }

    if(searchInput){
      searchInput.addEventListener('focus', ()=>{ loadUniverse().catch(()=>{}); });   // warm the coin list
      searchInput.addEventListener('input', ()=>{
        const q = searchInput.value.trim().toLowerCase();
        clearTimeout(searchTimer);
        searchSeq++;                                    
        if(!q){                                        
          clearRemote();
          baseRows().forEach(r => r.hidden = false);
          showEmpty('');
          refreshBorders();
          return;
        }
        filterBase(q);                                   
        clearRemote();
        showEmpty(anyVisible() ? '' : 'Searching\u2026');
        refreshBorders();
        searchTimer = setTimeout(()=>runSearch(q), DEBOUNCE_MS);
      });
    }

    rows().forEach(addChgLine);

    // ----- polling: only while the card is on screen -----
    const poller = pollWhileVisible(card, fetchPrices, COIN_POLL_MS);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  ()=>{ backoffUntil = 0; poller.refreshNow(); });
  })();

  /* =====================================================================
     FAQ accordion
  ===================================================================== */
  document.querySelectorAll('.faq-item').forEach(item=>{
    item.querySelector('.faq-q').addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i=>{
        i.classList.remove('open');
        i.querySelector('.faq-q i').className = 'fa-solid fa-plus';
      });
      if(!isOpen){
        item.classList.add('open');
        item.querySelector('.faq-q i').className = 'fa-solid fa-xmark';
      }
    });
  });
  // Open the first FAQ by default 
  document.querySelector('.faq-item').classList.add('open');
  document.querySelector('.faq-item .faq-q i').className = 'fa-solid fa-xmark';

  /* =====================================================================
     Testimonials auto carousel
  ===================================================================== */
  (function(){
    const track = document.querySelector('.testi-scroll');
    if(!track) return;
    const cards = Array.from(track.querySelectorAll('.testi-card'));
    if(cards.length < 2) return;

    const INTERVAL = 4500;        
    const RESUME_DELAY = 8000;      
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'testi-dots';
    dotsWrap.setAttribute('role','group');
    dotsWrap.setAttribute('aria-label','Testimonial slides');
    dotsWrap.style.setProperty('--testi-interval', INTERVAL + 'ms');
    track.insertAdjacentElement('afterend', dotsWrap);
    track.classList.add('has-dots');

    let stops = [], dots = [], current = 0;
    let timer = 0, resumeTimer = 0, progTimer = 0;
    let paused = reduce, programmatic = false, inView = false;
    if(reduce) dotsWrap.classList.add('paused');

    // Scroll positions of every slide 
    function computeStops(){
      const W = track.clientWidth, max = Math.max(0, track.scrollWidth - W);
      const centered = getComputedStyle(cards[0]).scrollSnapAlign.indexOf('center') > -1;
      const base = track.getBoundingClientRect().left - track.scrollLeft;
      const out = [];
      cards.forEach(c=>{
        const left = c.getBoundingClientRect().left - base;
        let t = centered ? left - (W - c.offsetWidth) / 2 : left;
        t = Math.min(max, Math.max(0, t));
        if(!out.some(v=>Math.abs(v - t) < 2)) out.push(t);
      });
      if(out[out.length-1] < max - 2) out.push(max);
      return out.sort((a,b)=>a-b);
    }
    function nearestStop(){
      let best = 0, bd = Infinity;
      stops.forEach((s,i)=>{ const d = Math.abs(s - track.scrollLeft); if(d < bd){ bd = d; best = i; } });
      return best;
    }
    function buildDots(){
      dotsWrap.innerHTML = '';
      dots = stops.map((s,i)=>{
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'testi-dot';
        b.setAttribute('aria-label','Go to slide ' + (i+1));
        b.innerHTML = '<span class="fill"></span>';
        b.addEventListener('click', ()=>{ pause(); goTo(i); });
        dotsWrap.appendChild(b);
        return b;
      });
    }
    // Update the active dot 
    function markActive(){
      dots.forEach(d=>d.classList.remove('active'));
      void dotsWrap.offsetWidth;
      if(dots[current]){
        dots[current].classList.add('active');
        dots[current].setAttribute('aria-current','true');
      }
      dots.forEach((d,i)=>{ if(i !== current) d.removeAttribute('aria-current'); });
    }
    function goTo(i){
      current = i;
      programmatic = true;
      clearTimeout(progTimer);
      progTimer = setTimeout(()=>{ programmatic = false; }, 1400); // fallback if scrollend isn't supported
      track.scrollTo({left: stops[i], behavior: reduce ? 'auto' : 'smooth'});
      markActive();
    }

    // ---- autoplay ----
    function schedule(){
      clearTimeout(timer);
      if(paused || !inView || document.hidden) return;
      timer = setTimeout(()=>{
        goTo((current + 1) % stops.length);   // last slide -> loops back to the first
        schedule();
      }, INTERVAL);
    }
    function pause(){                          // manual interaction: pause temporarily
      if(reduce) return;
      paused = true;
      clearTimeout(timer);
      dotsWrap.classList.add('paused');
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(resume, RESUME_DELAY);
    }
    function resume(){
      if(reduce) return;
      paused = false;
      dotsWrap.classList.remove('paused');
      markActive();                            // restart the progress fill for the current slide
      schedule();
    }


    function updateFade(){
      const tr = track.getBoundingClientRect();
      cards.forEach(c=>{
        const r = c.getBoundingClientRect();
        const vis = Math.max(0, Math.min(r.right, tr.right) - Math.max(r.left, tr.left)) / r.width;
        c.style.opacity = (0.4 + 0.6 * Math.min(1, vis / 0.9)).toFixed(2);
      });
    }
    let ticking = false;
    track.addEventListener('scroll', ()=>{
      if(!programmatic){                       
        pause();
        const i = nearestStop();
        if(i !== current){ current = i; markActive(); }
      }
      if(!ticking){ ticking = true; requestAnimationFrame(()=>{ ticking = false; updateFade(); }); }
    }, {passive:true});
    track.addEventListener('scrollend', ()=>{ programmatic = false; });

    // manual interaction detection
    ['pointerdown','touchstart'].forEach(ev=>track.addEventListener(ev, ()=>{ programmatic = false; pause(); }, {passive:true}));
    track.addEventListener('wheel', e=>{ if(Math.abs(e.deltaX) > Math.abs(e.deltaY)){ programmatic = false; pause(); } }, {passive:true});
    track.addEventListener('keydown', ()=>{ programmatic = false; pause(); });

    // only autoplay while the carousel is on screen and the tab is visible
    if('IntersectionObserver' in window){
      new IntersectionObserver(entries=>{
        inView = entries[0].isIntersecting;
        if(inView && !paused){ markActive(); schedule(); } else clearTimeout(timer);
      }, {threshold:.25}).observe(track);
    }else{ inView = true; schedule(); }
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden) clearTimeout(timer);
      else if(!paused && inView){ markActive(); schedule(); }
    });

    function layout(){
      stops = computeStops();
      if(dots.length !== stops.length) buildDots();
      current = Math.min(current, stops.length - 1);
      markActive();
      updateFade();
      if(!paused && inView) schedule();
    }
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    layout();
  })();

  /* =====================================================================
     Hero phone scroll-parallax
  ===================================================================== */
  (function(){
    const dev  = document.querySelector('.hero-device');
    const hero = document.querySelector('.hero');
    if(!dev || !hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    function update(){
      ticking = false;
      const y = Math.max(0, Math.min(window.scrollY, hero.offsetHeight));
      dev.style.translate = '0 ' + Math.min(y * 0.08, 26).toFixed(1) + 'px';
    }
    window.addEventListener('scroll', ()=>{
      if(!ticking){ ticking = true; requestAnimationFrame(update); }
    }, {passive:true});
    update();
  })();


  /* =====================================================================
     Scroll-driven horizontal carousel 
  ===================================================================== */
  function pinnedHorizontalCarousel(sectionSel, pinSel, trackSel){
    const section = document.querySelector(sectionSel);
    const pin = section && section.querySelector(pinSel);
    const track = section && section.querySelector(trackSel);
    if(!section || !pin || !track) return;
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; 
    const cards = track.children;
    if(cards.length < 2) return;
    section.classList.add('hscroll-on');

    const SPEED = 1.2;              
    let travel = 0, dist = 0, cur = 0, target = 0, raf = 0;

    function measure(){
      const first = cards[0].getBoundingClientRect();
      const last  = cards[cards.length-1].getBoundingClientRect();
      travel = Math.max(0, (last.right - first.left) - track.clientWidth);
      dist = Math.round(travel * SPEED);
      section.style.height = (pin.offsetHeight + dist) + 'px';
      read(true);
    }
    function read(jump){
      const top = section.getBoundingClientRect().top;
      const p = dist > 0 ? Math.min(1, Math.max(0, -top / dist)) : 0;
      target = p * travel;
      if(jump) cur = target;
      if(!raf) raf = requestAnimationFrame(tick);
    }
    function tick(){
      raf = 0;
      const diff = target - cur;
      cur = Math.abs(diff) < .3 ? target : cur + diff * .2;
      track.style.transform = 'translate3d(' + (-cur).toFixed(1) + 'px,0,0)';
      if(cur !== target) raf = requestAnimationFrame(tick);
    }
    window.addEventListener('scroll', ()=>read(false), {passive:true});
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    measure();
  }
  pinnedHorizontalCarousel('.dark-section',  '.dark-pin',  '.feature-cards');
  pinnedHorizontalCarousel('.trust-section', '.trust-pin', '.trust-grid');

  /* =====================================================================
     Multi-layer parallax (all sections)
  ===================================================================== */
  (function(){
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const BG=.12, IMG=.04, FG=-.04;
    const LAYERS = [
      /* ---- background (slowest) ---- */
      {sel:'.hero-visual',  mode:'var',       k:.15, max:40, scroll:true},
      {sel:'.dark-section', mode:'var',       k:BG,  max:40},
      {sel:'.footer-blob',  mode:'translate', k:BG,  max:40},
      /* ---- main imagery (medium) ---- */
      {sel:'.team-photo img', mode:'inner',   k:.08, max:30},
      {sel:'.flow-device',    mode:'translate', k:IMG, max:14},
      {sel:'.market-grid',    mode:'translate', k:IMG, max:14},
      {sel:'.video-wrap',     mode:'translate', k:IMG, max:14},
      {sel:'.promo-grid',     mode:'translate', k:IMG, max:14},
      /* ---- foreground text (slightly faster) ---- */
      {sel:'.hero h1, .hero p.lead, .hero .hero-buttons, .hero .users-row', mode:'translate', k:-.05, max:24, scroll:true},
      {sel:'.stats-row',      mode:'translate', k:-.04, max:14, scroll:true},
      {sel:'.center-head, .split-head, .flow-right, .market-head, .video-head, .testi-head, .faq-head, .footer-cta',
                              mode:'translate', k:FG,  max:14}
    ];
    const items=[];
    LAYERS.forEach(cfg=>{
      document.querySelectorAll(cfg.sel).forEach(el=>{ items.push({el,cfg,base:0,h:0,py:0}); });
    });
    if(!items.length) return;
    document.documentElement.classList.add('parallax-on');

    function measure(){
      items.forEach(it=>{
        if(it.cfg.scroll) return;
        const t = it.cfg.mode==='inner' ? it.el.parentElement : it.el;
        const r = t.getBoundingClientRect();
        const own = it.cfg.mode==='translate' ? it.py : 0;   
        it.base = r.top + window.scrollY - own + r.height/2;
        it.h = r.height;
      });
    }
    function update(){
      const y = window.scrollY, mid = y + window.innerHeight/2;
      items.forEach(it=>{
        const c = it.cfg;
        const d = c.scroll ? y : (it.base - mid);
        let max = c.max;
        if(c.mode==='inner') max = Math.min(max, it.h*.055);
        const v = Math.max(-max, Math.min(max, d*c.k));
        if(Math.abs(v - it.py) < .1) return;
        it.py = v;
        if(c.mode==='var') it.el.style.setProperty('--bgp', v.toFixed(1)+'px');
        else it.el.style.translate = '0 ' + v.toFixed(1) + 'px';
      });
    }
    let ticking=false;
    function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(()=>{ ticking=false; update(); }); } }
    function remeasure(){ measure(); update(); }

    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', remeasure);
    window.addEventListener('load', remeasure);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    if('ResizeObserver' in window){
      let t=null;
      new ResizeObserver(()=>{ cancelAnimationFrame(t); t=requestAnimationFrame(remeasure); }).observe(document.body);
    }
    remeasure();
  })();

  /* =====================================================================
     Back-to-top button
  ===================================================================== */
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

  /* =====================================================================
     Live indices / futures / bonds table (the black card)
  ===================================================================== */
  const MARKET_POLL_MS = 5000;
  const MARKET_BASELINE_MS = 10 * 60 * 1000;
  const COMPARE_HOURS = 12;                 
  const DASH = '\u2014';

  const MARKET_API_URL = '';
  const MARKET_PROXY = '';                   
  const CORS_PROXIES = [
    ...(MARKET_PROXY ? [u => MARKET_PROXY + encodeURIComponent(u)] : []),
    u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
    u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u)
  ];
  let proxyIdx = 0;

  const MARKET_DECIMALS = {'6E=F':5, 'ZN=F':3, 'ZB=F':3, '^TNX':3};
  const marketDecimals = symbol => MARKET_DECIMALS[symbol] ?? 2;

  function fmtMarketNum(n, decimals){
    return n.toLocaleString('en-US', {minimumFractionDigits:decimals, maximumFractionDigits:decimals});
  }
  function fmtMarketSigned(n, decimals){
    return (n >= 0 ? '+' : '') + fmtMarketNum(n, decimals);
  }

  function fetchWithTimeout(url, ms){
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), ms || 8000);
    return fetch(url, {signal: ctrl.signal}).finally(()=>clearTimeout(t));
  }

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

  async function yahooChart(symbol, query){
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${query}`;
    let lastErr = new Error('No proxy available');
    for(let n = 0; n < CORS_PROXIES.length; n++){
      const idx = (proxyIdx + n) % CORS_PROXIES.length;
      try{
        const res = await fetchWithTimeout(CORS_PROXIES[idx](url), 6000);
        if(!res.ok){ lastErr = new Error('HTTP ' + res.status); continue; }
        const result = (await res.json())?.chart?.result?.[0];
        if(!result){ lastErr = new Error('No data for ' + symbol); continue; }
        proxyIdx = idx;
        return result;
      }catch(err){ lastErr = err; }
    }
    throw lastErr;
  }
  // today's session bar (open/high) + the current price
  async function fetchLiveSymbol(symbol){
    const result = await yahooChart(symbol, 'interval=1d&range=1d');
    const meta = result.meta || {};
    const quote = result.indicators?.quote?.[0] || {};
    const price = meta.regularMarketPrice;
    if(typeof price !== 'number') throw new Error('No price for ' + symbol);
    const opens = (quote.open || []).filter(v => v != null);
    const highs = (quote.high || []).filter(v => v != null);
    const open = opens.length ? opens[0] : (meta.regularMarketOpen ?? price);
    const high = Math.max(price, highs.length ? Math.max(...highs) : (meta.regularMarketDayHigh ?? price));
    return {price, open, high};
  }

  async function fetchBaselineSymbol(symbol){
    const result = await yahooChart(symbol, 'interval=30m&range=5d');
    const ts = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    const cutoff = Date.now() / 1000 - COMPARE_HOURS * 3600;
    for(let i = ts.length - 1; i >= 0; i--){
      if(ts[i] + 1800 <= cutoff && closes[i] != null) return closes[i];
    }
    return null;
  }

  const marketTable = document.getElementById('marketTable');
  const marketBaseline = {};   
  const marketLive = {};       
  let marketBaselineAt = 0, marketBaselineTried = 0, marketBaselineBusy = false;
  let marketFetching = false, marketBackoffUntil = 0;
  const marketRows = () => Array.from(marketTable.querySelectorAll('tr[data-symbol]'));

  function setTrend(cells, cls){
    cells.forEach(c=>{ c.classList.remove('up','down'); if(cls) c.classList.add(cls); });
  }
  function renderMarketRow(row){
    const symbol = row.dataset.symbol, d = marketLive[symbol];
    if(!d) return;
    const decimals = marketDecimals(symbol);
    const priceCell = row.querySelector('.val-price');
    const chgCell = row.querySelector('.val-chg');
    const pctCell = row.querySelector('.val-chgpct');
    priceCell.textContent = fmtMarketNum(d.price, decimals);
    row.querySelector('.val-open').textContent = fmtMarketNum(d.open, decimals);
    row.querySelector('.val-high').textContent = fmtMarketNum(d.high, decimals);
    const base = marketBaseline[symbol];
    if(base){
      const chg = d.price - base;
      chgCell.textContent = fmtMarketSigned(chg, decimals);
      pctCell.textContent = fmtMarketSigned(chg / base * 100, 2) + '%';
      setTrend([priceCell, chgCell, pctCell], chg > 0 ? 'up' : chg < 0 ? 'down' : '');
    }
    
  }

  // Network off: every value reverts to a dash
  function blankMarket(){
    marketRows().forEach(row=>{
      row.querySelectorAll('td:not(:first-child)').forEach(td=>{ td.textContent = DASH; td.classList.remove('up','down'); });
    });
    Object.keys(marketLive).forEach(k=>delete marketLive[k]);
    Object.keys(marketBaseline).forEach(k=>delete marketBaseline[k]);
    marketBaselineAt = 0; marketBaselineTried = 0;
  }

  async function fetchMarketBaselines(){
    if(marketBaselineBusy) return;
    marketBaselineBusy = true; marketBaselineTried = Date.now();
    const rows = marketRows();
    try{
      const results = await Promise.allSettled(rows.map(r => fetchBaselineSymbol(r.dataset.symbol)));
      let got = 0;
      results.forEach((r,i)=>{
        if(r.status === 'fulfilled' && r.value){ marketBaseline[rows[i].dataset.symbol] = r.value; got++; }
      });
      if(got) marketBaselineAt = Date.now();
    }finally{
      marketBaselineBusy = false;
      rows.forEach(renderMarketRow);
    }
  }

  async function fetchMarketData(){
    if(marketFetching || Date.now() < marketBackoffUntil) return;
    if(navigator.onLine === false){ blankMarket(); return; }
    marketFetching = true;
    try{
      if(MARKET_API_URL){
        
        try{
          const res = await fetchWithTimeout(MARKET_API_URL, 8000);
          if(!res.ok) throw new Error('HTTP ' + res.status);
          const payload = (await res.json()).data || {};
          const rows = marketRows();
          let got = 0;
          rows.forEach(row=>{
            const d = payload[row.dataset.symbol];
            if(!d || typeof d.price !== 'number') return;
            marketLive[row.dataset.symbol] = {price:d.price, open:d.open ?? d.price, high:d.high ?? d.price};
            if(typeof d.base === 'number') marketBaseline[row.dataset.symbol] = d.base;
            got++;
          });
          if(!got) throw new Error('empty market payload');
          marketBaselineAt = marketBaselineTried = Date.now();
          rows.forEach(renderMarketRow);
        }catch(err){
          marketBackoffUntil = Date.now() + 10000;
          console.warn('Greatiby: could not fetch market data —', err);
        }
        return;
      }
    
      if(Date.now() - marketBaselineAt > MARKET_BASELINE_MS && Date.now() - marketBaselineTried > 60000) fetchMarketBaselines();
      const rows = marketRows();
      const results = await Promise.allSettled(rows.map(async row=>{
        marketLive[row.dataset.symbol] = await fetchLiveSymbol(row.dataset.symbol);
        renderMarketRow(row);
      }));
      if(!results.some(r => r.status === 'fulfilled')){
        
        marketBackoffUntil = Date.now() + 20000;
        console.warn('Greatiby: could not fetch market data —', results[0] && results[0].reason);
      }
    }finally{
      marketFetching = false;
    }
  }

  if(marketTable){
    const marketPoller = pollWhileVisible(marketTable, fetchMarketData, MARKET_POLL_MS);
    window.addEventListener('offline', blankMarket);
    window.addEventListener('online',  ()=>{ marketBackoffUntil = 0; marketPoller.refreshNow(); });
  }

  /* =====================================================================
     Footer copyright year 
  ===================================================================== */
  const yearEl = document.getElementById('currentYear');
  if(yearEl){
    yearEl.textContent = new Date().getFullYear();
  }
