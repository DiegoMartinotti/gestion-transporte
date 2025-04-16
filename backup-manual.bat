@echo off
echo Backup de MongoDB - Método Manual...

REM Crea carpeta para el backup
mkdir mongodb-backup 2>nul

echo.
echo Por favor, introduce la URI completa de MongoDB (incluyendo la contraseña):
echo Ejemplo: mongodb+srv://usuario:contraseña@cluster.mongodb.net/?options
echo.
set /p MONGO_URI="> "

if "%MONGO_URI%"=="" (
    echo No se proporcionó una URI. Saliendo.
    pause
    exit /b 1
)

echo.
echo Ejecutando backup...
mongodump --uri="%MONGO_URI%" --out=mongodb-backup

if errorlevel 1 (
    echo.
    echo ERROR: El backup falló.
) else (
    echo.
    echo Backup completado en la carpeta "mongodb-backup"
)
pause 