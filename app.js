const KEY="health_tracker_v1";
let db=JSON.parse(localStorage.getItem(KEY)||'{"meds":[],"labs":[],"status":[]}');
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
["medDate","labDate","statusDate"].forEach(id=>$(id).value=today());

function save(){localStorage.setItem(KEY,JSON.stringify(db));render();}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function render(){
  $("medCount").textContent=db.meds.length;
  $("labCount").textContent=db.labs.length;
  $("moodCount").textContent=db.status.filter(x=>x.mood).length;
  $("bodyCount").textContent=db.status.length;
  const all=[...db.meds,...db.labs,...db.status].sort((a,b)=>b.date.localeCompare(a.date));
  $("lastRecord").textContent=all[0]?all[0].date:"暂无";
  $("medList").innerHTML=db.meds.length?db.meds.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="row"><div class="row-head"><b>${esc(x.name||"未命名治疗")}</b><span class="date">${esc(x.date)}</span></div><p>${esc(x.plan||"")} ${esc(x.note||"")}</p></div>`).join(""):`<div class="card muted">还没有治疗记录。点击右上角“添加”。</div>`;
  $("labList").innerHTML=db.labs.length?db.labs.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="row"><div class="row-head"><b>化验</b><span class="date">${esc(x.date)}</span></div><p>E2：${x.e2===""?"—":esc(x.e2)}　T：${x.t===""?"—":esc(x.t)}</p><p>${esc(x.note||"")}</p></div>`).join(""):`<div class="card muted">还没有化验记录。</div>`;
  $("statusList").innerHTML=db.status.length?db.status.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>`<div class="row"><div class="row-head"><b>${esc(x.mood)}</b><span class="date">${esc(x.date)}</span></div><p>${esc(x.body||"")}</p><p>${esc(x.side||"")}</p></div>`).join(""):`<div class="card muted">还没有状态记录。</div>`;
  draw();
}
function draw(){
  const c=$("chart"),ctx=c.getContext("2d"),dpr=devicePixelRatio||1,w=c.clientWidth,h=210;
  c.width=w*dpr;c.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const labs=db.labs.slice().filter(x=>x.e2!==""||x.t!=="").sort((a,b)=>a.date.localeCompare(b.date));
  ctx.strokeStyle="#d1d1d6";ctx.lineWidth=1;
  for(let i=0;i<4;i++){let y=24+i*45;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  if(!labs.length){ctx.fillStyle="#8e8e93";ctx.font="14px -apple-system";ctx.fillText("录入化验结果后，这里会显示趋势",18,112);return;}
  const vals=[...labs.flatMap(x=>[Number(x.e2)||0,Number(x.t)||0])]; const max=Math.max(...vals,1),min=Math.min(...vals,0);
  function line(key,offset){
    const pts=labs.filter(x=>x[key]!=="").map((x,i)=>[labs.indexOf(x),Number(x[key])]);
    if(!pts.length)return;
    ctx.beginPath();
    pts.forEach(([i,v],j)=>{let px=18+(labs.length===1?w/2:(i/(labs.length-1))*(w-36));let py=185-((v-min)/(max-min||1))*150;if(j)ctx.lineTo(px,py);else ctx.moveTo(px,py);});
    ctx.strokeStyle=offset?"#ff9500":"#007aff";ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();
  }
  line("e2",0);line("t",1);
}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(b.dataset.page).classList.add("active");$("pageTitle").textContent={summary:"摘要",meds:"治疗记录",labs:"化验",status:"身体与状态",settings:"设置"}[b.dataset.page];window.scrollTo(0,0);});
document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>$(b.dataset.open).classList.add("show"));
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest(".modal").classList.remove("show"));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("show")}));
$("saveMed").onclick=()=>{db.meds.push({date:$("medDate").value,name:$("medName").value,plan:$("medPlan").value,note:$("medNote").value});["medName","medPlan","medNote"].forEach(id=>$(id).value="");$("medModal").classList.remove("show");save();};
$("saveLab").onclick=()=>{db.labs.push({date:$("labDate").value,e2:$("labE2").value,t:$("labT").value,note:$("labNote").value});["labE2","labT","labNote"].forEach(id=>$(id).value="");$("labModal").classList.remove("show");save();};
$("saveStatus").onclick=()=>{db.status.push({date:$("statusDate").value,mood:$("statusMood").value,body:$("statusBody").value,side:$("statusSide").value});["statusBody","statusSide"].forEach(id=>$(id).value="");$("statusModal").classList.remove("show");save();};
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="health-tracker-backup.json";a.click();URL.revokeObjectURL(a.href);}
$("exportBtn").onclick=exportData;$("exportBtn2").onclick=exportData;
$("clearBtn").onclick=()=>{if(confirm("确定清空本设备上的全部记录吗？")){db={meds:[],labs:[],status:[]};save();}};
window.addEventListener("resize",draw);render();