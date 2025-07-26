# 📒 Bot Laporan Jurnal Harian - Google Apps Script

Ini adalah project **bot laporan jurnal harian otomatis** yang dibuat menggunakan Google Apps Script. Tujuannya buat nyimpen dan ngelola laporan harian (kayak kegiatan PKL, magang, atau apapun itu) ke Google Spreadsheet, cuma lewat bot Telegram. Simpel, efektif, dan anti ribet.

## ✨ Fitur Utama

- Kirim laporan harian lewat Telegram (bisa foto + deskripsi kegiatan).
- Data langsung masuk ke Google Spreadsheet secara terstruktur.
- Bisa edit laporan sebelumnya.
- Bisa lihat laporan terakhir.
- Bisa setor laporan buat tanggal yang lalu (manual).
- Aman, cuma user tertentu yang bisa akses.

## 🛠️ Cara Instalasi

### 1. Buat Google Spreadsheet

1. Buka Google Spreadsheet baru.
2. Buat header di baris pertama seperti ini:

   | Tanggal | Foto | Deskripsi | Timestamp |
   |---------|------|-----------|-----------|

3. Simpan dan catat ID spreadsheet-nya (ada di URL setelah `/d/` dan sebelum `/edit`).

### 2. Buat Folder di Google Drive

1. Bikin satu folder di Google Drive buat nyimpen fotonya.
2. Klik kanan folder itu > "Get link" > Ubah ke **"Anyone with the link"** kalau mau akses publik.
3. Catat Folder ID-nya (dari URL setelah `folders/`).

### 3. Buat Project Google Apps Script

1. Buka [script.new](https://script.new) di browser.
2. Ganti nama project-nya (misalnya: `Bot Jurnal Harian`).
3. Hapus semua kode, lalu tempel isi file `main.gs` yang udah di download dari sini.
4. Edit bagian variabel `SPREADSHEET_ID` dan `FOLDER_ID` di awal script pake ID kamu sendiri.

### 4. Deploy jadi Web App

1. Klik **Deploy > New Deployment**
2. Klik ikon gear ⚙ > **Web App**
3. Isi:
   - Description: bebas
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik Deploy
5. Salin URL Web App-nya

### 5. Hubungkan dengan Telegram

1. Buka BotFather di Telegram.
2. Buat bot baru / ambil bot token yang udah ada.
3. Gunakan tools seperti [n8n.io](https://n8n.io), [Pipedream](https://pipedream.com), atau webhook middleware buat nyambungin bot ke Web App.
   - (Bisa juga pakai Google Apps Script sebagai webhook receiver, tapi perlu teknik tambahan)

---

## ⚙ Struktur Spreadsheet

| Kolom       | Keterangan                                  |
|-------------|---------------------------------------------|
| Tanggal     | Tanggal kegiatan, bisa manual               |
| Foto        | Link foto yang diunggah ke Drive            |
| Deskripsi   | Penjelasan kegiatan harian                  |
| Timestamp   | Waktu saat laporan disetor                  |

---

## 📎 Contoh Format Setoran

1. User kirim foto kegiatan via Telegram.
2. Bot minta deskripsi kegiatan.
3. Bot simpan semuanya ke spreadsheet.
4. User bisa ngetik `/edit` buat ubah deskripsi sebelumnya.

---

## 💡 Catatan

- Pastikan folder foto punya akses publik kalau mau embed di spreadsheet.
- Script ini cuma bisa diakses oleh user yang ID-nya terdaftar.
- Kamu bisa kembangin fitur kayak export PDF, summary mingguan, atau notifikasi otomatis.

---

## 🧠 Saran Pengembangan

- Tambahkan log aktivitas ke tab berbeda.
- Buat halaman visualisasi di Google Data Studio.
- Tambahkan fitur pengingat kalau belum setor di hari tertentu.

---

## 📬 Kontak

Punya ide pengembangan atau butuh bantuan? Feel free to reach out 😄

---
