@echo off
:: =====================================================================
:: SKRIP PEMBUAT APLIKASI EXE PORTABEL (WINDOWS)
:: Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur
:: =====================================================================

:: Pastikan bekerja di folder tempat file .bat ini berada (bukan System32 / Downloads acak)
cd /d "%~dp0"
color 1F
title Pembuat Aplikasi EXE Portabel - SK & Surat Tugas Sekolah
cls

echo =====================================================================
echo       PEMBUAT FILE APLIKASI EXE PORTABEL (WINDOWS)
echo       Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur
echo =====================================================================
echo.

:: 1. Verifikasi Keberadaan Berkas Proyek
echo [1/4] Memeriksa kelengkapan berkas aplikasi...
if not exist "package.json" (
    echo.
    echo =====================================================================
    echo [PERHATIAN PENTING - BERKAS TIDAK LENGKAP]
    echo =====================================================================
    echo File "BUAT_EXE_PORTABEL.bat" ini dijalankan sendirian di folder:
    echo   %CD%
    echo.
    echo Script ini MEMERLUKAN seluruh berkas sumber aplikasi (package.json, src, dll).
    echo.
    echo CARA MEMPERBAIKI:
    echo 1. Buka kembali aplikasi di web browser.
    echo 2. Buka menu "Aplikasi Desktop Portabel (.EXE)".
    echo 3. Klik tombol "Unduh Paket Lengkap Proyek (.ZIP)".
    echo 4. Ekstrak (Extract All) berkas ZIP tersebut ke folder di komputer Anda
    echo    (misalnya di D:\Aplikasi-SK atau Desktop\Aplikasi-SK).
    echo 5. Buka folder hasil ekstrak, lalu klik 2x file "BUAT_EXE_PORTABEL.bat" di sana.
    echo =====================================================================
    echo.
    echo Tekan tombol apa saja untuk menutup jendela ini...
    pause >nul
    exit /b 1
)
echo [OK] Berkas proyek ditemukan.
if not exist ".env" (
    if exist ".env.example" (
        copy /y ".env.example" ".env" >nul 2>&1
        echo [INFO] Menyiapkan file template .env untuk konfigurasi lokal.
    )
)
echo.

:: 2. Verifikasi Instalasi Node.js di Windows
echo [2/4] Memeriksa Node.js di komputer Anda...
node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo =====================================================================
    echo [PERHATIAN PENTING - NODE.JS BELUM TERPASANG]
    echo =====================================================================
    echo Komputer Anda belum memiliki Node.js (atau belum terdaftar di PATH).
    echo Untuk mengemas aplikasi menjadi file .EXE, Windows memerlukan Node.js.
    echo.
    echo PANDUAN CEPAT (Hanya perlu sekali saja):
    echo 1. Kunjungi situs resmi: https://nodejs.org/
    echo 2. Unduh versi "LTS" (Recommended For Most Users).
    echo 3. Buka file installer (.msi) dan klik Next sampai selesai.
    echo 4. Tutup dan buka kembali file "BUAT_EXE_PORTABEL.bat" ini.
    echo =====================================================================
    echo.
    echo Tekan tombol apa saja untuk menutup jendela ini...
    pause >nul
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VERSION=%%v
echo [OK] Node.js terdeteksi: %NODE_VERSION%
echo.

:: 3. Memeriksa dan Memasang Dependensi (npm install)
echo [3/4] Memeriksa modul dependensi aplikasi...
if not exist "node_modules\vite" (
    echo Mengunduh paket modul yang dibutuhkan (proses ini membutuhkan koneksi internet)...
    echo Mohon tunggu sebentar...
    echo.
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo.
        echo =====================================================================
        echo [ERROR] Gagal mengunduh modul dengan npm install.
        echo Pastikan komputer terhubung dengan internet, lalu coba lagi.
        echo =====================================================================
        echo.
        echo Tekan tombol apa saja untuk menutup jendela ini...
        pause >nul
        exit /b 1
    )
) else (
    echo [OK] Modul dependensi sudah siap.
)
echo.

:: 4. Build Berkas Web dan Server
echo [4/4] Mengompilasi dan mengemas aplikasi menjadi SATU FILE EXE PORTABEL...
echo Langkah 4a: Menyusun aset web (npm run build)...
call npm run build
if errorlevel 1 (
    echo.
    echo =====================================================================
    echo [ERROR] Gagal menyusun kode aplikasi (npm run build).
    echo =====================================================================
    echo.
    echo Tekan tombol apa saja untuk menutup jendela ini...
    pause >nul
    exit /b 1
)

echo.
echo Langkah 4b: Mengemas menjadi file EXE Portabel (Electron Builder)...
echo Mohon tunggu, proses pemadatan file .exe sedang berlangsung...
call npx electron-builder --config electron-builder.json --win portable
if errorlevel 1 (
    echo.
    echo =====================================================================
    echo [ERROR] Gagal membuat file EXE portabel.
    echo Silakan periksa pesan kesalahan di atas.
    echo =====================================================================
    echo.
    echo Tekan tombol apa saja untuk menutup jendela ini...
    pause >nul
    exit /b 1
)

echo.
echo =====================================================================
echo  SELAMAT! FILE EXE PORTABEL BERHASIL DIBUAT DENGAN SUKSES!
echo =====================================================================
echo  Lokasi File : dist-electron\Aplikasi-SK-Sekolah-Portable.exe
echo.
echo  Keunggulan File Ini:
echo  1. Mandiri (Standalone): Seluruh aplikasi dikemas menjadi satu file .exe.
echo  2. Bebas Dibawa: Dapat disalin ke Flashdisk / USB drive.
echo  3. Tanpa Instalasi: Langsung klik 2x untuk membuka di laptop sekolah mana saja.
echo.
echo  PANDUAN FITUR AI (GOOGLE GEMINI) SETELAH DIINSTAL / DI LAPTOP:
echo  - Seluruh fitur penyusunan SK, cetak A4, dan ekspor Word TETAP BISA
echo    digunakan 100%% tanpa internet (menggunakan template dinas standar).
echo  - Untuk mengaktifkan respon cerdas AI Google Gemini di laptop:
echo    1. Pastikan laptop terhubung ke internet.
echo    2. Buka https://aistudio.google.com/apikey (Gratis) untuk ambil API key.
echo    3. Buka file .env di sebelah file .exe atau di folder data dengan Notepad,
echo       lalu masukkan: GEMINI_API_KEY=kunci_anda_disini
echo =====================================================================
echo.

if exist "dist-electron" (
    if exist ".env" (
        copy /y ".env" "dist-electron\.env" >nul 2>&1
    ) else if exist ".env.example" (
        copy /y ".env.example" "dist-electron\.env.example" >nul 2>&1
    )
    echo Membuka folder lokasi file EXE...
    explorer dist-electron
)

echo.
echo Selesai. Tekan tombol apa saja untuk keluar...
pause >nul
