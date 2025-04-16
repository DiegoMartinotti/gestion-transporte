@echo off
echo Creando backup de MongoDB (con reemplazo de password)...

REM Crea carpeta para el backup
mkdir mongodb-backup

REM Captura la URI fija del archivo .env
set MONGO_URI=mongodb+srv://dbLiquidaciones:REEMPLAZAR_PASSWORD@cluster0.ahw8j.mongodb.net/?retryWrites=true^&w=majority^&appName=Cluster0

REM Pedir la contraseña al usuario
echo.
echo La cadena de conexión contiene ${DB_PASSWORD} que debe ser reemplazada.
echo.
echo Por favor, introduce la contraseña real para la base de datos:
set /p DB_PASSWORD=

REM Reemplazar el marcador de posición por la contraseña real
set MONGO_URI=%MONGO_URI:REEMPLAZAR_PASSWORD=%DB_PASSWORD%

echo.
echo Ejecutando backup con la contraseña proporcionada...
mongodump --uri=%MONGO_URI% --out=mongodb-backup

echo.
echo Backup completado en la carpeta "mongodb-backup"
pause 