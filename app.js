// Kalau file logo.png/logo.jpg ada di folder yang sama, pakai itu sebagai logo.
// Kalau tidak ada, tampilan tetap fallback ke huruf "O" yang sudah ada di HTML - tidak ada yang rusak.
(function loadBrandLogo(){
  ["logo.png","logo.jpg","logo.svg"].forEach(src=>{
    const img=new Image();
    img.onload=()=>{
      document.querySelectorAll(".logo,.brand-logo").forEach(el=>{
        el.style.backgroundImage=`url('${src}')`;
        el.style.backgroundSize="cover";
        el.style.backgroundPosition="center";
        el.textContent="";
      });
    };
    img.src=src;
  });
})();

const ROLE_OPTIONS=["SUPER MASTER","LEADER","CS","KAPTEN","KASIR"];
const MANAGE_ROLES=["SUPER MASTER","LEADER"];

let dashboard=null;
let currentCategory="withdraw";
let sessionToken=localStorage.getItem(CONFIG.SESSION_KEY)||"";
const apiCallbacks=new Map();
let heartbeatTimer=null;
const HEARTBEAT_INTERVAL=20000;

// Simple JSONP transport: GitHub Pages loads Apps Script as a script tag.
// This avoids CORS, hidden iframes and postMessage completely.
function api(action,data={}){
  return new Promise((resolve,reject)=>{
    if(!CONFIG.API_URL) return reject(new Error("API_URL belum diisi di config.js"));

    const id="cb_"+(crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random()).replace(/[^a-zA-Z0-9_]/g,"_");
    const callbackName="__officeApi_"+id;
    const script=document.createElement("script");
    const params=new URLSearchParams();

    params.set("action",action);
    params.set("token",sessionToken||"");
    params.set("callback",callbackName);
    params.set("_",Date.now().toString());

    Object.entries(data||{}).forEach(([key,value])=>params.set(key,String(value??"")));

    let finished=false;
    const finish=(fn,value)=>{
      if(finished)return;
      finished=true;
      clearTimeout(timer);
      delete window[callbackName];
      script.remove();
      apiCallbacks.delete(callbackName);
      fn(value);
    };

    window[callbackName]=(payload)=>{
      if(payload?.success) finish(resolve,payload.data);
      else finish(reject,new Error(payload?.message||"API Error"));
    };

    apiCallbacks.set(callbackName,true);

    script.async=true;
    script.src=CONFIG.API_URL+"?"+params.toString();
    script.onerror=()=>finish(reject,new Error("Tidak dapat terhubung ke Apps Script. Cek URL API dan deployment Web App."));

    document.head.appendChild(script);

    const timer=setTimeout(()=>finish(reject,new Error("Apps Script tidak merespons dalam 20 detik. Pastikan Web App sudah di-deploy sebagai versi terbaru.")),20000);
  });
}

document.addEventListener("DOMContentLoaded",init);

async function init(){
  bindEvents();
  if(!sessionToken){showLogin();return;}
  try{
    showLoading();
    dashboard=await api("getDashboard");
    renderUser();renderStats();renderTable();renderOnline();
    startHeartbeat();
  }catch(e){
    clearSession();showLogin();setLoginStatus(e.message);
  }finally{hideLoading();}
}

function startHeartbeat(){
  stopHeartbeat();
  heartbeatTimer=setInterval(async()=>{
    if(!sessionToken)return;
    try{
      const page=document.querySelector(".page:not(.hidden)")?.id.replace("Page","")||"dashboard";
      const result=await api("heartbeat",{page});
      if(dashboard){dashboard.online=result.online;renderOnline();}
    }catch(e){/* silent - koneksi sementara terputus, coba lagi di siklus berikutnya */}
  },HEARTBEAT_INTERVAL);
}
function stopHeartbeat(){if(heartbeatTimer){clearInterval(heartbeatTimer);heartbeatTimer=null;}}

function renderOnline(){
  const el=document.getElementById("onlineUsers");
  if(!el)return;
  const list=dashboard?.online||[];
  if(!list.length){el.innerHTML="";return;}
  el.innerHTML=`<span class="online-dot"></span>Online: `+list.map(u=>`<span class="online-user" title="${esc(u.email)}">${esc(u.name)}</span>`).join(", ");
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
  const search=document.getElementById("searchInput");if(search)search.oninput=renderTable;
  const filter=document.getElementById("checkFilter");if(filter)filter.onchange=renderTable;
  const refresh=document.getElementById("refreshBtn");if(refresh)refresh.onclick=refreshDashboard;
  const shift=document.getElementById("newShiftBtn");if(shift)shift.onclick=newShift;
}

async function startLogin(){
  const email=(document.getElementById("loginEmail")?.value||"").trim().toLowerCase();
  if(!email)return setLoginStatus("Email wajib diisi.");
  try{
    showLoading();setLoginStatus("Memverifikasi email...");
    const result=await api("login",{email});
    if(!result?.token)throw new Error("Login gagal: session tidak dibuat.");
    sessionToken=result.token;
    localStorage.setItem(CONFIG.SESSION_KEY,sessionToken);
    dashboard=await api("getDashboard");
    renderUser();renderStats();renderTable();setLoginStatus("");
  }catch(e){clearSession();showLogin();setLoginStatus(e.message)}finally{hideLoading()}
}

function renderUser(){
  const u=dashboard.user;
  document.getElementById("userEmail").textContent=u.email;
  document.getElementById("userRole").textContent=u.role;
  document.getElementById("shiftText").textContent=dashboard.shift.shift;
  document.getElementById("shiftName").textContent=dashboard.shift.shift;
  document.getElementById("shiftInfo").textContent=`Mulai ${dashboard.shift.startTime} • ${dashboard.shift.startedBy}`;
  const canManage=MANAGE_ROLES.includes(String(u.role||"").toUpperCase());
  document.getElementById("newShiftBtn").style.display=canManage?"block":"none";
  document.getElementById("usersNav").style.display=canManage?"block":"none";
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

function showLogin(){document.getElementById("loginScreen").classList.remove("hidden");document.getElementById("app").classList.add("hidden")}
function setLoginStatus(msg){const el=document.getElementById("loginStatus");if(el)el.textContent=msg||""}
function clearSession(){sessionToken="";localStorage.removeItem(CONFIG.SESSION_KEY)}
function renderStats(){const s=dashboard.stats;document.getElementById("withdrawCount").textContent=s.withdraw;document.getElementById("depoCount").textContent=s.depo;document.getElementById("bankKasCount").textContent=s.bankKas;document.getElementById("tokenCount").textContent=s.token}
function getData(){if(currentCategory==="withdraw")return dashboard.data.withdraw||[];if(currentCategory==="depo")return dashboard.data.depo||[];if(currentCategory==="bankKas")return dashboard.data.bankKas||[];if(currentCategory==="token")return [...(dashboard.data.tokenBca||[]),...(dashboard.data.tokenBca2||[])];return[]}

function renderTable(){
  const q=(document.getElementById("searchInput")?.value||"").toLowerCase().trim();
  const filter=document.getElementById("checkFilter")?.value||"all";
  const data=getData().filter(x=>{const text=`${x.number} ${x.bank} ${x.name}`.toLowerCase();if(q&&!text.includes(q))return false;if(filter==="checked"&&!x.checked)return false;if(filter==="unchecked"&&x.checked)return false;return true});
  const body=document.getElementById("dataTable");body.innerHTML="";
  data.forEach(item=>{
    const tr=document.createElement("tr");
    const byLine=item.checked&&item.checkedBy?`<small class="checked-by" title="${esc(formatTime(item.checkedAt))}">oleh ${esc(item.checkedBy)}</small>`:"";
    tr.innerHTML=`<td>${esc(item.number)}</td><td>${esc(item.bank)}</td><td>${esc(item.name)}</td><td><button type="button" class="check-status ${item.checked?"checked":"pending"}">${item.checked?"✓ SUDAH DI CEK":"BELUM DI CEK"}</button>${byLine}</td><td><button class="edit-btn">Edit</button></td>`;
    tr.querySelector(".check-status").onclick=e=>updateCheck(item,!item.checked,e.currentTarget);
    tr.querySelector(".edit-btn").onclick=()=>editData(item.nameCell,item.name);
    body.appendChild(tr);
  });
}

// Optimistic update: langsung ubah tampilan begitu diklik (tanpa nunggu server / spinner
// full-page), baru dikonfirmasi ke backend di belakang layar. Kalau gagal, di-rollback.
async function updateCheck(item,checked,btn){
  const prev={checked:item.checked,checkedBy:item.checkedBy,checkedAt:item.checkedAt};
  item.checked=checked;
  if(btn){
    btn.classList.toggle("checked",checked);
    btn.classList.toggle("pending",!checked);
    btn.textContent=checked?"✓ SUDAH DI CEK":"BELUM DI CEK";
    btn.disabled=true;
  }
  try{
    const result=await api("updateCheck",{cell:item.checkCell,checked});
    item.checked=result.checked;item.checkedBy=result.checkedBy;item.checkedAt=result.checkedAt;
    showToast(checked?`✓ Dicek oleh ${result.checkedBy}`:"✓ Check dibatalkan");
    renderTable();
  }catch(e){
    Object.assign(item,prev);
    showToast(e.message);
    renderTable();
  }
}
async function editData(cell,oldValue){const value=prompt("Edit data:",oldValue);if(value===null)return;try{showLoading();await api("editData",{cell,value});showToast("✓ Data berhasil diubah");await refreshDashboard()}catch(e){showToast(e.message)}finally{hideLoading()}}
async function newShift(){const current=dashboard.shift.shift||"SHIFT 1";const m=current.match(/(\d+)/);const next=`SHIFT ${m?Number(m[1])+1:2}`;const shift=prompt("Nama shift baru:",next);if(!shift)return;if(!confirm(`Mulai ${shift}? Semua checkbox aktif akan di-reset untuk shift baru.`))return;try{showLoading();await api("startNewShift",{shift});showToast(`✓ ${shift} berhasil dimulai`);await refreshDashboard()}catch(e){showToast(e.message)}finally{hideLoading()}}
async function refreshDashboard(){try{dashboard=await api("getDashboard");renderUser();renderStats();renderTable();renderOnline()}catch(e){if(/session|login|token/i.test(e.message)){stopHeartbeat();clearSession();showLogin();setLoginStatus(e.message)}else showToast(e.message)}}
async function loadHistory(){try{showLoading();const rows=await api("getHistory");document.getElementById("historyTable").innerHTML=`<div class="history-table"><table class="mini-table"><thead><tr><th>Waktu</th><th>Email</th><th>Action</th><th>Shift</th><th>Cell</th><th>Item</th><th>Old</th><th>New</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.timestamp)}</td><td>${esc(x.email)}</td><td>${esc(x.action)}</td><td>${esc(x.shift)}</td><td>${esc(x.cell)}</td><td>${esc(x.item)}</td><td>${esc(x.oldValue)}</td><td>${esc(x.newValue)}</td></tr>`).join("")}</tbody></table></div>`}catch(e){showToast(e.message)}finally{hideLoading()}}
async function loadUsers(){
  try{
    showLoading();
    const rows=await api("getUsers");
    const myRole=String(dashboard?.user?.role||"").toUpperCase();
    const canEdit=MANAGE_ROLES.includes(myRole);
    document.getElementById("usersTable").innerHTML=`<div class="history-table"><table class="mini-table"><thead><tr><th>Email</th><th>Nama</th><th>Role</th><th>Status</th></tr></thead><tbody>${rows.map(x=>{
      const isSuper=String(x.role||"").toUpperCase()==="SUPER MASTER";
      const lockedForMe=isSuper&&myRole!=="SUPER MASTER"; // LEADER tidak boleh ubah role SUPER MASTER
      const roleCell=canEdit&&!lockedForMe
        ?`<select class="role-select" data-email="${esc(x.email)}">${ROLE_OPTIONS.filter(r=>r!=="SUPER MASTER"||myRole==="SUPER MASTER").map(r=>`<option value="${esc(r)}" ${r===x.role?"selected":""}>${esc(r)}</option>`).join("")}</select>`
        :esc(x.role);
      return `<tr><td>${esc(x.email)}</td><td>${esc(x.name)}</td><td>${roleCell}</td><td>${esc(x.status)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
    if(canEdit){
      document.querySelectorAll(".role-select").forEach(sel=>{
        const original=sel.value;
        sel.onchange=async()=>{
          const email=sel.dataset.email,role=sel.value;
          sel.disabled=true;
          try{
            await api("updateUserRole",{email,role});
            showToast(`✓ Role ${email} diubah ke ${role}`);
          }catch(e){
            sel.value=original;
            showToast(e.message);
          }finally{sel.disabled=false}
        };
      });
    }
  }catch(e){showToast(e.message)}finally{hideLoading()}
}
function showPage(page){document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));document.getElementById(page+"Page").classList.remove("hidden");document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));const btn=document.querySelector(`.nav[data-page="${page}"]`);if(btn)btn.classList.add("active");if(page==="history")loadHistory();if(page==="users")loadUsers()}
async function logoutUser(){try{showLoading();if(sessionToken)await api("logout")}catch(e){}finally{stopHeartbeat();clearSession();dashboard=null;showLogin();setLoginStatus("Kamu sudah logout.");hideLoading()}}
function formatTime(iso){if(!iso)return"";try{return new Date(iso).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch(e){return iso}}
function showLoading(){document.getElementById("loading").classList.remove("hidden")}
function hideLoading(){document.getElementById("loading").classList.add("hidden")}
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;setTimeout(()=>t.textContent="",3500)}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
