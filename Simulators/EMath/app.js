/* Inputs, model, calculation worksheet and animation loop. */
(function () {
  const $ = id => document.getElementById(id);
  const { fmt, ease } = window.EL;
  const cv = $('scene'), ctx = cv.getContext('2d');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEG = Math.PI / 180;
  const clampN = (v, a, b) => Math.min(b, Math.max(a, v));

  const S = { H: 200, bx: 0, by: 200, useH: false, hv: 1.7, yaw: 125 * DEG, pitch: 25 * DEG, focus: 0, start: performance.now() };
  let M, T, tween = null, W = 0, Hh = 0;

  function model() {
    const A = [120, 0], B = [S.bx, S.by];
    const dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy;
    const tRaw = L2 > 0 ? -(A[0] * dx + A[1] * dy) / L2 : 0;
    const t = clampN(tRaw, 0, 1);
    const X = [A[0] + t * dx, A[1] + t * dy], d = Math.hypot(X[0], X[1]);
    const h = S.useH ? S.hv : 0, opp = S.H - h;
    return { A, B, dx, dy, L2, L: Math.sqrt(L2), tRaw, t, X, d, h, opp, theta: Math.atan2(opp, d), inside: tRaw >= 0 && tRaw <= 1 };
  }
  function timeline(m) {
    const walk = clampN(1.2 + m.t * m.L / 70, 1.4, 4);
    return { walk, foot: walk + 0.9, right: walk + 1.5, top: walk + 2.5, tri: walk + 3.7 };
  }

  // ---- worked calculation ----
  function renderCalc() {
    const m = M, ol = $('steps'), deg = m.theta / DEG;
    if (m.L2 === 0) { ol.innerHTML = '<li class="on"><h3>Choose a B that differs from A</h3><p>A and B are the same point, so there is no path to walk.</p></li>'; return; }
    const lbl = m.useH;
    const steps = [];
    steps.push(['Given',
      `<p>Building at O = (0, 0, 0), height H = ${fmt(S.H)} m. Path from A = (120, 0, 0) to B = (${fmt(S.bx)}, ${fmt(S.by)}, 0).</p>
       <p>${S.useH ? 'The viewer is ' + fmt(S.hv) + ' m tall, so the line of sight starts at the top of the person.' : 'Viewer height is ignored, so the person is treated as a point on the ground.'}</p>`]);
    steps.push(['Find the point X on AB closest to the building',
      `<p>Write X = A + t(B − A). The line OX is at 90° to AB when OX · AB = 0, which gives:</p>
       <div class="math">t = −A·(B − A) ÷ |B − A|² = −(120 × ${fmt(m.dx)}) ÷ ((${fmt(m.dx)})² + (${fmt(m.dy)})²) = ${fmt(m.tRaw)}</div>` +
      (m.inside
        ? `<div class="math">X = (120 + t × ${fmt(m.dx)}, 0 + t × ${fmt(m.dy)}, 0) = (${fmt(m.X[0])}, ${fmt(m.X[1])}, 0)</div>`
        : `<p>t is outside 0 to 1, so the perpendicular lands beyond the path. The closest point on AB is the end ${m.t === 0 ? 'A' : 'B'}, so X = (${fmt(m.X[0])}, ${fmt(m.X[1])}, 0). OX is not at 90° to AB here.</p>`)]);
    steps.push(['Adjacent side',
      `<p>The adjacent side is the ground distance from X to the building. The opposite side does not change, so the angle is largest where this distance is smallest.</p>
       <div class="math"><span class="adj">adjacent = OX</span> = √(${fmt(m.X[0])}² + ${fmt(m.X[1])}²) = <span class="adj">${fmt(m.d)} m</span></div>`]);
    steps.push(['Opposite side',
      `<div class="math"><span class="opp">opposite</span> = ${lbl ? 'H − h = ' + fmt(S.H) + ' − ' + fmt(S.hv) + ' = ' : 'H = '}<span class="opp">${fmt(m.opp)} m</span></div>`]);
    steps.push(['Angle of elevation',
      `<div class="math">tan θ = <span class="opp">opposite</span> ÷ <span class="adj">adjacent</span> = ${fmt(m.opp)} ÷ ${fmt(m.d)} = ${m.d > 0.01 ? fmt(m.opp / m.d) : '∞'}</div>
       <div class="math">θ = tan⁻¹(${m.d > 0.01 ? fmt(m.opp / m.d) : '∞'}) = ${fmt(deg)}°</div>`]);
    ol.innerHTML = steps.map((s, i) => `<li data-i="${i}" class="pending"><h3>${s[0]}</h3>${s[1]}</li>`).join('') +
      `<li data-i="5" class="pending"><div class="result">Largest angle of elevation: ${fmt(deg)}°<small>Reached at X = (${fmt(m.X[0])}, ${fmt(m.X[1])}, 0), ${fmt(m.d)} m from the building.</small></div></li>`;
  }
  function stepTimes() { return [0, T.walk, T.foot, T.top, T.tri - 0.4, T.tri]; }
  function updateSteps(tt) {
    const times = stepTimes();
    document.querySelectorAll('#steps li').forEach(li => {
      const on = tt >= times[+li.dataset.i];
      li.classList.toggle('pending', !on); li.classList.toggle('on', on);
    });
  }

  // ---- inputs ----
  function restart() { M = model(); T = timeline(M); S.start = performance.now(); renderCalc(); }
  function showErr(msg) { $('err').textContent = msg || ''; }
  function readInputs() {
    const h = parseFloat($('hNum').value), bx = parseFloat($('bx').value), by = parseFloat($('by').value), v = parseFloat($('vNum').value);
    if (!isNaN(h)) S.H = clampN(h, 10, 300);
    if (!isNaN(bx)) S.bx = clampN(bx, -500, 500);
    if (!isNaN(by)) S.by = clampN(by, -500, 500);
    if (!isNaN(v)) S.hv = clampN(Math.round(v * 100) / 100, 1.2, 2.7);
    S.useH = $('useH').checked;
    showErr(S.bx === 120 && S.by === 0 ? 'B must be a different point from A.' : '');
    restart();
  }
  $('hRange').addEventListener('input', e => { $('hNum').value = e.target.value; readInputs(); });
  $('hNum').addEventListener('input', e => { if (e.target.value !== '') { $('hRange').value = clampN(+e.target.value, 10, 300); readInputs(); } });
  $('hNum').addEventListener('change', e => { e.target.value = S.H; $('hRange').value = S.H; });
  ['bx', 'by'].forEach(id => {
    $(id).addEventListener('input', readInputs);
    $(id).addEventListener('change', () => { $('bx').value = S.bx; $('by').value = S.by; });
  });
  $('useH').addEventListener('change', e => {
    $('vRange').disabled = !e.target.checked; $('vNum').disabled = !e.target.checked; readInputs();
  });
  $('vRange').addEventListener('input', e => { $('vNum').value = (+e.target.value).toFixed(2); readInputs(); });
  $('vNum').addEventListener('input', e => { if (e.target.value !== '') { $('vRange').value = clampN(+e.target.value, 1.2, 2.7); readInputs(); } });
  $('vNum').addEventListener('change', e => { e.target.value = S.hv.toFixed(2); $('vRange').value = S.hv; });

  // ---- view controls ----
  function syncView() {
    $('yaw').value = Math.round(((S.yaw / DEG) % 360 + 360) % 360); $('yawv').textContent = $('yaw').value + '°';
    $('pitch').value = Math.round(S.pitch / DEG); $('pitchv').textContent = $('pitch').value + '°';
  }
  $('yaw').addEventListener('input', e => { tween = null; S.yaw = +e.target.value * DEG; syncView(); });
  $('pitch').addEventListener('input', e => { tween = null; S.pitch = +e.target.value * DEG; syncView(); });
  function goTo(yaw, pitch, focus) {
    let dy = ((yaw - S.yaw + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    const to = { yaw: S.yaw + dy, pitch, focus };
    if (reduce) { Object.assign(S, to); syncView(); return; }
    tween = { t0: performance.now(), dur: 900, from: { yaw: S.yaw, pitch: S.pitch, focus: S.focus }, to };
  }
  $('face').addEventListener('click', () => goTo(M.d > 0.01 ? Math.atan2(M.X[1], M.X[0]) : S.yaw, 0, 1));
  $('reset').addEventListener('click', () => goTo(125 * DEG, 25 * DEG, 0));
  $('replay').addEventListener('click', restart);

  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, yaw: S.yaw }; tween = null; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag) { S.yaw = drag.yaw + (e.clientX - drag.x) * 0.008; syncView(); } });
  const endDrag = () => { drag = null; };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { S.yaw -= 0.1; syncView(); } if (e.key === 'ArrowRight') { S.yaw += 0.1; syncView(); }
  });

  // ---- canvas sizing and loop ----
  function resize() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; Hh = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(cv); else addEventListener('resize', resize);

  function colors() {
    const cs = getComputedStyle(document.documentElement), g = n => cs.getPropertyValue(n).trim();
    return { panel: g('--panel'), ink: g('--ink'), muted: g('--muted'), grid: g('--grid'), ground: g('--ground'), adj: g('--adj'), opp: g('--opp'), hyp: g('--hyp'), accent: g('--accent') };
  }

  function frame(now) {
    if (tween) {
      const p = Math.min(1, (now - tween.t0) / tween.dur), e = ease(p);
      S.yaw = tween.from.yaw + (tween.to.yaw - tween.from.yaw) * e;
      S.pitch = tween.from.pitch + (tween.to.pitch - tween.from.pitch) * e;
      S.focus = tween.from.focus + (tween.to.focus - tween.from.focus) * e;
      syncView(); if (p >= 1) tween = null;
    }
    if (W > 0) {
      const tt = reduce ? 99 : (now - S.start) / 1000;
      const live = window.EL.render(ctx, W, Hh, S, M, T, tt, colors());
      updateSteps(tt);
      const done = tt >= T.walk;
      $('readout').textContent = M.L2 === 0 ? '' : (done ? 'At X' : 'Walking') + ': ' + fmt(live.dist) + ' m from the building, angle of elevation ' + fmt(live.angle / DEG) + '°';
    }
    requestAnimationFrame(frame);
  }

  M = model(); T = timeline(M); renderCalc(); syncView(); resize();
  requestAnimationFrame(frame);
})();
