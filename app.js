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

// ===== TEMA TERANG / GELAP =====
function initTheme(){
  const saved=localStorage.getItem("office_theme");
  if(saved==="dark")document.body.classList.add("dark");
  updateThemeIcon();
}
function toggleTheme(){
  document.body.classList.toggle("dark");
  localStorage.setItem("office_theme",document.body.classList.contains("dark")?"dark":"light");
  updateThemeIcon();
}
function updateThemeIcon(){
  const btn=document.getElementById("themeToggleBtn");
  if(btn)btn.textContent=document.body.classList.contains("dark")?"☀":"🌙";
}
initTheme();

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

// Ambil IP publik browser sendiri untuk dicocokkan ke daftar Allowed_IP di backend.
// Catatan: ini nilai yang dikirim klien, bukan dideteksi server - lihat penjelasan di Code.gs.
async function getClientIp(){
  try{
    const res=await fetch("https://api.ipify.org?format=json");
    const data=await res.json();
    return data.ip||"";
  }catch(e){return ""}
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
    // Render settings jika sudah ada data
    renderSettings();
    showShiftPicker();
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

// ===== SHIFT PICKER: muncul di atas kartu shift begitu dashboard dibuka =====
function showShiftPicker(){
  const myRole=String(dashboard?.user?.role||"").toUpperCase();
  if(!MANAGE_ROLES.includes(myRole))return; // hanya yang boleh atur shift yang ditanya
  const banner=document.getElementById("shiftPickerBanner");
  if(!banner)return;
  const cur=document.getElementById("shiftPickerCurrent");
  if(cur)cur.textContent=dashboard?.shift?.shift||"-";
  banner.classList.remove("hidden");
}
function hideShiftPicker(){document.getElementById("shiftPickerBanner")?.classList.add("hidden")}

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
  
  // Shift Pagi & Malam
  const shiftPagi=document.getElementById("shiftPagiBtn");
  const shiftMalam=document.getElementById("shiftMalamBtn");
  if(shiftPagi) shiftPagi.onclick=()=>startShiftWithName("SHIFT PAGI");
  if(shiftMalam) shiftMalam.onclick=()=>startShiftWithName("SHIFT MALAM");

  const changePw=document.getElementById("changePasswordBtn");
  if(changePw) changePw.onclick=submitChangePassword;

  const themeBtn=document.getElementById("themeToggleBtn");
  if(themeBtn) themeBtn.onclick=toggleTheme;

  const pickerPagi=document.getElementById("shiftPickerPagi");
  const pickerMalam=document.getElementById("shiftPickerMalam");
  const pickerSkip=document.getElementById("shiftPickerSkip");
  if(pickerPagi) pickerPagi.onclick=()=>{hideShiftPicker();startShiftWithName("SHIFT PAGI");};
  if(pickerMalam) pickerMalam.onclick=()=>{hideShiftPicker();startShiftWithName("SHIFT MALAM");};
  if(pickerSkip) pickerSkip.onclick=hideShiftPicker;
}

async function submitChangePassword(){
  const oldPassword=document.getElementById("oldPasswordInput")?.value||"";
  const newPassword=document.getElementById("newPasswordInput")?.value||"";
  const confirmPassword=document.getElementById("confirmPasswordInput")?.value||"";
  const status=document.getElementById("passwordStatus");
  const setStatus=msg=>{if(status)status.textContent=msg||""};

  if(newPassword.length<6)return setStatus("Password baru minimal 6 karakter.");
  if(newPassword!==confirmPassword)return setStatus("Konfirmasi password tidak cocok.");

  try{
    showLoading();setStatus("");
    await api("changePassword",{oldPassword,newPassword});
    showToast("✓ Password berhasil diubah");
    setStatus("");
    document.getElementById("oldPasswordInput").value="";
    document.getElementById("newPasswordInput").value="";
    document.getElementById("confirmPasswordInput").value="";
  }catch(e){
    setStatus(e.message);
  }finally{hideLoading()}
}

// ===== SHIFT PAGI & MALAM =====
async function startShiftWithName(shiftName){
  if(!confirm(`Mulai ${shiftName}? Semua checkbox aktif akan di-reset untuk shift baru.`)) return;
  try{
    showLoading();
    await api("startNewShift",{shift: shiftName});
    showToast(`✓ ${shiftName} berhasil dimulai`);
    await refreshDashboard();
    // Highlight tombol shift yang aktif
    document.querySelectorAll(".shift-btn").forEach(btn => btn.classList.remove("active-shift"));
    if(shiftName === "SHIFT PAGI"){
      document.getElementById("shiftPagiBtn")?.classList.add("active-shift");
    } else if(shiftName === "SHIFT MALAM"){
      document.getElementById("shiftMalamBtn")?.classList.add("active-shift");
    }
  }catch(e){
    showToast(e.message);
  }finally{hideLoading()}
}

// ===== SETTINGS - REKAP HP =====
const settingsData = {
  bankKas: {
    title: '1. HP BANK KAS',
    badge: 'BANK KAS',
    badgeClass: 'badge-bank-kas',
    data: [
      { bank: 'BANK BCA', value: 2 },
      { bank: 'BANK MANDIRI', value: 2 }
    ],
    total: 4
  },
  wdDp: {
    title: '2. HP WD & DP',
    badge: 'WD & DP',
    badgeClass: 'badge-wd-dp',
    data: [
      { bank: 'BANK BCA', value: 5 },
      { bank: 'BANK MANDIRI', value: 4 },
      { bank: 'WD MAYBANK', value: 1 },
      { bank: 'BANK BNI', value: 2 },
      { bank: 'BANK BRI', value: 5 },
      { bank: 'BANK CIMB', value: 0 }
    ],
    total: 17
  },
  depo: {
    title: '3. HP DEPO',
    badge: 'DEPO',
    badgeClass: 'badge-depo',
    data: [
      { bank: 'BANK BCA', value: 9 },
      { bank: 'BANK BRI', value: 8 },
      { bank: 'BANK BNI', value: 3 },
      { bank: 'BANK MAYBANK', value: 2 },
      { bank: 'BANK DANAMON', value: 1 },
      { bank: 'BANK MANDIRI', value: 4 },
      { bank: 'BANK CIMB', value: 1 }
    ],
    total: 28
  },
  wdBersih: {
    title: '4. HP WD BERSIH & KOTOR',
    badge: 'WD BERSIH',
    badgeClass: 'badge-wd-bersih',
    data: [
      { bank: 'BANK BCA', value: 47 },
      { bank: 'BANK BRI', value: 21 },
      { bank: 'BANK BNI', value: 3 },
      { bank: 'BANK DANAMON', value: 2 },
      { bank: 'BANK MANDIRI', value: 3 },
      { bank: 'BANK MAYBANK', value: 1 }
    ],
    total: 77
  },
  dataHp: {
    title: '5. DATA HP',
    badge: 'DATA HP',
    badgeClass: 'badge-data-hp',
    data: [
      { bank: 'HP BARU', value: 10 },
      { bank: 'HP', value: 11 }
    ],
    total: 21
  },
  bermasalah: {
    title: '6. HP BERMASALAH / OFF',
    badge: 'BERMASALAH',
    badgeClass: 'badge-bermasalah',
    data: [
      { bank: 'SISA HP BERMASALAH/OFF', value: 21 }
    ],
    total: 21
  }
};

const summaryData = [
  { label: 'HP BANK KAS', value: 4 },
  { label: 'HP WD & DP', value: 17 },
  { label: 'HP DEPO', value: 28 },
  { label: 'HP WD BERSIH & KOTOR', value: 77 },
  { label: 'HP BARU', value: 10 },
  { label: 'HP', value: 11 },
  { label: 'HP BERMASALAH / OFF', value: 21 }
];

function renderSettings() {
  const container = document.getElementById('settingsContent');
  if(!container) return;
  
  let html = '';

  // Render setiap card
  Object.values(settingsData).forEach(card => {
    html += `
      <div class="settings-card">
        <div class="card-title">
          ${card.title}
          <span class="badge ${card.badgeClass}">${card.badge}</span>
        </div>
    `;
    card.data.forEach(item => {
      const valueColor = item.value === 0 ? '#d9534f' : '';
      html += `
        <div class="bank-item">
          <span class="bank-name">${item.bank}</span>
          <span class="bank-value" style="color:${valueColor}">${item.value}</span>
        </div>
      `;
    });
    html += `
        <div class="total-row">
          <span class="total-label">TOTAL</span>
          <span class="total-value">${card.total} HP</span>
        </div>
      </div>
    `;
  });

  // Render Ringkasan
  html += `
    <div class="settings-card summary-card">
      <div class="card-title">
        📊 RINGKASAN TOTAL
        <span class="badge badge-ringkasan">TOTAL</span>
      </div>
      <div class="summary-grid">
  `;
  summaryData.forEach(item => {
    const highlight = item.value > 50 ? 'highlight' : '';
    html += `
      <div class="summary-item ${highlight}">
        <span class="sum-label">${item.label}</span>
        <span class="sum-value">${item.value} HP</span>
      </div>
    `;
  });
  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;
}

async function startLogin(){
  const email=(document.getElementById("loginEmail")?.value||"").trim().toLowerCase();
  const password=document.getElementById("loginPassword")?.value||"";
  if(!email)return setLoginStatus("Email wajib diisi.");
  if(!password)return setLoginStatus("Password wajib diisi.");
  try{
    showLoading();setLoginStatus("Memverifikasi...");
    const clientIp=await getClientIp();
    const result=await api("login",{email,password,clientIp});
    if(!result?.token)throw new Error("Login gagal: session tidak dibuat.");
    sessionToken=result.token;
    localStorage.setItem(CONFIG.SESSION_KEY,sessionToken);
    dashboard=await api("getDashboard");
    renderUser();renderStats();renderTable();renderOnline();
    renderSettings();
    setLoginStatus("");
    showShiftPicker();
  }catch(e){clearSession();showLogin();setLoginStatus(e.message)}finally{hideLoading()}
}

function renderUser(){
  const u=dashboard.user;
  document.getElementById("userEmail").textContent=u.email;
  document.getElementById("userRole").textContent=u.role;
  document.getElementById("shiftText").textContent=dashboard.shift.shift;
  document.getElementById("shiftName").textContent=dashboard.shift.shift;
  document.getElementById("shiftInfo").textContent=`Mulai ${dashboard.shift.startTime} • ${dashboard.shift.startedBy}`;
  
  // Highlight tombol shift yang aktif
  document.querySelectorAll(".shift-btn").forEach(btn => btn.classList.remove("active-shift"));
  const shiftName = dashboard.shift.shift || "";
  if(shiftName.toUpperCase().includes("PAGI")){
    document.getElementById("shiftPagiBtn")?.classList.add("active-shift");
  } else if(shiftName.toUpperCase().includes("MALAM")){
    document.getElementById("shiftMalamBtn")?.classList.add("active-shift");
  }
  
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
  }catch(e){
    showToast(e.message);
  }finally{hideLoading()}
}
async function refreshDashboard(){
  try{
    dashboard=await api("getDashboard");
    renderUser();renderStats();renderTable();renderOnline();
    renderSettings();
  }catch(e){
    if(/session|login|token/i.test(e.message)){
      stopHeartbeat();clearSession();showLogin();setLoginStatus(e.message);
    }else showToast(e.message);
  }
}
async function loadHistory(){
  try{
    showLoading();
    const rows=await api("getHistory");
    renderHistoryGrouped(rows);
  }catch(e){showToast(e.message)}finally{hideLoading()}
}

// Baris audit (terbaru dulu) dikelompokkan per blok shift yang sama (baris dengan shift
// sama selalu berurutan karena ditulis dari nilai shift aktif saat itu). Yang ditonjolkan
// hanya aktivitas cek/uncek per staf, biar tidak perlu baca ratusan baris satu-satu.
function renderHistoryGrouped(rows){
  const container=document.getElementById("historyTable");
  if(!container)return;
  if(!rows||!rows.length){container.innerHTML='<p class="history-item muted">Belum ada riwayat.</p>';return;}

  const groups=[];
  rows.forEach(r=>{
    const last=groups[groups.length-1];
    if(!last||last.shift!==r.shift) groups.push({shift:r.shift,rows:[r]});
    else last.rows.push(r);
  });

  container.innerHTML=groups.map(g=>{
    const starter=g.rows.find(r=>r.action==="NEW_SHIFT");
    const boundaryInfo=starter
      ?`Mulai ${esc(starter.timestamp)} • oleh ${esc(starter.email)}`
      :`Hingga ${esc(g.rows[g.rows.length-1].timestamp)}`;
    const checks=g.rows.filter(r=>r.action==="CHECK"||r.action==="UNCHECK");
    const items=checks.length
      ?checks.map(r=>`<div class="history-item"><b>${esc(r.timestamp)}</b> — ${esc(r.email)} ${r.action==="CHECK"?"mencentang":"membatalkan cek"} <b>${esc(r.item)}</b></div>`).join("")
      :'<div class="history-item muted">Tidak ada aktivitas cek di shift ini.</div>';
    return `<div class="history-group">
      <div class="history-group-header"><b>${esc(g.shift||"-")}</b><small>${boundaryInfo} • ${checks.length} kali cek</small></div>
      <div class="history-group-body">${items}</div>
    </div>`;
  }).join("");
}
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
function showPage(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));
  document.getElementById(page+"Page").classList.remove("hidden");
  document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));
  const btn=document.querySelector(`.nav[data-page="${page}"]`);
  if(btn)btn.classList.add("active");
  if(page==="history")loadHistory();
  if(page==="users")loadUsers();
  if(page==="settings")renderSettings();
}
async function logoutUser(){
  try{
    showLoading();
    if(sessionToken)await api("logout");
  }catch(e){}finally{
    stopHeartbeat();
    clearSession();
    dashboard=null;
    showLogin();
    setLoginStatus("Kamu sudah logout.");
    hideLoading();
  }
}
function formatTime(iso){if(!iso)return"";try{return new Date(iso).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}catch(e){return iso}}
function showLoading(){document.getElementById("loading").classList.remove("hidden")}
function hideLoading(){document.getElementById("loading").classList.add("hidden")}
function showToast(msg){const t=document.getElementById("toast");t.textContent=msg;setTimeout(()=>t.textContent="",3500)}
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}
