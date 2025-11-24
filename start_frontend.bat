@echo off
echo Starting HealthScan Frontend Server...
cd frontend
echo Frontend will be available at: http://localhost:8080
echo.
echo Make sure the backend is running on port 5000!
echo.
python -m http.server 8080