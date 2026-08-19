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

## Role & Akses
Role yang tersedia sekarang: `SUPER MASTER`, `LEADER`, `CS`, `KAPTEN`, `KASIR` (kolom `Role` di sheet `Users`).

- **SUPER MASTER**: akses penuh, satu-satunya yang boleh memberi/mencabut role SUPER MASTER ke orang lain.
- **LEADER**: bisa atur role staf lain (kecuali SUPER MASTER), mulai shift baru, lihat halaman Users & Riwayat, plus cek/edit data.
- **CS / KAPTEN / KASIR**: bisa cek & edit data di dashboard, tapi tidak bisa atur user/role/shift.

Role bisa diubah langsung dari dashboard: buka menu **Users** (hanya muncul untuk SUPER MASTER/LEADER), lalu pilih role baru dari dropdown di baris user yang dituju — tersimpan otomatis begitu dipilih.

> Kalau kamu sebelumnya sudah punya user dengan role lama (`MASTER`/`MEMBER`), ganti manual dulu di sheet `Users` ke salah satu dari 5 role di atas, karena role lama tidak lagi dikenali sistem.

## Logo
Kalau mau pakai foto/logo sendiri, taruh file bernama `logo.png` (atau `.jpg`/`.svg`) di folder yang sama dengan `index.html`, lalu upload ke GitHub. Dashboard otomatis mendeteksi dan memakainya sebagai logo. Kalau file tidak ada, tampilan tetap fallback ke logo huruf "O" seperti biasa — tidak ada yang rusak.

## Fitur baru: siapa yang cek
- **Dicek oleh siapa (riwayat)**: setiap kali checkbox diklik, Apps Script menyimpan email + nama staf + waktu ke Script Properties (`CHECK_META_V1`). Info ini muncul sebagai label kecil "oleh <nama>" di bawah status SUDAH CEK/BELUM CEK di tabel.
- **Sedang online sekarang (real-time)**: setiap 20 detik, browser staf yang sedang login mengirim `heartbeat` ke Apps Script. Daftar staf yang aktif dalam 45 detik terakhir tersimpan sementara di CacheService dan tampil sebagai titik hijau berkedip + daftar nama di pojok kanan atas dashboard.
- Login staf tetap memakai email pribadi masing-masing yang sudah didaftarkan (status `ACTIVE`) di sheet `Users` — tidak ada akun bersama.
- Tidak perlu kolom/sheet tambahan untuk fitur ini; datanya tersimpan otomatis di Script Properties (attribution, persisten) dan CacheService (online, sementara).

## Fitur baru: status cek instan
Tombol "SUDAH DI CEK / BELUM DI CEK" (menggantikan checkbox) langsung berubah begitu diklik — tidak menunggu respons server dulu (optimistic update), jadi terasa instan meski cek sistem sedang ramai. Kalau ternyata gagal tersimpan di server, tombol otomatis kembali ke status semula dan muncul notifikasi error.
