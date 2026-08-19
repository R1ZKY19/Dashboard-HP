# MEMBER MONITOR PRO — Dashboard Monitoring & Pengecekan Member

Dashboard monitoring member modern, cepat, simpel, dan responsif dengan sistem 5 Level Akses (Role-Based Access Control) dan Audit Trail Log Aktivitas Real-Time.

---

## 🌟 Fitur Utama

### 1. 5 Level Akses Role Pengguna
Setiap role memiliki hak akses dan batasan tampilan yang disesuaikan secara otomatis:
- 👑 **SUPER MASTER**:
  - Akses penuh (Full Access) ke seluruh data member, transaksi, kasir, log aktivitas, dan pengaturan sistem.
  - Bisa mengatur dan mengubah role semua level user dan member secara instan.
- 🎖️ **LEADER**:
  - Melihat semua data member dan transaksi.
  - Bisa mengatur role user dan member langsung dari dashboard.
  - Bisa memantau dan memeriksa seluruh Log Aktivitas user.
- 🎧 **CS (Customer Service)**:
  - Fokus operasional pada data member dan proses pengecekan member.
- 🧭 **KAPTEN**:
  - Fokus pada monitoring operasional dan verifikasi pengecekan member.
- 💳 **KASIR**:
  - Khusus menangani mutasi transaksi deposit, withdraw, dan pembukuan kasir.

---

### 2. Halaman Khusus Data Member
Menampilkan informasi lengkap:
- **Username / ID Member** (dilengkapi tombol quick-copy)
- **Nama Lengkap Member**
- **Status Akun** (Aktif, Non-Aktif, Suspended)
- **Role / Level Member** (VIP, Reguler, dll.)
- **Status Pengecekan** (`BELUM DI CEK` / `SUDAH DI CEK`)
- **Waktu Terakhir Dicek** (contoh: `19/08/2026 21:45`)
- **Siapa yang Melakukan Pengecekan** (contoh: `LEADER (Bambang)`)
- **Fitur Ubah Role**: Super Master dan Leader dapat mengubah role member/user langsung melalui tombol aksi cepat / modal.

---

### 3. Sistem Pengecekan Cepat (Zero Lag & No Checkbox)
- **Tanpa Checkbox**: Menggunakan tombol interaktif dengan teks jelas:
  - 🟡 **`BELUM DI CEK`** (Badge tombol peringatan kuning/amber).
  - 🟢 **`SUDAH DI CEK`** (Badge tombol sukses hijau emerald + centang).
- **Update Instan Tanpa Reload**: Saat tombol ditekan, status berubah seketika (*Optimistic UI Update* dalam 0ms) tanpa me-refresh seluruh halaman dashboard.
- **Auto Log**: Setiap kali tombol pengecekan diklik, data langsung otomatis dicatat ke **LOG AKTIVITAS** dengan format standar:
  ```text
  LEADER - MEMBER123 - SUDAH DI CEK - 19/08/2026 21:45
  ```

---

### 4. Performa Tinggi & Navigasi Cepat
- **Search Real-Time**: Pencarian instan per huruf tanpa reload.
- **Filter Cepat**: Filter berdasarkan status pengecekan (Semua / Belum Di Cek / Sudah Di Cek), role, dan status akun.
- **Pagination**: Pilihan tampilan 10, 25, 50, hingga 100 baris per halaman.
- **In-Memory & Cache Engine**: Memastikan rendering data tetap halus meskipun data berjumlah ribuan.

---

### 5. Log Aktivitas Lengkap
Mencatat seluruh riwayat penting sistem:
- Sesi **Login** dan **Logout**
- **Pengecekan Member** (Waktu, Target Member, Petugas)
- **Perubahan Role** (Siapa yang mengubah, Role lama ke Role baru, Alasan)
- **Edit & Penambahan Data**

---

### 6. Desain Modern, Responsif, & Kustomisasi Logo
- Tampilan Dark-Theme Fintech yang rapi, profesional, dan nyaman di mata.
- **Responsive Penuh**: Optimal di Desktop, Laptop, Tablet, dan Smartphone (HP).
- **Kustomisasi Logo**: Mendukung upload file logo langsung dari dashboard atau input URL logo untuk dipasang pada halaman login dan sidebar.

---

## 🚀 Panduan Setup & Instalasi

### 1. Struktur File
- `index.html` — Antarmuka Single Page Application (SPA).
- `style.css` — Styling modern, responsive, dan animasi.
- `app.js` — Core JavaScript engine, RBAC, live search, pagination, dan logger.
- `config.js` — File konfigurasi API dan aplikasi.
- `Code.gs` — Backend Google Apps Script (Web App API).

### 2. Setup Google Apps Script (Backend Google Sheets)
1. Buka Google Sheets baru atau spreadsheet yang sudah ada.
2. Klik menu **Extensions** > **Apps Script**.
3. Hapus kode default, lalu salin seluruh isi file `Code.gs` ke dalam editor Apps Script.
4. Jalankan fungsi `setupDatabase()` sekali untuk otomatis membuat sheet:
   - `MEMBERS`
   - `USERS`
   - `ACTIVITY_LOG`
   - `TRANSAKSI`
5. Klik **Deploy** > **New Deployment**:
   - Tipe: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone** (Siapa saja)
6. Salin **Web App URL** yang didapatkan, lalu tempelkan ke `config.js` pada variabel `API_URL` atau melalui menu **Pengaturan** di dashboard.

### 3. Deploy Frontend (GitHub Pages)
1. Upload file `index.html`, `style.css`, `app.js`, `config.js`, dan `logo.png` ke repository GitHub Anda.
2. Masuk ke **Settings** > **Pages** di repository GitHub.
3. Pilih branch `main` (atau `master`) dan folder `/ (root)`, lalu klik **Save**.
4. Website siap diakses secara online dan aman.

---

## 🔑 Akun Demo Pengujian (5 Level Akses)

| Role | Username | Password | Akses Utama |
| :--- | :--- | :--- | :--- |
| **SUPER MASTER** | `supermaster` | `admin123` | Akses Penuh ke Semua Fitur & Data |
| **LEADER** | `leader_ops` | `leader123` | Monitoring, Ubah Role, Log Aktivitas |
| **CS** | `cs_support` | `cs123` | Data Member & Verifikasi Cek Member |
| **KAPTEN** | `kapten_ops` | `kapten123` | Monitoring & Verifikasi Cek Member |
| **KASIR** | `kasir_bank` | `kasir123` | Data Transaksi Kasir & Mutasi |
