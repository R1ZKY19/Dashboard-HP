# OFFICE DATA CENTER — Dashboard Monitoring Kelengkapan HP & Perangkat

Dashboard monitoring modern, cepat, dan terhubung langsung ke Google Sheets `DATA BANK` untuk pengecekan fisik kelengkapan HP Office (HP Withdraw, HP Depo, HP Bank Kas, dan Token BCA Office).

---

## 🌟 Fitur Utama & Kategori Perangkat

### 1. Pengecekan Kelengkapan HP (Status ADA / SUDAH DI CEK vs BELUM DI CEK)
- **Terhubung Langsung ke Sheet `DATA BANK`**:
  - 📱 **HP WITHDRAW** (77 Perangkat di Kolom D & Cell E4:E80)
  - 📱 **HP DEPO** (27 Perangkat di Kolom H & Cell I4:I35)
  - 📱 **HP BANK KAS** (21 Perangkat di Kolom M & Cell N4:N30)
  - 🔑 **TOKEN BCA OFFICE** (12 Token di Kolom Q, R, U, V)
- **Tanpa Checkbox & Tanpa Reload**:
  - Tombol interaktif `BELUM DI CEK` (Warna Amber) diklik langsung berubah menjadi `SUDAH DI CEK` (Warna Hijau Emerald) seketika (0ms).
  - Kolom checkbox di Google Sheet otomatis terisi `TRUE` / `FALSE`.
  - Otomatis mencatat nama & role staf yang mengecek serta waktu pengecekan.

---

### 2. Format Log Standar (Tercatat ke Sheet `Audit_Log`)
Setiap kali status HP diubah, langsung tercatat otomatis:
```text
LEADER - WD BCA / RATNASARI - SUDAH DI CEK - 19/08/2026 22:26
```

---

### 3. 5 Level Akses (Sheet `Users`)
- 👑 **SUPER MASTER**: Full Access semua data, atur role semua staf, mulai shift baru / reset status HP.
- 🎖️ **LEADER**: Full View semua data, atur role staf, memantau log aktivitas.
- 🎧 **CS**: Fokus pengecekan & monitoring kelengkapan HP.
- 🧭 **KAPTEN**: Fokus monitoring & pengecekan fisik perangkat.
- 💳 **KASIR**: Fokus mutasi kas & perangkat kasir.

---

### 4. Kontrol Shift Operasional (`Shift_Control`)
- Super Master dan Leader dapat menekan tombol **`+ MULAI SHIFT BARU`** saat pergantian shift.
- Sistem otomatis me-reset seluruh status pengecekan HP untuk shift berikutnya dan mencatat riwayat ke log.

---

## 🚀 Panduan Setup ke Google Sheets Anda

1. Buka spreadsheet Google Sheets Anda (Sheet `DATA BANK`).
2. Masuk ke menu **Extensions** > **Apps Script**.
3. Hapus kode lama, lalu salin seluruh isi file **`Code.gs`**.
4. Jalankan fungsi `setupDashboard()` sekali.
5. Klik **Deploy** > **New Deployment**:
   - Tipe: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Salin **Web App URL** dan masukkan ke `config.js` pada `API_URL` atau via menu **Pengaturan** di dashboard.
7. Upload folder web ke **GitHub Pages**.
