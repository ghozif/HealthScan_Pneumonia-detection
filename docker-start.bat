@echo off
echo Starting HealthScan with Docker...
docker-compose up -d
echo.
echo HealthScan is running at:
echo Frontend: http://localhost:8080
echo Backend:  http://localhost:5000