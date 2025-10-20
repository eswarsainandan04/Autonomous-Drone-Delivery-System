from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import requests
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'shadowfly',
    'user': 'postgres',
    'password': 'admin',
    'port': 5432
}

# Raspberry Pi DDT Control URL
DDT_CONTROL_URL = "https://sddtlaunch-akshai.in1.pitunnel.net"

def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None

def validate_otp(otp):
    """Validate OTP against customers table"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM customers WHERE otp = %s", (otp,))
        customer = cursor.fetchone()
        return dict(customer) if customer else None
    except psycopg2.Error as e:
        print(f"Database query error: {e}")
        return None
    finally:
        conn.close()

def trigger_door_open(rack_name):
    """Send door open command to Raspberry Pi DDT system"""
    try:
        url = f"{DDT_CONTROL_URL}/door-open"
        payload = {"cmd": rack_name.lower()}
        
        print(f"[INFO] Sending door open command to {url} with payload: {payload}")
        
        response = requests.post(
            url, 
            json=payload, 
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print(f"[SUCCESS] Door open command sent successfully for {rack_name}")
            return True
        else:
            print(f"[ERROR] Door open failed with status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Failed to send door open command: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error in door open: {e}")
        return False

def get_package_details(package_id):
    """Get package details from packagemanagement table"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(
            "SELECT package_id, current_status, item_details FROM packagemanagement WHERE package_id = %s",
            (package_id,)
        )
        package = cursor.fetchone()
        return dict(package) if package else None
    except psycopg2.Error as e:
        print(f"Database query error: {e}")
        return None
    finally:
        conn.close()

def validate_admin_credentials(username, password):
    """Validate admin credentials with fallback logic"""
    # First check hardcoded admin credentials
    if username == "admin@shadowfly" and password == "drone12345":
        return True
    
    # If not hardcoded admin, check admins_data table
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT username, password FROM admins_data WHERE username = %s AND password = %s", 
                      (username, password))
        admin = cursor.fetchone()
        return admin is not None
    except psycopg2.Error as e:
        print(f"Admin validation error: {e}")
        return False
    finally:
        conn.close()

def get_ddt_details(ddt_name="SFDDT"):
    """Get DDT details and associated packages"""
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get DDT details
        cursor.execute("""
            SELECT id, name, latitude, longitude, status, 
                   rack_01, rack_02, rack_03, rack_04, rack_05, rack_06,
                   total_racks, control_key
            FROM ddts WHERE name = %s
        """, (ddt_name,))
        ddt = cursor.fetchone()
        
        if not ddt:
            return None
            
        # Get packages for each rack
        ddt_dict = dict(ddt)
        ddt_dict['rack_packages'] = {}
        
        for i in range(1, 7):  # rack_01 to rack_06
            rack_key = f'rack_{i:02d}'
            package_id = ddt_dict.get(rack_key)
            
            if package_id:
                # Get OTP for this package
                cursor.execute("SELECT otp FROM customers WHERE package_id = %s", (package_id,))
                otp_result = cursor.fetchone()
                otp = otp_result['otp'] if otp_result else None
                
                ddt_dict['rack_packages'][rack_key] = {
                    'package_id': package_id,
                    'otp': otp,
                    'rack_number': f'R{i:03d}'
                }
        
        return ddt_dict
        
    except psycopg2.Error as e:
        print(f"DDT query error: {e}")
        return None
    finally:
        conn.close()

@app.route('/')
def index():
    """Serve the home page"""
    return render_template('index.html')

@app.route('/user-login')
def user_login():
    """Serve the user login page"""
    return render_template('user-login.html')

@app.route('/admin-login')
def admin_login():
    """Serve the admin login page"""
    return render_template('admin-login.html')

@app.route('/dashboard')
def dashboard():
    """Serve the admin dashboard"""
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    return render_template('dashboard.html')

@app.route('/validate-otp', methods=['POST'])
def validate_otp_route():
    """API endpoint to validate OTP and trigger door opening"""
    data = request.get_json()
    otp = data.get('otp')
    
    if not otp:
        return jsonify({'success': False, 'message': 'OTP is required'}), 400
    
    # Validate OTP against database
    customer = validate_otp(otp)
    
    if customer:
        # Store OTP in session for package details page
        session['validated_otp'] = otp
        session['customer_data'] = customer
        
        # Get rack information and trigger door opening
        rack_name = customer.get('rack')
        if rack_name:
            print(f"[INFO] Triggering door open for rack: {rack_name}")
            door_success = trigger_door_open(rack_name)
            
            if door_success:
                return jsonify({
                    'success': True, 
                    'message': 'OTP validated successfully. Door is opening!',
                    'door_opened': True,
                    'rack': rack_name
                })
            else:
                return jsonify({
                    'success': True, 
                    'message': 'OTP validated but door opening failed. Please contact support.',
                    'door_opened': False,
                    'rack': rack_name
                })
        else:
            return jsonify({
                'success': True, 
                'message': 'OTP validated but no rack assigned. Please contact support.',
                'door_opened': False
            })
    else:
        return jsonify({'success': False, 'message': 'Invalid OTP. Please try again.'}), 401

@app.route('/package-details')
def package_details():
    """Serve package details page with data"""
    # Check if user has validated OTP
    if 'validated_otp' not in session:
        return redirect(url_for('user_login'))
    
    otp = session['validated_otp']
    customer_data = session.get('customer_data')
    
    if not customer_data:
        return redirect(url_for('user_login'))
    
    # Get package details
    package_data = get_package_details(customer_data['package_id'])
    
    # Prepare data for template
    template_data = {
        'customer': customer_data,
        'package': package_data,
        'otp': otp
    }
    
    return render_template('package-details.html', data=template_data)

@app.route('/api/package-data')
def api_package_data():
    """API endpoint to get package data for frontend"""
    if 'validated_otp' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    customer_data = session.get('customer_data')
    if not customer_data:
        return jsonify({'error': 'No customer data'}), 401
    
    package_data = get_package_details(customer_data['package_id'])
    
    return jsonify({
        'customer': customer_data,
        'package': package_data
    })

@app.route('/logout')
def logout():
    """Clear session and redirect to home"""
    session.clear()
    return redirect(url_for('index'))

@app.route('/validate-admin', methods=['POST'])
def validate_admin_route():
    """API endpoint to validate admin credentials"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400
    
    if validate_admin_credentials(username, password):
        session['admin_logged_in'] = True
        session['admin_username'] = username
        return jsonify({'success': True, 'message': 'Admin login successful'})
    else:
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

@app.route('/api/ddt-data')
def api_ddt_data():
    """API endpoint to get DDT data for admin dashboard"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    ddt_data = get_ddt_details()
    if ddt_data:
        return jsonify(ddt_data)
    else:
        return jsonify({'error': 'DDT data not found'}), 404

@app.route('/manual-door-open', methods=['POST'])
def manual_door_open():
    """Manual door opening endpoint for admin use"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    rack_name = data.get('rack')
    
    if not rack_name:
        return jsonify({'success': False, 'message': 'Rack name is required'}), 400
    
    door_success = trigger_door_open(rack_name)
    
    if door_success:
        return jsonify({'success': True, 'message': f'Door opened successfully for {rack_name}'})
    else:
        return jsonify({'success': False, 'message': f'Failed to open door for {rack_name}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=7000)
