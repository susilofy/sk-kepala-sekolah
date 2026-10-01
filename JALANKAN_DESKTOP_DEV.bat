@echo off
:: =====================================================================
:: SKRIP MENJALANKAN APLIKASI DALAM JENDELA DESKTOP
:: Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur
:: =====================================================================

cd /d "%~dp0"
color 1F
title Menjalankan Aplikasi Mode Desktop - SDN 3 Loloan Timur
cls

echo =====================================================================
echo    MENJALANKAN APLIKASI SK SEKOLAH DALAM JENDELA DESKTOP
echo    SDN 3 Loloan Timur
echo =====================================================================
echo.

if not exist "package.json" (
    echo [PERINGATAN] Berkas package.json tidak ditemukan.
    echo File ini harus dijalankan di dalam folder proyek aplikasi hasil ekstrak ZIP.
    echo.
    echo Tekan tombol apa saja untuk menutup...
    pause >nul
    exit /b 1
)

node -v >nul 2>&1
if errorlevel 1 (
    echo [PERINGATAN] Node.js belum terpasang di komputer Anda.
    echo Silakan unduh dan pasang Node.js LTS terlebih dahulu di https://nodejs.org/
    echo.
    echo Tekan tombol apa saja untuk menutup...
    pause >nul
    exit /b 1
)

if not exist "node_modules\vite" (
    echo Mengunduh modul dependensi (npm install --legacy-peer-deps)...
    call npm install --legacy-peer-deps
)

echo Membuka aplikasi dalam jendela desktop...
call npm run electron:dev
if errorlevel 1 (
    echo.
    echo Aplikasi ditutup dengan kode error.
    pause >nul
)
