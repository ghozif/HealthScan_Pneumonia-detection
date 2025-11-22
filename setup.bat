@echo off
echo ========================================
echo HealthScan - Pneumonia Detection Setup
echo ========================================

echo.
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)
echo Python found!

echo.
echo [2/4] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [3/4] Creating necessary directories...
if not exist "models" mkdir models
if not exist "uploads" mkdir uploads
echo Directories created!

echo.
echo [4/4] Setup complete!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Place your .h5 model file in: backend\models\pneumonia_model.h5
echo 2. Start backend: python backend\app.py
echo 3. Start frontend: python -m http.server 8080 (in frontend folder)
echo 4. Open browser: http://localhost:8080
echo.
echo ========================================
pause