-- Create admins_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS admins_data (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mobile_number VARCHAR(15) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ddts table if it doesn't exist
CREATE TABLE IF NOT EXISTS ddts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(255),
    rack_01 VARCHAR(255),
    rack_02 VARCHAR(255),
    rack_03 VARCHAR(255),
    rack_04 VARCHAR(255),
    rack_05 VARCHAR(255),
    rack_06 VARCHAR(255),
    total_racks INTEGER,
    control_key VARCHAR(225)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins_data(username);
CREATE INDEX IF NOT EXISTS idx_ddts_name ON ddts(name);
CREATE INDEX IF NOT EXISTS idx_customers_otp ON customers(otp);
CREATE INDEX IF NOT EXISTS idx_customers_package_id ON customers(package_id);
