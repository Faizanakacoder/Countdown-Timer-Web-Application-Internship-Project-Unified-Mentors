// script.js for Countdown Timer App
const $ = id => document.getElementById(id);
const display = $('display');
const status = $('status');
const startBtn = $('startBtn');
const pauseBtn = $('pauseBtn');
const resetBtn = $('resetBtn');
const setBtn = $('setBtn');
const hoursInput = $('hours');
const minsInput = $('minutes');
const secsInput = $('seconds');
const presetButtons = document.querySelectorAll('.preset-buttons .preset');
const savePreset = $('savePreset');
const loadPreset = $('loadPreset');
const lastUsed = $('lastUsed');
const toggleSoundBtn = $('toggleSound');
const resetAllBtn = $('resetAll');

let totalSeconds = 0;
let remaining = 0;
let timerInterval = null;
let soundOn = true;

// WebAudio beep
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(duration=200, frequency=1000, type='sine'){
  if(!soundOn) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = frequency;
  o.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  o.start(audioCtx.currentTime);
  setTimeout(()=>{
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.01);
    o.stop(audioCtx.currentTime + 0.02);
  }, duration);
}

// format seconds -> HH:MM:SS
function fmt(s){
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); const sec = s%60;
  const pad = n => String(n).padStart(2,'0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function updateDisplay(sec){
  const parts = fmt(sec).split(':');
  const spans = display.querySelectorAll('.tick');
  spans.forEach((sp,i)=>{
    sp.textContent = parts[i];
    sp.classList.add('pop');
    setTimeout(()=>sp.classList.remove('pop'),160);
  });
}

function tick(){
  if(remaining <=0){
    clearInterval(timerInterval); timerInterval=null;
    status.textContent = 'Completed';
    beep(400,1200,'sine');
    for(let i=0;i<2;i++) setTimeout(()=>beep(200,1200,'square'), 300*i);
    startBtn.disabled = false; pauseBtn.disabled = true;
    return;
  }
  remaining--;
  updateDisplay(remaining);
  if(remaining<=5) beep(90, 880 + (5-remaining)*80, 'sine');
  localStorage.setItem('countdown_lastRemaining', remaining);
}

function startTimer(){
  if(remaining<=0) {status.textContent='Set a positive time first'; return}
  if(timerInterval) return;
  status.textContent = 'Running';
  timerInterval = setInterval(tick,1000);
  startBtn.disabled = true; pauseBtn.disabled = false;
}

function pauseTimer(){
  if(timerInterval){
    clearInterval(timerInterval); timerInterval=null; status.textContent='Paused'; startBtn.disabled=false; pauseBtn.disabled=true;
  }
}

function resetTimer(toInitial=true){
  if(timerInterval){clearInterval(timerInterval);timerInterval=null}
  if(toInitial){remaining = totalSeconds}
  updateDisplay(remaining);
  status.textContent = 'Idle';
  startBtn.disabled = false; pauseBtn.disabled = true;
}

// set from inputs
setBtn.addEventListener('click', ()=>{
  const h = parseInt(hoursInput.value||0);
  const m = parseInt(minsInput.value||0);
  const s = parseInt(secsInput.value||0);
  if(isNaN(h)||isNaN(m)||isNaN(s)) {status.textContent='Invalid input'; return}
  totalSeconds = h*3600 + m*60 + s;
  remaining = totalSeconds;
  if(totalSeconds<=0){status.textContent='Please enter a time greater than 0'; return}
  updateDisplay(remaining);
  status.textContent = 'Ready';
  localStorage.setItem('countdown_lastSet', JSON.stringify({h,m,s,t:Date.now()}));
  lastUsed.textContent = new Date().toLocaleString();
});

// presets
presetButtons.forEach(btn=> btn.addEventListener('click', ()=>{
  const mins = parseInt(btn.dataset.mins,10)||0;
  totalSeconds = mins*60; remaining = totalSeconds;
  updateDisplay(remaining); status.textContent='Ready';
  localStorage.setItem('countdown_lastSet', JSON.stringify({h:0,m:mins,s:0,t:Date.now()}));
  lastUsed.textContent = new Date().toLocaleString();
}));

// save/load default preset
savePreset.addEventListener('click', ()=>{
  const h = parseInt(hoursInput.value||0);
  const m = parseInt(minsInput.value||0);
  const s = parseInt(secsInput.value||0);
  localStorage.setItem('countdown_default', JSON.stringify({h,m,s}));
  status.textContent='Default saved';
});
loadPreset.addEventListener('click', ()=>{
  const data = JSON.parse(localStorage.getItem('countdown_default')||'null');
  if(!data) {status.textContent='No default saved'; return}
  hoursInput.value = data.h; minsInput.value = data.m; secsInput.value = data.s;
  status.textContent='Default loaded';
});

// toggle sound
toggleSoundBtn.addEventListener('click', ()=>{
  soundOn = !soundOn; toggleSoundBtn.textContent = soundOn? 'Sound: ON':'Sound: OFF';
  localStorage.setItem('countdown_sound', soundOn? '1':'0');
});

// reset all
resetAllBtn.addEventListener('click', ()=>{
  localStorage.removeItem('countdown_default');
  localStorage.removeItem('countdown_lastSet');
  localStorage.removeItem('countdown_lastRemaining');
  localStorage.removeItem('countdown_sound');
  status.textContent='All saved data cleared';
  lastUsed.textContent='—';
})

// actions
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', ()=>resetTimer(true));

// keyboard support: space to start/pause, r to reset
window.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); if(timerInterval) pauseTimer(); else startTimer(); }
  if(e.key==='r' || e.key==='R') resetTimer(true);
})

// init: load last set or default
(function init(){
  const last = JSON.parse(localStorage.getItem('countdown_lastSet')||'null');
  const def = JSON.parse(localStorage.getItem('countdown_default')||'null');
  const sound = localStorage.getItem('countdown_sound');
  if(sound==='0') soundOn=false; toggleSoundBtn.textContent = soundOn? 'Sound: ON':'Sound: OFF';

  if(def){ hoursInput.value = def.h; minsInput.value = def.m; secsInput.value = def.s; }
  if(last){ hoursInput.value = last.h; minsInput.value = last.m; secsInput.value = last.s; lastUsed.textContent = new Date(last.t).toLocaleString(); }

  const savedRem = parseInt(localStorage.getItem('countdown_lastRemaining')||'0',10);
  if(savedRem>0){ remaining = savedRem; totalSeconds = savedRem; updateDisplay(remaining); status.textContent='Ready (restored)'; }
  else { updateDisplay(0); }

  pauseBtn.disabled = true;
})();

// accessibility: announce status changes for screen readers
const live = document.createElement('div'); live.setAttribute('aria-live','polite'); live.style.position='absolute'; live.style.left='-9999px'; document.body.appendChild(live);
const observeStatus = new MutationObserver(()=>{ live.textContent = status.textContent; });
observeStatus.observe(status, {childList:true});
