let dashboard=null;
let currentCategory="withdraw";
let sessionToken=localStorage.getItem(CONFIG.SESSION_KEY)||"";
const pending=new Map();

// Apps Script is called through a hidden iframe. The Apps Script doPost must
// return an HTML page that calls parent.postMessage({type:'OFFICE_API_RESPONSE',...}).
function api(action,data={}){
  return new Promise((resolve,reject)=>{
    if(!CONFIG.API_URL) return reject(new Error("API_URL belum diisi di config.js"));
    const id=(crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random()).replace(/[^a-zA-Z0-9_]/g,"_");
    pending.set(id,{resolve,reject});

    const iframe=document.createElement("iframe");
    iframe.name="api_frame_"+id;
    iframe.setAttribute("aria-hidden","true");
    iframe.style.cssText="position:fixed;width:1px;height:1px;border:0;opacity:0;pointer-events:none;left:-9999px;top:-9999px";
    document.body.appendChild(iframe);

    const form=document.createElement("form");
    form.method="POST";
    form.action=CONFIG.API_URL;
    form.target=iframe.name;
    form.style.display="none";

    const payload={action,token:sessionToken,requestId:id,...data};
    Object.entries(payload).forEach(([key,value])=>{
      const input=document.createElement("input");
      input.type="hidden";
      input.name=key;
      input.value=String(value??"");
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();

    setTimeout(()=>{
      iframe.remove();
      if(pending.has(id)){
        pending.delete(id);
        reject(new Error("Apps Script tidak mengembalikan respons. Pastikan Code.gs memakai doPost versi terbaru."));
      }
    },20000);
  });
}

window.addEventListener("message",event=>{
  const data=event.data||{};
  if(data.type!=="OFFICE_API_RESPONSE")return;
  const id=data.id;
  const request=pending.get(id);
  if(!request)return;
  pending.delete(id);
  if(data.payload?.success)request.resolve(data.payload.data);
  else request.reject(new Error(data.payload?.message||"API Error"));
});

document.addEventListener("DOMContentLoaded",init);

async function init(){
  bindEvents();
  if(!sessionToken){showLogin();return;}
  try{
    showLoading();
    dashboard=await api("getDashboard");
    renderUser();renderStats();renderTable();
  }catch(e){
    clearSession();showLogin();setLoginStatus(e.message);
  }finally{hideLoading();}
}

function bindEvents(){
  const login=document.getElementById("loginBtn");
  if(login)login.onclick=startLogin;

  const email=document.getElementById("loginEmail");
  if(email)email.addEventListener("keydown",e=>{if(e.key==="Enter")startLogin()});

  const logout=document.getElementById("logoutBtn");
  if(logout)logout.onclick=logoutUser;

  document.querySelectorAll(".nav[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  document.querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>{currentCategory=b.dataset.category;renderTable()});

  const search=document.getElementById("searchInput");
  if(search)search.oninput=renderTable;
  const filter=document.getElementById("checkFilter");
  if(filter)filter.onchange=renderTable;
  const refresh=document.getElementById("refreshBtn");
  if(refresh)refresh.onclick=refreshDashboard;
  const shift=document.getElementById("newShiftBtn");
  if(shift)shift.onclick=newShift;
}

async function startLogin(){
  const email=(document.getElementById("loginEmail")?.value||"").trim().toLowerCase();
  if(!email)return setLoginStatus("Email wajib diisi.");

  try{
    showLoading();
    setLoginStatus("Memverifikasi email...");

    const result=await api("login",{email});
    if(!result?.token)throw new Error("Login gagal: token tidak diterima.");

    sessionToken=result.token;
    localStorage.setItem(CONFIG.SESSION_KEY,sessionToken);

    dashboard=await api("getDashboard");
    renderUser();
    renderStats();
    renderTable();
    setLoginStatus("");
  }catch(e){
    clearSession();
    showLogin();
    setLoginStatus(e.message);
  }finally{
    hideLoading();
  }
}

function renderUser(){
  const u=dashboard.user;
  document.getElementById("userEmail").textContent=u.email;
  document.getElementById("userRole").textContent=u.role;
  document.getElementById("shiftText").textContent=dashboard.shift.shift;
  document.getElementById("shiftName").textContent=dashboard.shift.shift;
  document.getElementById("shiftInfo").textContent=`Mulai ${dashboard.shift.startTime} • ${dashboard.shift.startedBy}`;

  document.getElementById("newShiftBtn").style.display=u.role==="SUPER MASTER"?"block":"none";
  document.getElementById("usersNav").style.display=u.role==="SUPER MASTER"?"block":"none";

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

function showLogin(){
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function setLoginStatus(msg){
  const el=document.getElementById("loginStatus");
  if(el)el.textContent=msg||"";
}

function clearSession(){
  sessionToken="";
  localStorage.removeItem(CONFIG.SESSION_KEY);
}

function renderStats(){
  const s=dashboard.stats;
  document.getElementById("withdrawCount").textContent=s.withdraw;
  document.getElementById("depoCount").textContent=s.depo;
  document.getElementById("bankKasCount").textContent=s.bankKas;
  document.getElementById("tokenCount").textContent=s.token;
}

function getData(){
  if(currentCategory==="withdraw")return dashboard.data.withdraw||[];
  if(currentCategory==="depo")return dashboard.data.depo||[];
  if(currentCategory==="bankKas")return dashboard.data.bankKas||[];
  if(currentCategory==="token")return [...(dashboard.data.tokenBca||[]),...(dashboard.data.tokenBca2||[])];
  return[];
}

function renderTable(){
  const search=document.getElementById("searchInput");
  const filterEl=document.getElementById("checkFilter");
  const q=(search?.value||"").toLowerCase().trim();
  const filter=filterEl?.value||"all";

  const data=getData().filter(x=>{
    const text=`${x.number} ${x.bank} ${x.name}`.toLowerCase();
    if(q&&!text.includes(q))return false;
    if(filter==="checked"&&!x.checked)return false;
    if(filter==="unchecked"&&x.checked)return false;
    return true;
  });

  const body=document.getElementById("dataTable");
  body.innerHTML="";

  data.forEach(item=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${esc(item.number)}</td><td>${esc(item.bank)}</td><td>${esc(item.name)}</td><td><input class="check" type="checkbox" ${item.checked?"checked":""}><span class="${item.checked?"checked":"pending"}">${item.checked?"SUDAH CEK":"BELUM CEK"}</span></td><td><button class="edit-btn">Edit</button></td>`;
    tr.querySelector(".check").onchange=e=>updateCheck(item.checkCell,e.target.checked);
    tr.querySelector(".edit-btn").onclick=()=>editData(item.nameCell,item.name);
    body.appendChild(tr);
  });
}

async function updateCheck(cell,checked){
  try{
    showLoading();
    await api("updateCheck",{cell,checked});
    showToast(checked?"✓ Data berhasil dicek":"✓ Check dibatalkan");
    await refreshDashboard();
  }catch(e){showToast(e.message)}finally{hideLoading();}
}

async function editData(cell,oldValue){
  const value=prompt("Edit data:",oldValue);
  if(value===null)return;
  try{
    showLoading();
    await api("editData",{cell,value});
    showToast("✓ Data berhasil diubah");
    await refreshDashboard();
  }catch(e){showToast(e.message)}finally{hideLoading();}
}

async function newShift(){
  const current=dashboard.shift.shift||"SHIFT 1";
  const m=current.match(/(\d+)/);
  const next=`SHIFT ${m?Number(m[1])+1:2}`;
  const shift=prompt("Nama shift baru:",next);
  if(!shift)return;
  if(!confirm(`Mulai ${shift}? Semua checkbox aktif akan di-reset untuk shift baru.`))return;
  try{
    showLoading();
    await api("startNewShift",{shift});
    showToast(`✓ ${shift} berhasil dimulai`);
    await refreshDashboard();
  }catch(e){showToast(e.message)}finally{hideLoading();}
}

async function refreshDashboard(){
  try{
    dashboard=await api("getDashboard");
    renderUser();renderStats();renderTable();
  }catch(e){
    if(/session|login|token/i.test(e.message)){
      clearSession();showLogin();setLoginStatus(e.message);
    }else showToast(e.message);
  }
}

async function loadHistory(){
  try{
    showLoading();
    const rows=await api("getHistory");
    document.getElementById("historyTable").innerHTML=`<div class="history-table"><table class="mini-table"><thead><tr><th>Waktu</th><th>Email</th><th>Action</th><th>Shift</th><th>Cell</th><th>Item</th><th>Old</th><th>New</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.timestamp)}</td><td>${esc(x.email)}</td><td>${esc(x.action)}</td><td>${esc(x.shift)}</td><td>${esc(x.cell)}</td><td>${esc(x.item)}</td><td>${esc(x.oldValue)}</td><td>${esc(x.newValue)}</td></tr>`).join("")}</tbody></table></div>`;
  }catch(e){showToast(e.message)}finally{hideLoading();}
}

async function loadUsers(){
  try{
    showLoading();
    const rows=await api("getUsers");
    document.getElementById("usersTable").innerHTML=`<div class="history-table"><table class="mini-table"><thead><tr><th>Email</th><th>Nama</th><th>Role</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.email)}</td><td>${esc(x.name)}</td><td>${esc(x.role)}</td><td>${esc(x.status)}</td></tr>`).join("")}</tbody></table></div>`;
  }catch(e){showToast(e.message)}finally{hideLoading();}
}

function showPage(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));
  document.getElementById(page+"Page").classList.remove("hidden");
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));
  const btn=document.querySelector(`.nav[data-page="${page}"]`);
  if(btn)btn.classList.add("active");
  if(page==="history")loadHistory();
  if(page==="users")loadUsers();
}

async function logoutUser(){
  try{showLoading();if(sessionToken)await api("logout")}catch(e){}finally{
    clearSession();dashboard=null;showLogin();setLoginStatus("Kamu sudah logout.");hideLoading();
  }
}

function showLoading(){document.getElementById("loading").classList.remove("hidden")}
function hideLoading(){document.getElementById("loading").classList.add("hidden")}
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;setTimeout(()=>t.textContent="",3500)}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
