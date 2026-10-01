@echo off
chcp 65001 >nul
title Pembuat Installer Setup (.exe) - SK Sekolah
cls

echo =====================================================================
echo       PEMBUAT FILE INSTALLER SETUP (WINDOWS)
echo       Aplikasi SK & Surat Tugas Sekolah - SDN 3 Loloan Timur
echo =====================================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang. Unduh di https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Memasang dependensi...
    call npm install
)

echo [1/2] Melakukan build berkas...
call npm run build

echo [2/2] Mengemas installer setup Windows...
call npx electron-builder --config electron-builder.json --win nsis

if %errorlevel% equ 0 (
    echo.
    echo =====================================================================
    echo SUKSES! Installer Setup tersimpan di folder dist-electron\
    echo =====================================================================
    if exist "dist-electron" (
        explorer dist-electron
    )
) else (
    echo.
    echo [ERROR] Terjadi kendala saat membuat installer.
)
pause
