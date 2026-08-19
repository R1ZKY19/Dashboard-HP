# Office Data Center

Arsitektur:
GitHub Pages -> Apps Script API -> Google Sheets

Sheet yang digunakan:
- DATA BANK
- Users
- Audit_Log
- Shift_Control

## Setup
1. Buat Apps Script yang terhubung ke spreadsheet.
2. Masukkan `Code.gs` dan deploy ulang sebagai Web App (versi baru, akses "Siapa saja").
3. Salin URL Web App ke `config.js`.
4. Upload seluruh folder ini ke GitHub.
5. Aktifkan GitHub Pages dari branch repository.

## Fitur baru: siapa yang cek
- **Dicek oleh siapa (riwayat)**: setiap kali checkbox diklik, Apps Script menyimpan email + nama staf + waktu ke Script Properties (`CHECK_META_V1`). Info ini muncul sebagai label kecil "oleh <nama>" di bawah status SUDAH CEK/BELUM CEK di tabel.
- **Sedang online sekarang (real-time)**: setiap 20 detik, browser staf yang sedang login mengirim `heartbeat` ke Apps Script. Daftar staf yang aktif dalam 45 detik terakhir tersimpan sementara di CacheService dan tampil sebagai titik hijau berkedip + daftar nama di pojok kanan atas dashboard.
- Login staf tetap memakai email pribadi masing-masing yang sudah didaftarkan (status `ACTIVE`) di sheet `Users` — tidak ada akun bersama.
- Tidak perlu kolom/sheet tambahan untuk fitur ini; datanya tersimpan otomatis di Script Properties (attribution, persisten) dan CacheService (online, sementara).
