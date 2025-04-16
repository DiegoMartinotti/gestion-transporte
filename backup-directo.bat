@echo off
echo Creando backup de MongoDB (método directo)...

REM Crea carpeta para el backup
mkdir mongodb-backup

REM Captura la URI completa del archivo .env (sin procesar)
cd backend
type .env
echo.

REM Pedir la URL al usuario directamente
echo Por favor, copia y pega la URL completa de MongoDB (desde el archivo .env):
set /p MONGO_URI=

REM Volver a la raíz
cd ..

echo Ejecutando backup con la URI proporcionada...
mongodump --uri=%MONGO_URI% --out=mongodb-backup

echo Backup completado en la carpeta "mongodb-backup"
pause 