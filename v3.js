(() => {
'use strict';
const api = window.NobodyMowsAPI;
if (!api) return;
const $ = s => document.querySelector(s);
const wrap = $('#canvasWrap');
const canvas = api.canvas;
if (!wrap || !canvas) return;

const style = document.createElement('style');
style.textContent =
'.weather-pill{position:absolute;right:12px;top:12px;z-index:5;background:rgba(7,12,8,.74);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 11px;color:#eef8ef;font:800 12px system-ui,sans-serif;backdrop-filter:blur(7px);pointer-events:none}' +
'.boss-layer{position:absolute;inset:0;z-index:7;pointer-events:none;display:none;align-items:center;justify-content:center}.boss-layer.show{display:flex}' +
'.boss-card{pointer-events:auto;width:min(330px,82%);padding:14px;border-radius:22px;background:rgba(16,24,17,.90);border:1px solid rgba(255,255,255,.17);box-shadow:0 20px 55px rgba(0,0,0,.42);text-align:center;backdrop-filter:blur(8px)}' +
'.boss-title{font:900 18px/1.15 system-ui,sans-serif;margin-bottom:5px}.boss-sub{font:700 11px system-ui,sans-serif;color:#b9c9bc;margin-bottom:10px}' +
'.boss-hp{height:10px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden;margin:8px 0 11px}.boss-hp i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ff6b6b,#ffd166);border-radius:inherit;transition:width .15s}' +
'.boss-plant{position:relative;width:116px;height:112px;margin:2px auto 8px;border:0;background:transparent;cursor:pointer;touch-action:manipulation}.boss-plant:active{transform:scale(.94)}' +
'.boss-stem{position:absolute;left:54px;top:37px;width:9px;height:65px;border-radius:9px;background:#8bd35f;box-shadow:inset -2px 0 rgba(0,0,0,.18)}' +
'.boss-leaf{position:absolute;width:54px;height:34px;border-radius:70% 20% 70% 20%;background:linear-gradient(135deg,#b5f26f,#4c9d42);box-shadow:inset -5px -5px rgba(0,0,0,.10),0 4px 12px rgba(0,0,0,.18)}' +
'.boss-leaf.l1{left:8px;top:34px;transform:rotate(18deg)}.boss-leaf.l2{right:7px;top:40px;transform:scaleX(-1) rotate(12deg)}.boss-leaf.l3{left:30px;top:4px;transform:rotate(42deg)}' +
'.boss-face{position:absolute;left:40px;top:38px;width:38px;height:33px;border-radius:50%;background:#65bd4f;border:3px solid #2c6d35}.boss-face:before,.boss-face:after{content:"";position:absolute;top:8px;width:5px;height:7px;border-radius:50%;background:#15241a}.boss-face:before{left:8px}.boss-face:after{right:8px}.boss-mouth{position:absolute;left:50px;top:62px;width:18px;height:6px;border-bottom:3px solid #17311d;border-radius:50%}' +
'.boss-hit{animation:bossHit .16s linear}@keyframes bossHit{0%{transform:translateX(0)}25%{transform:translateX(-9px) rotate(-2deg)}75%{transform:translateX(9px) rotate(2deg)}100%{transform:translateX(0)}}' +
'.boss-dmg{position:absolute;z-index:9;color:white;font:900 18px system-ui,sans-serif;text-shadow:0 2px 5px #000;pointer-events:none;animation:dmgFly .7s forwards}@keyframes dmgFly{to{transform:translateY(-48px) scale(1.18);opacity:0}}' +
'.collection-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.collection-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.collect-card{min-width:0;border:1px solid var(--line);border-radius:12px;padding:8px;background:rgba(255,255,255,.035)}.collect-card.locked{opacity:.36;filter:saturate(.2)}.collect-card b{font-size:12px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.collect-card small{font-size:10px;color:var(--muted)}' +
'.rarity-Common{color:#c7d2c9}.rarity-Uncommon{color:#8ee68f}.rarity-Rare{color:#79bdff}.rarity-Epic{color:#cf8bff}.rarity-WTF{color:#ffd166}' +
'.set-head{margin:16px 0 7px;font:900 13px system-ui}.set-grid{display:grid;gap:7px}.set-card{border:1px solid rgba(255,255,255,.10);border-radius:12px;padding:9px;background:rgba(255,255,255,.025)}.set-card.complete{border-color:rgba(155,225,93,.55);background:rgba(155,225,93,.08)}.set-card b{font-size:12px}.set-card small{display:block;color:#a9b9ad;font-size:10px;margin-top:3px}.set-card.complete small{color:#c9f3b5}' +
'.weatherfx{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}@media(max-width:520px){.boss-card{width:min(300px,88%)}.collection-grid{grid-template-columns:1fr}.weather-pill{font-size:10px}}';
document.head.appendChild(style);

const weatherCanvas = document.createElement('canvas');
weatherCanvas.className = 'weatherfx';
weatherCanvas.width = 960;
weatherCanvas.height = 600;
wrap.appendChild(weatherCanvas);
const wx = weatherCanvas.getContext('2d');

const weatherBadge = document.createElement('div');
weatherBadge.className = 'weather-pill';
weatherBadge.textContent = 'CLEAR Clear';
wrap.appendChild(weatherBadge);

const weatherDefs = [
  {type:'Rain', icon:'RAIN', duration:38000, valueMult:1, regrowMult:.28, autoMult:1.18, goldenMult:1, note:'Fast regrowth +18% idle output'},
  {type:'Heatwave', icon:'HEAT', duration:36000, valueMult:1.20, regrowMult:1.55, autoMult:1, goldenMult:1, note:'+20% cut value, slower regrowth'},
  {type:'Tailwind', icon:'WIND', duration:42000, valueMult:1, regrowMult:1, autoMult:1.35, goldenMult:1, note:'+35% automatic mowing'},
  {type:'Golden Hour', icon:'GOLD', duration:33000, valueMult:1.05, regrowMult:1, autoMult:1, goldenMult:3, note:'3x golden grass chance'}
];
const spaceWeatherDefs = [
  {type:'Solar Wind', icon:'SOLAR', duration:40000, valueMult:1, regrowMult:1, autoMult:1.45, goldenMult:1, note:'+45% automatic mowing'},
  {type:'Meteor Shower', icon:'METEOR', duration:34000, valueMult:1.25, regrowMult:1.15, autoMult:1, goldenMult:2, note:'+25% cut value + rare grass'},
  {type:'Cosmic Bloom', icon:'BLOOM', duration:38000, valueMult:1.05, regrowMult:.35, autoMult:1.15, goldenMult:2, note:'Fast regrowth +15% idle output'},
  {type:'Eclipse', icon:'ECLIPSE', duration:32000, valueMult:1.15, regrowMult:1, autoMult:1, goldenMult:4, note:'+15% value + 4x golden grass'}
];
const clearWeather = () => ({type:'Clear',icon:'CLEAR',until:0,valueMult:1,regrowMult:1,autoMult:1,goldenMult:1,note:'Normal mowing conditions'});

const bossLayer = document.createElement('div');
bossLayer.className = 'boss-layer';
bossLayer.innerHTML =
  '<div class="boss-card" id="bossCard">' +
  '<div class="boss-title" id="bossTitle">Mutant Weed</div>' +
  '<div class="boss-sub" id="bossSub">Tap it. Repeatedly.</div>' +
  '<button class="boss-plant" id="bossPlant" aria-label="Attack boss weed">' +
  '<span class="boss-stem"></span><span class="boss-leaf l1"></span><span class="boss-leaf l2"></span><span class="boss-leaf l3"></span><span class="boss-face"></span><span class="boss-mouth"></span>' +
  '</button><div class="boss-hp"><i id="bossHp"></i></div><div class="boss-sub" id="bossHpText"></div></div>';
wrap.appendChild(bossLayer);
const bossPlant = $('#bossPlant');
const bossCard = $('#bossCard');

const bossNames = ['The Dandelion King','Crabgrass Horror','The HOA Nightmare','Rootzilla','The Unmowable One','Lawnathan','Grass Prime','The Final Clump'];

function ensureState(){
  const S = api.state;
  if (!S.weather || typeof S.weather !== 'object') S.weather = clearWeather();
  if (!Number.isFinite(S.nextWeatherAt)) S.nextWeatherAt = Date.now() + 35000;
  if (!Number.isFinite(S.bossKills)) S.bossKills = 0;
  if (!Number.isFinite(S.nextBossTiles)) S.nextBossTiles = Math.max(500, (S.tiles||0) + 500);
  if (!Number.isFinite(S.nextBossAt)) S.nextBossAt = Date.now() + 90000;
  if (S.boss && (!Number.isFinite(S.boss.hp) || S.boss.hp <= 0)) S.boss = null;

  // Normalize bosses created by older balance versions without deleting the fight.
  if (S.boss && Number.isFinite(S.boss.maxHp)) {
    const target=Math.round(1200*(1+(S.stage||0)*.35)*(1+Math.min(S.bossKills||0,60)*.035));
    if (S.boss.maxHp>target*8) {
      const ratio=Math.max(.01,Math.min(1,S.boss.hp/S.boss.maxHp));
      S.boss.maxHp=target;
      S.boss.hp=Math.max(1,target*ratio);
      const passive=(api.dps?api.dps():api.autoTilesPerSec()*api.cutValue());
      S.boss.reward=Math.max(3000,passive*(28+(S.stage||0)*4));
    }
  }
}
ensureState();

function setWeather(def){
  const S = api.state;
  const now = Date.now();
  S.weather = Object.assign({}, def, {until: now + def.duration});
  S.nextWeatherAt = S.weather.until + 35000 + Math.floor(Math.random()*25000);
  api.toast(def.type+'! '+def.note);
  api.log('Weather changed: '+def.type+'. '+def.note+'.');
  api.save();
}
function weatherTick(){
  const S = api.state, now=Date.now();
  if (S.weather && S.weather.type !== 'Clear' && now >= (S.weather.until||0)) {
    S.weather = clearWeather();
    api.toast('The weather cleared.');
  }
  if ((!S.weather || S.weather.type==='Clear') && now >= (S.nextWeatherAt||0)) {
    const pool=(S.stage||0)>=5?spaceWeatherDefs:weatherDefs;
    setWeather(pool[Math.floor(Math.random()*pool.length)]);
  }
  const left=S.weather && S.weather.until>now?' · '+Math.ceil((S.weather.until-now)/1000)+'s':'';
  weatherBadge.textContent=((S.weather&&S.weather.icon)||'CLEAR')+' '+((S.weather&&S.weather.type)||'Clear')+left;
}

function startBoss(){
  const S=api.state;
  const k=S.bossKills||0, stage=S.stage||0;
  const maxHp=Math.round(1200*(1+stage*.35)*(1+Math.min(k,60)*.035));
  const passive=(api.dps?api.dps():api.autoTilesPerSec()*api.cutValue());
  const rewardSeconds=28+stage*4+Math.min(20,k*.35);
  const collection=api.collectionBonuses?api.collectionBonuses():{boss:1};
  const reward=Math.max(3000,Math.round(Math.max(passive,api.cutValue()*8)*rewardSeconds*(collection.boss||1)));
  S.boss={name:bossNames[k%bossNames.length],hp:maxHp,maxHp:maxHp,reward:reward,startedAt:Date.now()};
  api.toast('BOSS WEED! '+S.boss.name);
  api.log(S.boss.name+' grew where absolutely nobody wanted it.');
  renderBoss();
  api.save();
}
function bossManualDamage(){
  const S=api.state;if(!S.boss)return;
  const b=S.boss;
  const blade=S.upgrades&&S.upgrades.grassValue||0;

  // Keep bosses interactive even in late game.
  // Reputation used to be added directly to damage, which made one click
  // delete the boss once Reputation became huge.
  const hitPct=.022 + Math.min(.012,blade*.00035);
  const crit=Math.random()<.08;
  const dmg=Math.max(1,Math.ceil(b.maxHp*hitPct*(crit?2.5:1)));
  damageBoss(dmg,true,crit);
}
function damageBoss(amount,manual,crit=false){
  const S=api.state;if(!S.boss)return;
  S.boss.hp=Math.max(0,S.boss.hp-amount);
  if(manual){
    bossCard.classList.remove('boss-hit'); void bossCard.offsetWidth; bossCard.classList.add('boss-hit');
    const n=document.createElement('div');n.className='boss-dmg';
    n.textContent=(crit?'CRIT ':'')+'-'+Math.round(amount);
    if(crit){
      n.style.fontSize='22px';
      n.style.color='#ffd166';
    }
    n.style.left=(45+Math.random()*10)+'%';n.style.top=(43+Math.random()*8)+'%';wrap.appendChild(n);setTimeout(()=>n.remove(),720);
  }
  if(S.boss.hp<=0) killBoss(); else renderBoss();
}
function bossDrop(){
  const defs=api.itemDefs||[];
  const pool=defs.filter(x=>x.rarity==='Rare'||x.rarity==='Epic'||x.rarity==='WTF');
  if(!pool.length)return null;
  const pick=pool[Math.floor(Math.random()*pool.length)];
  const S=api.state; S.items=(S.items||0)+1;S.found[pick.name]=(S.found[pick.name]||0)+1;
  return pick;
}
function killBoss(){
  const S=api.state,b=S.boss;if(!b)return;
  S.cash+=b.reward;S.lifetime+=b.reward;S.bossKills=(S.bossKills||0)+1;
  const drop=bossDrop();
  const stage=S.stage||0;
  const gap=1400+stage*550+Math.min(S.bossKills,30)*120;
  S.nextBossTiles=(S.tiles||0)+gap;
  S.nextBossAt=Date.now()+120000+Math.floor(Math.random()*90000);
  api.toast('BOSS DOWN! +'+api.money(b.reward)+(drop?' · '+drop.name:''));
  api.log(b.name+' was defeated for '+api.money(b.reward)+(drop?' and dropped '+drop.name:'')+'.');
  S.boss=null;
  bossLayer.classList.remove('show');
  api.renderAll();renderCollection();api.save();
}
function renderBoss(){
  const b=api.state.boss;
  if(!b){bossLayer.classList.remove('show');return}
  bossLayer.classList.add('show');
  $('#bossTitle').textContent=b.name;
  const auto=api.autoTilesPerSec();
  const autoPct=auto>0?Math.min(.022,.009 + Math.log10(1+auto)*.0022):0;
  const eta=autoPct>0?Math.max(1,Math.ceil((b.hp/b.maxHp)/autoPct)):null;
  $('#bossSub').textContent=eta?'Tap for faster kills · auto ETA ~'+eta+'s':'Tap the weed to damage it';
  $('#bossHp').style.width=Math.max(0,b.hp/b.maxHp*100)+'%';
  $('#bossHpText').textContent=api.fmt(Math.ceil(b.hp))+' / '+api.fmt(b.maxHp)+' HP · Reward '+api.money(b.reward);
}
bossPlant.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();bossManualDamage()});

function bossTick(){
  const S=api.state;
  if(!S.boss && Date.now()>=(S.nextBossAt||0) && (S.tiles||0)>=(S.nextBossTiles||500)) startBoss();
  if(S.boss){
    const auto=api.autoTilesPerSec();
    if(auto>0){
      // Idle-friendly boss balance:
      // low automation takes roughly 80–100s, strong late-game setups around 45–60s.
      const autoPct=Math.min(.022,.009 + Math.log10(1+auto)*.0022);
      const autoDmg=Math.max(1,S.boss.maxHp*autoPct);
      damageBoss(autoDmg,false);
    }
    renderBoss();
  }
}

function installCollectionTab(){
  const tabs=$('.tabs');
  if(!tabs || $('#collection')) return;
  const b=document.createElement('button');b.className='tab';b.dataset.tab='collection';b.textContent='Collection';tabs.appendChild(b);
  const p=document.createElement('div');p.className='section tabpanel';p.id='collection';tabs.parentElement.appendChild(p);
  b.onclick=()=>{
    document.querySelectorAll('.tab,.tabpanel').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');p.classList.add('active');renderCollection();
  };
}
function renderCollection(){
  const box=$('#collection');if(!box)return;
  const defs=api.itemDefs||[],found=api.state.found||{};
  const unlocked=defs.filter(x=>(found[x.name]||0)>0).length;
  let cards='';
  defs.forEach(x=>{
    const n=found[x.name]||0,locked=!n;
    cards+='<div class="collect-card '+(locked?'locked':'')+'"><b>'+(locked?'???':x.name)+'</b><small class="rarity-'+x.rarity+'">'+x.rarity+(n?' · ×'+n:'')+'</small></div>';
  });

  const bonus=api.collectionBonuses?api.collectionBonuses():{sets:[],mastery:false};
  let sets='';
  (bonus.sets||[]).forEach(set=>{
    sets+='<div class="set-card '+(set.complete?'complete':'')+'"><b>'+(set.complete?'ACTIVE · ':'')+set.name+'</b><small>'+set.owned+'/'+set.items.length+' items · '+set.effect+'</small></div>';
  });
  sets+='<div class="set-card '+(bonus.mastery?'complete':'')+'"><b>'+(bonus.mastery?'ACTIVE · ':'')+'Collector Mastery</b><small>'+unlocked+'/12 unique items · All income +15%</small></div>';

  box.innerHTML='<div class="collection-head"><h2 style="margin:0">Lawn collection</h2><b>'+unlocked+'/'+defs.length+'</b></div><div class="sub" style="margin-bottom:10px">Complete sets for permanent bonuses.</div><div class="collection-grid">'+cards+'</div><div class="set-head">Collection set bonuses</div><div class="set-grid">'+sets+'</div>';
}
installCollectionTab();
renderCollection();

let drops=Array.from({length:90},()=>({x:Math.random()*960,y:Math.random()*600,s:8+Math.random()*14,v:260+Math.random()*280}));
let motes=Array.from({length:34},()=>({x:Math.random()*960,y:Math.random()*600,r:1+Math.random()*2,p:Math.random()*6.28}));
let last=performance.now();
function drawWeather(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  wx.clearRect(0,0,960,600);
  const type=api.state.weather&&api.state.weather.type||'Clear';
  if(type==='Rain'||type==='Cosmic Bloom'){
    wx.strokeStyle='rgba(200,225,255,.42)';wx.lineWidth=2;
    drops.forEach(d=>{d.y+=d.v*dt;d.x-=80*dt;if(d.y>620){d.y=-20;d.x=Math.random()*1000}if(d.x<-30)d.x=990;wx.beginPath();wx.moveTo(d.x,d.y);wx.lineTo(d.x-8,d.y+d.s);wx.stroke()});
    wx.fillStyle='rgba(55,95,140,.09)';wx.fillRect(0,0,960,600);
  } else if(type==='Heatwave'||type==='Meteor Shower'){
    const g=wx.createRadialGradient(820,70,10,820,70,260);g.addColorStop(0,'rgba(255,220,110,.25)');g.addColorStop(1,'rgba(255,130,40,0)');wx.fillStyle=g;wx.fillRect(0,0,960,600);
  } else if(type==='Tailwind'||type==='Solar Wind'){
    wx.strokeStyle='rgba(235,255,238,.28)';wx.lineWidth=2;
    motes.forEach(m=>{m.x+=180*dt;if(m.x>980)m.x=-20;const y=m.y+Math.sin(t/300+m.p)*8;wx.beginPath();wx.moveTo(m.x,y);wx.lineTo(m.x-24,y+4);wx.stroke()});
  } else if(type==='Golden Hour'||type==='Eclipse'){
    wx.fillStyle='rgba(255,190,55,.07)';wx.fillRect(0,0,960,600);
    motes.forEach(m=>{m.y-=13*dt;if(m.y<-10)m.y=610;wx.globalAlpha=.35+.25*Math.sin(t/500+m.p);wx.fillStyle='#ffe680';wx.beginPath();wx.arc(m.x,m.y,m.r+1,0,Math.PI*2);wx.fill();wx.globalAlpha=1});
  }
  requestAnimationFrame(drawWeather);
}
requestAnimationFrame(drawWeather);

setInterval(()=>{ensureState();weatherTick();bossTick();renderCollection()},1000);
weatherTick();renderBoss();

window.NobodyMowsV3={setWeather:setWeather,startBoss:startBoss,renderCollection:renderCollection};
})();