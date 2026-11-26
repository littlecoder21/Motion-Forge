// @ts-nocheck
/* eslint-disable */
/**
 * MotionForge carousel runtime.
 *
 * One continuous-position engine ("pos" = fractional slide index) drives every layout, transition and 3D formation.
 * The live preview and all exports run THIS function, so what you see is what you ship.
 *
 * Everything lives inside createCarousel on purpose: exporters embed `createCarousel.toString()`, which only works
 * when the function has no references to outside scope. Do not hoist helpers out of it.
 */
export function createCarousel(root: HTMLElement, initial: any, hooks?: any): any {
  hooks = hooks || {};
  const doc = root.ownerDocument, win = doc.defaultView || window;
  const PI = Math.PI, RAD = PI / 180;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (v, m) => ((v % m) + m) % m;
  const r2 = (v) => Math.round(v * 100) / 100;
  const pad = (v) => (v < 10 ? '0' : '') + v;
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const nowMs = () => (win.performance || performance).now();

  // ---------- easing ----------
  const bez = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t, sy = (t) => ((ay * t + by) * t + cy) * t, dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = sx(t) - x; if (Math.abs(e) < 1e-5) return sy(t); const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
      let lo = 0, hi = 1; t = x;
      for (let i = 0; i < 24; i++) { const e = sx(t); if (Math.abs(e - x) < 1e-5) break; if (x > e) lo = t; else hi = t; t = (lo + hi) / 2; }
      return sy(t);
    };
  };
  const makeEase = (c) => {
    const e = c.easing, ov = (c.fx.overshoot == null ? 60 : c.fx.overshoot) / 60;
    if (e === 'Linear') return (t) => t;
    if (e === 'Ease in out') return bez(0.4, 0, 0.2, 1);
    if (e === 'Spring' || e === 'Back') return bez(0.34, 1 + 0.56 * ov, 0.64, 1);
    if (e === 'Expo out') return bez(0.16, 1, 0.3, 1);
    if (e === 'Quart in out') return bez(0.76, 0, 0.24, 1);
    if (e === 'Circ out') return bez(0, 0.55, 0.45, 1);
    if (e === 'Custom') { const b = c.bezier || [0.22, 0.75, 0.25, 1]; return bez(b[0], b[1], b[2], b[3]); }
    return bez(0.22, 0.75, 0.25, 1);
  };

  // ---------- state ----------
  let cfg = initial, eff = initial, slides = cfg.slides, n = slides.length, ease = makeEase(cfg);
  let W = 0, H = 0, destroyed = false, reduce = false, inView = true;
  let pos = clamp(cfg.active || 0, 0, Math.max(0, n - 1)), target = pos, vel = 0, moveDir = 1;
  let anim = null, springOn = false, springStart = 0, gliding = false;
  let playing = !!cfg.autoplay, autoT = 0, hovered = false, restUntil = 0, lastWheel = 0;
  let dragging = false, ptr = null, suppressClick = false;
  let mx = 0, tiltX = 0, tiltY = 0, tiltTX = 0, tiltTY = 0;
  let cards = [], reps = 1, lastCur = -1, geo = { pitch: 300, u: 10 }, hist = [], settleUntil = 0, lastChange = 0;
  let applied = [], navRefs = { dots: [], frac: null, prev: null, next: null, play: null }, sig = '';
  let raf = 0, last = 0, running = false;

  // ---------- DOM skeleton ----------
  root.classList.add('mf-root');
  root.textContent = '';
  root.tabIndex = 0;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  const viewport = el('div', 'mf-viewport'), stage = el('div', 'mf-stage');
  viewport.appendChild(stage); root.appendChild(viewport);
  const navEl = el('div', 'mf-nav'); navEl.setAttribute('role', 'group'); navEl.setAttribute('aria-label', 'Carousel controls'); root.appendChild(navEl);
  const progEl = el('div', 'mf-progress'); progEl.appendChild(el('i')); root.appendChild(progEl);
  const live = el('div', 'mf-live'); live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true'); root.appendChild(live);

  // ---------- helpers on config ----------
  const layoutOf = () => eff.layout;
  const isPaged = () => { const l = eff.layout; return l === 'standard' || l === 'hero' || l === 'vertical'; };
  const isCyc = () => eff.layout === 'spatial' || (cfg.loop && cfg.seamlessLoop && eff.layout !== 'accordion' && eff.layout !== 'marquee');
  const loopOK = () => eff.layout !== 'accordion' && eff.layout !== 'marquee' && (eff.layout === 'spatial' || cfg.loop);
  const angRad = () => (eff.angle || 0) * RAD;
  const wrapD = (d) => (isCyc() && n > 1 ? (eff.layout === 'deck' ? mod(d + 1.2, n) - 1.2 : mod(d + n / 2, n) - n / 2) : d);
  const cur = () => (n ? mod(Math.round(pos), n) : 0);
  const tIdx = () => (n ? mod(Math.round(target), n) : 0);
  const useSpring = () => !!eff.fx.spring || (isPaged() && eff.motion === 'elastic');

  const resolve = () => {
    let e = cfg; const r = cfg.responsive;
    if (r && r.on && W > 0 && W < (r.breakpoint || 560)) {
      const m = r.mobile || {};
      e = Object.assign({}, cfg, {
        layout: m.layout || cfg.layout, visible: m.visible || cfg.visible, gap: m.gap >= 0 ? m.gap : cfg.gap,
        fx: Object.assign({}, cfg.fx, { intensity: cfg.fx.intensity * (m.intensity == null ? 100 : m.intensity) / 100 }),
        nav: Object.assign({}, cfg.nav, { arrows: m.arrows === false ? false : cfg.nav.arrows }),
      });
    }
    eff = e;
  };

  // ---------- static look (classes + css variables) ----------
  const applyStatic = () => {
    const L = eff.look, ly = eff.layers;
    applied.forEach((c) => root.classList.remove(c));
    applied = ['mf-f-' + (L.font || 'sans')];
    if (L.sheen) applied.push('has-sheen'); if (L.border) applied.push('has-border');
    if (eff.layout === 'spatial' && eff.spatial.backface) applied.push('bf-on');
    if (eff.nav.drag) applied.push('mf-drag');
    ['image', 'overlay', 'eyebrow', 'title', 'body', 'cta', 'index'].forEach((k) => { if (ly[k] === false) applied.push('no-' + k); });
    applied.push('mf-l-' + eff.layout);
    if ((H && H < 280) || (W && W < 340)) applied.push('mf-compact');
    applied.forEach((c) => root.classList.add(c));
    root.setAttribute('aria-label', cfg.name || 'Carousel');
    const s = L.shadow / 100, st = root.style;
    st.setProperty('--mf-r', L.radius + 'px');
    st.setProperty('--mf-shadow', s > 0 ? '0 ' + r2(18 * s) + 'px ' + r2(50 * s) + 'px rgba(0,0,0,' + r2(0.55 * s) + ')' : 'none');
    st.setProperty('--mf-shadow-a', s > 0 ? '0 ' + r2(26 * s) + 'px ' + r2(70 * s) + 'px rgba(0,0,0,' + r2(0.7 * s) + ')' : 'none');
    st.setProperty('--mf-ts', String(L.titleScale / 100));
    st.setProperty('--mf-stage', L.stage);
    st.setProperty('--mf-ov', String(L.overlay / 100));
    st.setProperty('--mf-br', String(L.brightness / 100));
    st.setProperty('--mf-vig', String(r2((L.vignette / 100) * 0.75)));
    const ax = isPaged() ? Math.abs(Math.sin(angRad())) : 0;
    st.touchAction = ax > 0.7 ? 'pan-x' : 'pan-y';
    ease = makeEase(cfg);
  };

  // ---------- cards ----------
  const slideBg = (s) => (s.image ? 'url(' + JSON.stringify(s.image) + ')' : 'radial-gradient(ellipse at 80% 12%,' + s.accent + '55,transparent 43%)');
  const mkCard = (k, rep) => {
    const s = slides[k], L = cfg.look;
    const e = el('article', 'mf-card');
    e.setAttribute('role', 'group'); e.setAttribute('aria-roledescription', 'slide'); e.setAttribute('aria-label', (k + 1) + ' of ' + n);
    const bg = el('div', 'mf-bg'), shade = el('div', 'mf-shade'), copy = el('div', 'mf-copy');
    bg.style.backgroundColor = s.color; bg.style.backgroundPosition = s.focal || '50% 50%';
    if (!s.image) bg.style.backgroundImage = slideBg(s);
    const eb = el('div', 'mf-eyebrow'); eb.appendChild(el('i')); eb.appendChild(doc.createTextNode(s.eyebrow));
    const h = el('h2', '', s.title), p = el('p', '', s.body), a = el('a', 'mf-cta');
    a.textContent = s.cta + ' ↗'; a.href = s.href || '#';
    if (hooks.preview) a.addEventListener('click', (ev) => ev.preventDefault());
    copy.append(eb, h, p, a);
    const idx = el('span', 'mf-index', pad(k + 1)); idx.appendChild(el('i', '', ' / ' + pad(n)));
    e.append(bg, shade, copy, idx);
    e.dataset.a = s.align || L.align; e.dataset.v = s.valign || L.valign;
    if (s.image) e.dataset.img = '1';
    e.addEventListener('click', () => onCardClick(k));
    stage.appendChild(e);
    return { el: e, bg, copy, a, k, rep, st: {}, bst: {}, cst: {}, vis: undefined, img: false, act: false };
  };
  const sameSlides = (a, b) => {
    if (a === b) return true; if (!a || !b || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) { const x = a[i], y = b[i]; for (const k in x) if (x[k] !== y[k]) return false; for (const k in y) if (x[k] !== y[k]) return false; }
    return true;
  };
  const buildCards = () => {
    stage.textContent = ''; cards = [];
    const total = eff.layout === 'marquee' ? reps : 1;
    for (let r = 0; r < total; r++) for (let k = 0; k < n; k++) cards.push(mkCard(k, r));
    lastCur = -1;
  };

  // ---------- navigation ui ----------
  const buildNav = () => {
    navEl.textContent = ''; navRefs = { dots: [], frac: null, prev: null, next: null, play: null };
    const nv = eff.nav;
    progEl.style.display = nv.progress && n > 1 ? '' : 'none';
    if (n < 2) return;
    const vertical = isPaged() && Math.abs(Math.sin(angRad())) > 0.7;
    navEl.dataset.pos = nv.position || 'bottom';
    const bar = el('div', 'mf-bar'), left = el('div', 'mf-left'), right = el('div', 'mf-arrows');
    if (nv.thumbs) {
      const t = el('div', 'mf-thumbs');
      slides.forEach((s, i) => {
        const b = el('button', 'mf-thumb'); b.type = 'button'; b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.style.backgroundColor = s.color; b.style.backgroundImage = slideBg(s); b.style.backgroundSize = 'cover'; b.style.backgroundPosition = s.focal || '50% 50%';
        b.addEventListener('click', (ev) => { ev.stopPropagation(); goTo(i); }); t.appendChild(b); navRefs.dots.push(b);
      });
      left.appendChild(t);
    } else if (nv.pagination === 'dots') {
      const d = el('div', 'mf-dots');
      slides.forEach((s, i) => {
        const b = el('button', 'mf-dot'); b.type = 'button'; b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        b.addEventListener('click', (ev) => { ev.stopPropagation(); goTo(i); }); d.appendChild(b); navRefs.dots.push(b);
      });
      left.appendChild(d);
    } else if (nv.pagination === 'fraction') { navRefs.frac = el('span', 'mf-frac'); left.appendChild(navRefs.frac); }
    if (cfg.autoplay && eff.layout !== 'marquee') {
      const pb = el('button', 'mf-btn mf-play'); pb.type = 'button';
      pb.addEventListener('click', (ev) => { ev.stopPropagation(); setPlaying(!playing, true); });
      right.appendChild(pb); navRefs.play = pb;
    }
    if (nv.arrows && eff.layout !== 'marquee') {
      const pv = el('button', 'mf-btn mf-arrow'), nx = el('button', 'mf-btn mf-arrow');
      pv.type = nx.type = 'button'; pv.setAttribute('aria-label', 'Previous slide'); nx.setAttribute('aria-label', 'Next slide');
      pv.textContent = vertical ? '↑' : '←'; nx.textContent = vertical ? '↓' : '→';
      pv.addEventListener('click', (ev) => { ev.stopPropagation(); step(-1, 'user'); }); nx.addEventListener('click', (ev) => { ev.stopPropagation(); step(1, 'user'); });
      navRefs.prev = pv; navRefs.next = nx;
      if (nv.position === 'sides') { const sd = el('div', 'mf-arrows mf-sides'); sd.append(pv, nx); navEl.appendChild(sd); }
      else right.append(pv, nx);
    }
    bar.append(left, right); navEl.appendChild(bar);
    updateNav();
  };
  const updateNav = () => {
    const c = cur(), s = slides[c];
    if (s) root.style.setProperty('--mf-accent', s.accent || '#69daba');
    navRefs.dots.forEach((b, i) => b.setAttribute('aria-current', i === c ? 'true' : 'false'));
    if (navRefs.frac) navRefs.frac.textContent = pad(c + 1) + ' / ' + pad(n);
    const t = tIdx();
    if (navRefs.prev) { const dis = !loopOK() && t <= 0; navRefs.prev.disabled = dis; navRefs.next.disabled = !loopOK() && t >= n - 1; }
    if (navRefs.play) { navRefs.play.textContent = playing ? 'Pause' : 'Play'; navRefs.play.setAttribute('aria-label', playing ? 'Pause autoplay' : 'Start autoplay'); }
    live.setAttribute('aria-live', playing ? 'off' : 'polite');
    if (c !== lastCur) { if (lastCur !== -1) live.textContent = 'Slide ' + (c + 1) + ' of ' + n; lastCur = c; }
  };

  // ---------- geometry preparation ----------
  const prep = () => {
    if (!W || !H) return;
    const l = eff.layout, L = eff.look, gp = eff.gap, cwP = L.cardW / 100, f = clamp(W / 800, 0.55, 1.6);
    let u = W / 100, pitch = W;
    const ux = Math.cos(angRad()), uy = Math.sin(angRad());
    if (isPaged()) pitch = Math.max(80, Math.abs(ux) * W + Math.abs(uy) * H);
    else if (l === 'multi') { const v = clamp(Math.round(eff.visible), 2, 5), cw = (W - gp * (v - 1)) / v; u = cw / 100; pitch = cw + gp; }
    else if (l === 'centered') { const cw = W * cwP; u = cw / 100; pitch = cw + gp; }
    else if (l === 'coverflow') { const cw = W * cwP; u = cw / 100; pitch = cw * 0.3; }
    else if (l === 'stack') { const cw = W * cwP; u = cw / 100; pitch = W * 0.3; }
    else if (l === 'spotlight') { const cw = W * cwP; u = cw / 100; pitch = cw * 0.58; }
    else if (l === 'fan') { const cw = W * cwP * 0.8; u = cw / 100; pitch = cw * 0.4; }
    else if (l === 'wheel') { const cw = W * cwP * 0.5; u = cw / 100; pitch = W * 0.8 * Math.sin(18 * RAD * eff.fx.intensity / 100 + 0.001); }
    else if (l === 'deck') { const cw = W * cwP; u = cw / 100; pitch = W * 0.45; }
    else if (l === 'accordion') { const tot = W - gp * (n - 1), wa = n > 1 ? tot * clamp(cwP, 0.3, 0.9) : tot; u = wa / 100; pitch = Math.max(60, n > 1 ? (tot - wa) / (n - 1) + gp : W); }
    else if (l === 'marquee') { const cw = clamp(W * 0.34, 220, 420); u = cw / 100; pitch = cw + gp; }
    else if (l === 'spatial') { const cw = W * eff.spatial.cardW / 100; u = cw / 100 * 1.25; pitch = Math.max(60, cw * 0.9); }
    geo = { pitch, u, f };
    root.style.setProperty('--u', r2(u) + 'px');
    root.style.setProperty('--ft', r2(clamp(u * 5, 12, 26)) + 'px');
    root.style.setProperty('--fb', r2(clamp(u * 2.6, 8, 11)) + 'px');
    if (l === 'marquee') {
      const p = clamp(W * 0.34, 220, 420) + gp, need = Math.max(2, Math.ceil((W + 2 * p) / (Math.max(1, n) * p)) + 1);
      if (need !== reps) { reps = need; return true; }
    }
    return false;
  };

  const sync = (force) => {
    const prevReps = reps, wasLayout = root.dataset.layout;
    resolve(); applyStatic();
    const repsChanged = prep();
    const needBuild = force || repsChanged || !cards.length || wasLayout === 'marquee' !== (eff.layout === 'marquee') || cards.length !== (eff.layout === 'marquee' ? reps * n : n);
    root.dataset.layout = eff.layout;
    if (needBuild) buildCards();
    buildNav();
    dirty = true; wake();
  };
  let dirty = true;

  // ---------- navigation logic ----------
  const notify = (idx, source) => { if (hooks.onChange) hooks.onChange(idx, source || 'user'); };
  const nextTarget = (dir) => {
    const t = Math.round(target) + dir;
    if (isCyc()) return t;
    if (loopOK()) return mod(t, n);
    return clamp(t, 0, n - 1);
  };
  const moveTo = (t, source, v0, silent) => {
    const from = pos, dist = Math.abs(t - from);
    target = t; gliding = false;
    if (dist < 1e-4) { pos = t; anim = null; springOn = false; dirty = true; wake(); if (!silent) notify(tIdx(), source); updateNav(); return; }
    moveDir = t > from ? 1 : -1;
    const delay = eff.fx.delay || 0, t0 = nowMs() + delay;
    if (reduce) { pos = t; anim = null; springOn = false; vel = 0; }
    else if (useSpring()) { springOn = true; anim = null; vel = v0 || 0; springStart = t0; }
    else { springOn = false; anim = { from, to: t, t0, dur: Math.max(60, cfg.duration * (0.6 + 0.4 * Math.min(1, dist))), ease }; }
    autoT = 0; dirty = true; wake(); updateNav();
    if (!silent) notify(tIdx(), source);
  };
  const step = (dir, source) => {
    if (n < 2) return;
    if (eff.layout === 'marquee') { select(mod(cur() + dir, n)); return; }
    const t = nextTarget(dir);
    if (!isCyc() && !loopOK() && (t === Math.round(target))) return;
    moveTo(t, source);
  };
  const select = (i) => { pos = target = i; dirty = true; wake(); updateNav(); notify(i, 'user'); };
  const goTo = (i, silent) => {
    i = clamp(Math.round(i), 0, Math.max(0, n - 1));
    if (eff.layout === 'marquee') { pos = target = i; dirty = true; wake(); updateNav(); if (!silent) notify(i, 'user'); return; }
    if (i === tIdx() && Math.abs(pos - target) < 1e-3) return;
    let t = i;
    if (isCyc()) t = Math.round(target) + (mod(i - Math.round(target) + n / 2, n) - n / 2);
    moveTo(t, 'user', 0, !!silent);
  };
  const onCardClick = (k) => {
    if (suppressClick) return;
    if (eff.layout === 'marquee') { select(k); return; }
    if (eff.layout === 'spatial' && !eff.spatial.clickFocus) return;
    if (k !== cur()) goTo(k);
  };
  const setPlaying = (v, fromUi) => {
    if (reduce) v = false;
    if (v === playing) return;
    playing = v; autoT = 0; updateNav(); wake();
    if (fromUi !== false && hooks.onPlay) hooks.onPlay(v);
  };

  // ---------- geometry per card ----------
  const hp = (ux, uy, tau, amp, freq, ph) => {
    const vx = -uy, vy = ux, cx = W / 2, cy = H / 2, Q = Math.hypot(W, H), N = amp ? 28 : 1, pts = [];
    for (let i = 0; i <= N; i++) { const q = -Q + (2 * Q * i) / N; pts.push([tau + (amp ? amp * Math.sin(q * freq + ph) : 0), q]); }
    pts.push([Q * 2, Q], [Q * 2, -Q]);
    return 'polygon(' + pts.map((p) => r2(cx + p[0] * ux + p[1] * vx) + 'px ' + r2(cy + p[0] * uy + p[1] * vy) + 'px').join(',') + ')';
  };
  const blank = () => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, o: 1, b: 0, br: 1, zi: 20, clip: '', mask: '', bgx: 0, bgy: 0, bgs: 1, cpx: 0, cpy: 0, co: 1, ox: '', w: 0, h: 0 });
  const originCss = () => { const o = eff.fx.origin; return o === 'top' ? '50% 0%' : o === 'bottom' ? '50% 100%' : o === 'left' ? '0% 50%' : o === 'right' ? '100% 50%' : ''; };

  const pagedStyle = (d, S) => {
    const a = Math.abs(d), s = d < 0 ? -1 : 1, I = eff.fx.intensity / 100, D = eff.fx.depth / 100;
    S.w = W; S.h = H; S.ox = originCss();
    if (a >= 1) { S.o = 0; return; }
    const ang = angRad(), ux = Math.cos(ang), uy = Math.sin(ang);
    const role = d * moveDir >= 0 ? 'in' : 'out';
    const m = role === 'out' && eff.motionOut ? eff.motionOut : eff.motion;
    S.zi = Math.round(20 - a * 10);
    const hw = (Math.abs(ux) * W + Math.abs(uy) * H) / 2;
    switch (m) {
      case 'fade': S.o = role === 'in' ? 1 - a : 1; S.zi = role === 'in' ? 30 : 20; break;
      case 'zoom': S.s = 1 - a * 0.12 * I; S.o = 1 - a; break;
      case 'lift': S.y = a * H * 0.14 * I; S.o = 1 - a; break;
      case 'zoomthrough':
        if (role === 'in') { S.s = 1 - a * 0.45 * I; S.zi = 20; } else { S.s = 1 + a * 0.8 * I; S.zi = 30; }
        S.o = 1 - a; break;
      case 'flip': S.ry = -ux * d * 180; S.rx = uy * d * 180; break;
      case 'tilt': S.x = ux * d * W; S.y = uy * d * H; S.rz = d * 8 * I; S.ry = -ux * d * 28 * I; S.rx = uy * d * 28 * I; break;
      case 'depthpush':
        if (role === 'in') { S.z = -a * 500 * D; S.zi = 20; } else { S.z = a * 350 * D; S.zi = 30; }
        S.o = 1 - a; break;
      case 'wipe': case 'diagonal': case 'wave': {
        if (role === 'in') {
          let vx = ux * s, vy = uy * s;
          if (m === 'diagonal') { const c = Math.cos(45 * RAD), sn = Math.sin(45 * RAD); const nx = vx * c - vy * sn, ny = vx * sn + vy * c; vx = nx; vy = ny; }
          const hwd = (Math.abs(vx) * W + Math.abs(vy) * H) / 2, tau = hwd * (2 * a - 1);
          S.clip = m === 'wave' ? hp(vx, vy, tau, 0.07 * Math.min(W, H) * I, (2 * PI) / (Math.min(W, H) * 0.55), a * 7) : hp(vx, vy, tau, 0, 0, 0);
          S.zi = 30;
        } else S.zi = 20;
        break;
      }
      case 'circle':
        if (role === 'in') { S.clip = 'circle(' + r2((1 - a) * Math.hypot(W, H) * 0.5) + 'px at 50% 50%)'; S.zi = 30; } else S.zi = 20;
        break;
      case 'blinds':
        if (role === 'in') {
          const P = 12.5, v = (1 - a) * P, dir = Math.abs(ux) >= Math.abs(uy) ? 'to right' : 'to bottom';
          S.mask = 'repeating-linear-gradient(' + dir + ',#000 0%,#000 ' + r2(v) + '%,transparent ' + r2(v) + '%,transparent ' + P + '%)'; S.zi = 30;
        } else S.zi = 20;
        break;
      case 'blur': S.b = a * eff.fx.blur * I; S.o = 1 - a; S.s = 1 + a * 0.04; break;
      case 'parallax':
        S.x = ux * d * W; S.y = uy * d * H; S.bgx = -ux * d * W * 0.38 * I; S.bgy = -uy * d * H * 0.38 * I; S.bgs = 1.18; S.cpx = ux * d * W * 0.12 * I; S.cpy = uy * d * H * 0.12 * I; break;
      default: S.x = ux * d * W; S.y = uy * d * H; // slide + elastic
    }
  };

  let accW = [], accX = [], accE = [], SP = null;
  const spatialPrep = () => {
    const sp = eff.spatial, cw = (W * sp.cardW) / 100, ch = (H * sp.cardH) / 100, f = sp.formation;
    let R = (W * sp.radius) / 100, stepDeg = sp.spacing > 0 ? sp.spacing : 360 / Math.max(1, n);
    if (f === 'cylinder') { stepDeg = 360 / Math.max(1, n); R = Math.max(cw * 0.5, (cw + eff.gap) / (2 * Math.tan(PI / Math.max(n, 3)))); }
    const o = { cw, ch, R, stepDeg, vr: (H * sp.vRadius) / 100, f, sp, R0: 0, psi: 0, chi: 0 };
    o.R0 = f === 'tunnel' || f === 'wave' ? 0 : R;
    if (f === 'sphere') {
      const G = 2.399963229728653, N = Math.max(1, n), j = Math.floor(pos), fr = pos - j;
      const wrapPi = (a) => mod(a + PI, 2 * PI) - PI;
      const azOf = (i) => mod(i, N) * G, latOf = (i) => Math.asin(clamp(1 - (2 * (mod(i, N) + 0.5)) / N, -1, 1));
      const A = azOf(j), B = azOf(j + 1), la = latOf(j), lb = latOf(j + 1);
      o.psi = A + wrapPi(B - A) * fr; o.chi = la + (lb - la) * fr;
    }
    return o;
  };
  const spatialStyle = (k, d, S) => {
    const { cw, ch, R, stepDeg, vr, f, sp } = SP, I = eff.fx.intensity / 100;
    const half = Math.max(n / 2, 0.5), a = Math.abs(d) / half, th = d * stepDeg * RAD;
    let px = 0, py = 0, pz = 0, yaw = 0, pitch = 0, roll = 0, fr = 1 - Math.min(1, a), circ = false;
    switch (f) {
      case 'ring': case 'cylinder': circ = true; px = R * Math.sin(th); pz = R * Math.cos(th); break;
      case 'orbit': circ = true; px = R * Math.sin(th); pz = R * Math.cos(th); py = vr * (Math.cos(th) - 1); break;
      case 'helix': circ = true; px = R * Math.sin(th); pz = R * Math.cos(th); py = d * H * sp.rise / 100; break;
      case 'spiral': { circ = true; const rr = R * (1 - 0.5 * Math.min(1, a)); px = rr * Math.sin(th); pz = rr * Math.cos(th); py = d * H * sp.rise / 100 * 0.6; break; }
      case 'multi': { circ = true; const ring = mod(k, 2), rr = ring ? R * 0.62 : R; px = rr * Math.sin(th); pz = rr * Math.cos(th); py = ring ? -ch * 0.7 : 0; break; }
      case 'tunnel': pz = -d * R * 0.45; px = d * cw * 0.3; py = -Math.abs(d) * ch * 0.07; roll = d * sp.twist; fr = d < 0 ? 1 - Math.min(1, -d * 0.6) : 1 - Math.min(1, a); break;
      case 'wave': px = d * cw * 0.72; py = Math.sin(d * 1.1) * H * sp.amplitude / 100; pz = -Math.abs(d) * R * 0.18; yaw = -clamp(d, -3, 3) * 9; roll = Math.cos(d * 1.1) * sp.amplitude * 0.25; break;
      case 'sphere': {
        const G = 2.399963229728653, N = Math.max(1, n), y = clamp(1 - (2 * (k + 0.5)) / N, -1, 1), rho = Math.sqrt(1 - y * y), phi = k * G;
        const x0 = rho * Math.cos(phi), z0 = rho * Math.sin(phi), al = SP.psi - PI / 2;
        const x1 = x0 * Math.cos(al) + z0 * Math.sin(al), z1 = -x0 * Math.sin(al) + z0 * Math.cos(al);
        const cb = Math.cos(SP.chi), sb = Math.sin(SP.chi), y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
        px = R * x1; py = -R * y2; pz = R * z2; yaw = Math.atan2(x1, z2) / RAD; pitch = Math.asin(clamp(y2, -1, 1)) / RAD; fr = (z2 + 1) / 2; break;
      }
    }
    if (circ) { yaw = sp.facing === 'front' ? 0 : sp.facing === 'in' ? th / RAD + 180 : th / RAD; fr = (1 + Math.cos(th)) / 2; }
    const e = Math.max(0, 1 - Math.abs(d));
    S.w = cw; S.h = ch; S.x = (W - cw) / 2 + px; S.y = (H - ch) / 2 + py + (H * sp.elevation) / 100; S.z = pz + sp.activeLift * e;
    S.ry = yaw; S.rx = pitch; S.rz = roll; S.s = 1 + (sp.activeScale / 100 - 1) * e;
    S.o = 1 - (sp.depthFade / 100) * (1 - fr);
    if (f === 'helix' || f === 'spiral') S.o *= clamp((1 - a) / 0.2, 0, 1);
    if (f === 'wave') S.o *= clamp(4.5 - Math.abs(d), 0, 1);
    if (f === 'tunnel' && d < 0) S.o *= clamp(1 + d * 1.1, 0, 1);
    S.br = 1 - (sp.lighting / 100) * (1 - fr); S.b = sp.depthBlur * (1 - fr) * I; S.zi = Math.round(fr * 100);
  };

  const cardStyle = (k, d, S, t) => {
    const l = eff.layout, L = eff.look, I = eff.fx.intensity / 100, D = eff.fx.depth / 100, gp = eff.gap, f = geo.f;
    const cwP = L.cardW / 100, chP = L.cardH / 100, a = Math.abs(d), sg = d < 0 ? -1 : 1;
    S.ox = originCss();
    if (isPaged()) { pagedStyle(d, S); return; }
    if (l === 'spatial') { spatialStyle(k, d, S); return; }
    if (l === 'accordion') { S.w = accW[k]; S.h = H * chP; S.x = accX[k]; S.y = (H - S.h) / 2; S.co = clamp((accE[k] - 0.35) / 0.65, 0, 1); S.zi = 20; return; }
    if (l === 'multi') {
      const v = clamp(Math.round(eff.visible), 2, 5), cw = (W - gp * (v - 1)) / v, ch = H * chP;
      S.w = cw; S.h = ch; S.x = d * (cw + gp); S.y = (H - ch) / 2; if (d < -1.01 || d > v + 0.01) S.o = 0; return;
    }
    const cw = W * cwP, ch = H * chP, cx = (W - cw) / 2, cy = (H - ch) / 2;
    S.w = cw; S.h = ch; S.x = cx; S.y = cy; S.zi = Math.round(30 - a * 5);
    if (l === 'centered') { S.x = cx + d * (cw + gp); S.s = 1 - Math.min(a, 1) * 0.18 * I; if (a > 2.2) S.o = 0; }
    else if (l === 'coverflow') {
      S.x = cx + sg * cw * (0.28 * Math.min(a, 1) + 0.18 * Math.max(0, a - 1)); S.ry = -clamp(d, -1.5, 1.5) * 28 * I; S.s = Math.max(0.72, 1 - a * 0.14);
      S.z = -Math.min(a, 2) * 90 * D; S.o = a > 2.4 ? 0 : Math.max(0.35, 1 - a * 0.25);
    } else if (l === 'stack') {
      S.w = cw; S.h = H * Math.min(chP, 0.84); S.x = (W - S.w) / 2 + d * 14 * f * I; S.y = (H - S.h) / 2 + a * 14 * f; S.rz = d * 2 * I; S.s = Math.max(0.76, 1 - a * 0.07); if (a > 3.4) S.o = 0;
    } else if (l === 'spotlight') {
      S.x = cx + sg * cw * (0.58 * Math.min(a, 1) + 0.34 * Math.max(0, a - 1)); S.s = 1 - Math.min(a, 1) * 0.38 * Math.min(1, 0.4 + I * 0.6) - Math.max(0, a - 1) * 0.1;
      S.br = 1 - Math.min(a, 1) * 0.45; S.b = Math.min(a, 1.5) * eff.fx.blur * 0.35 * I; S.o = a > 2.4 ? 0 : 1 - Math.max(0, a - 1) * 0.5;
    } else if (l === 'fan') {
      const w = W * cwP * 0.8, h = H * chP * 0.9;
      S.w = w; S.h = h; S.x = (W - w) / 2; S.y = H - h - H * 0.05 + a * 6 * f; S.rz = clamp(d, -3, 3) * 14 * I; S.s = 1 - Math.min(a, 3) * 0.03;
      S.ox = '50% ' + r2(h * 1.5) + 'px'; if (a > 3.4) S.o = 0;
    } else if (l === 'wheel') {
      const w = W * cwP * 0.5, h = H * chP * 0.9, R = W * 0.8, th = clamp(d, -4, 4) * 18 * RAD * I;
      S.w = w; S.h = h; S.x = (W - w) / 2 + R * Math.sin(th); S.y = H * 0.1 + R * (1 - Math.cos(th)) * 0.6; S.rz = th / RAD; if (a > 3.4) S.o = 0;
    } else if (l === 'deck') {
      if (d >= 0) { S.s = 1 - Math.min(d, 4) * 0.055 * I; S.y = cy + Math.min(d, 4) * 30 * f; S.z = -Math.min(d, 4) * 20; S.zi = Math.round(30 - d); if (d > 3.6) S.o = 0; }
      else if (d > -1.2) { S.x = cx + d * W * 0.85; S.rz = d * 14 * I; S.zi = 40; S.o = a > 0.65 ? clamp(1 - (a - 0.65) / 0.35, 0, 1) : 1; }
      else S.o = 0;
    }
  };

  // ---------- applying styles ----------
  const put = (node, cache, prop, val) => { if (cache[prop] !== val) { cache[prop] = val; node.style[prop] = val; } };
  const applyCard = (c, S, a, d) => {
    const e = c.el;
    if (S.o <= 0.003) {
      if (c.vis !== false) { e.style.visibility = 'hidden'; e.style.pointerEvents = 'none'; e.setAttribute('aria-hidden', 'true'); c.a.tabIndex = -1; c.vis = false; }
      return;
    }
    if (c.vis !== true) { e.style.visibility = 'visible'; e.style.pointerEvents = 'auto'; e.removeAttribute('aria-hidden'); c.vis = true; }
    c.a.tabIndex = a < 0.5 ? 0 : -1;
    if (!c.img && a <= 2.2 && cfg.slides[c.k].image) { c.bg.style.backgroundImage = slideBg(cfg.slides[c.k]); c.img = true; }
    const st = c.st;
    put(e, st, 'width', r2(S.w) + 'px'); put(e, st, 'height', r2(S.h) + 'px');
    put(e, st, 'transform', 'translate3d(' + r2(S.x) + 'px,' + r2(S.y) + 'px,' + r2(S.z) + 'px) rotateX(' + r2(S.rx) + 'deg) rotateY(' + r2(S.ry) + 'deg) rotateZ(' + r2(S.rz) + 'deg) scale(' + r2(S.s * 1000) / 1000 + ')');
    put(e, st, 'transformOrigin', S.ox || '50% 50%');
    put(e, st, 'opacity', String(r2(S.o)));
    put(e, st, 'zIndex', String(S.zi));
    const fl = (S.b > 0.05 ? 'blur(' + r2(S.b) + 'px) ' : '') + (S.br < 0.995 ? 'brightness(' + r2(S.br) + ')' : '');
    put(e, st, 'filter', fl || 'none');
    put(e, st, 'clipPath', S.clip || 'none');
    const mk = S.mask || 'none'; put(e, st, 'maskImage', mk); put(e, st, 'webkitMaskImage', mk);
    if (S.bgx || S.bgy || S.bgs !== 1 || c.bst.transform) put(c.bg, c.bst, 'transform', 'translate3d(' + r2(S.bgx) + 'px,' + r2(S.bgy) + 'px,0) scale(' + S.bgs + ')');
    if (S.cpx || S.cpy || c.cst.transform) put(c.copy, c.cst, 'transform', 'translate3d(' + r2(S.cpx) + 'px,' + r2(S.cpy) + 'px,0)');
    if (S.co !== 1 || c.cst.opacity) put(c.copy, c.cst, 'opacity', String(r2(S.co)));
  };

  const posAgo = (t, ms) => {
    if (ms <= 0 || hist.length < 2) return pos;
    const tt = t - ms; let i = -1;
    for (let j = 0; j < hist.length; j++) if (hist[j].t <= tt) i = j; else break;
    if (i < 0) return hist[0].p;
    if (i === hist.length - 1) return hist[i].p;
    const A = hist[i], B = hist[i + 1], f = (tt - A.t) / Math.max(1, B.t - A.t);
    return A.p + (B.p - A.p) * f;
  };

  const render = (t) => {
    if (!W || !H || !cards.length) return;
    const l = eff.layout, c0 = cur();
    // camera
    let persp = 1200, stageT = 'none';
    if (l === 'spatial') {
      SP = spatialPrep();
      const sp = eff.spatial;
      persp = sp.perspective;
      stageT = 'translateZ(' + r2(-(SP.R0 + sp.distance)) + 'px) rotateX(' + r2(sp.pitch - tiltY * sp.mouseTilt * 0.6) + 'deg) rotateY(' + r2(sp.yaw + tiltX * sp.mouseTilt) + 'deg) rotateZ(' + r2(sp.roll) + 'deg)';
    } else if (isPaged() && (eff.motion === 'flip' || eff.motion === 'depthpush' || eff.motionOut === 'depthpush' || eff.motionOut === 'flip')) persp = 1400;
    if (viewport._p !== persp) { viewport._p = persp; viewport.style.perspective = persp + 'px'; }
    if (stage._t !== stageT) { stage._t = stageT; stage.style.transform = stageT; }
    if (l === 'marquee') {
      const cw = clamp(W * 0.34, 220, 420), p = cw + eff.gap, ch = H * eff.look.cardH / 100, total = cards.length * p, base = mod(mx, n * p), S = blank();
      for (let i = 0; i < cards.length; i++) {
        const c = cards[i]; let x = i * p - base; if (x < -p) x += total;
        S.o = 1; S.w = cw; S.h = ch; S.x = x; S.y = (H - ch) / 2; S.s = 1; S.zi = 20; S.ox = '';
        applyCard(c, S, 0, 0);
        const act = c.k === c0; if (act !== c.act) { c.act = act; c.el.classList.toggle('is-active', act); }
      }
      progEl.firstChild.style.transform = 'scaleX(' + r2(n > 1 ? c0 / (n - 1) : 1) + ')';
      return;
    }
    if (l === 'accordion') {
      const g = eff.gap, tot = W - g * (n - 1), wa = n > 1 ? tot * clamp(eff.look.cardW / 100, 0.3, 0.9) : tot, wc = n > 1 ? (tot - wa) / (n - 1) : 0, p0 = clamp(pos, 0, n - 1);
      let x = 0; accW = []; accX = []; accE = [];
      for (let k = 0; k < n; k++) { const e = Math.max(0, 1 - Math.abs(k - p0)); accE[k] = e; accW[k] = wc + (wa - wc) * e; accX[k] = x; x += accW[k] + g; }
    }
    const stag = eff.fx.stagger || 0, tr = Math.round(target);
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i], k = c.k, S = blank();
      let pk = pos;
      if (stag > 0 && l !== 'accordion' && l !== 'spatial') pk = posAgo(t, stag * Math.min(4, Math.abs(wrapD(k - tr))));
      const d = wrapD(k - pk);
      cardStyle(k, d, S, t);
      applyCard(c, S, Math.abs(d), d);
      const act = k === c0; if (act !== c.act) { c.act = act; c.el.classList.toggle('is-active', act); }
    }
    if (eff.nav.progress) {
      const pr = playing && !springOn && !anim ? clamp(autoT / cfg.interval, 0, 1) : n > 1 ? clamp(mod(pos, n) / (n - 1), 0, 1) : 1;
      progEl.firstChild.style.transform = 'scaleX(' + r2(pr) + ')';
    }
    if (c0 !== lastCur) updateNav();
  };

  // ---------- physics / time ----------
  const advance = (dt, t) => {
    if (dragging) return true;
    if (gliding) {
      pos += vel * dt; vel *= Math.exp(-dt * 3.2);
      if (!isCyc() && (pos < 0 || pos > n - 1)) { pos = clamp(pos, 0, n - 1); vel = 0; }
      if (Math.abs(vel) < 0.02) { gliding = false; vel = 0; target = pos; notify(cur(), 'user'); updateNav(); }
      return true;
    }
    if (anim) {
      const p = (t - anim.t0) / anim.dur;
      if (p <= 0) return true;
      if (p >= 1) { pos = anim.to; anim = null; vel = 0; } else pos = anim.from + (anim.to - anim.from) * anim.ease(p);
      return true;
    }
    if (springOn) {
      if (t < springStart) return true;
      const k = eff.fx.stiffness, cdamp = eff.fx.damping; let rem = dt;
      while (rem > 1e-6) { const h = Math.min(rem, 1 / 120), acc = -k * (pos - target) - cdamp * vel; vel += acc * h; pos += vel * h; rem -= h; }
      if (Math.abs(pos - target) < 5e-4 && Math.abs(vel) < 2e-3) { pos = target; vel = 0; springOn = false; }
      return true;
    }
    return false;
  };
  const moving = () => dragging || gliding || !!anim || springOn;

  const extras = (dt, t) => {
    const l = eff.layout, mv = moving();
    const paused = dragging || (hovered && (l === 'spatial' ? eff.spatial.pauseHover : eff.nav.pauseOnHover)) || t < restUntil || reduce;
    if (l === 'marquee') {
      if (!paused && !reduce) mx += eff.fx.speed * dt * (eff.fx.reverse ? -1 : 1);
      return;
    }
    if (l === 'spatial' && eff.spatial.autoRotate && !paused && !mv && n > 1) {
      const sp = eff.spatial, sps = (sp.speed / (sp.spacing > 0 ? sp.spacing : 360 / n)) * (sp.reverse ? -1 : 1);
      pos += sps * dt; target = pos; moveDir = sps >= 0 ? 1 : -1;
      const c = cur(); if (c !== lastCur) { updateNav(); notify(c, 'auto'); }
    } else if (playing && !paused && !mv && n > 1 && l !== 'marquee') {
      autoT += dt * 1000;
      if (autoT >= cfg.interval) {
        autoT = 0;
        if (!loopOK() && !isCyc() && tIdx() >= n - 1) setPlaying(false, true); else step(1, 'auto');
      }
    }
    if (l === 'spatial') {
      const k = Math.min(1, dt * 6); tiltX += (tiltTX - tiltX) * k; tiltY += (tiltTY - tiltY) * k;
    }
  };

  const wake = () => { if (!running && !destroyed) { running = true; last = 0; raf = win.requestAnimationFrame(tick); } };
  const tick = (t) => {
    raf = 0; if (destroyed) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
    if (!inView && !dragging) { running = false; return; }
    const before = pos, mv = advance(dt, t);
    extras(dt, t);
    const l = eff.layout;
    if (pos !== before) {
      if (!hist.length || t - hist[hist.length - 1].t > 1000) { hist.length = 0; hist.push({ t: t - 16, p: before }); }
      hist.push({ t, p: pos }); lastChange = t;
      while (hist.length > 2 && t - hist[1].t > 1600) hist.shift();
      const c = cur(); if (c !== lastCur) updateNav();
      dirty = true;
    }
    const stagWin = (eff.fx.stagger || 0) * 4 + 80;
    const tilting = l === 'spatial' && (Math.abs(tiltX - tiltTX) > 0.002 || Math.abs(tiltY - tiltTY) > 0.002 || eff.spatial.mouseTilt > 0 && (tiltTX || tiltTY));
    const alive = mv || l === 'marquee' || (l === 'spatial' && eff.spatial.autoRotate) || (playing && n > 1) || tilting || t - lastChange < stagWin || dirty;
    if (alive || l === 'marquee') render(t);
    dirty = false;
    const keep = mv || (l === 'marquee' && !reduce) || (l === 'spatial' && eff.spatial.autoRotate && !reduce) || (playing && n > 1 && !reduce) || tilting || t - lastChange < stagWin;
    if (keep) raf = win.requestAnimationFrame(tick); else { running = false; hist.length = 0; }
  };

  // ---------- pointer / keyboard ----------
  const axis = () => { if (isPaged()) { const a = angRad(); return [Math.cos(a), Math.sin(a)]; } return [1, 0]; };
  const rubber = (p) => {
    if (isCyc() || eff.layout === 'marquee') return p;
    if (p < 0) return p * 0.35; if (p > n - 1) return n - 1 + (p - (n - 1)) * 0.35; return p;
  };
  const onDown = (e) => {
    if (!eff.nav.drag || (e.button != null && e.button > 0) || n < 2) return;
    if (e.target.closest && e.target.closest('.mf-nav,.mf-arrow,.mf-play,.mf-thumb,.mf-dot')) return;
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY, lx: e.clientX, startPos: pos, samples: [], type: e.pointerType, started: false };
  };
  const onMove = (e) => {
    if (eff.layout === 'spatial' && e.pointerType === 'mouse' && eff.spatial.mouseTilt > 0) {
      const r = root.getBoundingClientRect();
      tiltTX = clamp(((e.clientX - r.left) / Math.max(1, r.width)) * 2 - 1, -1, 1); tiltTY = clamp(((e.clientY - r.top) / Math.max(1, r.height)) * 2 - 1, -1, 1); wake();
    }
    if (!ptr || e.pointerId !== ptr.id) return;
    const ax = axis(), dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (!dragging) {
      if (Math.abs(dx * ax[0] + dy * ax[1]) < 5) return;
      dragging = true; anim = null; springOn = false; gliding = false; ptr.ox = e.clientX; ptr.oy = e.clientY; ptr.lx = e.clientX; ptr.startPos = pos;
      try { root.setPointerCapture(e.pointerId); } catch (_) {}
      root.classList.add('is-dragging'); autoT = 0;
    }
    const proj = (e.clientX - ptr.ox) * ax[0] + (e.clientY - ptr.oy) * ax[1], sens = eff.nav.sensitivity / 100;
    if (eff.layout === 'marquee') { mx -= (e.clientX - ptr.lx) * sens; ptr.lx = e.clientX; }
    else { pos = rubber(ptr.startPos - (proj / geo.pitch) * sens); target = pos; moveDir = pos >= (ptr.samples.length ? ptr.samples[ptr.samples.length - 1].p : ptr.startPos) ? 1 : -1; }
    const t = nowMs(); ptr.samples.push({ t, p: pos }); while (ptr.samples.length > 2 && t - ptr.samples[0].t > 120) ptr.samples.shift();
    dirty = true; wake();
  };
  const onUp = (e) => {
    if (!ptr || (e && e.pointerId != null && e.pointerId !== ptr.id)) return;
    const p = ptr; ptr = null;
    if (!dragging) return;
    dragging = false; root.classList.remove('is-dragging');
    try { root.releasePointerCapture(p.id); } catch (_) {}
    suppressClick = true; win.setTimeout(() => { suppressClick = false; }, 0);
    restUntil = nowMs() + 1500;
    if (eff.layout === 'marquee') { wake(); return; }
    let v = 0; const s = p.samples;
    if (s.length > 1) { const A = s[0], B = s[s.length - 1]; v = (B.p - A.p) / Math.max(0.016, (B.t - A.t) / 1000); }
    const mom = eff.fx.momentum ? eff.fx.inertia / 50 : 0, startRound = Math.round(p.startPos);
    if (eff.layout === 'spatial' && !eff.spatial.snap) { vel = v * mom; gliding = true; wake(); return; }
    let t = Math.round(pos + v * 0.22 * mom); const moved = pos - p.startPos;
    if (t === startRound && Math.abs(moved) > 0.12) t = startRound + (moved > 0 ? 1 : -1);
    if (isPaged()) t = clamp(t, startRound - 1, startRound + 1);
    if (!isCyc()) t = loopOK() ? mod(t, n) : clamp(t, 0, n - 1);
    moveTo(t, 'user', v);
  };
  const onEnter = (e) => { if (e.pointerType === 'mouse') hovered = true; };
  const onLeave = () => { hovered = false; tiltTX = 0; tiltTY = 0; wake(); };
  const onClickCapture = (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } };
  const onKey = (e) => {
    if (!eff.nav.keyboard) return;
    const k = e.key, f = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 0;
    if (f) { e.preventDefault(); step(f, 'user'); }
    else if (k === 'Home') { e.preventDefault(); goTo(0); } else if (k === 'End') { e.preventDefault(); goTo(n - 1); }
  };
  const onWheel = (e) => {
    if (!eff.nav.wheel || n < 2) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(d) < 12) return;
    e.preventDefault();
    const t = nowMs(); if (t - lastWheel < 500) return; lastWheel = t; step(d > 0 ? 1 : -1, 'user');
  };

  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onUp);
  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('click', onClickCapture, true);
  root.addEventListener('keydown', onKey);
  root.addEventListener('wheel', onWheel, { passive: false });

  const measure = () => {
    const w = root.clientWidth, h = root.clientHeight;
    if (w === W && h === H) return;
    W = w; H = h; sync(false);
  };
  const ro = win.ResizeObserver ? new win.ResizeObserver(measure) : null; if (ro) ro.observe(root);
  const io = win.IntersectionObserver ? new win.IntersectionObserver((es) => { inView = es[es.length - 1].isIntersecting; if (inView) { dirty = true; wake(); } }) : null; if (io) io.observe(root);
  const mq = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const onMq = () => { reduce = !!mq.matches; if (reduce) setPlaying(false, true); wake(); };
  if (mq) { reduce = !!mq.matches; if (mq.addEventListener) mq.addEventListener('change', onMq); }
  if (reduce) playing = false;

  // ---------- init ----------
  W = root.clientWidth; H = root.clientHeight;
  resolve(); sig = '';
  sync(true);
  if (playing) wake();

  return {
    update(next) {
      const slidesChanged = !sameSlides(cfg.slides, next.slides);
      const prevLayout = cfg.layout;
      cfg = next; slides = cfg.slides; n = slides.length;
      if (!isCyc()) pos = clamp(pos, 0, Math.max(0, n - 1)); target = isCyc() ? target : clamp(target, 0, Math.max(0, n - 1));
      sync(slidesChanged || prevLayout !== cfg.layout);
      anim = anim ? Object.assign(anim, { ease }) : anim;
    },
    goTo, go: (dir) => step(dir, 'user'),
    setPlaying: (v) => setPlaying(!!v, false),
    getIndex: () => cur(),
    destroy() {
      destroyed = true; if (raf) win.cancelAnimationFrame(raf);
      root.removeEventListener('pointerdown', onDown); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp); root.removeEventListener('pointerenter', onEnter); root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('click', onClickCapture, true); root.removeEventListener('keydown', onKey); root.removeEventListener('wheel', onWheel);
      if (ro) ro.disconnect(); if (io) io.disconnect(); if (mq && mq.removeEventListener) mq.removeEventListener('change', onMq);
      root.textContent = ''; applied.forEach((c) => root.classList.remove(c)); root.classList.remove('mf-root', 'is-dragging');
    },
  };
}
