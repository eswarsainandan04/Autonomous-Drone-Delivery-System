import psycopg2
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'shadowfly',
    'user': 'postgres',
    'password': 'admin',
    'port': 5432
}

def create_admin_and_ddt_data():
    """Create sample admin and DDT data for testing"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Insert sample admin data
        cursor.execute("""
            INSERT INTO admins_data (name, email, mobile_number, username, password)
            VALUES 
            ('Admin User', 'admin@shadowfly.com', '1234567890', 'admin_user', 'password123'),
            ('Manager User', 'manager@shadowfly.com', '0987654321', 'manager', 'manager456')
            ON CONFLICT (username) DO NOTHING;
        """)
        
        # Insert sample DDT data
        cursor.execute("""
            INSERT INTO ddts (
                name, latitude, longitude, status, 
                rack_01, rack_02, rack_03, rack_04, rack_05, rack_06,
                total_racks, control_key
            )
            VALUES 
            ('SFDDT', 37.7749, -122.4194, 'active',
             'PKG001', 'PKG002', NULL, NULL, NULL, NULL,
             6, 'CTRL001')
            ON CONFLICT (name) DO NOTHING;
        """)
        
        # Update existing customers with more test data
        cursor.execute("""
            INSERT INTO customers (customer_id, customer_name, mail_id, package_id, item_details, otp, rack)
            VALUES 
            ('CUST003', 'Alice Johnson', 'alice@email.com', 'PKG003', 'Clothing Package', 111111, 'R003'),
            ('CUST004', 'Bob Wilson', 'bob@email.com', 'PKG004', 'Home Goods', 222222, 'R004')
            ON CONFLICT (customer_id) DO NOTHING;
        """)
        
        # Update packagemanagement with more test data
        cursor.execute("""
            INSERT INTO packagemanagement (
                package_id, tracking_code, sender_id, customer_id, warehouse_name,
                destination_address, current_status, weight_kg, item_details
            )
            VALUES 
            ('PKG003', 'TRK003', 'SEND003', 'CUST003', 'Main Warehouse',
             '789 Pine St, City, State', 'Processing', '1.8', 'Clothing Package'),
            ('PKG004', 'TRK004', 'SEND004', 'CUST004', 'Main Warehouse',
             '321 Elm St, City, State', 'Shipped', '3.2', 'Home Goods')
            ON CONFLICT (package_id) DO NOTHING;
        """)
        
        conn.commit()
        print("Admin and DDT sample data created successfully!")
        print("\nTest Credentials:")
        print("1. Hardcoded Admin: username='admin@shadowfly', password='drone12345'")
        print("2. Database Admin: username='admin_user', password='password123'")
        print("3. Database Manager: username='manager', password='manager456'")
        print("\nTest OTPs:")
        print("- 123456 (PKG001)")
        print("- 789012 (PKG002)")
        print("- 111111 (PKG003)")
        print("- 222222 (PKG004)")
        
    except psycopg2.Error as e:
        print(f"Error creating sample data: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_admin_and_ddt_data()
