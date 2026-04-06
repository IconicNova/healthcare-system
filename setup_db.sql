-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='homecare') THEN
        CREATE USER homecare WITH PASSWORD 'homecare123';
    END IF;
END
$$;

-- Create database if not exists
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'homecare_pro';
DROP DATABASE IF EXISTS homecare_pro;
CREATE DATABASE homecare_pro OWNER homecare;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE homecare_pro TO homecare;
