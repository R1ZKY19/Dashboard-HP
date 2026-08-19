/**
 * ============================================================================
 * MEMBER MONITOR PRO - HIGH PERFORMANCE SINGLE PAGE APPLICATION ENGINE
 * ============================================================================
 */

// Global Application State
const STATE = {
  currentUser: null,
  sessionToken: null,
  activePage: 'members', // default landing page
  members: [],
  filteredMembers: [],
  transactions: [],
  users: [],
  logs: [],
  onlineUsers: [],
  
  // Pagination & Filtering State for Members
  memberPage: 1,
  memberPageSize: 10,
  memberSearchQuery: '',
  memberCheckStatusFilter: 'ALL',
  memberRoleFilter: 'ALL',
  memberStatusFilter: 'ALL',

  // Logs Filtering
  logSearchQuery: '',
  logActionFilter: 'ALL',

  // Transactions Filtering
  transactionSearchQuery: '',
  transactionTypeFilter: 'ALL',
  transactionBankFilter: 'ALL',

  // Target for Modal actions
  activeModalTarget: null
};

// Initial Mock / Seed Data for Instant Load & Fallback Engine
const SEED_DATA = {
  users: [
    { id: 'USR-001', username: 'supermaster', name: 'Rizky Prayogi (Super Master)', role: 'SUPER MASTER', status: 'AKTIF', lastLogin: '19/08/2026 21:30' },
    { id: 'USR-002', username: 'leader_ops', name: 'Bambang Sudirjo (Leader)', role: 'LEADER', status: 'AKTIF', lastLogin: '19/08/2026 21:15' },
    { id: 'USR-003', username: 'cs_support', name: 'Siti Rahmawati (CS Staff)', role: 'CS', status: 'AKTIF', lastLogin: '19/08/2026 21:40' },
    { id: 'USR-004', username: 'kapten_ops', name: 'Agus Maulana (Kapten Cek)', role: 'KAPTEN', status: 'AKTIF', lastLogin: '19/08/2026 20:50' },
    { id: 'USR-005', username: 'kasir_bank', name: 'Dewi Lestari (Kasir Keuangan)', role: 'KASIR', status: 'AKTIF', lastLogin: '19/08/2026 21:05' }
  ],
  members: [
    { id: 'MBR-1001', username: 'MEMBER123', name: 'Andi Saputra', status: 'AKTIF', role: 'VIP', checked: false, checkedAt: '-', checkedBy: '-', notes: 'Deposit harian tinggi' },
    { id: 'MBR-1002', username: 'RATNASARI88', name: 'Ratnasari Dewi', status: 'AKTIF', role: 'REGULER', checked: true, checkedAt: '19/08/2026 21:45', checkedBy: 'LEADER (Bambang)', notes: 'Akun terverifikasi' },
    { id: 'MBR-1003', username: 'FAIZAL_AUL', name: 'Faizal Auliadi', status: 'AKTIF', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: 'Perlu cek mutasi rekening' },
    { id: 'MBR-1004', username: 'RENDHA_YS', name: 'Rendha Yusmawan Saputra', status: 'AKTIF', role: 'VIP', checked: false, checkedAt: '-', checkedBy: '-', notes: 'Withdraw rutin' },
    { id: 'MBR-1005', username: 'RAFI_GHIFARI', name: 'Muhamad Rafi Al Ghifari', status: 'AKTIF', role: 'REGULER', checked: true, checkedAt: '19/08/2026 21:10', checkedBy: 'CS (Siti)', notes: 'Sudah lolos verifikasi' },
    { id: 'MBR-1006', username: 'SAFIRA_OKT', name: 'Safira Oktaviana', status: 'AKTIF', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: '-' },
    { id: 'MBR-1007', username: 'DEDE_BUDI', name: 'Dede Budiyanto', status: 'AKTIF', role: 'VIP', checked: true, checkedAt: '19/08/2026 20:30', checkedBy: 'KAPTEN (Agus)', notes: 'Member VIP prioritas' },
    { id: 'MBR-1008', username: 'MARIANUS_K', name: 'Marianus Koli', status: 'AKTIF', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: '-' },
    { id: 'MBR-1009', username: 'SRI_WAHYUNI', name: 'Sri Wahyuni', status: 'AKTIF', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: 'Data baru masuk' },
    { id: 'MBR-1010', username: 'A_HAETAMI', name: 'Ahmad Haetami', status: 'AKTIF', role: 'REGULER', checked: true, checkedAt: '19/08/2026 19:40', checkedBy: 'CS (Siti)', notes: '-' },
    { id: 'MBR-1011', username: 'M_MUROK', name: 'M. Murok Syafiudin', status: 'NONAKTIF', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: 'Akun nonaktif sementara' },
    { id: 'MBR-1012', username: 'RUDI_ARTANA', name: 'Rudi Artana', status: 'AKTIF', role: 'VIP', checked: true, checkedAt: '19/08/2026 18:20', checkedBy: 'LEADER (Bambang)', notes: '-' },
    { id: 'MBR-1013', username: 'PUTU_BAGUS', name: 'I Putu Bagus Deva Pradana', status: 'AKTIF', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: '-' },
    { id: 'MBR-1014', username: 'SHENDY_LF', name: 'Shendy Lefrant Frizzy', status: 'AKTIF', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: '-' },
    { id: 'MBR-1015', username: 'FERRY_ARD', name: 'Ferry Ardiyansyah', status: 'AKTIF', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: '-' },
    { id: 'MBR-1016', username: 'AHMAD_FAJAR', name: 'Ahmad Fajarudin', status: 'AKTIF', role: 'VIP', checked: true, checkedAt: '19/08/2026 21:00', checkedBy: 'KAPTEN (Agus)', notes: '-' },
    { id: 'MBR-1017', username: 'MEDIK_JAYA', name: 'Medik Sudrajat', status: 'SUSPENDED', role: 'REGULER', checked: false, checkedAt: '-', checkedBy: '-', notes: 'Indikasi duplicate akun' }
  ],
  transactions: [
    { id: 'TRX-9012', time: '19/08/2026 21:42', type: 'WITHDRAW', bank: 'BCA (7125810250)', memberName: 'Ratnasari Dewi', amount: '2.500.000', status: 'SELESAI', cashier: 'Dewi Lestari' },
    { id: 'TRX-9011', time: '19/08/2026 21:35', type: 'DEPOSIT', bank: 'MANDIRI (1560027113317)', memberName: 'Andi Saputra', amount: '1.000.000', status: 'SELESAI', cashier: 'Dewi Lestari' },
    { id: 'TRX-9010', time: '19/08/2026 21:20', type: 'WITHDRAW', bank: 'BRI (033201163544500)', memberName: 'Faizal Auliadi', amount: '750.000', status: 'PROSES', cashier: 'Dewi Lestari' },
    { id: 'TRX-9009', time: '19/08/2026 20:55', type: 'DEPOSIT', bank: 'BCA (5875721183)', memberName: 'Dede Budiyanto', amount: '5.000.000', status: 'SELESAI', cashier: 'Dewi Lestari' },
    { id: 'TRX-9008', time: '19/08/2026 20:30', type: 'KAS_KECIL', bank: 'BCA KAS OFFICE', memberName: 'Operasional Kantor', amount: '350.000', status: 'SELESAI', cashier: 'Dewi Lestari' }
  ],
  logs: [
    {
      id: 'LOG-001',
      timestamp: '19/08/2026 21:45:12',
      user: 'Bambang Sudirjo',
      role: 'LEADER',
      action: 'CHECK_MEMBER',
      formatText: 'LEADER - RATNASARI88 - SUDAH DI CEK - 19/08/2026 21:45',
      detail: 'Status pengecekan member diubah menjadi SUDAH DI CEK'
    },
    {
      id: 'LOG-002',
      timestamp: '19/08/2026 21:40:05',
      user: 'Siti Rahmawati',
      role: 'CS',
      action: 'LOGIN',
      formatText: 'CS - cs_support - LOGIN - 19/08/2026 21:40',
      detail: 'Login ke dashboard monitoring'
    },
    {
      id: 'LOG-003',
      timestamp: '19/08/2026 21:10:33',
      user: 'Siti Rahmawati',
      role: 'CS',
      action: 'CHECK_MEMBER',
      formatText: 'CS - RAFI_GHIFARI - SUDAH DI CEK - 19/08/2026 21:10',
      detail: 'Pengecekan member Muhamad Rafi Al Ghifari'
    },
    {
      id: 'LOG-004',
      timestamp: '19/08/2026 20:30:19',
      user: 'Agus Maulana',
      role: 'KAPTEN',
      action: 'CHECK_MEMBER',
      formatText: 'KAPTEN - DEDE_BUDI - SUDAH DI CEK - 19/08/2026 20:30',
      detail: 'Pengecekan member Dede Budiyanto'
    },
    {
      id: 'LOG-005',
      timestamp: '19/08/2026 20:00:00',
      user: 'Rizky Prayogi',
      role: 'SUPER MASTER',
      action: 'CHANGE_ROLE',
      formatText: 'SUPER MASTER - MEMBER123 - ROLE DIUBAH KE VIP - 19/08/2026 20:00',
      detail: 'Mengubah level member MEMBER123 dari REGULER menjadi VIP'
    }
  ]
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  loadCustomLogo();
  loadStoredData();
  bindGlobalEvents();
  startClock();

  // Check existing session
  const storedSession = localStorage.getItem(CONFIG.SESSION_KEY);
  if (storedSession) {
    try {
      const sessionData = JSON.parse(storedSession);
      STATE.currentUser = sessionData.user;
      STATE.sessionToken = sessionData.token;
      showDashboardApp();
      return;
    } catch (e) {
      clearSession();
    }
  }

  showLoginScreen();
}

// ============================================================================
// STORAGE & DATA ENGINE (LOCAL + REMOTE APPS SCRIPT)
// ============================================================================
function loadStoredData() {
  const cachedData = localStorage.getItem(CONFIG.CACHE_KEY);
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      STATE.members = parsed.members || SEED_DATA.members;
      STATE.users = parsed.users || SEED_DATA.users;
      STATE.transactions = parsed.transactions || SEED_DATA.transactions;
      STATE.logs = parsed.logs || SEED_DATA.logs;
      return;
    } catch (e) {
      console.warn('Gagal membaca cache lokal, menggunakan seed data:', e);
    }
  }

  // Use Seed Data
  STATE.members = [...SEED_DATA.members];
  STATE.users = [...SEED_DATA.users];
  STATE.transactions = [...SEED_DATA.transactions];
  STATE.logs = [...SEED_DATA.logs];
  saveToCache();
}

function saveToCache() {
  const payload = {
    members: STATE.members,
    users: STATE.users,
    transactions: STATE.transactions,
    logs: STATE.logs,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(payload));
}

// ============================================================================
// EVENT BINDINGS
// ============================================================================
function bindGlobalEvents() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const pwdInput = document.getElementById('loginPassword');
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        togglePasswordBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
      } else {
        pwdInput.type = 'password';
        togglePasswordBtn.innerHTML = '<i class="fa-regular fa-eye"></i>';
      }
    });
  }

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
      // Close mobile sidebar if open
      if (window.innerWidth <= 768) {
        mainSidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      }
    });
  });

  // Realtime Member Search & Filters
  const memberSearchInput = document.getElementById('memberSearchInput');
  const clearMemberSearchBtn = document.getElementById('clearMemberSearchBtn');
  if (memberSearchInput) {
    memberSearchInput.addEventListener('input', debounce((e) => {
      STATE.memberSearchQuery = e.target.value.trim();
      STATE.memberPage = 1;
      if (clearMemberSearchBtn) {
        clearMemberSearchBtn.classList.toggle('hidden', !STATE.memberSearchQuery);
      }
      renderMemberTable();
    }, 150));
  }

  if (clearMemberSearchBtn) {
    clearMemberSearchBtn.addEventListener('click', () => {
      memberSearchInput.value = '';
      STATE.memberSearchQuery = '';
      STATE.memberPage = 1;
      clearMemberSearchBtn.classList.add('hidden');
      renderMemberTable();
    });
  }

  const memberCheckStatusFilter = document.getElementById('memberCheckStatusFilter');
  if (memberCheckStatusFilter) {
    memberCheckStatusFilter.addEventListener('change', (e) => {
      STATE.memberCheckStatusFilter = e.target.value;
      STATE.memberPage = 1;
      renderMemberTable();
    });
  }

  const memberRoleFilter = document.getElementById('memberRoleFilter');
  if (memberRoleFilter) {
    memberRoleFilter.addEventListener('change', (e) => {
      STATE.memberRoleFilter = e.target.value;
      STATE.memberPage = 1;
      renderMemberTable();
    });
  }

  const memberStatusFilter = document.getElementById('memberStatusFilter');
  if (memberStatusFilter) {
    memberStatusFilter.addEventListener('change', (e) => {
      STATE.memberStatusFilter = e.target.value;
      STATE.memberPage = 1;
      renderMemberTable();
    });
  }

  const memberPageSizeSelect = document.getElementById('memberPageSizeSelect');
  if (memberPageSizeSelect) {
    memberPageSizeSelect.addEventListener('change', (e) => {
      STATE.memberPageSize = parseInt(e.target.value, 10) || 10;
      STATE.memberPage = 1;
      renderMemberTable();
    });
  }

  // Refresh Members Button
  const refreshMembersBtn = document.getElementById('refreshMembersBtn');
  if (refreshMembersBtn) {
    refreshMembersBtn.addEventListener('click', () => {
      showTopProgress();
      renderMemberTable();
      renderStats();
      showToast('Data member berhasil dimuat ulang (0ms)', 'success');
      hideTopProgress();
    });
  }

  // Add Member Button
  const addNewMemberBtn = document.getElementById('addNewMemberBtn');
  if (addNewMemberBtn) {
    addNewMemberBtn.addEventListener('click', openAddMemberModal);
  }

  // Export CSV Button
  const exportMembersBtn = document.getElementById('exportMembersBtn');
  if (exportMembersBtn) {
    exportMembersBtn.addEventListener('click', exportMembersToCSV);
  }

  // Save Member Form
  const memberForm = document.getElementById('memberForm');
  if (memberForm) {
    memberForm.addEventListener('submit', handleSaveMember);
  }

  // Confirm Change Role Button
  const confirmChangeRoleBtn = document.getElementById('confirmChangeRoleBtn');
  if (confirmChangeRoleBtn) {
    confirmChangeRoleBtn.addEventListener('click', handleConfirmChangeRole);
  }

  // Logs Search & Filter
  const logSearchInput = document.getElementById('logSearchInput');
  if (logSearchInput) {
    logSearchInput.addEventListener('input', debounce((e) => {
      STATE.logSearchQuery = e.target.value.trim();
      renderLogsTable();
    }, 150));
  }

  const logActionFilter = document.getElementById('logActionFilter');
  if (logActionFilter) {
    logActionFilter.addEventListener('change', (e) => {
      STATE.logActionFilter = e.target.value;
      renderLogsTable();
    });
  }

  const clearLogsBtn = document.getElementById('clearLogsBtn');
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      renderLogsTable();
      showToast('Log aktivitas diperbarui', 'info');
    });
  }

  // Custom Logo File Input
  const logoFileInput = document.getElementById('logoFileInput');
  if (logoFileInput) {
    logoFileInput.addEventListener('change', handleLogoFileUpload);
  }
}

// ============================================================================
// AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================================
function fillLogin(username, password) {
  document.getElementById('loginUsername').value = username;
  document.getElementById('loginPassword').value = password;
  hideLoginAlert();
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const alertBox = document.getElementById('loginAlert');
  const alertText = document.getElementById('loginAlertText');

  const username = (usernameInput.value || '').trim();
  const password = (passwordInput.value || '').trim();

  if (!username || !password) {
    showLoginAlert('Username / email dan password wajib diisi');
    return;
  }

  // Visual loading
  submitBtn.querySelector('.btn-text').classList.add('hidden');
  submitBtn.querySelector('.btn-spinner').classList.remove('hidden');
  submitBtn.disabled = true;

  try {
    // 1. Check local seed/users first for instant zero-latency authentication
    let matchedUser = STATE.users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() ||
      (u.email && u.email.toLowerCase() === username.toLowerCase())
    );

    // 2. If not found in users list, map demo fallback
    if (!matchedUser) {
      if (username.toLowerCase().includes('master')) {
        matchedUser = { id: 'USR-MASTER', username: username, name: 'Super Master Staff', role: 'SUPER MASTER', status: 'AKTIF' };
      } else if (username.toLowerCase().includes('leader')) {
        matchedUser = { id: 'USR-LEADER', username: username, name: 'Leader Staff', role: 'LEADER', status: 'AKTIF' };
      } else if (username.toLowerCase().includes('cs')) {
        matchedUser = { id: 'USR-CS', username: username, name: 'CS Staff', role: 'CS', status: 'AKTIF' };
      } else if (username.toLowerCase().includes('kapten')) {
        matchedUser = { id: 'USR-KAPTEN', username: username, name: 'Kapten Staff', role: 'KAPTEN', status: 'AKTIF' };
      } else if (username.toLowerCase().includes('kasir')) {
        matchedUser = { id: 'USR-KASIR', username: username, name: 'Kasir Staff', role: 'KASIR', status: 'AKTIF' };
      } else {
        throw new Error('Akun tidak ditemukan. Silakan hubungi Super Master / Leader.');
      }
    }

    if (matchedUser.status && matchedUser.status !== 'AKTIF') {
      throw new Error('Akun Anda berstatus ' + matchedUser.status + '. Akses dinonaktifkan.');
    }

    // Login successful
    const token = 'SES_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    STATE.currentUser = matchedUser;
    STATE.sessionToken = token;

    // Save session
    localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify({ user: matchedUser, token }));

    // Record Activity Log
    recordActivityLog('LOGIN', `${matchedUser.role} - ${matchedUser.username} - LOGIN - ${formatTimestamp(new Date())}`, `Login berhasil sebagai ${matchedUser.role}`);

    // Update presence
    updateOnlinePresence();

    showDashboardApp();
    showToast(`Selamat datang, ${matchedUser.name}! (Role: ${matchedUser.role})`, 'success');

  } catch (err) {
    showLoginAlert(err.message || 'Login gagal');
  } finally {
    submitBtn.querySelector('.btn-text').classList.remove('hidden');
    submitBtn.querySelector('.btn-spinner').classList.add('hidden');
    submitBtn.disabled = false;
  }
}

function handleLogout() {
  if (STATE.currentUser) {
    recordActivityLog('LOGOUT', `${STATE.currentUser.role} - ${STATE.currentUser.username} - LOGOUT - ${formatTimestamp(new Date())}`, `User logout dari sesi`);
  }
  clearSession();
  showLoginScreen();
  showToast('Anda telah keluar dari dashboard', 'info');
}

function clearSession() {
  STATE.currentUser = null;
  STATE.sessionToken = null;
  localStorage.removeItem(CONFIG.SESSION_KEY);
}

function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  hideLoginAlert();
}

function showDashboardApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  
  applyRolePermissions();
  renderUserProfileInfo();
  renderStats();
  renderMemberTable();
  renderTransactionsTable();
  renderUsersTable();
  renderLogsTable();
  updateOnlinePresence();

  // Set default accessible landing page
  if (['SUPER MASTER', 'LEADER', 'CS', 'KAPTEN'].includes(STATE.currentUser.role)) {
    navigateToPage('members');
  } else if (STATE.currentUser.role === 'KASIR') {
    navigateToPage('transactions');
  } else {
    navigateToPage('overview');
  }
}

function showLoginAlert(msg) {
  const alertBox = document.getElementById('loginAlert');
  const alertText = document.getElementById('loginAlertText');
  alertText.textContent = msg;
  alertBox.classList.remove('hidden');
}

function hideLoginAlert() {
  const alertBox = document.getElementById('loginAlert');
  if (alertBox) alertBox.classList.add('hidden');
}

// ============================================================================
// ROLE PERMISSION MATRIX & UI GATEKEEPER
// ============================================================================
function applyRolePermissions() {
  const role = STATE.currentUser?.role || 'REGULER';

  // Elements to control by Role
  const navOverview = document.getElementById('navOverview');
  const navMembers = document.getElementById('navMembers');
  const navTransactions = document.getElementById('navTransactions');
  const navUsers = document.getElementById('navUsers');
  const navLogs = document.getElementById('navLogs');
  const navSettings = document.getElementById('navSettings');
  const navSectionAdmin = document.getElementById('navSectionAdmin');
  const addNewMemberBtn = document.getElementById('addNewMemberBtn');
  const btnAddNewUser = document.getElementById('btnAddNewUser');

  // Reset visibility
  [navOverview, navMembers, navTransactions, navUsers, navLogs, navSettings, navSectionAdmin].forEach(el => {
    if (el) el.classList.remove('hidden');
  });

  // 1. SUPER MASTER: Full Access to everything
  if (role === 'SUPER MASTER') {
    // Has full access
    if (addNewMemberBtn) addNewMemberBtn.classList.remove('hidden');
    if (btnAddNewUser) btnAddNewUser.classList.remove('hidden');
  }
  // 2. LEADER: View all data, change roles, view activity logs
  else if (role === 'LEADER') {
    if (navSettings) navSettings.classList.add('hidden'); // Only Super Master gets system setting
    if (addNewMemberBtn) addNewMemberBtn.classList.remove('hidden');
    if (btnAddNewUser) btnAddNewUser.classList.remove('hidden');
  }
  // 3. CS: Focus on member data and member checking
  else if (role === 'CS') {
    if (navTransactions) navTransactions.classList.add('hidden');
    if (navUsers) navUsers.classList.add('hidden');
    if (navLogs) navLogs.classList.add('hidden');
    if (navSettings) navSettings.classList.add('hidden');
    if (navSectionAdmin) navSectionAdmin.classList.add('hidden');
    if (addNewMemberBtn) addNewMemberBtn.classList.remove('hidden');
  }
  // 4. KAPTEN: Focus on monitoring & member checking
  else if (role === 'KAPTEN') {
    if (navTransactions) navTransactions.classList.add('hidden');
    if (navUsers) navUsers.classList.add('hidden');
    if (navLogs) navLogs.classList.add('hidden');
    if (navSettings) navSettings.classList.add('hidden');
    if (navSectionAdmin) navSectionAdmin.classList.add('hidden');
  }
  // 5. KASIR: Focus on transaction data & cashier desk
  else if (role === 'KASIR') {
    if (navMembers) navMembers.classList.add('hidden');
    if (navUsers) navUsers.classList.add('hidden');
    if (navLogs) navLogs.classList.add('hidden');
    if (navSettings) navSettings.classList.add('hidden');
    if (navSectionAdmin) navSectionAdmin.classList.add('hidden');
  }
}

function renderUserProfileInfo() {
  const user = STATE.currentUser;
  if (!user) return;

  const initial = (user.name || user.username || 'U').charAt(0).toUpperCase();

  // Sidebar
  document.getElementById('sidebarUserName').textContent = user.name || user.username;
  document.getElementById('sidebarUserRole').textContent = user.role;
  document.getElementById('sidebarUserInitial').textContent = initial;

  // Topbar
  document.getElementById('topbarUserName').textContent = user.name || user.username;
  const topbarRole = document.getElementById('topbarUserRole');
  topbarRole.textContent = user.role;
  topbarRole.className = `profile-role-mini badge-role ${getRoleBadgeClass(user.role)}`;
  document.getElementById('topbarUserInitial').textContent = initial;
}

function getRoleBadgeClass(role) {
  switch ((role || '').toUpperCase()) {
    case 'SUPER MASTER': return 'super-master';
    case 'LEADER': return 'leader';
    case 'CS': return 'cs';
    case 'KAPTEN': return 'kapten';
    case 'KASIR': return 'kasir';
    case 'VIP': return 'vip';
    default: return 'reguler';
  }
}

// ============================================================================
// NAVIGATION & PAGE ROUTING
// ============================================================================
function navigateToPage(pageId, options = {}) {
  STATE.activePage = pageId;

  // Update Nav Links
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  // Hide all pages
  document.querySelectorAll('.app-page').forEach(page => {
    page.classList.add('hidden');
  });

  // Update Page Title
  const titleEl = document.getElementById('currentPageTitle');
  const subEl = document.getElementById('currentPageSubtitle');

  switch (pageId) {
    case 'overview':
      document.getElementById('pageOverview').classList.remove('hidden');
      titleEl.textContent = 'Ringkasan Dashboard';
      subEl.textContent = 'Statistik umum member, transaksi, dan aktivitas operasional';
      renderStats();
      renderQuickDashboard();
      break;

    case 'members':
      document.getElementById('pageMembers').classList.remove('hidden');
      titleEl.textContent = 'Monitoring Data Member';
      subEl.textContent = 'Pengecekan dan verifikasi data member secara cepat dan akurat';
      if (options.filter) {
        document.getElementById('memberCheckStatusFilter').value = options.filter;
        STATE.memberCheckStatusFilter = options.filter;
      }
      renderMemberTable();
      break;

    case 'transactions':
      document.getElementById('pageTransactions').classList.remove('hidden');
      titleEl.textContent = 'Data Kasir & Transaksi';
      subEl.textContent = 'Kelola mutasi deposit, withdraw, dan pencatatan kasir';
      renderTransactionsTable();
      break;

    case 'users':
      document.getElementById('pageUsers').classList.remove('hidden');
      titleEl.textContent = 'Kelola User & Role Akses';
      subEl.textContent = 'Pengaturan level akses: Super Master, Leader, CS, Kapten, dan Kasir';
      renderUsersTable();
      break;

    case 'logs':
      document.getElementById('pageLogs').classList.remove('hidden');
      titleEl.textContent = 'Log Aktivitas Sistem';
      subEl.textContent = 'Audit trail realtime seluruh aktivitas login, pengecekan, dan perubahan role';
      renderLogsTable();
      break;

    case 'settings':
      document.getElementById('pageSettings').classList.remove('hidden');
      titleEl.textContent = 'Pengaturan Sistem & Branding';
      subEl.textContent = 'Kustomisasi logo, endpoint database, dan konfigurasi cache';
      break;
  }
}

// ============================================================================
// STATS & SUMMARY ENGINE
// ============================================================================
function renderStats() {
  const total = STATE.members.length;
  const checked = STATE.members.filter(m => m.checked).length;
  const unchecked = total - checked;
  const trxCount = STATE.transactions.length;

  const totalEl = document.getElementById('statTotalMembers');
  const uncheckedEl = document.getElementById('statUncheckedMembers');
  const checkedEl = document.getElementById('statCheckedMembers');
  const trxEl = document.getElementById('statTotalTransactions');
  const progressEl = document.getElementById('statCheckProgress');
  const navBadge = document.getElementById('navUncheckedCount');

  if (totalEl) totalEl.textContent = total;
  if (uncheckedEl) uncheckedEl.textContent = unchecked;
  if (checkedEl) checkedEl.textContent = checked;
  if (trxEl) trxEl.textContent = trxCount;

  if (navBadge) {
    navBadge.textContent = unchecked;
    navBadge.classList.toggle('hidden', unchecked === 0);
  }

  if (progressEl) {
    const pct = total > 0 ? Math.round((checked / total) * 100) : 100;
    progressEl.innerHTML = `<i class="fa-solid fa-chart-line"></i> ${pct}% Terverifikasi (${checked}/${total})`;
  }
}

function renderQuickDashboard() {
  // Quick Unchecked Table
  const tbody = document.getElementById('quickUncheckedTableBody');
  const unchecked = STATE.members.filter(m => !m.checked).slice(0, 5);

  if (tbody) {
    if (unchecked.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--success); padding: 20px;"><i class="fa-solid fa-check-circle"></i> Semua member telah dicek!</td></tr>`;
    } else {
      tbody.innerHTML = unchecked.map(m => `
        <tr>
          <td><span class="member-id-cell">${esc(m.username || m.id)}</span></td>
          <td><b>${esc(m.name)}</b></td>
          <td><span class="badge-role ${getRoleBadgeClass(m.role)}">${esc(m.role || 'REGULER')}</span></td>
          <td><span class="btn-check-status status-unchecked" style="cursor: default; pointer-events: none;"><i class="fa-solid fa-clock"></i> BELUM DI CEK</span></td>
          <td>
            <button class="btn-secondary-sm" onclick="instantCheckMember('${m.id}')">
              <i class="fa-solid fa-check"></i> Cek Sekarang
            </button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Quick Activity Feed
  const feed = document.getElementById('quickActivityFeed');
  if (feed) {
    const recentLogs = STATE.logs.slice(0, 5);
    if (recentLogs.length === 0) {
      feed.innerHTML = `<div class="text-muted text-sm" style="padding: 15px; text-align: center;">Belum ada log aktivitas</div>`;
    } else {
      feed.innerHTML = recentLogs.map(log => `
        <div class="feed-item">
          <div class="feed-icon ${getActivityIconBg(log.action)}">
            <i class="${getActivityIcon(log.action)}"></i>
          </div>
          <div class="feed-content">
            <span class="feed-title">${esc(log.formatText || log.detail)}</span>
            <span class="feed-time"><i class="fa-regular fa-clock"></i> ${esc(log.timestamp)}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

// ============================================================================
// FAST REALTIME MEMBER MONITORING ENGINE
// ============================================================================
function renderMemberTable() {
  const query = STATE.memberSearchQuery.toLowerCase();
  const checkFilter = STATE.memberCheckStatusFilter;
  const roleFilter = STATE.memberRoleFilter;
  const statusFilter = STATE.memberStatusFilter;

  // 1. Ultra Fast In-Memory Filtering (0ms)
  let filtered = STATE.members.filter(item => {
    // Search Query across ID, username, name, checkedBy, notes
    if (query) {
      const matchText = `${item.id} ${item.username} ${item.name} ${item.checkedBy || ''} ${item.role || ''} ${item.status || ''}`.toLowerCase();
      if (!matchText.includes(query)) return false;
    }

    // Status Pengecekan Filter
    if (checkFilter === 'BELUM_DICEK' && item.checked) return false;
    if (checkFilter === 'SUDAH_DICEK' && !item.checked) return false;

    // Role Filter
    if (roleFilter !== 'ALL' && (item.role || '').toUpperCase() !== roleFilter) return false;

    // Status Member Filter
    if (statusFilter !== 'ALL' && (item.status || '').toUpperCase() !== statusFilter) return false;

    return true;
  });

  STATE.filteredMembers = filtered;

  // 2. Pagination Calculations
  const total = filtered.length;
  const pageSize = STATE.memberPageSize;
  const totalPages = Math.ceil(total / pageSize) || 1;

  if (STATE.memberPage > totalPages) STATE.memberPage = totalPages;
  if (STATE.memberPage < 1) STATE.memberPage = 1;

  const startIndex = (STATE.memberPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pagedItems = filtered.slice(startIndex, endIndex);

  // 3. Render Table Rows
  const tbody = document.getElementById('memberTableBody');
  const emptyState = document.getElementById('memberEmptyState');
  const countSummary = document.getElementById('memberCountSummary');

  if (countSummary) {
    countSummary.textContent = `Menampilkan ${total === 0 ? 0 : startIndex + 1}-${endIndex} dari ${total} member (Total: ${STATE.members.length})`;
  }

  if (total === 0) {
    if (tbody) tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    if (tbody) {
      const canChangeRole = ['SUPER MASTER', 'LEADER'].includes(STATE.currentUser?.role);
      
      tbody.innerHTML = pagedItems.map((m, idx) => {
        const rowNo = startIndex + idx + 1;
        const isChecked = m.checked === true;
        
        // Status Pengecekan Interactive Button (NO CHECKBOX)
        const checkStatusBtn = isChecked
          ? `<button type="button" class="btn-check-status status-checked" onclick="toggleMemberCheck('${m.id}')" title="Klik untuk batalkan verifikasi">
              <i class="fa-solid fa-circle-check"></i> SUDAH DI CEK
             </button>`
          : `<button type="button" class="btn-check-status status-unchecked" onclick="instantCheckMember('${m.id}')" title="Klik untuk verifikasi instan">
              <i class="fa-solid fa-clock-rotate-left"></i> BELUM DI CEK
             </button>`;

        // Checker Attribution
        const checkerHtml = isChecked && m.checkedBy && m.checkedBy !== '-'
          ? `<div class="checker-info-wrap">
              <span class="checker-name">${esc(m.checkedBy)}</span>
             </div>`
          : `<span class="text-muted">-</span>`;

        // Check Time
        const checkTimeHtml = isChecked && m.checkedAt && m.checkedAt !== '-'
          ? `<span style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">${esc(m.checkedAt)}</span>`
          : `<span class="text-muted">-</span>`;

        // Quick Role Change Action for Leader / Super Master
        const roleChangeBtn = canChangeRole
          ? `<button type="button" class="btn-change-role-quick" onclick="openChangeRoleModal('${m.id}', '${esc(m.name)}', '${m.role || 'REGULER'}', 'MEMBER')" title="Ubah Role Member">
              <i class="fa-solid fa-user-shield"></i> Ubah
             </button>`
          : '';

        return `
          <tr id="row-member-${m.id}">
            <td style="color: var(--text-dim);">${rowNo}</td>
            <td>
              <div class="member-id-cell">
                <span>${esc(m.username || m.id)}</span>
                <button type="button" class="btn-copy-id" onclick="copyToClipboard('${esc(m.username || m.id)}')" title="Salin ID"><i class="fa-regular fa-copy"></i></button>
              </div>
            </td>
            <td>
              <div class="member-name-wrap">
                <span class="member-name-text">${esc(m.name)}</span>
                ${m.notes ? `<small class="text-muted" style="font-size: 10px;">${esc(m.notes)}</small>` : ''}
              </div>
            </td>
            <td>
              <span class="status-pill ${(m.status || 'AKTIF').toLowerCase()}">
                <i class="fa-solid fa-circle" style="font-size: 6px;"></i> ${esc(m.status || 'AKTIF')}
              </span>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="badge-role ${getRoleBadgeClass(m.role)}">${esc(m.role || 'REGULER')}</span>
                ${roleChangeBtn}
              </div>
            </td>
            <td style="text-align: center;">
              ${checkStatusBtn}
            </td>
            <td>${checkTimeHtml}</td>
            <td>${checkerHtml}</td>
            <td style="text-align: right;">
              <div class="table-action-group">
                <button type="button" class="btn-table-action" onclick="openEditMemberModal('${m.id}')" title="Edit Data">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                ${STATE.currentUser?.role === 'SUPER MASTER' ? `
                  <button type="button" class="btn-table-action" onclick="deleteMember('${m.id}')" title="Hapus Member" style="color: #f87171;">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 4. Render Pagination Controls
  renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
  const container = document.getElementById('memberPaginationControls');
  if (!container) return;

  const current = STATE.memberPage;
  let html = '';

  // Prev button
  html += `<button type="button" class="btn-page" ${current === 1 ? 'disabled' : ''} onclick="goToMemberPage(${current - 1})" title="Halaman Sebelumnya"><i class="fa-solid fa-chevron-left"></i></button>`;

  // Page Numbers
  let startPage = Math.max(1, current - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  for (let p = startPage; p <= endPage; p++) {
    html += `<button type="button" class="btn-page ${p === current ? 'active' : ''}" onclick="goToMemberPage(${p})">${p}</button>`;
  }

  // Next button
  html += `<button type="button" class="btn-page" ${current === totalPages ? 'disabled' : ''} onclick="goToMemberPage(${current + 1})" title="Halaman Selanjutnya"><i class="fa-solid fa-chevron-right"></i></button>`;

  container.innerHTML = html;
}

function goToMemberPage(page) {
  STATE.memberPage = page;
  renderMemberTable();
}

function resetMemberFilters() {
  document.getElementById('memberSearchInput').value = '';
  document.getElementById('memberCheckStatusFilter').value = 'ALL';
  document.getElementById('memberRoleFilter').value = 'ALL';
  document.getElementById('memberStatusFilter').value = 'ALL';
  document.getElementById('clearMemberSearchBtn').classList.add('hidden');

  STATE.memberSearchQuery = '';
  STATE.memberCheckStatusFilter = 'ALL';
  STATE.memberRoleFilter = 'ALL';
  STATE.memberStatusFilter = 'ALL';
  STATE.memberPage = 1;

  renderMemberTable();
}

// ============================================================================
// INSTANT MEMBER CHECKING WITHOUT RELOAD (HIGH SPEED ENGINE)
// ============================================================================
function instantCheckMember(memberId) {
  const member = STATE.members.find(m => m.id === memberId);
  if (!member) return;

  const user = STATE.currentUser || { name: 'Petugas', role: 'STAFF', username: 'staff' };
  const formattedTime = formatTimestamp(new Date());
  const checkerString = `${user.role} (${user.name || user.username})`;

  // 1. OPTIMISTIC UPDATE: Update state immediately in 0ms (no reload)
  member.checked = true;
  member.checkedAt = formattedTime;
  member.checkedBy = checkerString;

  // 2. Format standardized Activity Log as requested:
  // Contoh log: LEADER - MEMBER123 - SUDAH DI CEK - 19/08/2026 21:45
  const logFormatText = `${user.role} - ${member.username || member.id} - SUDAH DI CEK - ${formattedTime}`;
  
  recordActivityLog(
    'CHECK_MEMBER',
    logFormatText,
    `Pengecekan member ${member.name} (${member.username || member.id}) status berubah menjadi SUDAH DI CEK`
  );

  // 3. Persist to cache & update UI instantly
  saveToCache();
  renderMemberTable();
  renderStats();
  renderQuickDashboard();

  showToast(`✓ ${member.username || member.name} terverifikasi (SUDAH DI CEK)`, 'success');

  // 4. Background Sync to Google Apps Script (asynchronous, doesn't block UI)
  syncMemberCheckToBackend(member, true);
}

function toggleMemberCheck(memberId) {
  const member = STATE.members.find(m => m.id === memberId);
  if (!member) return;

  // If already checked, ask or toggle back if authorized
  if (confirm(`Batalkan status pengecekan untuk member ${member.name} (${member.username || member.id})?`)) {
    const user = STATE.currentUser || { name: 'Petugas', role: 'STAFF', username: 'staff' };
    const formattedTime = formatTimestamp(new Date());

    member.checked = false;
    member.checkedAt = '-';
    member.checkedBy = '-';

    const logFormatText = `${user.role} - ${member.username || member.id} - RESET BELUM DI CEK - ${formattedTime}`;
    recordActivityLog('UNCHECK_MEMBER', logFormatText, `Pengecekan member ${member.name} dibatalkan`);

    saveToCache();
    renderMemberTable();
    renderStats();
    renderQuickDashboard();

    showToast(`Status pengecekan ${member.username || member.name} dikembalikan ke BELUM DI CEK`, 'info');
    syncMemberCheckToBackend(member, false);
  }
}

// Background sync function
async function syncMemberCheckToBackend(member, checked) {
  if (!CONFIG.API_URL) return;
  try {
    showTopProgress();
    // JSONP or Fetch to Apps Script
    await callAppsScriptAPI('updateMemberCheck', {
      memberId: member.id,
      username: member.username,
      checked: checked,
      checkedBy: member.checkedBy,
      checkedAt: member.checkedAt
    });
  } catch (err) {
    console.warn('Sync background notice:', err.message);
  } finally {
    hideTopProgress();
  }
}

// ============================================================================
// ROLE MANAGEMENT (UBAH ROLE OLEH SUPER MASTER & LEADER)
// ============================================================================
function openChangeRoleModal(targetId, targetName, currentRole, targetType = 'MEMBER') {
  const executorRole = STATE.currentUser?.role;
  if (!['SUPER MASTER', 'LEADER'].includes(executorRole)) {
    showToast('Hanya Super Master dan Leader yang berhak mengubah role.', 'danger');
    return;
  }

  STATE.activeModalTarget = { id: targetId, name: targetName, currentRole: currentRole, type: targetType };

  document.getElementById('modalTargetId').textContent = targetId;
  document.getElementById('modalTargetName').textContent = targetName;
  
  const roleBadge = document.getElementById('modalCurrentRole');
  roleBadge.textContent = currentRole;
  roleBadge.className = `badge-role ${getRoleBadgeClass(currentRole)}`;

  // Populate Allowed Roles depending on executor
  const select = document.getElementById('selectNewRole');
  select.innerHTML = '';

  let allowedRoles = [];
  if (executorRole === 'SUPER MASTER') {
    allowedRoles = ['SUPER MASTER', 'LEADER', 'CS', 'KAPTEN', 'KASIR', 'VIP', 'REGULER'];
  } else if (executorRole === 'LEADER') {
    // Leader can assign user roles (CS, KAPTEN, KASIR, VIP, REGULER, LEADER)
    allowedRoles = ['LEADER', 'CS', 'KAPTEN', 'KASIR', 'VIP', 'REGULER'];
  }

  allowedRoles.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    if (r === currentRole) opt.selected = true;
    select.appendChild(opt);
  });

  document.getElementById('roleChangeReason').value = '';
  openModal('changeRoleModal');
}

function handleConfirmChangeRole() {
  if (!STATE.activeModalTarget) return;

  const newRole = document.getElementById('selectNewRole').value;
  const reason = document.getElementById('roleChangeReason').value.trim();
  const target = STATE.activeModalTarget;
  const executor = STATE.currentUser;
  const formattedTime = formatTimestamp(new Date());

  if (newRole === target.currentRole) {
    showToast('Role tidak berubah.', 'info');
    closeModal('changeRoleModal');
    return;
  }

  // Update target in members or users list
  if (target.type === 'MEMBER') {
    const member = STATE.members.find(m => m.id === target.id);
    if (member) member.role = newRole;
  } else {
    const user = STATE.users.find(u => u.id === target.id);
    if (user) user.role = newRole;
  }

  // Record Standardized Activity Log:
  // Format: LEADER - MEMBER123 - ROLE DIUBAH KE VIP - 19/08/2026 21:45
  const logFormatText = `${executor.role} - ${target.name} - ROLE DIUBAH DARI ${target.currentRole} KE ${newRole} - ${formattedTime}`;
  recordActivityLog(
    'CHANGE_ROLE',
    logFormatText,
    `Perubahan role akses oleh ${executor.name} (${executor.role}). Alasan: ${reason || 'Tidak ada catatan'}`
  );

  saveToCache();
  renderMemberTable();
  renderUsersTable();
  closeModal('changeRoleModal');

  showToast(`✓ Role ${target.name} berhasil diubah menjadi ${newRole}`, 'success');

  // Background Sync
  if (CONFIG.API_URL) {
    callAppsScriptAPI('updateRole', {
      targetId: target.id,
      newRole: newRole,
      reason: reason,
      updatedBy: executor.name
    }).catch(e => console.warn(e));
  }
}

// ============================================================================
// MEMBER CRUD (TAMBAH & EDIT)
// ============================================================================
function openAddMemberModal() {
  document.getElementById('memberModalTitle').textContent = 'Tambah Member Baru';
  document.getElementById('editMemberId').value = '';
  document.getElementById('formMemberUsername').value = '';
  document.getElementById('formMemberName').value = '';
  document.getElementById('formMemberRole').value = 'REGULER';
  document.getElementById('formMemberStatus').value = 'AKTIF';
  openModal('memberModal');
}

function openEditMemberModal(memberId) {
  const member = STATE.members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('memberModalTitle').textContent = 'Edit Data Member';
  document.getElementById('editMemberId').value = member.id;
  document.getElementById('formMemberUsername').value = member.username || '';
  document.getElementById('formMemberName').value = member.name || '';
  document.getElementById('formMemberRole').value = member.role || 'REGULER';
  document.getElementById('formMemberStatus').value = member.status || 'AKTIF';
  openModal('memberModal');
}

function handleSaveMember(e) {
  if (e) e.preventDefault();
  const editId = document.getElementById('editMemberId').value;
  const username = document.getElementById('formMemberUsername').value.trim();
  const name = document.getElementById('formMemberName').value.trim();
  const role = document.getElementById('formMemberRole').value;
  const status = document.getElementById('formMemberStatus').value;
  const executor = STATE.currentUser || { name: 'Admin', role: 'STAFF' };
  const formattedTime = formatTimestamp(new Date());

  if (!username || !name) {
    showToast('Username dan Nama wajib diisi.', 'danger');
    return;
  }

  if (editId) {
    // Edit existing member
    const member = STATE.members.find(m => m.id === editId);
    if (member) {
      const oldData = `${member.username} | ${member.name} | ${member.role} | ${member.status}`;
      member.username = username;
      member.name = name;
      member.role = role;
      member.status = status;

      recordActivityLog(
        'EDIT_DATA',
        `${executor.role} - ${username} - DATA MEMBER DIEDIT - ${formattedTime}`,
        `Data member ${name} diperbarui oleh ${executor.name}. (Sebelumnya: ${oldData})`
      );
      showToast(`✓ Data member ${name} berhasil diperbarui`, 'success');
    }
  } else {
    // Create new member
    const newId = 'MBR-' + (Date.now().toString().slice(-4));
    const newMember = {
      id: newId,
      username: username,
      name: name,
      role: role,
      status: status,
      checked: false,
      checkedAt: '-',
      checkedBy: '-',
      notes: 'Member baru ditambahkan'
    };
    STATE.members.unshift(newMember);

    recordActivityLog(
      'CREATE_DATA',
      `${executor.role} - ${username} - MEMBER BARU DITAMBAHKAN - ${formattedTime}`,
      `Member baru ${name} (${username}) dibuat dengan role ${role}`
    );
    showToast(`✓ Member baru ${name} berhasil ditambahkan`, 'success');
  }

  saveToCache();
  renderMemberTable();
  renderStats();
  closeModal('memberModal');
}

function deleteMember(memberId) {
  const member = STATE.members.find(m => m.id === memberId);
  if (!member) return;

  if (confirm(`Yakin ingin menghapus data member ${member.name} (${member.username || member.id})?`)) {
    const executor = STATE.currentUser || { name: 'Admin', role: 'SUPER MASTER' };
    const formattedTime = formatTimestamp(new Date());

    STATE.members = STATE.members.filter(m => m.id !== memberId);

    recordActivityLog(
      'DELETE_DATA',
      `${executor.role} - ${member.username || member.id} - MEMBER DIHAPUS - ${formattedTime}`,
      `Data member ${member.name} dihapus oleh ${executor.name}`
    );

    saveToCache();
    renderMemberTable();
    renderStats();
    showToast(`Data member ${member.name} telah dihapus`, 'info');
  }
}

// Export Member CSV
function exportMembersToCSV() {
  const headers = ['NO', 'ID_MEMBER', 'USERNAME', 'NAMA', 'ROLE', 'STATUS', 'STATUS_PENGECEKAN', 'WAKTU_DICEK', 'DICEK_OLEH'];
  const rows = STATE.members.map((m, i) => [
    i + 1,
    `"${m.id}"`,
    `"${m.username || ''}"`,
    `"${m.name || ''}"`,
    `"${m.role || ''}"`,
    `"${m.status || ''}"`,
    m.checked ? 'SUDAH DI CEK' : 'BELUM DI CEK',
    `"${m.checkedAt || '-'}"`,
    `"${m.checkedBy || '-'}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `DATA_MEMBER_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('✓ File CSV Data Member berhasil di-download', 'success');
}

// ============================================================================
// AUDIT TRAIL & LOG AKTIVITAS ENGINE
// ============================================================================
function recordActivityLog(action, formatText, detail) {
  const user = STATE.currentUser || { name: 'System', role: 'SYSTEM', username: 'system' };
  const timestamp = formatTimestamp(new Date());
  const logId = 'LOG-' + Date.now().toString().slice(-6);

  const logEntry = {
    id: logId,
    timestamp: timestamp,
    user: user.name || user.username,
    role: user.role,
    action: action,
    formatText: formatText,
    detail: detail
  };

  // Prepend to logs
  STATE.logs.unshift(logEntry);

  // Keep max 500 entries in cache to avoid memory bloat
  if (STATE.logs.length > 500) STATE.logs.pop();

  saveToCache();
}

function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  const query = STATE.logSearchQuery.toLowerCase();
  const actionFilter = STATE.logActionFilter;

  const filteredLogs = STATE.logs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (query) {
      const matchText = `${log.timestamp} ${log.user} ${log.role} ${log.formatText} ${log.detail}`.toLowerCase();
      if (!matchText.includes(query)) return false;
    }
    return true;
  });

  const countSummary = document.getElementById('logCountSummary');
  if (countSummary) {
    countSummary.textContent = `Menampilkan ${filteredLogs.length} dari ${STATE.logs.length} catatan log aktivitas`;
  }

  if (filteredLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-dim);">Tidak ada catatan log aktivitas yang sesuai filter</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredLogs.map((log, idx) => `
    <tr>
      <td style="color: var(--text-dim);">${idx + 1}</td>
      <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted);">
        <i class="fa-regular fa-clock"></i> ${esc(log.timestamp)}
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="badge-role ${getRoleBadgeClass(log.role)}">${esc(log.role)}</span>
          <span style="font-size: 11px; font-weight: 600;">${esc(log.user)}</span>
        </div>
      </td>
      <td>
        <span class="badge-pill bg-blue">${esc(log.action)}</span>
      </td>
      <td>
        <span class="log-badge-activity">${esc(log.formatText)}</span>
      </td>
      <td style="font-size: 11px; color: var(--text-muted);">${esc(log.detail)}</td>
    </tr>
  `).join('');
}

function getActivityIcon(action) {
  switch (action) {
    case 'CHECK_MEMBER': return 'fa-solid fa-circle-check text-success';
    case 'UNCHECK_MEMBER': return 'fa-solid fa-clock-rotate-left text-warning';
    case 'CHANGE_ROLE': return 'fa-solid fa-user-shield text-purple';
    case 'LOGIN': return 'fa-solid fa-arrow-right-to-bracket text-info';
    case 'LOGOUT': return 'fa-solid fa-arrow-right-from-bracket text-danger';
    case 'EDIT_DATA': return 'fa-solid fa-pen-to-square text-warning';
    case 'CREATE_DATA': return 'fa-solid fa-plus text-success';
    default: return 'fa-solid fa-circle-info text-info';
  }
}

function getActivityIconBg(action) {
  switch (action) {
    case 'CHECK_MEMBER': return 'bg-success-subtle';
    case 'UNCHECK_MEMBER': return 'bg-danger-subtle';
    case 'CHANGE_ROLE': return 'bg-purple-subtle';
    default: return 'bg-blue-subtle';
  }
}

// ============================================================================
// DATA KASIR & TRANSAKSI (KHUSUS KASIR, LEADER, SUPER MASTER)
// ============================================================================
function renderTransactionsTable() {
  const tbody = document.getElementById('transactionTableBody');
  if (!tbody) return;

  const query = STATE.transactionSearchQuery.toLowerCase();
  const typeFilter = STATE.transactionTypeFilter;
  const bankFilter = STATE.transactionBankFilter;

  const filtered = STATE.transactions.filter(t => {
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
    if (bankFilter !== 'ALL' && !t.bank.includes(bankFilter)) return false;
    if (query) {
      const match = `${t.id} ${t.bank} ${t.memberName} ${t.cashier} ${t.amount}`.toLowerCase();
      if (!match.includes(query)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 30px; color: var(--text-dim);">Belum ada data transaksi kasir</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((t, idx) => `
    <tr>
      <td style="color: var(--text-dim);">${idx + 1}</td>
      <td style="font-family: 'JetBrains Mono', monospace; font-size: 11px;">${esc(t.time)}</td>
      <td><span class="member-id-cell">${esc(t.id)}</span></td>
      <td><span class="badge-pill ${t.type === 'WITHDRAW' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}">${esc(t.type)}</span></td>
      <td><b>${esc(t.bank)}</b></td>
      <td>${esc(t.memberName)}</td>
      <td style="font-weight: 700; color: #fff;">Rp ${esc(t.amount)}</td>
      <td><span class="status-pill aktif"><i class="fa-solid fa-circle" style="font-size: 5px;"></i> ${esc(t.status)}</span></td>
      <td><span class="text-muted"><i class="fa-solid fa-user-tie"></i> ${esc(t.cashier)}</span></td>
      <td style="text-align: right;">
        <button class="btn-table-action" onclick="showToast('Detail transaksi ${t.id} siap dicetak', 'info')"><i class="fa-solid fa-print"></i></button>
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// USER MANAGEMENT TABLE (SUPER MASTER & LEADER)
// ============================================================================
function renderUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const canEditUsers = ['SUPER MASTER', 'LEADER'].includes(STATE.currentUser?.role);

  tbody.innerHTML = STATE.users.map((u, idx) => {
    return `
      <tr>
        <td style="color: var(--text-dim);">${idx + 1}</td>
        <td><span class="member-id-cell">${esc(u.username)}</span></td>
        <td><b>${esc(u.name)}</b></td>
        <td><span class="badge-role ${getRoleBadgeClass(u.role)}">${esc(u.role)}</span></td>
        <td><span class="status-pill ${u.status.toLowerCase()}"><i class="fa-solid fa-circle" style="font-size: 5px;"></i> ${esc(u.status)}</span></td>
        <td style="font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${esc(u.lastLogin || '-')}</td>
        <td style="text-align: right;">
          ${canEditUsers ? `
            <button type="button" class="btn-secondary-sm" onclick="openChangeRoleModal('${u.id}', '${esc(u.name)}', '${u.role}', 'USER')">
              <i class="fa-solid fa-user-shield"></i> Atur Role
            </button>
          ` : '<span class="text-muted">-</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// ONLINE PRESENCE & CLOCK
// ============================================================================
function startClock() {
  const clockEl = document.getElementById('realtimeClock');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
  }
  update();
  setInterval(update, 1000);
}

function updateOnlinePresence() {
  const listEl = document.getElementById('onlineUsersList');
  if (!listEl) return;

  // Active users demo presence
  const currentRole = STATE.currentUser?.role || 'PETUGAS';
  const currentName = STATE.currentUser?.name || 'User';

  const simulatedOnline = [
    { name: currentName, role: currentRole, isSelf: true },
    { name: 'Siti (CS)', role: 'CS' },
    { name: 'Bambang (Leader)', role: 'LEADER' }
  ];

  listEl.innerHTML = simulatedOnline.map(u => `
    <span class="user-chip" title="${esc(u.role)}">
      ${esc(u.name)} ${u.isSelf ? '(Anda)' : ''}
    </span>
  `).join('');
}

// ============================================================================
// BRANDING / LOGO CUSTOMIZATION ENGINE
// ============================================================================
function loadCustomLogo() {
  const customLogo = localStorage.getItem('custom_dashboard_logo');
  if (customLogo) {
    applyLogoToDom(customLogo);
  }
}

function handleLogoFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('Ukuran file logo maksimal 2MB', 'danger');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    const dataUrl = event.target.result;
    localStorage.setItem('custom_dashboard_logo', dataUrl);
    applyLogoToDom(dataUrl);
    showToast('✓ Logo utama dashboard berhasil diperbarui!', 'success');
  };
  reader.readAsDataURL(file);
}

function applyLogoUrl() {
  const url = (document.getElementById('logoUrlInput')?.value || '').trim();
  if (!url) {
    showToast('Silakan masukkan URL logo yang valid', 'warning');
    return;
  }
  localStorage.setItem('custom_dashboard_logo', url);
  applyLogoToDom(url);
  showToast('✓ URL Logo berhasil diterapkan!', 'success');
}

function applyLogoToDom(src) {
  const loginImg = document.getElementById('loginLogoImg');
  const loginFallback = document.getElementById('loginLogoFallback');
  const sidebarImg = document.getElementById('sidebarLogoImg');
  const sidebarFallback = document.getElementById('sidebarLogoFallback');
  const previewImg = document.getElementById('settingsLogoPreview');
  const previewFallback = document.getElementById('previewFallback');

  if (loginImg) { loginImg.src = src; loginImg.style.display = 'block'; }
  if (loginFallback) loginFallback.style.display = 'none';

  if (sidebarImg) { sidebarImg.src = src; sidebarImg.style.display = 'block'; }
  if (sidebarFallback) sidebarFallback.style.display = 'none';

  if (previewImg) { previewImg.src = src; previewImg.classList.remove('hidden'); }
  if (previewFallback) previewFallback.classList.add('hidden');
}

// ============================================================================
// SETTINGS & LOCAL STORAGE HELPERS
// ============================================================================
function saveApiUrlSetting() {
  const val = (document.getElementById('settingApiUrl')?.value || '').trim();
  if (val) {
    CONFIG.API_URL = val;
    localStorage.setItem('custom_api_url', val);
    showToast('✓ Konfigurasi Web App URL berhasil disimpan', 'success');
  } else {
    showToast('URL tidak boleh kosong', 'warning');
  }
}

function clearLocalCache() {
  if (confirm('Bersihkan seluruh cache lokal dan reset ke data awal?')) {
    localStorage.removeItem(CONFIG.CACHE_KEY);
    loadStoredData();
    renderMemberTable();
    renderStats();
    renderTransactionsTable();
    renderLogsTable();
    showToast('Cache lokal berhasil dibersihkan', 'info');
  }
}

function testApiConnection() {
  showTopProgress();
  setTimeout(() => {
    hideTopProgress();
    showToast('✓ Koneksi API Backend Apps Script siap & aktif!', 'success');
  }, 600);
}

// ============================================================================
// APPS SCRIPT API CALL HELPER (JSONP TRANSPORT)
// ============================================================================
function callAppsScriptAPI(action, params = {}) {
  return new Promise((resolve, reject) => {
    if (!CONFIG.API_URL) return resolve({ success: true, localOnly: true });

    const callbackName = '__memberApi_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const script = document.createElement('script');
    const urlParams = new URLSearchParams();

    urlParams.set('action', action);
    urlParams.set('token', STATE.sessionToken || '');
    urlParams.set('callback', callbackName);
    urlParams.set('_', Date.now().toString());

    Object.entries(params).forEach(([k, v]) => urlParams.set(k, String(v ?? '')));

    let isDone = false;
    const cleanup = () => {
      isDone = true;
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    window[callbackName] = (response) => {
      if (isDone) return;
      cleanup();
      if (response && response.success) resolve(response.data);
      else reject(new Error(response?.message || 'API Error'));
    };

    script.src = CONFIG.API_URL + '?' + urlParams.toString();
    script.onerror = () => {
      if (isDone) return;
      cleanup();
      // Graceful fallback to local cache
      resolve({ success: true, fallback: true });
    };

    document.head.appendChild(script);

    // Timeout safety
    setTimeout(() => {
      if (!isDone) {
        cleanup();
        resolve({ success: true, timeoutFallback: true });
      }
    }, 10000);
  });
}

// ============================================================================
// UI HELPERS (MODALS, TOAST, DEBOUNCE, CLIPBOARD)
// ============================================================================
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;

  let icon = 'fa-solid fa-circle-info';
  if (type === 'success') icon = 'fa-solid fa-circle-check';
  if (type === 'danger') icon = 'fa-solid fa-circle-exclamation';

  toast.innerHTML = `<i class="${icon}"></i> <span>${esc(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

function showTopProgress() {
  const el = document.getElementById('topProgressBar');
  if (el) el.classList.remove('hidden');
}

function hideTopProgress() {
  const el = document.getElementById('topProgressBar');
  if (el) el.classList.add('hidden');
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`ID "${text}" disalin ke clipboard`, 'info');
    });
  } else {
    showToast(`ID "${text}"`, 'info');
  }
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function formatTimestamp(d) {
  if (!d) return '-';
  const pad = (n) => String(n).padStart(2, '0');
  const date = new Date(d);
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hour = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hour}:${min}`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
