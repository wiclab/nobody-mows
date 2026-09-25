(() => {
  'use strict';

  const game = document.getElementById('game');
  const wrap = document.getElementById('canvasWrap');
  if (!game || !wrap) return;

  const fx = document.createElement('canvas');
  fx.id = 'mowerFx';
  fx.width = 960;
  fx.height = 600;
  fx.setAttribute('aria-hidden', 'true');
  Object.assign(fx.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    background: 'transparent',
    zIndex: '3'
  });
  wrap.appendChild(fx);

  const badge = document.createElement('div');
  Object.assign(badge.style, {
    position: 'absolute',
    left: '12px',
    bottom: '12px',
    zIndex: '4',
    padding: '6px 9px',
    borderRadius: '999px',
    background: 'rgba(7,12,8,.72)',
    border: '1px solid rgba(255,255,255,.12)',
    color: '#dbe8dd',
    font: '700 11px system-ui,sans-serif',
    backdropFilter: 'blur(6px)',
    pointerEvents: 'none'
  });
  badge.textContent = 'Machines on field: 0';
  wrap.appendChild(badge);

  const c = fx.getContext('2d');
  let machines = [];
  let grassBits = [];
  let moneyBits = [];
  let trails = [];
  let lastPlan = '';
  let lastTime = performance.now();
  let lastStage = (document.getElementById('stageName') || {}).textContent || '';
  let flash = 0;

  const looks = {
    push:     {speed: 78, size: 30, body:'#e84b4b', trim:'#ffe16b'},
    electric: {speed:105, size: 32, body:'#3189e8', trim:'#e4f4ff'},
    rider:    {speed:130, size: 44, body:'#eeb52f', trim:'#2f2b21'},
    robot:    {speed:112, size: 34, body:'#b9c7cf', trim:'#222b30'},
    drone:    {speed:145, size: 36, body:'#7f8cff', trim:'#e4e7ff'},
    fleet:    {speed:158, size: 48, body:'#ff6262', trim:'#242526'}
  };

  function parseLevel(name) {
    const nodes = document.querySelectorAll('#upgrades .upgrade');
    for (const node of nodes) {
      const txt = node.textContent || '';
      if (!txt.includes(name)) continue;
      const m = txt.match(/Lv\.(\d+)/);
      return m ? Number(m[1]) : 0;
    }
    return 0;
  }

  function plan() {
    const u = {
      push: parseLevel('Push Mower'),
      electric: parseLevel('Electric Mower'),
      rider: parseLevel('Riding Mower'),
      robot: parseLevel('Robot Mower'),
      drone: parseLevel('Drone Mower'),
      fleet: parseLevel('Mower Fleet')
    };
    const out = [];
    const add = (type, count) => {
      for (let i = 0; i < count; i++) out.push(type);
    };
    if (u.push) add('push', Math.min(2, 1 + Math.floor((u.push - 1) / 4)));
    if (u.electric) add('electric', Math.min(2, 1 + Math.floor((u.electric - 1) / 4)));
    if (u.rider) add('rider', Math.min(2, 1 + Math.floor((u.rider - 1) / 3)));
    if (u.robot) add('robot', Math.min(4, 1 + Math.floor((u.robot - 1) / 2)));
    if (u.drone) add('drone', Math.min(3, 1 + Math.floor((u.drone - 1) / 2)));
    if (u.fleet) add('fleet', Math.min(3, 1 + Math.floor((u.fleet - 1) / 2)));
    return out.slice(0, 14);
  }

  function syncMachines() {
    const p = plan();
    const sig = p.join(',');
    if (sig === lastPlan) return;
    lastPlan = sig;
    machines = p.map((type, i) => {
      const look = looks[type];
      const row = i % 8;
      const dir = i % 2 ? -1 : 1;
      return {
        type,
        look,
        x: dir > 0 ? -55 : fx.width + 55,
        y: 55 + row * 62,
        row,
        dir,
        speed: look.speed * (.92 + Math.random() * .16),
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() > .5 ? 1 : -1) * look.speed,
        vy: (Math.random() > .5 ? 1 : -1) * look.speed * .55,
        trailClock: 0,
        cashClock: Math.random()
      };
    });
    badge.textContent = 'Machines on field: ' + machines.length;
    if (machines.length) popMoney(110, 80, 'AUTO MOWERS ONLINE', 1.05);
  }

  function stageRows() {
    const name = ((document.getElementById('stageName') || {}).textContent || '').trim();
    if (name === 'Backyard') return 4;
    if (name === 'Suburban Lawn') return 6;
    if (name === 'Golf Course') return 7;
    if (name === 'Stadium') return 8;
    if (name === 'City Park') return 9;
    if (name === 'Moon Lawn') return 10;
    return 6;
  }

  function popGrass(x, y, power) {
    const n = Math.min(12, Math.max(2, Math.round(5 * power)));
    for (let i = 0; i < n; i++) {
      grassBits.push({
        x, y,
        vx: (Math.random() - .5) * 100 * power,
        vy: -30 - Math.random() * 70 * power,
        g: 120 + Math.random() * 50,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - .5) * 8,
        life: 500 + Math.random() * 420,
        born: performance.now()
      });
    }
    if (grassBits.length > 160) grassBits.splice(0, grassBits.length - 160);
  }

  function popMoney(x, y, text, scale) {
    moneyBits.push({
      x, y, text,
      vx: (Math.random() - .5) * 24,
      vy: -48 - Math.random() * 25,
      scale: scale || 1,
      life: 900,
      born: performance.now()
    });
    if (moneyBits.length > 70) moneyBits.shift();
  }

  function addTrail(x, y, w, h, dir) {
    trails.push({x, y, w, h, dir, born: performance.now(), life: 4200});
    if (trails.length > 90) trails.shift();
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawMachine(m, t) {
    const s = m.look.size;
    c.save();
    c.translate(m.x, m.y);

    if (m.type === 'drone') {
      const bob = Math.sin(t / 150 + m.phase) * 4;
      c.translate(0, bob);
      c.fillStyle = 'rgba(0,0,0,.18)';
      c.beginPath();
      c.ellipse(0, s * .70, s * .65, s * .20, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = m.look.trim;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-s * .62, -s * .42);
      c.lineTo(s * .62, s * .42);
      c.moveTo(s * .62, -s * .42);
      c.lineTo(-s * .62, s * .42);
      c.stroke();
      c.fillStyle = m.look.body;
      c.beginPath();
      c.arc(0, 0, s * .34, 0, Math.PI * 2);
      c.fill();
      const spin = t / 42;
      [[-.62,-.42],[.62,-.42],[-.62,.42],[.62,.42]].forEach(p => {
        c.save();
        c.translate(s * p[0], s * p[1]);
        c.rotate(spin);
        c.strokeStyle = 'rgba(239,242,255,.82)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-s * .32, 0);
        c.lineTo(s * .32, 0);
        c.moveTo(0, -s * .32);
        c.lineTo(0, s * .32);
        c.stroke();
        c.restore();
      });
      c.restore();
      return;
    }

    c.scale(m.dir, 1);
    c.fillStyle = 'rgba(0,0,0,.20)';
    c.beginPath();
    c.ellipse(0, s * .48, s * .68, s * .20, 0, 0, Math.PI * 2);
    c.fill();

    if (m.type === 'robot') {
      c.fillStyle = m.look.trim;
      c.beginPath(); c.arc(0, 0, s * .62, 0, Math.PI * 2); c.fill();
      c.fillStyle = m.look.body;
      c.beginPath(); c.arc(0, -2, s * .48, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#77ff83';
      c.beginPath(); c.arc(s * .20, -s * .15, 3, 0, Math.PI * 2); c.fill();
    } else if (m.type === 'rider' || m.type === 'fleet') {
      c.fillStyle = '#202321';
      c.fillRect(-s * .66, s * .20, s * .30, s * .25);
      c.fillRect(s * .36, s * .20, s * .30, s * .25);
      c.fillStyle = m.look.body;
      roundedRect(c, -s * .68, -s * .24, s * 1.36, s * .56, s * .14); c.fill();
      c.fillStyle = m.look.trim;
      roundedRect(c, -s * .10, -s * .56, s * .50, s * .38, s * .10); c.fill();
      c.strokeStyle = '#e7ece8';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(s * .13, -s * .50); c.lineTo(s * .43, -s * .83); c.stroke();
    } else {
      c.fillStyle = '#20231f';
      c.beginPath();
      c.arc(-s * .54, s * .27, s * .17, 0, Math.PI * 2);
      c.arc(s * .54, s * .27, s * .17, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = m.look.body;
      roundedRect(c, -s * .66, -s * .14, s * 1.32, s * .52, s * .13); c.fill();
      c.fillStyle = m.look.trim;
      c.fillRect(-s * .44, -s * .06, s * .84, s * .10);
      c.strokeStyle = '#e7ece8';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(-s * .40, -s * .05); c.lineTo(-s * .67, -s * .82); c.lineTo(-s * .88, -s * .84); c.stroke();
    }
    c.restore();
  }

  function update(dt) {
    syncMachines();

    const stage = ((document.getElementById('stageName') || {}).textContent || '').trim();
    if (stage !== lastStage) {
      lastStage = stage;
      flash = 1;
      popMoney(fx.width / 2, 100, stage.toUpperCase() + ' UNLOCKED', 1.15);
    }

    const rows = stageRows();
    const rowH = fx.height / rows;

    for (const m of machines) {
      if (m.type === 'drone') {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.x < 25 || m.x > fx.width - 25) m.vx *= -1;
        if (m.y < 28 || m.y > fx.height - 28) m.vy *= -1;
        m.x = Math.max(25, Math.min(fx.width - 25, m.x));
        m.y = Math.max(28, Math.min(fx.height - 28, m.y));
        m.trailClock -= dt;
        if (m.trailClock <= 0) {
          m.trailClock = .24;
          popGrass(m.x, m.y + 12, .55);
          addTrail(m.x - 34, m.y - 20, 68, 40, 0);
        }
      } else {
        m.row %= rows;
        const targetY = (m.row + .5) * rowH;
        m.y += (targetY - m.y) * Math.min(1, dt * 8);
        m.x += m.dir * m.speed * dt;
        if (m.x > fx.width + 60) {
          m.x = fx.width + 60; m.dir = -1; m.row = (m.row + 1) % rows;
        }
        if (m.x < -60) {
          m.x = -60; m.dir = 1; m.row = (m.row + 1) % rows;
        }
        m.trailClock -= dt;
        if (m.trailClock <= 0 && m.x > 0 && m.x < fx.width) {
          m.trailClock = m.type === 'fleet' ? .08 : m.type === 'rider' ? .11 : .16;
          const width = m.type === 'fleet' ? 76 : m.type === 'rider' ? 58 : 40;
          addTrail(m.x - width / 2, m.y - rowH * .34, width, rowH * .68, m.dir);
          popGrass(m.x, m.y + 10, m.type === 'fleet' ? .9 : m.type === 'rider' ? .7 : .38);
        }
      }

      m.cashClock -= dt;
      if (m.cashClock <= 0 && m.x > 20 && m.x < fx.width - 20) {
        m.cashClock = 1.4 + Math.random() * 1.8;
        popMoney(m.x, m.y - 18, '$', .88);
      }
    }

    if (flash > 0) flash = Math.max(0, flash - dt * 2.5);
  }

  function draw(t) {
    c.clearRect(0, 0, fx.width, fx.height);

    const now = performance.now();

    trails = trails.filter(p => now - p.born < p.life);
    trails.forEach(p => {
      const a = 1 - (now - p.born) / p.life;
      c.save();
      c.globalAlpha = .14 * a;
      c.fillStyle = '#d8f0b5';
      c.fillRect(p.x, p.y, p.w, p.h);
      c.strokeStyle = 'rgba(255,255,255,.28)';
      c.lineWidth = 1;
      if (p.dir === 0) {
        for (let x = p.x + 12; x < p.x + p.w; x += 15) {
          c.beginPath(); c.moveTo(x, p.y + 3); c.lineTo(x, p.y + p.h - 3); c.stroke();
        }
      } else {
        for (let y = p.y + 10; y < p.y + p.h; y += 13) {
          c.beginPath(); c.moveTo(p.x + 3, y); c.lineTo(p.x + p.w - 3, y); c.stroke();
        }
      }
      c.restore();
    });

    machines.forEach(m => drawMachine(m, t));

    grassBits = grassBits.filter(p => now - p.born < p.life);
    grassBits.forEach(p => {
      const age = (now - p.born) / 1000;
      const x = p.x + p.vx * age;
      const y = p.y + p.vy * age + .5 * p.g * age * age;
      c.save();
      c.globalAlpha = Math.max(0, 1 - (now - p.born) / p.life);
      c.translate(x, y);
      c.rotate(p.rot + p.vr * age);
      c.fillStyle = '#b8e477';
      c.fillRect(-3, -1, 7, 2);
      c.restore();
    });

    moneyBits = moneyBits.filter(p => now - p.born < p.life);
    moneyBits.forEach(p => {
      const age = (now - p.born) / 1000;
      c.save();
      c.globalAlpha = Math.max(0, 1 - (now - p.born) / p.life);
      c.fillStyle = '#fff';
      c.font = '900 ' + Math.round(18 * p.scale) + 'px system-ui,sans-serif';
      c.textAlign = 'center';
      c.shadowColor = 'rgba(0,0,0,.55)';
      c.shadowBlur = 5;
      c.fillText(p.text, p.x + p.vx * age, p.y + p.vy * age);
      c.restore();
    });

    if (flash > 0) {
      c.save();
      c.globalAlpha = flash * .38;
      c.fillStyle = '#fff';
      c.fillRect(0, 0, fx.width, fx.height);
      c.restore();
    }
  }

  game.addEventListener('pointerdown', e => {
    const r = game.getBoundingClientRect();
    const x = (e.clientX - r.left) * fx.width / r.width;
    const y = (e.clientY - r.top) * fx.height / r.height;
    popGrass(x, y, .75);
    popMoney(x, y - 6, '+$', .92);
  });

  function loop(t) {
    const dt = Math.min(.05, Math.max(0, (t - lastTime) / 1000));
    lastTime = t;
    update(dt);
    draw(t);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();