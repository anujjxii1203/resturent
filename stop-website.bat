@echo off
echo ========================================================
echo        STOPPING SWAAD RUSTAM RESTAURANT SYSTEM
echo ========================================================
echo.
echo Stopping all background servers (Website, Database, WhatsApp API)...
docker-compose down

echo.
echo ========================================================
echo    ALL SERVERS HAVE BEEN STOPPED SUCCESSFULLY!
echo ========================================================
pause
