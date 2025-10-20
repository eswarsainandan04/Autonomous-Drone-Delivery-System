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

def create_sample_data():
    """Create sample data for testing"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    try:
        # Insert sample customer data
        cursor.execute("""
            INSERT INTO customers (customer_id, customer_name, mail_id, package_id, item_details, otp, rack)
            VALUES 
            ('CUST001', 'John Doe', 'john.doe@email.com', 'PKG001', 'Electronics Package', 123456, 'R001'),
            ('CUST002', 'Jane Smith', 'jane.smith@email.com', 'PKG002', 'Books Package', 789012, 'R002')
            ON CONFLICT (customer_id) DO NOTHING;
        """)
        
        # Insert sample package management data
        cursor.execute("""
            INSERT INTO packagemanagement (
                package_id, tracking_code, sender_id, customer_id, warehouse_name,
                destination_address, current_status, weight_kg, item_details
            )
            VALUES 
            ('PKG001', 'TRK001', 'SEND001', 'CUST001', 'Main Warehouse',
             '123 Main St, City, State', 'In Transit', '2.5', 'Electronics Package'),
            ('PKG002', 'TRK002', 'SEND002', 'CUST002', 'Main Warehouse',
             '456 Oak Ave, City, State', 'Delivered', '1.2', 'Books Package')
            ON CONFLICT (package_id) DO NOTHING;
        """)
        
        conn.commit()
        print("Sample data created successfully!")
        
    except psycopg2.Error as e:
        print(f"Error creating sample data: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    create_sample_data()
