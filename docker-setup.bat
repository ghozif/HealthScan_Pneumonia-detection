@echo off
echo ========================================
echo HealthScan - Docker Setup
echo ========================================

echo.
echo [1/3] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop from https://docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo Docker found!

echo.
echo [2/3] Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose is not available
    echo Please ensure Docker Desktop is running
    pause
    exit /b 1
)
echo Docker Compose found!

echo.
echo [3/3] Building and starting containers...
docker-compose up --build -d

if errorlevel 1 (
    echo ERROR: Failed to start containers
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! HealthScan is now running:
echo ========================================
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:5000
echo.
echo To stop: docker-compose down
echo To view logs: docker-compose logs -f
echo.
echo IMPORTANT: Place your .h5 model file in backend/models/pneumonia_model.h5
echo ========================================
pause