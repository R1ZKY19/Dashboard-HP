let dashboard=null;
let currentCategory="withdraw";
let sessionToken=localStorage.getItem(CONFIG.SESSION_KEY)||"";
const pending=new Map();
let loginPopup=null;

function api(action,data={}){
  return new Promise((resolve,reject)=>{
    if(!CONFIG.API_URL) return reject(new Error("API_URL belum diisi di config.js"));
    const id=crypto.randomUUID();
    pending.set(id,{resolve,reject});
    const iframe=document.createElement("iframe");
    iframe.name="api_"+id;
    iframe.style.display="none";
    document.body.appendChild(iframe);
    const form=document.createElement("form");
    form.method="POST";form.action=CONFIG.API_URL;form.target=iframe.name;form.style.display="none";
    const payload={action,token:sessionToken,origin:location.origin,requestId:id,...data};
    Object.entries(payload).forEach(([k,v])=>{const input=document.createElement("input");input.type="hidden";input.name=k;input.value=typeof v==="object"?JSON.stringify(v):String(v??"");form.appendChild(input)});
    document.body.appendChild(form);form.submit();form.remove();
    setTimeout(()=>{iframe.remove();if(pending.has(id)){pending.delete(id);reject(new Error("API timeout. Cek deployment Apps Script dan akses Web App."))}},30000);
  });
}

window.addEventListener("message",event=>{
  const data=event.data||{};
  if(data.type==="OFFICE_DASHBOARD_LOGIN"){
    if(!data.token){setLoginStatus(data.message||"Login gagal.");return}
    sessionToken=data.token;localStorage.setItem(CONFIG.SESSION_KEY,sessionToken);finishLogin();return;
  }
  if(data.type!=="OFFICE_API_RESPONSE"||event.origin!==new URL(CONFIG.API_URL).origin)return;
  const p=pending.get(data.id);if(!p)return;pending.delete(data.id);
  if(data.payload?.success)p.resolve(data.payload.data);else p.reject(new Error(data.payload?.message||"API Error"));
});

document.addEventListener("DOMContentLoaded",init);
async function init(){bindEvents();if(!sessionToken){showLogin();return}try{showLoading();dashboard=await api("getDashboard");renderUser();renderStats();renderTable()}catch(e){clearSession();showLogin();setLoginStatus(e.message)}finally{hideLoading()}}
function bindEvents(){
  document.getElementById("loginBtn").onclick=startLogin;
  document.getElementById("logoutBtn").onclick=logout;
  document.querySelectorAll(".nav[data-page]").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
  document.querySelectorAll("[data-category]").forEach(b=>b.onclick=()=>{currentCategory=b.dataset.category;renderTable()});
  document.getElementById("searchInput").oninput=renderTable;
  document.getElementById("checkFilter").onchange=renderTable;
  document.getElementById("refreshBtn").onclick=refreshDashboard;
  document.getElementById("newShiftBtn").onclick=newShift;
}
function startLogin(){
  setLoginStatus("Membuka login Google...");
  loginPopup=window.open(CONFIG.API_URL+"?action=login&origin="+encodeURIComponent(location.origin),"officeLogin","width=520,height=680,menubar=no,toolbar=no,location=yes,resizable=yes");
  if(!loginPopup)setLoginStatus("Popup login diblokir browser. Izinkan popup untuk situs ini lalu klik MASUK lagi.");
}
async function finishLogin(){try{showLoading();dashboard=await api("getDashboard");renderUser();renderStats();renderTable();setLoginStatus("")}catch(e){clearSession();showLogin();setLoginStatus(e.message)}finally{hideLoading()}}
function renderUser(){
  const u=dashboard.user;document.getElementById("userEmail").textContent=u.email;document.getElementById("userRole").textContent=u.role;document.getElementById("shiftText").textContent=dashboard.shift.shift;document.getElementById("shiftName").textContent=dashboard.shift.shift;document.getElementById("shiftInfo").textContent=`Mulai ${dashboard.shift.startTime} • ${dashboard.shift.startedBy}`;
  document.getElementById("newShiftBtn").style.display=u.role==="SUPER MASTER"?"block":"none";document.getElementById("usersNav").style.display=u.role==="SUPER MASTER"?"block":"none";document.getElementById("loginScreen").classList.add("hidden");document.getElementById("app").classList.remove("hidden");
}
function showLogin(){document.getElementById("loginScreen").classList.remove("hidden");document.getElementById("app").classList.add("hidden")}
function setLoginStatus(msg){document.getElementById("loginStatus").textContent=msg||""}
function clearSession(){sessionToken="";localStorage.removeItem(CONFIG.SESSION_KEY)}
function renderStats(){const s=dashboard.stats;document.getElementById("withdrawCount").textContent=s.withdraw;document.getElementById("depoCount").textContent=s.depo;document.getElementById("bankKasCount").textContent=s.bankKas;document.getElementById("tokenCount").textContent=s.token}
function getData(){if(currentCategory==="withdraw")return dashboard.data.withdraw||[];if(currentCategory==="depo")return dashboard.data.depo||[];if(currentCategory==="bankKas")return dashboard.data.bankKas||[];if(currentCategory==="token")return [...(dashboard.data.tokenBca||[]),...(dashboard.data.tokenBca2||[])];return[]}
function renderTable(){
  const q=document.getElementById("searchInput").value.toLowerCase().trim(),filter=document.getElementById("checkFilter").value;const data=getData().filter(x=>{const text=`${x.number} ${x.bank} ${x.name}`.toLowerCase();if(q&&!text.includes(q))return false;if(filter==="checked"&&!x.checked)return false;if(filter==="unchecked"&&x.checked)return false;return true});const body=document.getElementById("dataTable");body.innerHTML="";
  data.forEach(item=>{const tr=document.createElement("tr");tr.innerHTML=`<td>${esc(item.number)}</td><td>${esc(item.bank)}</td><td>${esc(item.name)}</td><td><input class="check" type="checkbox" ${item.checked?"checked":""}><span class="${item.checked?"checked":"pending"}">${item.checked?"SUDAH CEK":"BELUM CEK"}</span></td><td><button class="edit-btn">Edit</button></td>`;tr.querySelector(".check").onchange=e=>updateCheck(item.checkCell,e.target.checked);tr.querySelector(".edit-btn").onclick=()=>editData(item.nameCell,item.name);body.appendChild(tr)});
}
async function updateCheck(cell,checked){try{showLoading();await api("updateCheck",{cell,checked});showToast(checked?"✓ Data berhasil dicek":"✓ Check dibatalkan");await refreshDashboard()}catch(e){showToast(e.message)}finally{hideLoading()}}
async function editData(cell,oldValue){const value=prompt("Edit data:",oldValue);if(value===null)return;try{showLoading();await api("editData",{cell,value});showToast("✓ Data berhasil diubah");await refreshDashboard()}catch(e){showToast(e.message)}finally{hideLoading()}}
async function newShift(){const current=dashboard.shift.shift||"SHIFT 1",m=current.match(/(\d+)/),next=`SHIFT ${m?Number(m[1])+1:2}`,shift=prompt("Nama shift baru:",next);if(!shift)return;if(!confirm(`Mulai ${shift}? Semua checkbox aktif akan di-reset untuk shift baru.`))return;try{showLoading();await api("startNewShift",{shift});showToast(`✓ ${shift} berhasil dimulai`);await refreshDashboard()}catch(e){showToast(e.message)}finally{hideLoading()}}
async function refreshDashboard(){dashboard=await api("getDashboard");renderUser();renderStats();renderTable()}
async function loadHistory(){try{showLoading();const rows=await api("getHistory");document.getElementById("historyTable").innerHTML=`<div class="history-table"><table class="mini-table"><thead><tr><th>Waktu</th><th>Email</th><th>Action</th><th>Shift</th><th>Cell</th><th>Item</th><th>Old</th><th>New</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.timestamp)}</td><td>${esc(x.email)}</td><td>${esc(x.action)}</td><td>${esc(x.shift)}</td><td>${esc(x.cell)}</td><td>${esc(x.item)}</td><td>${esc(x.oldValue)}</td><td>${esc(x.newValue)}</td></tr>`).join("")}</tbody></table></div>`}catch(e){showToast(e.message)}finally{hideLoading()}}
async function loadUsers(){try{showLoading();const rows=await api("getUsers");document.getElementById("usersTable").innerHTML=`<div class="history-table"><table class="mini-table"><thead><tr><th>Email</th><th>Nama</th><th>Role</th><th>Status</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.email)}</td><td>${esc(x.name)}</td><td>${esc(x.role)}</td><td>${esc(x.status)}</td></tr>`).join("")}</tbody></table></div>`}catch(e){showToast(e.message)}finally{hideLoading()}}
function showPage(page){document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));document.getElementById(page+"Page").classList.remove("hidden");document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));const btn=document.querySelector(`.nav[data-page="${page}"]`);if(btn)btn.classList.add("active");if(page==="history")loadHistory();if(page==="users")loadUsers()}
async function logout(){try{if(sessionToken)await api("logout")}catch(e){}finally{clearSession();dashboard=null;showLogin();setLoginStatus("Kamu sudah logout.")}}
function showLoading(){document.getElementById("loading").classList.remove("hidden")}
function hideLoading(){document.getElementById("loading").classList.add("hidden")}
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;setTimeout(()=>t.textContent="",3500)}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
