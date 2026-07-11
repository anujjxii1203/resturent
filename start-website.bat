@echo off
echo ========================================================
echo        STARTING SWAAD RUSTAM RESTAURANT SYSTEM
echo ========================================================
echo.
echo Starting all background servers (Website, Database, WhatsApp API)...
docker-compose up -d

echo.
echo Waiting a few seconds for the servers to initialize...
timeout /t 10 /nobreak >nul

echo.
echo Opening the Website and WhatsApp Manager in your browser...
:: This will open the URLs in your default browser. 
:: If Brave is your default browser, it will open in Brave.
start "" "http://localhost:3000/"
start "" "http://localhost:8080/manager/"

echo.
echo ========================================================
echo    SYSTEM IS NOW RUNNING IN THE BACKGROUND!
echo    You can safely close this black window.
echo ========================================================
pause
