@echo off
echo Setting up PostgreSQL database for HomeCare Pro...

REM Create user and database
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d postgres -c "SELECT 1 FROM pg_roles WHERE rolname='homecare'" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo User homecare already exists
) else (
    echo Creating user homecare...
    "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d postgres -c "CREATE USER homecare WITH PASSWORD 'homecare123'"
)

echo Dropping existing database if exists...
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d postgres -c "DROP DATABASE IF EXISTS homecare_pro"

echo Creating database homecare_pro...
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d postgres -c "CREATE DATABASE homecare_pro OWNER homecare"

echo Granting privileges...
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE homecare_pro TO homecare"

echo.
echo Database setup complete!
echo.
pause
