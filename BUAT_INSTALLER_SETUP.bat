@echo off
:: =====================================================================
:: SKRIP PEMBUAT INSTALLER SETUP (.EXE)
:: Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur
:: =====================================================================

cd /d "%~dp0"
color 1F
title Pembuat Installer Setup (.exe) - SDN 3 Loloan Timur
cls

echo =====================================================================
echo       PEMBUAT FILE INSTALLER SETUP (WINDOWS)
echo       Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur
echo =====================================================================
echo.

if not exist "package.json" (
    echo [PERINGATAN] Berkas package.json tidak ditemukan di folder ini.
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
    echo Mengunduh paket modul yang dibutuhkan...
    call npm install --legacy-peer-deps
)

echo [1/2] Menyusun aset aplikasi (npm run build)...
call npm run build
if errorlevel 1 (
    echo [ERROR] Gagal menyusun kode aplikasi.
    pause >nul
    exit /b 1
)

echo [2/2] Mengemas installer setup Windows (NSIS)...
call npx electron-builder --config electron-builder.json --win nsis
if errorlevel 1 (
    echo [ERROR] Gagal membuat file installer.
    pause >nul
    exit /b 1
)

echo.
echo =====================================================================
echo SUKSES! File Installer Setup berhasil dibuat:
echo dist-electron\Aplikasi-SK-Sekolah-Setup.exe
echo =====================================================================
echo.
if exist "dist-electron" explorer dist-electron
pause >nul
