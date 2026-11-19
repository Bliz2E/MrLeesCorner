/* Scene renderer: orthographic 3D projection drawn on a 2D canvas. */
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = v => (v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = v => String(+v.toFixed(2));

  // Marina Bay Sands picture: three leaning towers with the SkyPark on top.
  // (x, y) is the base centre; hp is the pixel height from base to SkyPark top.
  function building(ctx, x, y, hp) {
    if (hp < 4) { ctx.fillStyle = '#4a6b80'; ctx.fillRect(x - 2, y - hp, 4, hp); return; }
    const p = (nx, ny) => [x + nx * hp, y - ny * hp];
    const topY = 0.89;
    const towers = [
      [[-0.50, -0.25], [-0.36, -0.14], '#7aa0b5', '#3b5d73'],
      [[-0.14, 0.14], [-0.12, 0.12], '#6a8fa5', '#2f5068'],
      [[0.25, 0.50], [0.14, 0.36], '#5f869d', '#2a4a60']
    ];
    towers.forEach(([b, t, c1, c2]) => {
      ctx.beginPath();
      let q = p(b[0], 0); ctx.moveTo(q[0], q[1]);
      q = p(b[1], 0); ctx.lineTo(q[0], q[1]);
      q = p(t[1], topY); ctx.lineTo(q[0], q[1]);
      q = p(t[0], topY); ctx.lineTo(q[0], q[1]);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, y, 0, y - hp * topY);
      g.addColorStop(0, c2); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1;
      for (let ny = 0.02; ny < topY; ny += 0.028) {
        const f = ny / topY;
        const a = p(lerp(b[0], t[0], f), ny), e = p(lerp(b[1], t[1], f), ny);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      for (let i = 1; i < 5; i++) {
        const a = p(lerp(b[0], b[1], i / 5), 0), e = p(lerp(t[0], t[1], i / 5), topY);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
      }
      ctx.restore();
    });
    // SkyPark: boat-shaped deck with a cantilevered bow, a pool strip and trees
    ctx.beginPath();
    let q = p(-0.62, 0.935); ctx.moveTo(q[0], q[1]);
    q = p(-0.56, 0.87); ctx.lineTo(q[0], q[1]);
    q = p(0.44, 0.87); ctx.lineTo(q[0], q[1]);
    q = p(0.72, 0.955); ctx.lineTo(q[0], q[1]);
    q = p(0.70, 0.985); ctx.lineTo(q[0], q[1]);
    q = p(-0.62, 0.985); ctx.lineTo(q[0], q[1]);
    ctx.closePath();
    ctx.fillStyle = '#9fb7c6'; ctx.fill();
    ctx.strokeStyle = 'rgba(20,35,46,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    let a = p(-0.58, 0.985), e = p(0.68, 1.0);
    ctx.fillStyle = '#3f8f63'; ctx.fillRect(a[0], e[1], e[0] - a[0], a[1] - e[1]);
    a = p(-0.30, 0.965); e = p(0.22, 0.945);
    ctx.fillStyle = '#4aa3c9'; ctx.fillRect(a[0], a[1], e[0] - a[0], e[1] - a[1]);
  }

  function person(ctx, x, y, fh, col, swing) {
    const r = fh * 0.12;
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.6, fh * 0.08); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y - fh + r, r, 0, 7); ctx.fill();
    const neck = y - fh + 2 * r + 1, hip = y - fh * 0.42;
    ctx.beginPath();
    ctx.moveTo(x, neck); ctx.lineTo(x, hip);
    ctx.moveTo(x, neck + fh * 0.08); ctx.lineTo(x - fh * 0.18 + swing * 0.6, hip - fh * 0.05);
    ctx.moveTo(x, neck + fh * 0.08); ctx.lineTo(x + fh * 0.18 - swing * 0.6, hip - fh * 0.05);
    ctx.moveTo(x, hip); ctx.lineTo(x - fh * 0.12 + swing, y);
    ctx.moveTo(x, hip); ctx.lineTo(x + fh * 0.12 - swing, y);
    ctx.stroke();
    ctx.restore();
  }

  window.EL = window.EL || {};
  window.EL.fmt = fmt;
  window.EL.ease = ease;

  window.EL.render = function (ctx, W, Hh, S, m, T, tt, c) {
    ctx.clearRect(0, 0, W, Hh);
    // ---- extents of the scene and camera ----
    const minX = Math.min(0, m.B[0], 120), maxX = Math.max(0, m.B[0], 120);
    const minY = Math.min(0, m.B[1]), maxY = Math.max(0, m.B[1]);
    const x0 = minX < 0 ? Math.floor(minX / 50) * 50 : 0, x1 = Math.ceil((maxX + 20) / 50) * 50;
    const y0 = minY < 0 ? Math.floor(minY / 50) * 50 : 0, y1 = Math.ceil((maxY + 20) / 50) * 50;
    const z1 = Math.ceil((S.H + 10) / 50) * 50;
    const rho = Math.hypot(x1 - x0, y1 - y0, z1) / 2;
    const k0 = 0.5 * Math.min(W, Hh) / rho;
    const k1 = Math.max(k0, Math.min(0.8 * Hh / Math.max(1, S.H), 0.9 * W / (m.d + 0.5 * S.H + 30)));
    const fz = S.focus;
    const C = [lerp((x0 + x1) / 2, 0.4 * m.X[0], fz), lerp((y0 + y1) / 2, 0.4 * m.X[1], fz), lerp(z1 / 2, S.H / 2, fz)];
    const k = lerp(k0, k1, fz);
    const cp = Math.cos(S.pitch), sp = Math.sin(S.pitch), cy = Math.cos(S.yaw), sy = Math.sin(S.yaw);
    const pr = (x, y, z) => {
      const qx = x - C[0], qy = y - C[1], qz = z - C[2];
      const sx = qx * cy + qy * sy, dep = -qx * sy + qy * cy, up = qz * cp + dep * sp;
      return [W / 2 + sx * k, Hh / 2 - up * k, dep * cp - qz * sp];
    };
    const L = (a, b, col, w = 1, dash = null, al = 1) => {
      ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
    };
    const dot = (a, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(a[0], a[1], r, 0, 7); ctx.fill(); };
    const tag = (txt, x, y, col, align = 'center', size = 12) => {
      ctx.save(); ctx.font = '600 ' + size + 'px Inter, system-ui, sans-serif'; ctx.textAlign = align; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = c.panel; ctx.strokeText(txt, x, y);
      ctx.fillStyle = col; ctx.fillText(txt, x, y); ctx.restore();
    };
    const arrow = (a, b) => {
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      ctx.fillStyle = c.ink; ctx.beginPath(); ctx.moveTo(b[0], b[1]);
      ctx.lineTo(b[0] - 9 * Math.cos(ang - 0.4), b[1] - 9 * Math.sin(ang - 0.4));
      ctx.lineTo(b[0] - 9 * Math.cos(ang + 0.4), b[1] - 9 * Math.sin(ang + 0.4)); ctx.fill();
    };
    const axis = (a3, b3, name, tickFn) => {
      const a = pr(...a3), b = pr(...b3);
      L(a, b, c.ink, 1.6); arrow(a, b);
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      tag(name, b[0] + 12 * Math.cos(ang), b[1] + 12 * Math.sin(ang), c.ink, 'center', 15);
      tickFn();
    };

    // ---- ground and grid ----
    const quad = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(q => pr(q[0], q[1], 0));
    ctx.fillStyle = c.ground; ctx.beginPath(); quad.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill();
    for (let v = x0; v <= x1; v += 50) L(pr(v, y0, 0), pr(v, y1, 0), c.grid, 1);
    for (let v = y0; v <= y1; v += 50) L(pr(x0, v, 0), pr(x1, v, 0), c.grid, 1);

    axis([x0, 0, 0], [x1, 0, 0], 'x', () => {
      for (let v = 50; v <= x1 - 40; v += 50) { const q = pr(v, 0, 0); L(q, [q[0], q[1] + 4], c.ink, 1); tag(String(v), q[0], q[1] + 14, c.muted, 'center', 10); }
    });
    axis([0, y0, 0], [0, y1, 0], 'y', () => {
      for (let v = 50; v <= y1 - 40; v += 50) { const q = pr(0, v, 0); L(q, [q[0], q[1] + 4], c.ink, 1); tag(String(v), q[0] - 4, q[1] + 14, c.muted, 'center', 10); }
    });

    // ---- path A -> B ----
    const A3 = pr(120, 0, 0), B3 = pr(m.B[0], m.B[1], 0);
    L(A3, B3, c.muted, 2.5);
    const w = ease(clamp(tt / T.walk));
    const pos = [m.A[0] + (m.X[0] - m.A[0]) * w, m.A[1] + (m.X[1] - m.A[1]) * w];
    L(A3, pr(pos[0], pos[1], 0), c.accent, 4);
    dot(A3, 4.5, c.ink); dot(B3, 4.5, c.ink);
    tag('A (120, 0, 0)', A3[0], A3[1] + 16, c.ink);
    tag('B (' + fmt(m.B[0]) + ', ' + fmt(m.B[1]) + ', 0)', B3[0], B3[1] + 16, c.ink);

    // ---- building and person, farther one first ----
    const base = pr(0, 0, 0), top = pr(0, 0, S.H);
    const hp = Math.max(0, base[1] - top[1]);
    const pBase = pr(pos[0], pos[1], 0), pTrue = pr(pos[0], pos[1], m.h);
    const fh = Math.max(24, pBase[1] - pTrue[1]);
    const swing = tt < T.walk ? Math.sin(tt * 11) * fh * 0.12 : 0;
    const drawB = () => building(ctx, base[0], base[1], hp);
    const drawP = () => person(ctx, pBase[0], pBase[1], fh, c.ink, swing);
    if (pBase[2] > base[2]) { drawP(); drawB(); } else { drawB(); drawP(); }
    tag('Marina Bay Sands', base[0], base[1] + 18, c.ink, 'center', 12);
    tag('O (0, 0, 0)', base[0], base[1] + 32, c.muted, 'center', 11);

    // z axis over the picture
    axis([0, 0, 0], [0, 0, z1], 'z', () => {
      const step = S.H > 150 ? 100 : 50;
      for (let v = step; v <= z1 - 20; v += step) { const q = pr(0, 0, v); L([q[0] - 4, q[1]], [q[0] + 4, q[1]], c.ink, 1); tag(String(v), q[0] - 14, q[1], c.muted, 'center', 10); }
    });
    dot(top, 4.5, c.opp);
    tag('Top (0, 0, ' + fmt(S.H) + ')', top[0] + 10, top[1] - 8, c.opp, 'left');

    // ---- construction stages ----
    const f = clamp((tt - T.walk) / 0.9), rt = clamp((tt - T.foot) / 0.6);
    const tp = clamp((tt - T.right) / 1.0), tr = clamp((tt - T.top) / 1.2);
    const live = { dist: Math.hypot(pos[0], pos[1]), angle: Math.atan2(S.H - m.h, Math.hypot(pos[0], pos[1])) };
    const Xs = pr(m.X[0], m.X[1], 0);
    if (tt >= T.walk) { dot(Xs, 4.5, c.accent); tag('X', Xs[0] + 10, Xs[1] + 12, c.accent, 'left', 14); }

    if (f > 0 && m.d > 0.01) {
      const target = [lerp(Xs[0], base[0], ease(f)), lerp(Xs[1], base[1], ease(f))];
      L(Xs, target, c.adj, 2.5, [7, 5]);
    }
    if (rt > 0 && m.inside && m.d > 0.01) {
      const eO = [-m.X[0] / m.d, -m.X[1] / m.d], sg = m.t < 0.5 ? 1 : -1;
      const eA = [sg * m.dx / m.L, sg * m.dy / m.L], s = 0.05 * rho;
      const pts = [[0, 0], [eO[0] * s, eO[1] * s], [eO[0] * s + eA[0] * s, eO[1] * s + eA[1] * s], [eA[0] * s, eA[1] * s]]
        .map(o => pr(m.X[0] + o[0], m.X[1] + o[1], 0));
      ctx.save(); ctx.globalAlpha = rt; ctx.fillStyle = c.adj + '33'; ctx.strokeStyle = c.adj; ctx.lineWidth = 1.6;
      ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = rt;
      tag('90°  (OX ⟂ AB)', (pts[2][0] + pts[0][0]) / 2 + 8, (pts[2][1] + pts[0][1]) / 2 + 20, c.adj, 'left');
      ctx.restore();
    }

    const P3 = pr(m.X[0], m.X[1], m.h), Q3 = pr(0, 0, m.h), T3 = pr(0, 0, S.H);
    if (tp > 0) {
      dot(P3, 3.5, c.hyp);
      L(P3, [lerp(P3[0], T3[0], ease(tp)), lerp(P3[1], T3[1], ease(tp))], c.hyp, 2.5);
    }
    if (tr > 0 && m.d > 0.01) {
      ctx.save(); ctx.globalAlpha = 0.16 * tr; ctx.fillStyle = c.hyp;
      ctx.beginPath(); ctx.moveTo(P3[0], P3[1]); ctx.lineTo(Q3[0], Q3[1]); ctx.lineTo(T3[0], T3[1]); ctx.closePath(); ctx.fill(); ctx.restore();
      const a1 = clamp(tr * 3), a2 = clamp(tr * 3 - 1);
      L(P3, [lerp(P3[0], Q3[0], a1), lerp(P3[1], Q3[1], a1)], c.adj, 4);
      if (a2 > 0) L(Q3, [lerp(Q3[0], T3[0], a2), lerp(Q3[1], T3[1], a2)], c.opp, 4);
      ctx.save(); ctx.globalAlpha = clamp(tr * 2 - 0.6);
      // right angle at Q, inside the vertical triangle
      const ux = m.X[0] / m.d, uy = m.X[1] / m.d, s2 = 0.09 * Math.min(m.d, m.opp);
      const r1 = pr(ux * s2, uy * s2, m.h), r2 = pr(ux * s2, uy * s2, m.h + s2), r3 = pr(0, 0, m.h + s2);
      ctx.strokeStyle = c.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]); ctx.lineTo(r3[0], r3[1]); ctx.stroke();
      // angle arc at P
      const hyp = Math.hypot(m.d, m.opp), ra = 0.2 * hyp;
      const va = [-ux, -uy, 0], vb = [-m.d / hyp, 0, 0].map(() => 0);
      const tb = [-m.X[0], -m.X[1], S.H - m.h].map(v => v / hyp);
      ctx.strokeStyle = c.ink; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i <= 18; i++) {
        const q = [lerp(va[0], tb[0], i / 18), lerp(va[1], tb[1], i / 18), lerp(va[2], tb[2], i / 18)];
        const ln = Math.hypot(q[0], q[1], q[2]);
        const sp3 = pr(m.X[0] + q[0] / ln * ra, m.X[1] + q[1] / ln * ra, m.h + q[2] / ln * ra);
        i ? ctx.lineTo(sp3[0], sp3[1]) : ctx.moveTo(sp3[0], sp3[1]);
      }
      ctx.stroke();
      const mid = [lerp(va[0], tb[0], 0.5), lerp(va[1], tb[1], 0.5), lerp(va[2], tb[2], 0.5)], ml = Math.hypot(mid[0], mid[1], mid[2]);
      const ap = pr(m.X[0] + mid[0] / ml * ra * 1.9, m.X[1] + mid[1] / ml * ra * 1.9, m.h + mid[2] / ml * ra * 1.9);
      tag('θ = ' + fmt(m.theta * 180 / Math.PI) + '°', ap[0], ap[1], c.ink, 'center', 13);
      const mp = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let q = mp(P3, Q3); tag('Adjacent = ' + fmt(m.d) + ' m', q[0], q[1] + 16, c.adj);
      q = mp(Q3, T3); tag('Opposite = ' + fmt(m.opp) + ' m', q[0] - 10, q[1], c.opp, 'right');
      q = mp(P3, T3); tag('Line of sight', q[0] + 10, q[1] - 6, c.hyp, 'left');
      ctx.restore();
    }
    return live;
  };
})();
