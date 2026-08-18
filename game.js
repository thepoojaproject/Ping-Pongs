const canvas=document.getElementById("gameCanvas");
const ctx=canvas.getContext("2d");
const playerScoreEl=document.getElementById("playerScore");
const aiScoreEl=document.getElementById("aiScore");
const startOverlay=document.getElementById("startOverlay");
const gameOverOverlay=document.getElementById("gameOverOverlay");
const resultTitle=document.getElementById("resultTitle");
const resultText=document.getElementById("resultText");
const soundBtn=document.getElementById("soundBtn");
const pauseBtn=document.getElementById("pauseBtn");

let W=800,H=500,dpr=1,running=false,paused=false,gameOver=false;
let playerScore=0,aiScore=0,soundOn=true,last=0,keys={};
const targetScore=7;
const player={x:0,y:0,w:13,h:88,speed:520};
const ai={x:0,y:0,w:13,h:88,speed:330};
const ball={x:0,y:0,r:9,vx:0,vy:0,speed:400};

function resize(){
  const rect=canvas.getBoundingClientRect();
  dpr=Math.min(devicePixelRatio||1,2);
  W=Math.max(320,rect.width); H=Math.max(320,rect.height);
  canvas.width=W*dpr; canvas.height=H*dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  player.x=20; player.y=H/2-player.h/2;
  ai.x=W-33; ai.y=H/2-ai.h/2;
}
window.addEventListener("resize",resize);

function resetBall(direction=Math.random()<.5?-1:1){
  ball.x=W/2; ball.y=H/2;
  const angle=(Math.random()*.9-.45);
  ball.vx=direction*ball.speed;
  ball.vy=ball.speed*angle;
}
function resetGame(){
  playerScore=aiScore=0; playerScoreEl.textContent=0; aiScoreEl.textContent=0;
  gameOver=false; paused=false; running=true;
  gameOverOverlay.classList.add("hidden"); startOverlay.classList.add("hidden");
  resetBall();
}
function beep(freq=440,duration=.05){
  if(!soundOn)return;
  try{
    const A=window.AudioContext||window.webkitAudioContext;
    if(!window.audioCtx)window.audioCtx=new A();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.frequency.value=freq;o.type="square";g.gain.value=.035;
    o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);
  }catch(e){}
}
function scorePoint(who){
  if(who==="player"){playerScore++;beep(760,.1)}else{aiScore++;beep(180,.1)}
  playerScoreEl.textContent=playerScore;aiScoreEl.textContent=aiScore;
  if(playerScore>=targetScore||aiScore>=targetScore){
    gameOver=true;running=false;
    resultTitle.textContent=playerScore>=targetScore?"You Win!":"Computer Wins!";
    resultText.textContent=playerScore>=targetScore?"🏓 Excellent rally!":"Keep practicing and try again.";
    gameOverOverlay.classList.remove("hidden");
  }else resetBall(who==="player"?1:-1);
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function update(dt){
  if(!running||paused||gameOver)return;
  let dir=(keys.ArrowDown||keys.s?-1:0)+(keys.ArrowUp||keys.w?1:0);
  if(dir)player.y-=dir*player.speed*dt;
  player.y=clamp(player.y,0,H-player.h);

  const desired=ball.y-ai.h/2;
  const diff=desired-ai.y;
  const move=clamp(diff,-ai.speed*dt,ai.speed*dt);
  ai.y+=move; ai.y=clamp(ai.y,0,H-ai.h);

  ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
  if(ball.y-ball.r<=0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);beep(500,.025)}
  if(ball.y+ball.r>=H){ball.y=H-ball.r;ball.vy=-Math.abs(ball.vy);beep(500,.025)}

  if(ball.vx<0 && ball.x-ball.r<=player.x+player.w && ball.x+ball.r>=player.x && ball.y>=player.y && ball.y<=player.y+player.h){
    const hit=(ball.y-(player.y+player.h/2))/(player.h/2);
    const speed=Math.min(Math.hypot(ball.vx,ball.vy)*1.05,850);
    ball.vx=Math.abs(speed);ball.vy=hit*speed*.85;beep(650,.04);
  }
  if(ball.vx>0 && ball.x+ball.r>=ai.x && ball.x-ball.r<=ai.x+ai.w && ball.y>=ai.y && ball.y<=ai.y+ai.h){
    const hit=(ball.y-(ai.y+ai.h/2))/(ai.h/2);
    const speed=Math.min(Math.hypot(ball.vx,ball.vy)*1.05,850);
    ball.vx=-Math.abs(speed);ball.vy=hit*speed*.85;beep(430,.04);
  }
  if(ball.x<-25)scorePoint("ai");
  if(ball.x>W+25)scorePoint("player");
}
function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#0d6b46";ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#0b5d3e";ctx.fillRect(0,0,W,H);
  ctx.strokeStyle="#e9f4f1";ctx.lineWidth=4;
  ctx.strokeRect(12,12,W-24,H-24);
  ctx.beginPath();ctx.moveTo(W/2,12);ctx.lineTo(W/2,H-12);ctx.stroke();
  ctx.setLineDash([12,12]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle="#f5f7fb";ctx.fillRect(player.x,player.y,player.w,player.h);ctx.fillRect(ai.x,ai.y,ai.w,ai.h);
  ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();
  ctx.beginPath();ctx.arc(ball.x-2,ball.y-2,2,0,Math.PI*2);ctx.fillStyle="#d8dee9";ctx.fill();
}
function loop(t){const dt=Math.min((t-last)/1000||0,.033);last=t;update(dt);draw();requestAnimationFrame(loop)}
function setKey(k,v){keys[k]=v}
window.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown"," "].includes(e.key))e.preventDefault();if(e.key===" ")togglePause();setKey(e.key,true)});
window.addEventListener("keyup",e=>setKey(e.key,false));

function pointerY(e){
  const rect=canvas.getBoundingClientRect();
  const y=(e.clientY-rect.top)*(H/rect.height);
  player.y=clamp(y-player.h/2,0,H-player.h);
}
canvas.addEventListener("pointerdown",e=>{canvas.setPointerCapture?.(e.pointerId);pointerY(e)});
canvas.addEventListener("pointermove",e=>{if(e.buttons||e.pointerType==="touch")pointerY(e)});

document.getElementById("startBtn").onclick=()=>{beep(600,.05);resetGame()};
document.getElementById("restartBtn").onclick=()=>{beep(600,.05);resetGame()};
pauseBtn.onclick=togglePause;
soundBtn.onclick=()=>{soundOn=!soundOn;soundBtn.textContent=soundOn?"🔊":"🔇"};
function togglePause(){if(!running||gameOver)return;paused=!paused;pauseBtn.textContent=paused?"▶":"Ⅱ"}

function holdButton(id,key){
  const el=document.getElementById(id);
  const on=e=>{e.preventDefault();setKey(key,true)};
  const off=e=>{e.preventDefault();setKey(key,false)};
  el.addEventListener("pointerdown",on);el.addEventListener("pointerup",off);el.addEventListener("pointercancel",off);el.addEventListener("pointerleave",off);
}
holdButton("leftBtn","ArrowDown");
holdButton("rightBtn","ArrowUp");

resize();resetBall();draw();requestAnimationFrame(loop);