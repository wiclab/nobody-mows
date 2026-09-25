(() => {
'use strict';
const api=window.NobodyMowsAPI;
const wrap=document.getElementById('canvasWrap');
const stageEl=document.getElementById('stageName');
const toastEl=document.getElementById('toast');
if(!api||!wrap||!stageEl)return;

const style=document.createElement('style');
style.textContent=
'.juice-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:4;pointer-events:none}' +
'.field-live{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:5;display:flex;gap:6px;align-items:center;padding:6px 9px;border-radius:999px;background:rgba(6,12,9,.62);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(7px);font:800 10px system-ui,sans-serif;color:#dce8de;pointer-events:none;white-space:nowrap}' +
'.field-live b{color:#a9ef71}.field-live .dot{width:6px;height:6px;border-radius:50%;background:#91ea65;box-shadow:0 0 10px rgba(145,234,101,.8);animation:livePulse 1.15s infinite}' +
'@keyframes livePulse{50%{transform:scale(1.45);opacity:.55}}' +
'.stage-flash{animation:stageFlash .8s ease both}@keyframes stageFlash{0%{filter:brightness(1)}25%{filter:brightness(1.35)}100%{filter:brightness(1)}}' +
'.impact-shake{animation:impactShake .34s ease both}@keyframes impactShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-3px,2px)}40%{transform:translate(4px,-2px)}60%{transform:translate(-2px,-1px)}80%{transform:translate(2px,1px)}}';
document.head.appendChild(style);

const fx=document.createElement('canvas');
fx.className='juice-canvas';
fx.width=960;fx.height=600;
wrap.appendChild(fx);
const c=fx.getContext('2d');

const live=document.createElement('div');
live.className='field-live';
live.innerHTML='<span class="dot"></span><span id="fieldLiveText">LIVE FIELD</span>';
wrap.appendChild(live);
const liveText=live.querySelector('#fieldLiveText');

let stage=stageEl.textContent.trim();
let lastStage=stage;
let last=performance.now();
let burst=[];
let floaters=[];
let stars=Array.from({length:55},(_,i)=>({x:(i*173)%960,y:(i*97)%600,p:i*.73,s:1+(i%3)*.7}));
let motes=Array.from({length:36},(_,i)=>({x:(i*149)%960,y:(i*61)%600,p:i*.49,s:1+(i%4)*.45}));
let nextIncomePulse=performance.now()+2600;
let nextAmbientEvent=performance.now()+4500;

function money(v){
  try{return api.money(v)}catch{return '$0'}
}
function stageIndex(){
  const arr=api.stages||[];
  return Math.max(0,arr.findIndex(x=>x.name===stage));
}
function rand(a,b){return a+Math.random()*(b-a)}
function line(x1,y1,x2,y2,color,w=2,a=1){
  c.save();c.globalAlpha=a;c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.restore();
}
function circle(x,y,r,color,a=1){
  c.save();c.globalAlpha=a;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();
}
function burstAt(x,y,color='#baff72',count=20,power=1){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,sp=rand(40,150)*power;
    burst.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-rand(15,55),life:rand(500,1100),born:performance.now(),r:rand(1.5,4),color});
  }
  if(burst.length>260)burst.splice(0,burst.length-260);
}
function floatText(text,x,y,scale=1,color='#fff'){
  floaters.push({text,x,y,scale,color,born:performance.now(),life:1200,vx:rand(-8,8),vy:rand(-48,-36)});
  if(floaters.length>30)floaters.shift();
}
function impact(kind='normal'){
  wrap.classList.remove('impact-shake');void wrap.offsetWidth;wrap.classList.add('impact-shake');
  if(kind==='big') {
    burstAt(480,300,'#ffe37a',48,1.25);
    burstAt(480,300,'#b174ff',30,1.1);
  } else burstAt(480,300,'#b8ee70',20,.8);
}
function stageCelebration(){
  wrap.classList.remove('stage-flash');void wrap.offsetWidth;wrap.classList.add('stage-flash');
  for(let i=0;i<5;i++)burstAt(rand(150,810),rand(80,480),['#b8ee70','#ffd166','#8fd3ff','#cf8bff'][i%4],26,1.15);
  floatText(stage.toUpperCase()+'!',480,90,1.45,'#fff');
}
function updateLive(){
  const d=api.dps?api.dps():0;
  const label=stageIndex()>=5?'COSMIC OUTPUT':'FIELD OUTPUT';
  liveText.innerHTML=label+' <b>'+money(d)+'/s</b>';
}
function drawGlobalLight(t){
  const idx=stageIndex();
  c.save();
  // moving light sweep gives the field a living sheen
  const x=((t*.055)%1300)-170;
  const g=c.createLinearGradient(x-120,0,x+120,0);
  g.addColorStop(0,'rgba(255,255,255,0)');
  g.addColorStop(.5,idx>=5?'rgba(135,190,255,.08)':'rgba(225,255,188,.075)');
  g.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=g;c.fillRect(0,0,960,600);
  c.restore();
}
function drawBackyard(t){
  // butterflies
  for(let i=0;i<3;i++){
    const x=(t*.032*(i+1)+i*260)%1020-30,y=160+i*90+Math.sin(t/400+i)*18;
    c.strokeStyle='rgba(255,235,150,.72)';c.lineWidth=2;
    c.beginPath();c.arc(x-4,y,5,Math.PI*.2,Math.PI*1.7);c.stroke();
    c.beginPath();c.arc(x+4,y,5,Math.PI*1.3,Math.PI*.8,true);c.stroke();
  }
}
function drawSuburban(t){
  // passing car at the sidewalk edge
  const x=(t*.075)%1160-100,y=505;
  c.fillStyle='rgba(54,93,140,.72)';c.fillRect(x,y,58,17);
  c.fillStyle='rgba(190,220,235,.60)';c.fillRect(x+13,y-9,28,11);
  circle(x+12,y+18,6,'rgba(20,25,30,.8)');circle(x+47,y+18,6,'rgba(20,25,30,.8)');
}
function drawGolf(t){
  // golf cart
  const x=(t*.044)%1120-80,y=470+Math.sin(t/700)*8;
  c.fillStyle='rgba(238,226,182,.78)';c.fillRect(x,y,55,20);
  c.strokeStyle='rgba(245,245,245,.72)';c.lineWidth=3;c.strokeRect(x+8,y-24,35,24);
  circle(x+10,y+22,7,'rgba(28,32,30,.85)');circle(x+45,y+22,7,'rgba(28,32,30,.85)');
  // ball arc
  const p=(t%2600)/2600, bx=190+p*330, by=210-Math.sin(p*Math.PI)*120;
  circle(bx,by,4,'rgba(255,255,255,.88)');
}
function drawStadium(t){
  // crowd twinkles + scoreboard sweep
  for(let i=0;i<40;i++){
    const x=(i*47)%960,y=22+(i%3)*10;
    c.globalAlpha=.18+.42*Math.abs(Math.sin(t/350+i));
    c.fillStyle=i%3===0?'#ffd166':i%3===1?'#8ec5ff':'#ff7f7f';
    c.fillRect(x,y,3,3);
  }
  c.globalAlpha=1;
  const sx=(t*.16)%1120-80;
  c.fillStyle='rgba(255,255,255,.055)';c.fillRect(sx,0,60,600);
}
function drawPark(t){
  // floating leaves and jogger
  motes.slice(0,16).forEach((m,i)=>{
    const x=(m.x+t*.018*(1+i%3))%1000-20,y=(m.y+t*.012*(1+i%2))%620-10;
    c.save();c.translate(x,y);c.rotate(t/900+m.p);c.globalAlpha=.20;c.fillStyle=i%2?'#e4c86b':'#a8d86c';c.fillRect(-4,-2,8,4);c.restore();
  });
  const jx=(t*.032)%1100-70,jy=515;
  circle(jx,jy-18,5,'rgba(48,60,54,.55)');
  line(jx,jy-12,jx,jy+6,'rgba(48,60,54,.55)',3);
  line(jx,jy-3,jx-9,jy+10,'rgba(48,60,54,.55)',3);
  line(jx,jy-3,jx+10,jy+8,'rgba(48,60,54,.55)',3);
}
function drawMoon(t){
  // satellite
  const a=t/2200,x=760+Math.cos(a)*95,y=105+Math.sin(a)*38;
  c.save();c.translate(x,y);c.rotate(a);c.fillStyle='rgba(200,215,225,.80)';c.fillRect(-10,-7,20,14);c.fillStyle='rgba(92,145,210,.72)';c.fillRect(-35,-5,22,10);c.fillRect(13,-5,22,10);c.restore();
  // occasional shooting star
  const p=(t%5200)/5200;
  if(p<.22){const sx=860-p*1450,sy=50+p*900;line(sx,sy,sx+55,sy-28,'rgba(220,240,255,.72)',2,.75);}
}
function drawMars(t){
  // dust devil
  const x=(t*.03)%1050-45,y=410;
  for(let i=0;i<9;i++){
    const yy=y-i*17,rr=10+i*4;
    c.strokeStyle='rgba(255,182,125,'+(0.16+i*.015)+')';c.lineWidth=2;c.beginPath();c.ellipse(x+Math.sin(t/300+i)*6,yy,rr,7,0,0,Math.PI*2);c.stroke();
  }
}
function drawOrbital(t){
  // cargo pod
  const x=(t*.055)%1100-70,y=120+Math.sin(t/600)*22;
  c.fillStyle='rgba(184,218,235,.68)';c.fillRect(x,y,54,20);
  c.fillStyle='rgba(78,159,214,.62)';c.fillRect(x+7,y+4,40,12);
  line(x-40,y+10,x,y+10,'rgba(140,210,255,.38)',3);
}
function drawAlien(t){
  const x=480+Math.sin(t/900)*260,y=105+Math.cos(t/1300)*30;
  c.fillStyle='rgba(197,130,255,.38)';c.beginPath();c.ellipse(x,y,62,16,0,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(115,246,225,.35)';c.beginPath();c.ellipse(x,y-10,30,16,0,0,Math.PI*2);c.fill();
  const beam=.12+.10*Math.abs(Math.sin(t/300));
  c.fillStyle='rgba(118,255,218,'+beam+')';c.beginPath();c.moveTo(x-20,y+8);c.lineTo(x-70,500);c.lineTo(x+70,500);c.lineTo(x+20,y+8);c.closePath();c.fill();
}
function drawDyson(t){
  // solar flare
  c.save();c.strokeStyle='rgba(255,176,78,.22)';c.lineWidth=7;
  for(let i=0;i<3;i++){c.beginPath();c.arc(760,120,95+i*24,t/1000+i,t/1000+i+1.35);c.stroke();}
  c.restore();
}
function drawEnd(t){
  // reality pulses
  const r=68+Math.sin(t/350)*12;
  c.strokeStyle='rgba(185,103,255,.25)';c.lineWidth=3;c.beginPath();c.arc(500,310,r,0,Math.PI*2);c.stroke();
  c.strokeStyle='rgba(105,255,236,.18)';c.beginPath();c.arc(500,310,r+28,0,Math.PI*2);c.stroke();
}
function drawStageAmbient(t){
  switch(stage){
    case 'Backyard':drawBackyard(t);break;
    case 'Suburban Lawn':drawSuburban(t);break;
    case 'Golf Course':drawGolf(t);break;
    case 'Stadium':drawStadium(t);break;
    case 'City Park':drawPark(t);break;
    case 'Moon Lawn':drawMoon(t);break;
    case 'Mars Yard':drawMars(t);break;
    case 'Orbital Garden':drawOrbital(t);break;
    case 'Alien Golf Course':drawAlien(t);break;
    case 'Dyson Lawn':drawDyson(t);break;
    case 'End of the Universe':drawEnd(t);break;
  }
}
function updateParticles(t,dt){
  burst=burst.filter(p=>t-p.born<p.life);
  for(const p of burst){
    const age=(t-p.born)/1000;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=150*dt;
    c.save();c.globalAlpha=Math.max(0,1-(t-p.born)/p.life);c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,p.r,0,Math.PI*2);c.fill();c.restore();
  }
  floaters=floaters.filter(p=>t-p.born<p.life);
  for(const p of floaters){
    const age=(t-p.born)/1000;
    c.save();c.globalAlpha=Math.max(0,1-(t-p.born)/p.life);c.fillStyle=p.color;c.font='900 '+Math.round(18*p.scale)+'px system-ui';c.textAlign='center';c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=6;c.fillText(p.text,p.x+p.vx*age,p.y+p.vy*age);c.restore();
  }
}
function randomAmbientEvent(t){
  if(t<nextAmbientEvent)return;
  nextAmbientEvent=t+rand(6500,11000);
  const idx=stageIndex();
  if(idx>=5){
    burstAt(rand(160,820),rand(100,440),['#8ed7ff','#c887ff','#ffd166'][Math.floor(Math.random()*3)],12,.65);
  }else{
    burstAt(rand(120,840),rand(120,470),['#b8ee70','#ffe37a','#ffd4e2'][Math.floor(Math.random()*3)],9,.45);
  }
}
function loop(t){
  const dt=Math.min(.05,Math.max(0,(t-last)/1000));last=t;
  stage=stageEl.textContent.trim();
  if(stage!==lastStage){lastStage=stage;stageCelebration();}

  c.clearRect(0,0,960,600);
  drawGlobalLight(t);
  drawStageAmbient(t);
  randomAmbientEvent(t);
  updateParticles(t,dt);

  if(t>=nextIncomePulse){
    nextIncomePulse=t+rand(3500,5200);
    const d=api.dps?api.dps():0;
    if(d>0)floatText('+'+money(d)+'/s',480,555,1.0,stageIndex()>=5?'#9fdcff':'#c8f99d');
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
setInterval(updateLive,900);
updateLive();

if(toastEl){
  const obs=new MutationObserver(()=>{
    const txt=toastEl.textContent||'';
    if(!txt)return;
    if(/MOWPOCALYPSE|BOSS DOWN|GOLDEN GRASS|New area unlocked/i.test(txt)){
      impact(/MOWPOCALYPSE|BOSS DOWN|New area unlocked/i.test(txt)?'big':'normal');
    }else if(/OVERDRIVE|GROWTH SURGE/i.test(txt)){
      burstAt(480,520,/OVERDRIVE/i.test(txt)?'#ffd166':'#aaf58a',26,.9);
    }
  });
  obs.observe(toastEl,{childList:true,characterData:true,subtree:true});
}
})();