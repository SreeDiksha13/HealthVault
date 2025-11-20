@echo off
echo ========================================
echo  Hospital Locator - Quick Start
echo ========================================
echo.

REM Check if OSM file exists
if not exist "data\india-latest.osm.pbf" (
    echo [!] OSM data file not found!
    echo.
    echo Please download the India OSM data:
    echo 1. Visit: https://download.geofabrik.de/asia/india.html
    echo 2. Download: india-latest.osm.pbf
    echo 3. Place it in: backend\data\
    echo.
    echo Or download a specific state if you prefer a smaller dataset.
    echo.
    pause
    exit /b
)

echo [*] OSM file found!
echo.

REM Check if MongoDB is running
echo [*] Checking MongoDB connection...
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_locator').then(() => { console.log('[+] MongoDB connected!'); process.exit(0); }).catch(() => { console.log('[!] MongoDB not running. Please start MongoDB first.'); process.exit(1); });"

if errorlevel 1 (
    echo.
    echo Please start MongoDB and try again.
    pause
    exit /b
)

echo.
echo ========================================
echo  Starting Import Process
echo ========================================
echo.
echo This may take 10-30 minutes for full India dataset
echo You can monitor progress below...
echo.

node src\scripts\importOsmData.js

echo.
echo ========================================
echo  Import Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: npm run dev
echo 2. Start frontend: cd ..\frontend ^&^& npm run dev
echo 3. Open: http://localhost:5173
echo.
pause
