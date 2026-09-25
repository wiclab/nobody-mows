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
    fleet:    {speed:158, size: 48, body:'#ff6262', trim:'#242526'},
    terra:    {speed:170, size: 50, body:'#d96f43', trim:'#9ff0a5'},
    orbital:  {speed:188, size: 39, body:'#68d5ff', trim:'#eafcff'},
    quantum:  {speed:180, size: 40, body:'#b375ff', trim:'#f3e6ff'},
    stellar:  {speed:205, size: 44, body:'#ffb347', trim:'#fff0b0'},
    reality:  {speed:220, size: 48, body:'#ff65c7', trim:'#a9fff1'}
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
      fleet: parseLevel('Mower Fleet'),
      terra: parseLevel('Terraformer Rover'),
      orbital: parseLevel('Orbital Swarm'),
      quantum: parseLevel('Quantum Trimmer'),
      stellar: parseLevel('Stellar Harvester'),
      reality: parseLevel('Reality Mower')
    };
    const out = [];
    const add = (type, count) => {
      for (let i = 0; i < count; i++) out.push(type);
    };
    if (u.push) add('push', Math.min(2, 1 + Math.floor((u.push - 1) / 4)));
    if (u.electric) add('electric', Math.min(2, 1 + Math.floor((u.electric - 1) / 4)));
    if (u.rider) add('rider', Math.min(2, 1 + Math.floor((u.rider - 1) / 3)));
    if (u.robot) add('robot', Math.min(3, 1 + Math.floor((u.robot - 1) / 3)));
    if (u.drone) add('drone', Math.min(2, 1 + Math.floor((u.drone - 1) / 3)));
    if (u.fleet) add('fleet', Math.min(2, 1 + Math.floor((u.fleet - 1) / 3)));
    if (u.terra) add('terra', Math.min(2, 1 + Math.floor((u.terra - 1) / 3)));
    if (u.orbital) add('orbital', Math.min(2, 1 + Math.floor((u.orbital - 1) / 3)));
    if (u.quantum) add('quantum', Math.min(2, 1 + Math.floor((u.quantum - 1) / 3)));
    if (u.stellar) add('stellar', Math.min(2, 1 + Math.floor((u.stellar - 1) / 3)));
    if (u.reality) add('reality', Math.min(2, 1 + Math.floor((u.reality - 1) / 3)));
    return out.slice(-18);
  }

  function syncMachines() {
    const p = plan();
    const sig = p.join(',');
    if (sig === lastPlan) return;
    lastPlan = sig;
    machines = p.map((type, i) => {
      const look = looks[type];
      const row = i % stageRows();
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
    if (name === 'Mars Yard') return 10;
    if (name === 'Orbital Garden') return 10;
    if (name === 'Alien Golf Course') return 11;
    if (name === 'Dyson Lawn') return 11;
    if (name === 'End of the Universe') return 12;
    return 10;
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

    if (['drone','orbital','stellar'].includes(m.type)) {
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

    if (['robot','quantum','reality'].includes(m.type)) {
      c.fillStyle = m.look.trim;
      c.beginPath(); c.arc(0, 0, s * .62, 0, Math.PI * 2); c.fill();
      c.fillStyle = m.look.body;
      c.beginPath(); c.arc(0, -2, s * .48, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#77ff83';
      c.beginPath(); c.arc(s * .20, -s * .15, 3, 0, Math.PI * 2); c.fill();
    } else if (['rider','fleet','terra'].includes(m.type)) {
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
      if (['drone','orbital','stellar'].includes(m.type)) {
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
          m.trailClock = ['stellar','reality'].includes(m.type) ? .06 : ['fleet','terra'].includes(m.type) ? .08 : m.type === 'rider' ? .11 : .16;
          const width = ['stellar','reality'].includes(m.type) ? 88 : ['fleet','terra'].includes(m.type) ? 76 : m.type === 'rider' ? 58 : 40;
          addTrail(m.x - width / 2, m.y - rowH * .34, width, rowH * .68, m.dir);
          popGrass(m.x, m.y + 10, ['stellar','reality'].includes(m.type) ? 1.1 : ['fleet','terra'].includes(m.type) ? .9 : m.type === 'rider' ? .7 : .38);
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

  function overlayTree(x, y, r) {
    c.save();
    c.fillStyle = 'rgba(64,42,24,.75)';
    c.fillRect(x-r*.08, y, r*.16, r*.75);
    c.shadowColor = 'rgba(0,0,0,.25)';
    c.shadowBlur = 12;
    c.fillStyle = '#2f6f39';
    c.beginPath(); c.arc(x, y-r*.12, r*.36, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x-r*.22, y+r*.04, r*.28, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+r*.22, y+r*.04, r*.28, 0, Math.PI*2); c.fill();
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(192,239,126,.16)';
    c.beginPath(); c.arc(x-r*.08, y-r*.22, r*.17, 0, Math.PI*2); c.fill();
    c.restore();
  }

  function roundScene(x,y,w,h,r,fill) {
    const rr=Math.min(r,w/2,h/2);
    c.beginPath(); c.moveTo(x+rr,y); c.arcTo(x+w,y,x+w,y+h,rr); c.arcTo(x+w,y+h,x,y+h,rr); c.arcTo(x,y+h,x,y,rr); c.arcTo(x,y,x+w,y,rr); c.closePath();
    if(fill)c.fill();
  }

  function drawOverlayScenery(t) {
    const name = ((document.getElementById('stageName') || {}).textContent || '').trim();
    const w=fx.width,h=fx.height;
    c.save();

    if (name === 'Backyard') {
      c.fillStyle='rgba(118,82,49,.88)'; c.fillRect(0,0,w,18); c.fillRect(0,h-14,w,14);
      for(let x=12;x<w;x+=70){c.fillStyle='rgba(230,198,145,.72)';c.fillRect(x,2,9,37);}
      c.fillStyle='rgba(188,148,93,.92)'; roundScene(w*.73,h*.70,w*.22,h*.20,18,true);
      c.strokeStyle='rgba(67,133,235,.72)';c.lineWidth=6;c.beginPath();c.arc(w*.15,h*.79,45,0,Math.PI*1.55);c.stroke();
      overlayTree(w*.90,h*.19,58);
    } else if (name === 'Suburban Lawn') {
      c.fillStyle='rgba(194,188,176,.94)';c.fillRect(w*.57,0,88,h);
      c.fillStyle='rgba(111,111,108,.96)';c.fillRect(w*.595,0,42,h);
      c.fillStyle='rgba(218,210,194,.96)';c.fillRect(0,h*.79,w,48);
      c.fillStyle='rgba(95,123,132,.95)';c.fillRect(w*.16,h*.16,9,70);
      c.fillStyle='#d65a57';roundScene(w*.135,h*.15,46,21,5,true);
      for(let i=0;i<4;i++){c.fillStyle='#39733b';c.beginPath();c.arc(62+i*54,62+(i%2)*6,19,0,Math.PI*2);c.fill();}
    } else if (name === 'Golf Course') {
      c.fillStyle='rgba(222,201,139,.96)';c.beginPath();c.ellipse(w*.77,h*.29,96,53,-.18,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(91,172,211,.72)';c.beginPath();c.ellipse(w*.18,h*.80,90,40,.10,0,Math.PI*2);c.fill();
      c.strokeStyle='rgba(255,255,255,.88)';c.lineWidth=4;c.beginPath();c.moveTo(w*.82,h*.12);c.lineTo(w*.82,h*.37);c.stroke();
      c.fillStyle='#ffffff';c.beginPath();c.moveTo(w*.82,h*.12);c.lineTo(w*.89,h*.16);c.lineTo(w*.82,h*.22);c.closePath();c.fill();
      c.fillStyle='#f2d15c';c.beginPath();c.arc(w*.43,h*.18,7,0,Math.PI*2);c.arc(w*.47,h*.18,7,0,Math.PI*2);c.fill();
    } else if (name === 'Stadium') {
      c.fillStyle='rgba(19,31,45,.84)';c.fillRect(0,0,w,62);c.fillRect(0,h-42,w,42);
      for(let i=0;i<32;i++){c.fillStyle=i%3===0?'#f2c95f':i%3===1?'#e95a5a':'#77a9dd';c.fillRect(i*(w/32)+2,10,w/32-5,9);}
      c.strokeStyle='rgba(255,255,255,.76)';c.lineWidth=4;c.strokeRect(25,55,w-50,h-105);
      c.beginPath();c.moveTo(w/2,55);c.lineTo(w/2,h-50);c.stroke();
      c.beginPath();c.arc(w/2,h/2,58,0,Math.PI*2);c.stroke();
    } else if (name === 'City Park') {
      // Strong contrast on purpose: this was the stage that still looked flat.
      c.fillStyle='rgba(211,194,157,.94)';c.fillRect(w*.17,0,72,h);c.fillRect(w*.68,0,64,h);
      c.fillStyle='rgba(103,184,211,.78)';c.beginPath();c.ellipse(w*.83,h*.22,82,50,-.12,0,Math.PI*2);c.fill();
      c.strokeStyle='rgba(218,245,255,.46)';c.lineWidth=3;c.beginPath();c.ellipse(w*.83,h*.22,64,35,-.12,0,Math.PI*2);c.stroke();
      c.fillStyle='#7a593d';c.fillRect(w*.31,h*.67,55,8);c.fillRect(w*.31,h*.75,55,8);c.fillRect(w*.32,h*.67,6,30);c.fillRect(w*.36,h*.67,6,30);
      overlayTree(w*.08,h*.25,62);overlayTree(w*.92,h*.67,66);overlayTree(w*.54,h*.13,48);
      c.fillStyle='rgba(255,239,169,.88)';c.fillRect(w*.61,h*.09,5,52);c.beginPath();c.arc(w*.6125,h*.085,10,0,Math.PI*2);c.fill();
      const dogX=(t*.020)%(w+90)-45,dogY=h*.86;
      c.fillStyle='rgba(44,48,39,.52)';c.fillRect(dogX,dogY,22,9);c.fillRect(dogX+16,dogY-7,11,9);
    } else if (name === 'Moon Lawn') {
      c.fillStyle='rgba(6,10,20,.76)';c.fillRect(0,0,w,h*.25);
      for(let i=0;i<60;i++){const sx=(i*137)%w,sy=(i*71)%(h*.24);c.globalAlpha=.35+(i%4)*.14;c.fillStyle='#fff';c.fillRect(sx,sy,2+(i%2),2+(i%2));}
      c.globalAlpha=.85;c.fillStyle='#6fa8ee';c.beginPath();c.arc(w*.84,h*.11,34,0,Math.PI*2);c.fill();
      c.globalAlpha=.45;c.fillStyle='#79c778';c.beginPath();c.arc(w*.835,h*.105,14,0,Math.PI*2);c.fill();
      c.globalAlpha=.15;c.fillStyle='#d8d9d7';
      for(const [cx,cy,r] of [[.13,.38,38],[.30,.73,25],[.73,.40,45],[.87,.78,30]]){c.beginPath();c.arc(w*cx,h*cy,r,0,Math.PI*2);c.fill();}
      c.globalAlpha=1;
    } else if (name === 'Mars Yard') {
      c.fillStyle='rgba(113,42,28,.64)';c.fillRect(0,0,w,h);
      c.fillStyle='rgba(244,154,93,.38)';for(let i=0;i<28;i++){const rx=(i*173)%w,ry=(i*91)%h;c.beginPath();c.arc(rx,ry,5+(i%5)*3,0,Math.PI*2);c.fill();}
      c.fillStyle='rgba(191,225,236,.72)';c.beginPath();c.arc(w*.20,h*.22,70,Math.PI,0);c.lineTo(w*.27,h*.22);c.lineTo(w*.13,h*.22);c.closePath();c.fill();
      c.strokeStyle='rgba(105,214,255,.66)';c.lineWidth=4;c.stroke();
      c.fillStyle='rgba(42,54,62,.86)';c.fillRect(w*.63,h*.18,120,10);
      for(let i=0;i<4;i++){c.fillStyle=i%2?'#375d85':'#284866';c.fillRect(w*.63+i*30,h*.11,26,62);}
      c.strokeStyle='rgba(255,194,146,.35)';c.lineWidth=2;for(let i=0;i<18;i++){const x=(t*.08+i*73)%w;c.beginPath();c.moveTo(x,20+i*27%h);c.lineTo(x+28,24+i*27%h);c.stroke();}
    } else if (name === 'Orbital Garden') {
      c.fillStyle='rgba(4,9,17,.86)';c.fillRect(0,0,w,h);
      for(let i=0;i<70;i++){const sx=(i*149)%w,sy=(i*83)%h;c.globalAlpha=.35+(i%4)*.12;c.fillStyle='#fff';c.fillRect(sx,sy,2,2);}
      c.globalAlpha=.8;c.fillStyle='#4287d6';c.beginPath();c.arc(w*.82,h*.74,150,0,Math.PI*2);c.fill();
      c.globalAlpha=.35;c.fillStyle='#69c474';c.beginPath();c.arc(w*.78,h*.70,58,0,Math.PI*2);c.fill();
      c.globalAlpha=1;c.fillStyle='rgba(190,210,220,.65)';c.fillRect(0,h*.14,w,12);c.fillRect(w*.12,0,12,h);
      c.strokeStyle='rgba(125,233,255,.55)';c.lineWidth=3;c.strokeRect(w*.32,h*.18,w*.34,h*.18);
      for(let i=0;i<5;i++){c.fillStyle='rgba(105,203,117,.72)';roundScene(w*.34+i*55,h*.21,42,65,8,true);}
    } else if (name === 'Alien Golf Course') {
      const g=c.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(48,25,82,.82)');g.addColorStop(1,'rgba(10,92,83,.72)');c.fillStyle=g;c.fillRect(0,0,w,h);
      c.fillStyle='rgba(101,238,205,.42)';c.beginPath();c.ellipse(w*.18,h*.77,100,42,.1,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(218,107,255,.48)';c.beginPath();c.ellipse(w*.77,h*.27,95,52,-.2,0,Math.PI*2);c.fill();
      c.strokeStyle='#b8ffef';c.lineWidth=4;c.beginPath();c.moveTo(w*.82,h*.13);c.lineTo(w*.82,h*.37);c.stroke();
      c.fillStyle='#d781ff';c.beginPath();c.moveTo(w*.82,h*.13);c.lineTo(w*.90,h*.17);c.lineTo(w*.82,h*.23);c.closePath();c.fill();
      const ux=w*.50+Math.sin(t/900)*90,uy=h*.12;c.fillStyle='rgba(175,230,255,.75)';c.beginPath();c.ellipse(ux,uy,45,14,0,0,Math.PI*2);c.fill();c.fillStyle='rgba(190,112,255,.65)';c.beginPath();c.ellipse(ux,uy-8,22,12,0,0,Math.PI*2);c.fill();
    } else if (name === 'Dyson Lawn') {
      c.fillStyle='rgba(22,14,8,.88)';c.fillRect(0,0,w,h);
      const sun=c.createRadialGradient(w*.80,h*.18,8,w*.80,h*.18,115);sun.addColorStop(0,'rgba(255,248,184,.98)');sun.addColorStop(.35,'rgba(255,170,64,.75)');sun.addColorStop(1,'rgba(255,90,20,0)');c.fillStyle=sun;c.fillRect(0,0,w,h);
      c.strokeStyle='rgba(255,192,88,.62)';c.lineWidth=15;c.beginPath();c.arc(w*.80,h*.18,145,.2,Math.PI*1.75);c.stroke();
      c.strokeStyle='rgba(117,180,205,.58)';c.lineWidth=8;c.beginPath();c.arc(w*.80,h*.18,185,.55,Math.PI*1.45);c.stroke();
      for(let i=0;i<8;i++){c.fillStyle=i%2?'rgba(255,190,78,.26)':'rgba(84,141,170,.30)';c.fillRect(i*w/8,h*.70,w/8-4,h*.22);}
    } else if (name === 'End of the Universe') {
      c.fillStyle='rgba(1,2,5,.94)';c.fillRect(0,0,w,h);
      for(let i=0;i<40;i++){const fade=.08+.30*Math.abs(Math.sin(t/1200+i));c.globalAlpha=fade;c.fillStyle=i%5===0?'#ff8de1':'#b9d8ff';c.fillRect((i*211)%w,(i*97)%h,2+(i%3),2+(i%3));}
      c.globalAlpha=.5;c.strokeStyle='#d56aff';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(w*(.12+i*.18),0);c.lineTo(w*(.18+i*.16),h*.42);c.lineTo(w*(.10+i*.18),h);c.stroke();}
      c.globalAlpha=.30;c.fillStyle='#73fff0';c.beginPath();c.arc(w*.52,h*.50,80+Math.sin(t/420)*8,0,Math.PI*2);c.fill();
      c.globalAlpha=.18;c.fillStyle='#000';c.beginPath();c.arc(w*.52,h*.50,58,0,Math.PI*2);c.fill();
      c.globalAlpha=1;
    }

    // Slight glass badge so you can immediately tell the new scene layer is loaded.
    c.fillStyle='rgba(5,10,7,.58)';roundScene(14,14,170,31,12,true);
    c.fillStyle='rgba(255,255,255,.94)';c.font='800 14px system-ui,sans-serif';c.textAlign='left';c.fillText(name || 'Lawn',28,35);
    c.restore();
  }

  function draw(t) {
    c.clearRect(0, 0, fx.width, fx.height);

    const now = performance.now();
    drawOverlayScenery(t);

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