(() => {
'use strict';
const api=window.NobodyMowsAPI;
const wrap=document.getElementById('canvasWrap');
if(!api||!wrap)return;

const style=document.createElement('style');
style.textContent=
'.rare-layer{position:absolute;inset:0;z-index:8;pointer-events:none;overflow:hidden}' +
'.rare-event{position:absolute;width:132px;min-height:108px;transform:translate(-50%,-50%);pointer-events:auto;border:1px solid rgba(255,255,255,.24);border-radius:24px;background:linear-gradient(180deg,rgba(19,31,23,.96),rgba(9,17,12,.94));box-shadow:0 18px 45px rgba(0,0,0,.38),0 0 28px var(--rareGlow,rgba(155,225,93,.25));color:#fff;text-align:center;padding:11px 9px 9px;cursor:pointer;animation:rareFloat 1.55s ease-in-out infinite alternate,rareIn .22s ease-out both;backdrop-filter:blur(8px)}' +
'.rare-event:hover{filter:brightness(1.13);transform:translate(-50%,-50%) scale(1.04)}' +
'.rare-event .rare-icon{width:48px;height:48px;margin:0 auto 5px;border-radius:50%;display:grid;place-items:center;background:var(--rareColor,#8eea62);color:#0d160f;font:1000 17px system-ui;box-shadow:0 0 22px var(--rareGlow,rgba(155,225,93,.32))}' +
'.rare-event b{display:block;font:900 12px system-ui}.rare-event small{display:block;margin-top:3px;color:#c2d1c5;font:700 9px/1.2 system-ui}.rare-timer{height:4px;margin-top:7px;border-radius:999px;background:rgba(255,255,255,.10);overflow:hidden}.rare-timer i{display:block;height:100%;width:100%;background:var(--rareColor,#8eea62);transform-origin:left center}' +
'@keyframes rareFloat{to{margin-top:-8px}}@keyframes rareIn{from{opacity:0;transform:translate(-50%,-50%) scale(.72)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}' +
'.event-pop{position:absolute;z-index:10;pointer-events:none;color:white;font:1000 20px system-ui;text-shadow:0 3px 8px #000;animation:eventPop .9s ease-out forwards}@keyframes eventPop{to{transform:translateY(-65px) scale(1.18);opacity:0}}';
document.head.appendChild(style);

const layer=document.createElement('div');
layer.className='rare-layer';
wrap.appendChild(layer);

const defs=[
  {id:'gold',name:'Golden Patch',icon:'$$',color:'#ffd166',glow:'rgba(255,209,102,.45)',seconds:45,note:'Click for 45 sec of income'},
  {id:'crate',name:'Mystery Crate',icon:'?',color:'#8ec5ff',glow:'rgba(110,180,255,.45)',seconds:30,note:'Cash + collection drop'},
  {id:'clover',name:'Lucky Clover',icon:'4x',color:'#9be15d',glow:'rgba(155,225,93,.45)',seconds:20,note:'Cash + 12 sec Overdrive'},
  {id:'weed',name:'Elite Weed',icon:'!',color:'#ff7f7f',glow:'rgba(255,100,100,.45)',seconds:60,note:'Click before it escapes'},
  {id:'cosmic',name:'Cosmic Cache',icon:'*',color:'#cf8bff',glow:'rgba(196,120,255,.48)',seconds:90,note:'Space-only jackpot',minStage:5}
];

let current=null;
let nextAt=Date.now()+12000+Math.random()*9000;
let timer=null;

function eligibleDefs(){
  const st=api.state.stage||0;
  return defs.filter(d=>(d.minStage||0)<=st);
}
function eventValue(def){
  const dps=Math.max(0,api.dps?api.dps():0);
  const base=Math.max(dps,api.cutValue()*25);
  return Math.max(api.cutValue()*250,base*def.seconds);
}
function dropItem(preferRare=false){
  const all=api.itemDefs||[];
  let pool=all;
  if(preferRare) pool=all.filter(x=>['Rare','Epic','WTF'].includes(x.rarity));
  if(!pool.length)return null;
  const pick=pool[Math.floor(Math.random()*pool.length)];
  const S=api.state;
  S.items=(S.items||0)+1;
  S.found=S.found||{};
  S.found[pick.name]=(S.found[pick.name]||0)+1;
  return pick;
}
function pop(text,x,y,color){
  const n=document.createElement('div');
  n.className='event-pop';n.textContent=text;n.style.color=color||'#fff';
  n.style.left=x+'%';n.style.top=y+'%';layer.appendChild(n);
  setTimeout(()=>n.remove(),950);
}
function clearEvent(){
  if(timer){clearInterval(timer);timer=null;}
  layer.innerHTML='';
  current=null;
}
function expireEvent(){
  if(!current)return;
  const def=current.def;
  const salvage=eventValue(def)*.15;
  api.state.cash+=salvage;api.state.lifetime+=salvage;
  api.log(def.name+' expired. Auto mowers salvaged '+api.money(salvage)+'.');
  api.renderAll();api.save();
  clearEvent();
  nextAt=Date.now()+50000+Math.random()*35000;
}
function claimEvent(def,x,y){
  if(!current)return;
  const S=api.state;
  let payout=eventValue(def);
  let extra='';

  if(def.id==='crate'){
    const item=dropItem(false);
    if(item)extra=' + '+item.name;
  }else if(def.id==='cosmic'){
    payout*=1.25;
    const item=dropItem(true);
    if(item)extra=' + '+item.name;
  }else if(def.id==='clover'){
    S.ability=S.ability||{};
    S.ability.turboUntil=Math.max(S.ability.turboUntil||0,Date.now()+12000);
    extra=' + Overdrive';
  }else if(def.id==='weed'){
    S.bossKills=(S.bossKills||0)+1;
    extra=' + elite kill';
  }

  S.cash+=payout;S.lifetime+=payout;
  S.rareEvents=(S.rareEvents||0)+1;
  pop('+'+api.money(payout),x,y,def.color);
  api.toast(def.name+'! +'+api.money(payout)+extra);
  api.log('Caught '+def.name+' for '+api.money(payout)+extra+'.');
  api.renderAll();api.save();

  clearEvent();
  nextAt=Date.now()+45000+Math.random()*40000;
}
function spawnEvent(){
  if(current||api.state.boss)return;
  const pool=eligibleDefs();
  const def=pool[Math.floor(Math.random()*pool.length)];
  const x=16+Math.random()*68;
  const y=20+Math.random()*58;
  const life=18000;
  const born=Date.now();

  const el=document.createElement('button');
  el.type='button';el.className='rare-event';
  el.style.left=x+'%';el.style.top=y+'%';
  el.style.setProperty('--rareColor',def.color);
  el.style.setProperty('--rareGlow',def.glow);
  el.innerHTML='<span class="rare-icon">'+def.icon+'</span><b>'+def.name+'</b><small>'+def.note+'</small><span class="rare-timer"><i></i></span>';
  layer.appendChild(el);
  current={def,el,born,life,x,y};

  const bar=el.querySelector('.rare-timer i');
  el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();claimEvent(def,x,y);});
  api.toast('RARE EVENT: '+def.name);

  timer=setInterval(()=>{
    if(!current)return;
    const p=Math.max(0,1-(Date.now()-born)/life);
    bar.style.transform='scaleX('+p+')';
    if(p<=0)expireEvent();
  },120);
}
setInterval(()=>{
  if(!current && Date.now()>=nextAt && !api.state.boss)spawnEvent();
},1000);

window.NobodyMowsFun={
  spawnRareEvent:()=>{nextAt=0;spawnEvent();},
  get activeEvent(){return current&&current.def&&current.def.name}
};
})();