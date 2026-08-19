/**
 * ============================================================================
 * OFFICE DATA CENTER - HIGH SPEED HP MONITORING ENGINE V3
 * ============================================================================
 */

// Application State
const STATE = {
  currentUser: null,
  sessionToken: localStorage.getItem(CONFIG.SESSION_KEY) || '',
  activePage: 'monitoring',
  activeCategory: 'all',
  shift: { shift: 'SHIFT 1', startTime: '19/08/2026', startedBy: 'SYSTEM' },
  
  // Data Containers
  allData: [],
  withdrawData: [],
  depoData: [],
  bankKasData: [],
  tokenData: [],
  users: [],
  logs: [],
  onlineUsers: [],

  // Filtering & Pagination
  searchQuery: '',
  checkFilter: 'ALL',
  bankFilter: 'ALL',
  currentPage: 1,
  pageSize: 10,

  // Selected Target for Role/Edit Modals
  activeTarget: null
};

let heartbeatTimer = null;

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', init);

async function init() {
  bindEvents();
  startClock();
  loadCustomLogo();

  // Load custom API URL if stored
  const customApi = localStorage.getItem('custom_api_url');
  if (customApi) CONFIG.API_URL = customApi;
  const apiUrlInput = document.getElementById('settingApiUrl');
  if (apiUrlInput) apiUrlInput.value = CONFIG.API_URL;

  if (STATE.sessionToken) {
    try {
      showTopProgress();
      await fetchDashboardData();
      showDashboard();
      startHeartbeat();
    } catch (e) {
      console.warn('Session check fallback:', e.message);
      loadFallbackData();
      showDashboard();
    } finally {
      hideTopProgress();
    }
  } else {
    showLogin();
  }
}

// ============================================================================
// API TRANSPORT (JSONP & ASYNC CALLS TO APPS SCRIPT)
// ============================================================================
function api(action, data = {}) {
  return new Promise((resolve, reject) => {
    if (!CONFIG.API_URL) return reject(new Error('API_URL belum diatur di config.js'));

    const id = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const callbackName = '__officeApi_' + id;
    const script = document.createElement('script');
    const params = new URLSearchParams();

    params.set('action', action);
    params.set('token', STATE.sessionToken || '');
    params.set('callback', callbackName);
    params.set('_', Date.now().toString());

    Object.entries(data || {}).forEach(([key, val]) => {
      params.set(key, String(val ?? ''));
    });

    let finished = false;
    const finish = (fn, val) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
      fn(val);
    };

    window[callbackName] = (payload) => {
      if (payload && payload.success) finish(resolve, payload.data);
      else finish(reject, new Error(payload?.message || 'API Error'));
    };

    script.src = CONFIG.API_URL + '?' + params.toString();
    script.onerror = () => finish(reject, new Error('Koneksi ke Apps Script gagal.'));

    document.head.appendChild(script);

    // Timeout 15 Detik
    const timer = setTimeout(() => {
      finish(reject, new Error('Timeout koneksi Apps Script.'));
    }, 15000);
  });
}

// ============================================================================
// EVENT BINDINGS
// ============================================================================
function bindEvents() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Sidebar toggle for mobile
  const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mainSidebar = document.getElementById('mainSidebar');

  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      mainSidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('active');
    });
  }
  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
      mainSidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      mainSidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    });
  }

  // Navigation Links
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.dataset.page;
      if (pageId) navigateToPage(pageId);
      if (window.innerWidth <= 768) {
        mainSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      }
    });
  });

  // Realtime HP Search & Filters
  const hpSearchInput = document.getElementById('hpSearchInput');
  const clearHpSearchBtn = document.getElementById('clearHpSearchBtn');
  if (hpSearchInput) {
    hpSearchInput.addEventListener('input', debounce((e) => {
      STATE.searchQuery = e.target.value.trim();
      STATE.currentPage = 1;
      if (clearHpSearchBtn) clearHpSearchBtn.classList.toggle('hidden', !STATE.searchQuery);
      filterAndRenderHp();
    }, 120));
  }

  if (clearHpSearchBtn) {
    clearHpSearchBtn.addEventListener('click', () => {
      hpSearchInput.value = '';
      STATE.searchQuery = '';
      STATE.currentPage = 1;
      clearHpSearchBtn.classList.add('hidden');
      filterAndRenderHp();
    });
  }

  const hpCheckFilter = document.getElementById('hpCheckFilter');
  if (hpCheckFilter) {
    hpCheckFilter.addEventListener('change', (e) => {
      STATE.checkFilter = e.target.value;
      STATE.currentPage = 1;
      filterAndRenderHp();
    });
  }

  const hpBankFilter = document.getElementById('hpBankFilter');
  if (hpBankFilter) {
    hpBankFilter.addEventListener('change', (e) => {
      STATE.bankFilter = e.target.value;
      STATE.currentPage = 1;
      filterAndRenderHp();
    });
  }

  const hpPageSizeSelect = document.getElementById('hpPageSizeSelect');
  if (hpPageSizeSelect) {
    hpPageSizeSelect.addEventListener('change', (e) => {
      STATE.pageSize = parseInt(e.target.value, 10) || 10;
      STATE.currentPage = 1;
      filterAndRenderHp();
    });
  }

  // Logs Search
  const logSearchInput = document.getElementById('logSearchInput');
  if (logSearchInput) {
    logSearchInput.addEventListener('input', debounce((e) => {
      renderLogsTable(e.target.value.trim());
    }, 150));
  }

  // Logo file upload
  const logoFileInput = document.getElementById('logoFileInput');
  if (logoFileInput) logoFileInput.addEventListener('change', handleLogoUpload);
}

// ============================================================================
// AUTHENTICATION
// ============================================================================
function quickFillEmail(email) {
  const input = document.getElementById('loginEmail');
  if (input) input.value = email;
  hideLoginAlert();
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const email = (emailInput?.value || '').trim();

  if (!email) {
    showLoginAlert('Masukkan email yang terdaftar pada Sheet Users.');
    return;
  }

  submitBtn.querySelector('.btn-text').classList.add('hidden');
  submitBtn.querySelector('.btn-spinner').classList.remove('hidden');
  submitBtn.disabled = true;

  try {
    showTopProgress();
    // Panggil login API
    const res = await api('login', { email: email });
    if (!res || !res.token) throw new Error('Login gagal: Session token tidak dibuat.');

    STATE.sessionToken = res.token;
    STATE.currentUser = res.user;
    localStorage.setItem(CONFIG.SESSION_KEY, res.token);

    // Ambil data dashboard lengkap
    await fetchDashboardData();
    showDashboard();
    startHeartbeat();
    showToast(`Selamat datang, ${res.user.name}! (Role: ${res.user.role})`, 'success');
  } catch (err) {
    console.warn('Online login error, checking local fallback:', err.message);
    // Fallback login lokal jika offline
    let role = 'CS';
    if (email.includes('rizky') || email.includes('master') || email.includes('admin')) role = 'SUPER MASTER';
    else if (email.includes('leader')) role = 'LEADER';
    else if (email.includes('kapten')) role = 'KAPTEN';
    else if (email.includes('kasir')) role = 'KASIR';

    STATE.currentUser = { email: email, name: email.split('@')[0].toUpperCase(), role: role };
    STATE.sessionToken = 'LOCAL_TOKEN_' + Date.now();
    localStorage.setItem(CONFIG.SESSION_KEY, STATE.sessionToken);

    loadFallbackData();
    showDashboard();
    showToast(`Mode Standalone: Login sebagai ${role}`, 'info');
  } finally {
    submitBtn.querySelector('.btn-text').classList.remove('hidden');
    submitBtn.querySelector('.btn-spinner').classList.add('hidden');
    submitBtn.disabled = false;
    hideTopProgress();
  }
}

async function handleLogout() {
  try {
    showTopProgress();
    if (STATE.sessionToken) await api('logout');
  } catch (e) {
  } finally {
    stopHeartbeat();
    STATE.sessionToken = '';
    STATE.currentUser = null;
    localStorage.removeItem(CONFIG.SESSION_KEY);
    showLogin();
    hideTopProgress();
    showToast('Anda telah logout.', 'info');
  }
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  hideLoginAlert();
}

function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  applyRolePermissions();
  renderUserProfile();
  renderShiftBanner();
  renderCategoryTabs();
  filterAndRenderHp();
  renderStats();
  renderUsersTable();
  renderLogsTable();
}

function showLoginAlert(msg) {
  const alertBox = document.getElementById('loginAlert');
  document.getElementById('loginAlertText').textContent = msg;
  alertBox.classList.remove('hidden');
}

function hideLoginAlert() {
  const alertBox = document.getElementById('loginAlert');
  if (alertBox) alertBox.classList.add('hidden');
}

// ============================================================================
// DATA SYNC WITH GOOGLE SHEETS
// ============================================================================
async function fetchDashboardData() {
  const res = await api('getDashboard');
  if (!res) throw new Error('Data dashboard kosong.');

  STATE.currentUser = res.user || STATE.currentUser;
  STATE.shift = res.shift || STATE.shift;
  STATE.onlineUsers = res.online || [];

  const d = res.data || {};
  STATE.withdrawData = d.withdraw || [];
  STATE.depoData = d.depo || [];
  STATE.bankKasData = d.bankKas || [];
  STATE.tokenData = d.token || [];
  STATE.allData = d.all || [].concat(STATE.withdrawData, STATE.depoData, STATE.bankKasData, STATE.tokenData);

  // Simpan ke cache lokal
  localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify({
    all: STATE.allData,
    withdraw: STATE.withdrawData,
    depo: STATE.depoData,
    bankKas: STATE.bankKasData,
    token: STATE.tokenData,
    shift: STATE.shift,
    user: STATE.currentUser
  }));
}

async function refreshDashboardData() {
  showTopProgress();
  try {
    await fetchDashboardData();
    renderShiftBanner();
    renderCategoryTabs();
    filterAndRenderHp();
    renderStats();
    showToast('✓ Data berhasil disinkronkan dari Sheet DATA BANK!', 'success');
  } catch (err) {
    showToast('Gagal sinkron: ' + err.message, 'danger');
  } finally {
    hideTopProgress();
  }
}

// ============================================================================
// ROLE PERMISSION MATRIX
// ============================================================================
function applyRolePermissions() {
  const role = (STATE.currentUser?.role || 'CS').toUpperCase();
  const shiftActions = document.getElementById('shiftAdminActions');
  const navUsers = document.getElementById('navUsers');
  const navLogs = document.getElementById('navLogs');
  const navSettings = document.getElementById('navSettings');
  const navSectionAdmin = document.getElementById('navSectionAdmin');

  // SUPER MASTER: Full Access
  if (role === 'SUPER MASTER') {
    if (shiftActions) shiftActions.style.display = 'block';
    if (navUsers) navUsers.classList.remove('hidden');
    if (navLogs) navLogs.classList.remove('hidden');
    if (navSettings) navSettings.classList.remove('hidden');
    if (navSectionAdmin) navSectionAdmin.classList.remove('hidden');
  }
  // LEADER: Full View, Ubah Role, Audit Log
  else if (role === 'LEADER') {
    if (shiftActions) shiftActions.style.display = 'block';
    if (navUsers) navUsers.classList.remove('hidden');
    if (navLogs) navLogs.classList.remove('hidden');
    if (navSettings) navSettings.classList.add('hidden');
    if (navSectionAdmin) navSectionAdmin.classList.remove('hidden');
  }
  // CS & KAPTEN: Fokus Pengecekan
  else if (role === 'CS' || role === 'KAPTEN') {
    if (shiftActions) shiftActions.style.display = 'none';
    if (navUsers) navUsers.classList.add('hidden');
    if (navLogs) navLogs.classList.add('hidden');
    if (navSettings) navSettings.classList.add('hidden');
    if (navSectionAdmin) navSectionAdmin.classList.add('hidden');
  }
  // KASIR: Fokus Kas & Transaksi
  else if (role === 'KASIR') {
    if (shiftActions) shiftActions.style.display = 'none';
    if (navUsers) navUsers.classList.add('hidden');
    if (navLogs) navLogs.classList.add('hidden');
    if (navSettings) navSettings.classList.add('hidden');
    if (navSectionAdmin) navSectionAdmin.classList.add('hidden');
  }
}

function renderUserProfile() {
  const user = STATE.currentUser || { email: 'user@office.local', name: 'User', role: 'CS' };
  const initial = (user.name || user.email).charAt(0).toUpperCase();

  document.getElementById('sidebarUserName').textContent = user.name || user.email;
  document.getElementById('sidebarUserRole').textContent = user.role;
  document.getElementById('sidebarUserInitial').textContent = initial;

  document.getElementById('topbarUserName').textContent = user.name || user.email;
  const topRole = document.getElementById('topbarUserRole');
  topRole.textContent = user.role;
  topRole.className = `profile-role-mini badge-role ${getRoleBadgeClass(user.role)}`;
  document.getElementById('topbarUserInitial').textContent = initial;
}

function getRoleBadgeClass(role) {
  switch ((role || '').toUpperCase()) {
    case 'SUPER MASTER': return 'super-master';
    case 'LEADER': return 'leader';
    case 'CS': return 'cs';
    case 'KAPTEN': return 'kapten';
    case 'KASIR': return 'kasir';
    default: return 'reguler';
  }
}

// ============================================================================
// SHIFT BANNER & CONTROLS
// ============================================================================
function renderShiftBanner() {
  const s = STATE.shift || { shift: 'SHIFT 1', startTime: '19/08/2026', startedBy: 'SYSTEM' };
  document.getElementById('shiftBadge').textContent = s.shift;
  document.getElementById('shiftInfoText').textContent = `Dimulai: ${s.startTime} • Oleh: ${s.startedBy}`;
}

async function handleNewShift() {
  const current = STATE.shift.shift || 'SHIFT 1';
  const match = current.match(/(\d+)/);
  const next = `SHIFT ${match ? Number(match[1]) + 1 : 2}`;
  
  const shiftName = prompt('Mulai Shift Baru (Nama Shift):', next);
  if (!shiftName) return;

  if (!confirm(`Mulai ${shiftName}? Seluruh status kelengkapan HP akan di-reset (BELUM DI CEK) untuk shift baru.`)) {
    return;
  }

  showTopProgress();
  try {
    await api('startNewShift', { shift: shiftName });
    showToast(`✓ ${shiftName} berhasil dimulai! Seluruh HP siap dicek.`, 'success');
    await refreshDashboardData();
  } catch (err) {
    showToast('Gagal memulai shift baru: ' + err.message, 'danger');
  } finally {
    hideTopProgress();
  }
}

// ============================================================================
// CATEGORY TABS & FILTERING
// ============================================================================
function switchCategory(cat) {
  STATE.activeCategory = cat;
  STATE.currentPage = 1;

  document.querySelectorAll('.category-tabs-bar .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });

  filterAndRenderHp();
}

function getActiveCategoryData() {
  switch (STATE.activeCategory) {
    case 'withdraw': return STATE.withdrawData;
    case 'depo': return STATE.depoData;
    case 'bankKas': return STATE.bankKasData;
    case 'token': return STATE.tokenData;
    default: return STATE.allData;
  }
}

function renderCategoryTabs() {
  document.getElementById('countCatAll').textContent = STATE.allData.length;
  document.getElementById('countCatWithdraw').textContent = STATE.withdrawData.length;
  document.getElementById('countCatDepo').textContent = STATE.depoData.length;
  document.getElementById('countCatBankKas').textContent = STATE.bankKasData.length;
  document.getElementById('countCatToken').textContent = STATE.tokenData.length;
}

// ============================================================================
// HIGH SPEED HP MONITORING TABLE (INSTANT CHECK NO RELOAD)
// ============================================================================
function filterAndRenderHp() {
  const dataset = getActiveCategoryData();
  const query = STATE.searchQuery.toLowerCase();
  const checkFilter = STATE.checkFilter;
  const bankFilter = STATE.bankFilter;

  // In-Memory Fast Filter
  const filtered = dataset.filter(item => {
    if (query) {
      const match = `${item.number} ${item.bank} ${item.name} ${item.category} ${item.checkedBy || ''}`.toLowerCase();
      if (!match.includes(query)) return false;
    }
    if (checkFilter === 'UNCHECKED' && item.checked) return false;
    if (checkFilter === 'CHECKED' && !item.checked) return false;
    if (bankFilter !== 'ALL' && !item.bank.toUpperCase().includes(bankFilter)) return false;
    return true;
  });

  const total = filtered.length;
  const pageSize = STATE.pageSize;
  const totalPages = Math.ceil(total / pageSize) || 1;

  if (STATE.currentPage > totalPages) STATE.currentPage = totalPages;
  if (STATE.currentPage < 1) STATE.currentPage = 1;

  const startIndex = (STATE.currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paged = filtered.slice(startIndex, endIndex);

  const tbody = document.getElementById('hpTableBody');
  const emptyState = document.getElementById('hpEmptyState');
  const summary = document.getElementById('hpCountSummary');

  if (summary) {
    summary.textContent = `Menampilkan ${total === 0 ? 0 : startIndex + 1}-${endIndex} dari ${total} perangkat (Total Kategori: ${dataset.length})`;
  }

  if (total === 0) {
    if (tbody) tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    if (tbody) {
      const canEdit = ['SUPER MASTER', 'LEADER'].includes(STATE.currentUser?.role);

      tbody.innerHTML = paged.map((item, idx) => {
        const rowNo = startIndex + idx + 1;
        const isChecked = item.checked === true;

        // Tombol Status Pengecekan Interaktif (NO CHECKBOX)
        const checkStatusButton = isChecked
          ? `<button type="button" class="btn-check-status status-checked" onclick="updateHpCheck('${item.checkCell}', false, '${esc(item.name)}', '${item.category}')" title="Klik untuk membatalkan verifikasi">
              <i class="fa-solid fa-circle-check"></i> SUDAH DI CEK
             </button>`
          : `<button type="button" class="btn-check-status status-unchecked" onclick="updateHpCheck('${item.checkCell}', true, '${esc(item.name)}', '${item.category}')" title="Klik untuk verifikasi kelengkapan HP">
              <i class="fa-solid fa-clock-rotate-left"></i> BELUM DI CEK
             </button>`;

        const checkerHtml = isChecked && item.checkedBy && item.checkedBy !== '-'
          ? `<span class="checker-name">${esc(item.checkedBy)}</span>`
          : `<span class="text-muted">-</span>`;

        const checkTimeHtml = isChecked && item.checkedAt && item.checkedAt !== '-'
          ? `<span style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">${esc(item.checkedAt)}</span>`
          : `<span class="text-muted">-</span>`;

        return `
          <tr id="row-hp-${item.checkCell}">
            <td style="color: var(--text-dim);">${rowNo}</td>
            <td><span class="badge-pill bg-blue">${esc(item.category)}</span></td>
            <td><b>${esc(item.bank)}</b></td>
            <td>
              <div class="member-name-wrap">
                <span class="member-name-text">${esc(item.name)}</span>
                <small class="text-dim" style="font-size: 10px;">Cell: ${item.checkCell}</small>
              </div>
            </td>
            <td style="text-align: center;">${checkStatusButton}</td>
            <td>${checkTimeHtml}</td>
            <td>${checkerHtml}</td>
            <td style="text-align: right;">
              ${canEdit ? `
                <button type="button" class="btn-table-action" onclick="openEditHpModal('${item.nameCell}', '${esc(item.name)}')" title="Edit Nama HP">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
              ` : '<span class="text-muted">-</span>'}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  const container = document.getElementById('hpPaginationControls');
  if (!container) return;

  const current = STATE.currentPage;
  let html = `<button type="button" class="btn-page" ${current === 1 ? 'disabled' : ''} onclick="goToHpPage(${current - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;

  let startPage = Math.max(1, current - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let p = startPage; p <= endPage; p++) {
    html += `<button type="button" class="btn-page ${p === current ? 'active' : ''}" onclick="goToHpPage(${p})">${p}</button>`;
  }

  html += `<button type="button" class="btn-page" ${current === totalPages ? 'disabled' : ''} onclick="goToHpPage(${current + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function goToHpPage(page) {
  STATE.currentPage = page;
  filterAndRenderHp();
}

function resetHpFilters() {
  document.getElementById('hpSearchInput').value = '';
  document.getElementById('hpCheckFilter').value = 'ALL';
  document.getElementById('hpBankFilter').value = 'ALL';
  document.getElementById('clearHpSearchBtn').classList.add('hidden');

  STATE.searchQuery = '';
  STATE.checkFilter = 'ALL';
  STATE.bankFilter = 'ALL';
  STATE.currentPage = 1;

  filterAndRenderHp();
}

// ============================================================================
// INSTANT UPDATE CHECK WITHOUT RELOAD (OPTIMISTIC UPDATE + ASYNC SYNC)
// ============================================================================
async function updateHpCheck(cell, isChecked, itemName, category) {
  // 1. OPTIMISTIC UPDATE DI LOCAL STATE (0ms)
  const user = STATE.currentUser || { name: 'Petugas', role: 'STAFF', email: 'staff' };
  const ts = formatDateTime(new Date());
  const checkerString = `${user.role} (${user.name || user.email})`;

  function applyCheck(item) {
    if (item.checkCell === cell) {
      item.checked = isChecked;
      item.checkedBy = isChecked ? checkerString : '-';
      item.checkedAt = isChecked ? ts : '-';
    }
  }

  STATE.allData.forEach(applyCheck);
  STATE.withdrawData.forEach(applyCheck);
  STATE.depoData.forEach(applyCheck);
  STATE.bankKasData.forEach(applyCheck);
  STATE.tokenData.forEach(applyCheck);

  // Render seketika tanpa reload
  filterAndRenderHp();
  renderStats();
  renderQuickOverview();

  // Standardized Activity Log Format:
  // Format: LEADER - MEMBER123 - SUDAH DI CEK - 19/08/2026 21:45
  const logFormat = `${user.role} - ${itemName} - ${isChecked ? 'SUDAH DI CEK' : 'BELUM DI CEK'} - ${ts}`;
  showToast(`✓ ${itemName} (${isChecked ? 'SUDAH DI CEK' : 'BELUM DI CEK'})`, isChecked ? 'success' : 'info');

  // 2. ASYNC SYNC KE GOOGLE APPS SCRIPT (Background)
  try {
    showTopProgress();
    await api('updateCheck', {
      cell: cell,
      checked: isChecked,
      itemName: itemName,
      category: category
    });
  } catch (err) {
    console.warn('Sync background notice:', err.message);
  } finally {
    hideTopProgress();
  }
}

// ============================================================================
// EDIT NAMA PERANGKAT HP (SUPER MASTER & LEADER)
// ============================================================================
function openEditHpModal(nameCell, currentName) {
  document.getElementById('editHpCell').value = nameCell;
  document.getElementById('editHpCellDisplay').value = nameCell;
  document.getElementById('editHpNameInput').value = currentName;
  openModal('editHpModal');
}

async function handleConfirmEditHp() {
  const cell = document.getElementById('editHpCell').value;
  const newName = document.getElementById('editHpNameInput').value.trim();
  if (!newName) {
    showToast('Nama perangkat tidak boleh kosong.', 'danger');
    return;
  }

  showTopProgress();
  try {
    await api('editData', { cell: cell, value: newName });
    closeModal('editHpModal');
    showToast('✓ Nama perangkat berhasil diubah di Sheet DATA BANK', 'success');
    await refreshDashboardData();
  } catch (err) {
    showToast('Gagal mengubah data: ' + err.message, 'danger');
  } finally {
    hideTopProgress();
  }
}

// ============================================================================
// ROLE MANAGEMENT & USER MODAL
// ============================================================================
function openChangeRoleModal(email, name, currentRole) {
  STATE.activeTarget = { email: email, name: name, currentRole: currentRole };
  document.getElementById('modalTargetEmail').textContent = email;
  document.getElementById('modalTargetName').textContent = name;

  const roleBadge = document.getElementById('modalCurrentRole');
  roleBadge.textContent = currentRole;
  roleBadge.className = `badge-role ${getRoleBadgeClass(currentRole)}`;

  document.getElementById('selectNewRole').value = currentRole;
  openModal('changeRoleModal');
}

async function handleConfirmChangeRole() {
  if (!STATE.activeTarget) return;
  const newRole = document.getElementById('selectNewRole').value;
  const target = STATE.activeTarget;

  showTopProgress();
  try {
    await api('updateRole', { targetEmail: target.email, newRole: newRole });
    closeModal('changeRoleModal');
    showToast(`✓ Role ${target.name} berhasil diubah ke ${newRole}`, 'success');
    loadUsersTable();
  } catch (err) {
    showToast('Gagal mengubah role: ' + err.message, 'danger');
  } finally {
    hideTopProgress();
  }
}

async function loadUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  try {
    const users = await api('getUsers');
    STATE.users = users || [];
    renderUsersTable();
  } catch (err) {
    renderUsersTable();
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const list = STATE.users.length ? STATE.users : [
    { email: 'rizkykucuk19@gmail.com', name: 'Owner Rizky', role: 'SUPER MASTER', status: 'ACTIVE' },
    { email: 'ediw4717@gmail.com', name: 'EDI WAHYUDI', role: 'SUPER MASTER', status: 'ACTIVE' },
    { email: 'leader@office.local', name: 'Leader Shift', role: 'LEADER', status: 'ACTIVE' },
    { email: 'cs@office.local', name: 'CS Staff', role: 'CS', status: 'ACTIVE' }
  ];

  const canEdit = ['SUPER MASTER', 'LEADER'].includes(STATE.currentUser?.role);

  tbody.innerHTML = list.map((u, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><span class="member-id-cell">${esc(u.email)}</span></td>
      <td><b>${esc(u.name)}</b></td>
      <td><span class="badge-role ${getRoleBadgeClass(u.role)}">${esc(u.role)}</span></td>
      <td><span class="status-pill aktif">${esc(u.status)}</span></td>
      <td style="text-align: right;">
        ${canEdit ? `
          <button type="button" class="btn-secondary-sm" onclick="openChangeRoleModal('${esc(u.email)}', '${esc(u.name)}', '${esc(u.role)}')">
            <i class="fa-solid fa-user-shield"></i> Atur Role
          </button>
        ` : '-'}
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// AUDIT LOGS / RIWAYAT
// ============================================================================
async function loadAuditHistory() {
  showTopProgress();
  try {
    const logs = await api('getHistory');
    STATE.logs = logs || [];
    renderLogsTable();
    showToast('✓ Log aktivitas berhasil dimuat dari Audit_Log', 'success');
  } catch (err) {
    showToast('Gagal memuat log: ' + err.message, 'danger');
  } finally {
    hideTopProgress();
  }
}

function renderLogsTable(query = '') {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  const list = (STATE.logs && STATE.logs.length) ? STATE.logs : [
    { timestamp: '19/08/2026 21:45:12', email: 'leader@office.local', action: 'CHECK', shift: 'SHIFT 1', cell: 'E4', item: 'WD BCA / RATNASARI', newValue: 'LEADER - WD BCA / RATNASARI - SUDAH DI CEK - 19/08/2026 21:45' }
  ];

  const filtered = list.filter(l => {
    if (!query) return true;
    const match = `${l.timestamp} ${l.email} ${l.action} ${l.cell} ${l.item} ${l.newValue}`.toLowerCase();
    return match.includes(query.toLowerCase());
  });

  tbody.innerHTML = filtered.map((l, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">${esc(l.timestamp)}</td>
      <td><span class="checker-name">${esc(l.email)}</span></td>
      <td><span class="badge-pill bg-blue">${esc(l.action)}</span></td>
      <td>${esc(l.shift || '-')}</td>
      <td><span class="member-id-cell">${esc(l.cell || '-')}</span></td>
      <td><b>${esc(l.item || '-')}</b></td>
      <td><span class="log-badge-activity">${esc(l.newValue || l.action)}</span></td>
    </tr>
  `).join('');
}

// ============================================================================
// STATS & OVERVIEW
// ============================================================================
function renderStats() {
  const total = STATE.allData.length;
  const checked = STATE.allData.filter(x => x.checked).length;
  const unchecked = total - checked;

  document.getElementById('statTotalHp').textContent = total;
  document.getElementById('statUncheckedHp').textContent = unchecked;
  document.getElementById('statCheckedHp').textContent = checked;
  document.getElementById('statTotalToken').textContent = STATE.tokenData.length;

  const navBadge = document.getElementById('navUncheckedCount');
  if (navBadge) {
    navBadge.textContent = unchecked;
    navBadge.classList.toggle('hidden', unchecked === 0);
  }

  const progress = document.getElementById('statCheckProgress');
  if (progress) {
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    progress.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${pct}% Terverifikasi (${checked}/${total})`;
  }

  renderQuickOverview();
}

function renderQuickOverview() {
  const quickBody = document.getElementById('quickUncheckedHpBody');
  if (!quickBody) return;

  const unchecked = STATE.allData.filter(x => !x.checked).slice(0, 5);
  if (unchecked.length === 0) {
    quickBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--success); padding: 20px;"><i class="fa-solid fa-circle-check"></i> Seluruh perangkat HP telah diverifikasi!</td></tr>`;
  } else {
    quickBody.innerHTML = unchecked.map(x => `
      <tr>
        <td><span class="badge-pill bg-blue">${esc(x.category)}</span></td>
        <td><b>${esc(x.bank)}</b></td>
        <td>${esc(x.name)}</td>
        <td><span class="btn-check-status status-unchecked" style="cursor: default;"><i class="fa-solid fa-clock"></i> BELUM DI CEK</span></td>
        <td>
          <button class="btn-secondary-sm" onclick="updateHpCheck('${x.checkCell}', true, '${esc(x.name)}', '${x.category}')">
            <i class="fa-solid fa-check"></i> Cek
          </button>
        </td>
      </tr>
    `).join('');
  }
}

// ============================================================================
// ONLINE HEARTBEAT & PRESENCE
// ============================================================================
function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(async () => {
    if (!STATE.sessionToken) return;
    try {
      const res = await api('heartbeat', { page: STATE.activePage });
      if (res && res.online) {
        STATE.onlineUsers = res.online;
        renderOnlineUsers();
      }
    } catch (e) {}
  }, CONFIG.HEARTBEAT_INTERVAL || 15000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function renderOnlineUsers() {
  const el = document.getElementById('onlineUsersList');
  if (!el) return;
  const list = STATE.onlineUsers.length ? STATE.onlineUsers : [{ name: STATE.currentUser?.name || 'Anda' }];
  el.innerHTML = list.map(u => `<span class="user-chip">${esc(u.name)}</span>`).join('');
}

// ============================================================================
// NAVIGATION
// ============================================================================
function navigateToPage(pageId) {
  STATE.activePage = pageId;

  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  document.querySelectorAll('.app-page').forEach(page => page.classList.add('hidden'));

  const titleEl = document.getElementById('currentPageTitle');
  const subEl = document.getElementById('currentPageSubtitle');

  switch (pageId) {
    case 'monitoring':
      document.getElementById('pageMonitoring').classList.remove('hidden');
      titleEl.textContent = 'Monitoring Kelengkapan HP Office';
      subEl.textContent = 'Verifikasi kelengkapan HP Withdraw, Depo, Bank Kas & Token BCA';
      filterAndRenderHp();
      break;

    case 'overview':
      document.getElementById('pageOverview').classList.remove('hidden');
      titleEl.textContent = 'Ringkasan & Statistik';
      subEl.textContent = 'Pantau rasio pengecekan fisik perangkat per shift';
      renderStats();
      break;

    case 'users':
      document.getElementById('pageUsers').classList.remove('hidden');
      titleEl.textContent = 'Kelola User & Role Akses';
      subEl.textContent = 'Daftar user dari Sheet Users (Super Master, Leader, CS, Kapten, Kasir)';
      loadUsersTable();
      break;

    case 'logs':
      document.getElementById('pageLogs').classList.remove('hidden');
      titleEl.textContent = 'Log Aktivitas Pengecekan';
      subEl.textContent = 'Audit trail realtime yang tersimpan di Sheet Audit_Log';
      loadAuditHistory();
      break;

    case 'settings':
      document.getElementById('pageSettings').classList.remove('hidden');
      titleEl.textContent = 'Pengaturan Sistem & Endpoint';
      subEl.textContent = 'Konfigurasi Web App URL dan logo dashboard';
      break;
  }
}

// ============================================================================
// BRANDING & LOGO
// ============================================================================
function loadCustomLogo() {
  const logo = localStorage.getItem('custom_dashboard_logo');
  if (logo) applyLogoToDom(logo);
}

function handleLogoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = event.target.result;
    localStorage.setItem('custom_dashboard_logo', dataUrl);
    applyLogoToDom(dataUrl);
    showToast('✓ Logo utama dashboard berhasil diperbarui!', 'success');
  };
  reader.readAsDataURL(file);
}

function applyLogoToDom(src) {
  const loginImg = document.getElementById('loginLogoImg');
  const sidebarImg = document.getElementById('sidebarLogoImg');
  const preview = document.getElementById('settingsLogoPreview');
  if (loginImg) { loginImg.src = src; loginImg.style.display = 'block'; }
  if (sidebarImg) { sidebarImg.src = src; sidebarImg.style.display = 'block'; }
  if (preview) preview.src = src;
}

function saveApiUrlSetting() {
  const val = (document.getElementById('settingApiUrl')?.value || '').trim();
  if (val) {
    CONFIG.API_URL = val;
    localStorage.setItem('custom_api_url', val);
    showToast('✓ URL API berhasil disimpan!', 'success');
    refreshDashboardData();
  }
}

function testConnection() {
  showTopProgress();
  api('getDashboard').then(() => {
    showToast('✓ Koneksi ke Google Sheets (DATA BANK) berhasil!', 'success');
  }).catch(err => {
    showToast('Gagal terhubung: ' + err.message, 'danger');
  }).finally(hideTopProgress);
}

// Export CSV
function exportHpToCSV() {
  const headers = ['NO', 'KATEGORI', 'BANK', 'NAMA_PERANGKAT', 'CELL', 'STATUS_KELENGKAPAN', 'WAKTU_DICEK', 'DICEK_OLEH'];
  const dataset = getActiveCategoryData();
  const rows = dataset.map((item, idx) => [
    idx + 1,
    `"${item.category}"`,
    `"${item.bank}"`,
    `"${item.name}"`,
    `"${item.checkCell}"`,
    item.checked ? 'SUDAH DI CEK' : 'BELUM DI CEK',
    `"${item.checkedAt || '-'}"`,
    `"${item.checkedBy || '-'}"`
  ]);

  const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csv));
  link.setAttribute('download', `MONITORING_HP_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('✓ File CSV kelengkapan HP berhasil didownload', 'success');
}

// Fallback seed data if offline
function loadFallbackData() {
  const wdNames = [
    'WD BCA / RATNASARI', 'WD BCA / FAIZAL AULIADI', 'WD BCA / RENDHA YUSMAWAN SAPUTRA', 'WD BCA / MUHAMAD RAFI AL GHIFARI',
    'WD BCA / SAFIRA OKTAVIANA', 'WD BCA / DEDE BUDIYANTO', 'WD BCA / MARIANUS KOLI', 'WD BCA / SRI WAHYUNI',
    'WD BCA / A. HAETAMI', 'WD BCA / M. MUROK SYAFIUDIN', 'WD BCA / RUDI ARTANA', 'WD BRI / KEVIN MAULANA LUBIS',
    'WD BRI / NORMAYANTI', 'WD BRI / HARUN', 'WD BNI / Umi Salamah', 'WD DANAMON / Ima Fatimah Al Adawiyah', 'WD MANDIRI / HERNAWATI'
  ];

  STATE.withdrawData = wdNames.map((n, i) => ({
    id: 'E' + (i + 4), number: i + 1, category: 'WITHDRAW', bank: n.includes('BCA') ? 'BCA' : n.includes('BRI') ? 'BRI' : n.includes('BNI') ? 'BNI' : 'MANDIRI',
    name: n, checked: false, nameCell: 'D' + (i + 4), checkCell: 'E' + (i + 4), checkedBy: '-', checkedAt: '-'
  }));

  const depoNames = ['BCA G1 / AGUS MAULANA', 'BCA G9 / Maita Ayu Dwi Anggita', 'BCA G10 / OOM', 'BCA G11 / Han Setiawan', 'BRI G11 / Irpan Gunawan', 'BNI G4 / Herman'];
  STATE.depoData = depoNames.map((n, i) => ({
    id: 'I' + (i + 4), number: i + 1, category: 'DEPO', bank: n.includes('BCA') ? 'BCA' : n.includes('BRI') ? 'BRI' : 'BNI',
    name: n, checked: false, nameCell: 'H' + (i + 4), checkCell: 'I' + (i + 4), checkedBy: '-', checkedAt: '-'
  }));

  const kasNames = ['BANK KAS KECIL BCA / TUMINI MANURUNG', 'BANK KAS BESAR BCA / Teoh Li Tjien', 'KAS BESAR BCA / SITI ROHMAWATI', 'BANK KAS BESAR DANAMON / Priskila'];
  STATE.bankKasData = kasNames.map((n, i) => ({
    id: 'N' + (i + 4), number: i + 1, category: 'BANK KAS', bank: n.includes('BCA') ? 'BCA' : 'DANAMON',
    name: n, checked: false, nameCell: 'M' + (i + 4), checkCell: 'N' + (i + 4), checkedBy: '-', checkedAt: '-'
  }));

  const tokenNames = ['WD BCA / RUDI ARTANA ( TOKEN )', 'WD BCA / RATNASARI', 'DEPO IM-TOKEN RIZKA', 'DEPO IM-TOKEN HENRY'];
  STATE.tokenData = tokenNames.map((n, i) => ({
    id: 'R' + (i + 4), number: i + 1, category: 'TOKEN BCA', bank: 'BCA',
    name: n, checked: false, nameCell: 'Q' + (i + 4), checkCell: 'R' + (i + 4), checkedBy: '-', checkedAt: '-'
  }));

  STATE.allData = [].concat(STATE.withdrawData, STATE.depoData, STATE.bankKasData, STATE.tokenData);
}

// Helpers
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${esc(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function showTopProgress() { document.getElementById('topProgressBar')?.classList.remove('hidden'); }
function hideTopProgress() { document.getElementById('topProgressBar')?.classList.add('hidden'); }

function startClock() {
  const el = document.getElementById('realtimeClock');
  if (el) setInterval(() => { el.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false }); }, 1000);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function formatDateTime(d) {
  const pad = n => String(n).padStart(2, '0');
  const date = new Date(d);
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
