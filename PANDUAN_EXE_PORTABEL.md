# Panduan Menjadikan Aplikasi SK Sekolah Sebagai File .EXE Portabel

Aplikasi ini dapat dikemas menjadi **Aplikasi Desktop Mandiri (.EXE)** untuk sistem operasi Windows (Windows 10 / Windows 11).

Dengan format **EXE Portabel**:
- **Bisa langsung dibuka di komputer mana saja tanpa instalasi** (cukup klik 2x).
- **Bisa disimpan dan dijalankan dari Flashdisk / USB Drive**.
- **Berjalan offline tanpa koneksi internet** untuk penyusunan SK, cetak naskah dinas A4, ekspor Microsoft Word (.docx), dan pembuatan Surat Tugas (SPT).
- Semua data sekolah, daftar guru, dan arsip SK tersimpan secara aman di komputer lokal Anda.

---

## CARA MUDAH 1: Menggunakan Script 1-Klik (Rekomendasi untuk Windows)

Jika Anda sudah mengunduh / mengekstrak folder proyek ini di komputer Windows:

1. Pastikan komputer Anda telah terpasang **Node.js** (unduh gratis di [nodejs.org](https://nodejs.org/), pilih versi LTS).
2. Di dalam folder proyek ini, cukup **klik dua kali (Double Click)** pada file:
   ```text
   BUAT_EXE_PORTABEL.bat
   ```
3. Jendela hitam (Command Prompt) akan memproses pembuatan file secara otomatis:
   - Memeriksa kelengkapan paket
   - Menyusun berkas aplikasi (build)
   - Mengemas menjadi file `.exe` portabel
4. Setelah selesai, folder `dist-electron\` akan terbuka secara otomatis di layar Anda.
5. Anda akan menemukan file:
   ```text
   dist-electron\Aplikasi-SK-Sekolah-Portable.exe
   ```
6. **Selesai!** Anda bisa menyalin file `Aplikasi-SK-Sekolah-Portable.exe` ini ke mana pun Anda suka (Flashdisk, Desktop, laptop guru lain) dan langsung menggunakannya.

---

## CARA MUDAH 2: Melalui Terminal / Command Prompt (CMD)

Jika Anda terbiasa menggunakan baris perintah (Terminal/CMD/PowerShell):

1. Buka folder proyek di Terminal atau VS Code.
2. Jalankan perintah instalasi dependensi (hanya jika baru pertama kali):
   ```bash
   npm install
   ```
3. Jalankan perintah pembuatan file EXE:
   ```bash
   npm run build:exe
   ```
4. File `.exe` portabel siap pakai akan berada di:
   ```text
   dist-electron/Aplikasi-SK-Sekolah-Portable.exe
   ```

---

## Opsi Tambahan:

- **Ingin Menguji Tampilan Desktop tanpa Menunggu Pembuatan .EXE?**
  - Cukup klik 2x pada file `JALANKAN_DESKTOP_DEV.bat` atau jalankan `npm run electron:dev`.
- **Ingin Membuat Installer Setup Windows (dengan shortcut Desktop & Start Menu)?**
  - Cukup klik 2x pada file `BUAT_INSTALLER_SETUP.bat` atau jalankan `npm run build:exe:installer`.

---

## Catatan Penting Penggunaan Windows:

1. **Peringatan Windows SmartScreen ("Windows protected your PC"):**
   Karena aplikasi ini dikompilasi secara mandiri (self-compiled) dan belum membeli sertifikat tanda tangan digital komersial berbayar (EV Code Signing Certificate), Windows SmartScreen mungkin menampilkan layar biru peringatan pada pembukaan pertama kali.
   - Solusi: Cukup klik **"More info" (Info selengkapnya)** -> lalu klik tombol **"Run anyway" (Tetap jalankan)**.
2. **Koneksi & Cara Mengaktifkan Fitur AI (Google Gemini):**
   - **Mode Offline (Tanpa Internet / Tanpa API Key):** Aplikasi tetap dapat digunakan 100% untuk menyusun seluruh jenis SK sekolah, menyusun Surat Tugas (SPT), mencetak dokumen format resmi A4, dan ekspor ke file Microsoft Word (.docx) menggunakan template standar dinas pendidikan yang sudah tertanam di dalam aplikasi.
   - **Mode Cerdas Online (AI Asisten & Pembuat SK Dinamis):**
     1. Komputer harus terhubung ke internet saat memanggil AI.
     2. Dapatkan API Key Gemini resmi Google secara gratis di: [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (Login dengan akun Google/Gmail Anda -> klik **Create API key**).
     3. Pada aplikasi desktop, buka menu atas **Bantuan** -> klik **Buka Folder Data & Pengaturan (.env)** (atau buka folder `data-sekolah` di sebelah file .exe).
     4. Buat / buka file bernama `.env` menggunakan Notepad, lalu tulis:
        ```env
        GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        ```
     5. Simpan file (`Ctrl + S`), lalu tutup dan buka kembali aplikasi Anda. Fitur asisten dan pembuatan SK cerdas akan langsung aktif penuh!
3. **Penyimpanan Data Lokal:**
   Data profil sekolah, logo/kop surat, daftar PTK, dan draf SK tersimpan secara persisten di folder lokal `data-sekolah` atau `%APPDATA%/Aplikasi-SK-Sekolah`. Jangan lupa gunakan menu **"Cadangan Data (Backup)"** untuk menyimpan salinan cadangan berkala ke file `.json`.
