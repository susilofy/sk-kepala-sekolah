@echo off
chcp 65001 >nul
title Menjalankan Aplikasi Desktop Mode - SK Sekolah
cls

echo =====================================================================
echo    MENJALANKAN APLIKASI SK SEKOLAH DALAM JENDELA DESKTOP
echo    SDN 3 Loloan Timur
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

echo Membangun berkas terbaru...
call npm run build

echo Membuka aplikasi dalam jendela desktop...
call npx electron electron/main.cjs

pause
