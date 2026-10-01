@echo off
chcp 65001 >nul
title Pembuat Aplikasi EXE Portabel - SK & Surat Tugas Sekolah
cls

echo =====================================================================
echo       PEMBUAT FILE APLIKASI EXE PORTABEL (WINDOWS)
echo       Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur
echo =====================================================================
echo.

:: 1. Cek ketersediaan Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang di komputer Anda.
    echo Silakan unduh dan pasang Node.js LTS terlebih dahulu di:
    echo https://nodejs.org/
    echo Setelah dipasang, tutup jendela ini dan jalankan kembali file ini.
    echo.
    pause
    exit /b 1
)

echo [1/4] Node.js terdeteksi. Memeriksa dependensi proyek...
if not exist "node_modules" (
    echo Mengunduh paket modul yang dibutuhkan (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal mengunduh dependensi (npm install).
        pause
        exit /b 1
    )
)

echo [2/4] Melakukan build frontend dan backend server...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Proses build aplikasi gagal.
    pause
    exit /b 1
)

echo [3/4] Mengemas aplikasi menjadi SATU FILE EXE PORTABEL...
echo Mohon tunggu sebentar, file .exe sedang dipadatkan...
call npx electron-builder --config electron-builder.json --win portable
if %errorlevel% neq 0 (
    echo [ERROR] Gagal membuat file exe portabel.
    pause
    exit /b 1
)

echo.
echo =====================================================================
echo [4/4] SUKSES! File EXE Portabel berhasil dibuat!
echo =====================================================================
echo Lokasi File:
echo Folder: dist-electron\
echo Nama File: Aplikasi-SK-Sekolah-Portable.exe
echo.
echo Anda dapat menyalin file "Aplikasi-SK-Sekolah-Portable.exe" ini ke:
echo - Flashdisk / USB Drive
echo - Komputer sekolah mana saja
echo Langsung klik 2x untuk membuka tanpa perlu instalasi!
echo.

:: Buka folder hasil build di Windows Explorer
if exist "dist-electron" (
    explorer dist-electron
)

pause
