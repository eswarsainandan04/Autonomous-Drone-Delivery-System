import os
import psycopg2
import psycopg2.extras
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import datetime
import uuid
import logging
import random
import requests
import time
from threading import Thread

app = Flask(__name__)
CORS(app, origins="*", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

DB_HOST = "localhost"
DB_NAME = "shadowfly"
DB_USER = "postgres"
DB_PASS = "admin"
DB_PORT = 5432

# Global launch status tracking
launch_status_tracker = {}
email_sent_packages = set()
# Global rack tracking for packages
package_rack_mapping = {}

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def create_customers_table_if_not_exists():
    """Create customers table if it doesn't exist"""
    try:
        conn = get_db_connection()
        if not conn:
            print("Failed to connect to database for table creation")
            return False
        
        cursor = conn.cursor()
        
        create_table_query = """
        CREATE TABLE IF NOT EXISTS public.customers
        (
            customer_id character varying(225) COLLATE pg_catalog."default" NOT NULL,
            customer_name character varying(225) COLLATE pg_catalog."default",
            mail_id character varying(225) COLLATE pg_catalog."default",
            package_id character varying(225) COLLATE pg_catalog."default" NOT NULL,
            item_details character varying(225) COLLATE pg_catalog."default",
            otp integer,
            rack character varying(225) COLLATE pg_catalog."default",
            CONSTRAINT customers_pkey PRIMARY KEY (customer_id)
        )
        TABLESPACE pg_default;
        
        ALTER TABLE IF EXISTS public.customers
            OWNER to postgres;
        """
        
        cursor.execute(create_table_query)
        conn.commit()
        cursor.close()
        conn.close()
        
        print("✅ Customers table created/verified successfully")
        return True
        
    except Exception as e:
        print(f"❌ Error creating customers table: {e}")
        return False
    
create_customers_table_if_not_exists()

def update_drone_source_coordinates(conn, drone_id, source_lat, source_lng):
    """Updates the source coordinates in the dronesdata table."""
    if not drone_id:
        return False
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE dronesdata 
                SET source_lat = %s, source_lng = %s 
                WHERE drone_id = %s;
            """, (source_lat, source_lng, drone_id))
            rows_affected = cur.rowcount
            print(f"Updated source coordinates for drone {drone_id}. Rows affected: {rows_affected}")
            return rows_affected > 0
    except psycopg2.Error as e:
        print(f"Error updating drone source coordinates: {e}")
        return False

def clear_drone_gripper_after_delivery(conn, package_id):
    """Clear the drone gripper that contained the delivered package"""
    try:
        with conn.cursor() as cur:
            # Find which gripper contains this package_id and clear it
            cur.execute("""
                UPDATE dronesdata 
                SET gripper_01 = CASE WHEN gripper_01 = %s THEN NULL ELSE gripper_01 END,
                    gripper_02 = CASE WHEN gripper_02 = %s THEN NULL ELSE gripper_02 END,
                    gripper_03 = CASE WHEN gripper_03 = %s THEN NULL ELSE gripper_03 END
                WHERE gripper_01 = %s OR gripper_02 = %s OR gripper_03 = %s
            """, (package_id, package_id, package_id, package_id, package_id, package_id))
            
            rows_affected = cur.rowcount
            if rows_affected > 0:
                print(f"✅ Cleared gripper for delivered package {package_id}. Rows affected: {rows_affected}")
                return True
            else:
                print(f"⚠️ No gripper found containing package {package_id}")
                return False
    except psycopg2.Error as e:
        print(f"❌ Error clearing drone gripper: {e}")
        return False

def generate_otp():
    """Generate a 6-digit OTP"""
    return random.randint(100000, 999999)

def update_ddt_rack_with_package(conn, package_id, ddt_name, rack_column):
    """Update DDT rack with package_id"""
    try:
        with conn.cursor() as cur:
            cur.execute(f"""
                UPDATE ddts SET {rack_column} = %s WHERE name = %s
            """, (package_id, ddt_name))
            rows_affected = cur.rowcount
            print(f"Updated {ddt_name} {rack_column} with package {package_id}. Rows affected: {rows_affected}")
            return rows_affected > 0
    except psycopg2.Error as e:
        print(f"Error updating DDT rack: {e}")
        return False

def update_customer_otp(conn, package_id, otp):
    """Update customer OTP in database"""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE customers SET otp = %s WHERE package_id = %s
            """, (otp, package_id))
            rows_affected = cur.rowcount
            print(f"Updated OTP for package {package_id}. Rows affected: {rows_affected}")
            return rows_affected > 0
    except psycopg2.Error as e:
        print(f"Error updating customer OTP: {e}")
        return False

def update_customer_rack(conn, package_id, selected_rack):
    """Update customer rack information when package is delivered"""
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE customers SET rack = %s WHERE package_id = %s
            """, (selected_rack, package_id))
            rows_affected = cur.rowcount
            print(f"Updated customer rack for package {package_id} to {selected_rack}. Rows affected: {rows_affected}")
            return rows_affected > 0
    except psycopg2.Error as e:
        print(f"Error updating customer rack: {e}")
        return False

def clear_ddt_rack(conn, ddt_name, rack_column):
    """Clear DDT rack by setting it to NULL"""
    try:
        with conn.cursor() as cur:
            cur.execute(f"""
                UPDATE ddts SET {rack_column} = NULL WHERE name = %s
            """, (ddt_name,))
            rows_affected = cur.rowcount
            print(f"Cleared {ddt_name} {rack_column}. Rows affected: {rows_affected}")
            return rows_affected > 0
    except psycopg2.Error as e:
        print(f"Error clearing DDT rack: {e}")
        return False

def monitor_delivery_status(package_id, control_key, ddt_name, rack_column):
    """Background thread to monitor delivery status"""
    print(f"Starting status monitoring for package {package_id}")
    
    while True:
        try:
            # Check status from external DDT server
            response = requests.get(f"{control_key}/status", timeout=5)
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'Unknown')
                
                # Update global status tracker
                launch_status_tracker[package_id] = status
                print(f"Package {package_id} status: {status}")
                
                if status == 'Delivered':
                    # Process delivery completion
                    if package_id not in email_sent_packages:
                        conn = get_db_connection()
                        if conn:
                            try:
                                # Get customer email
                                cursor = conn.cursor()
                                cursor.execute("""
                                    SELECT mail_id FROM customers WHERE package_id = %s
                                """, (package_id,))
                                
                                result = cursor.fetchone()
                                if result:
                                    mail_id = result[0]
                                    
                                    # Generate and update OTP
                                    otp = generate_otp()
                                    if update_customer_otp(conn, package_id, otp):
                                        # Update customer rack information
                                        selected_rack = package_rack_mapping.get(package_id)
                                        if selected_rack:
                                            if update_customer_rack(conn, package_id, selected_rack):
                                                print(f"Successfully updated customer rack to {selected_rack} for package {package_id}")
                                            else:
                                                print(f"Failed to update customer rack for package {package_id}")
                                        else:
                                            print(f"No rack mapping found for package {package_id}")
                                        
                                        # Ensure package_id is in the DDT rack after delivery
                                        if selected_rack:
                                            if update_ddt_rack_with_package(conn, package_id, ddt_name, selected_rack):
                                                print(f"Confirmed package {package_id} is in {ddt_name} {selected_rack} after delivery")
                                            else:
                                                print(f"Warning: Failed to confirm package {package_id} in DDT rack after delivery")
                                        
                                        # 🆕 NEW FEATURE: Clear drone gripper after successful delivery
                                        if clear_drone_gripper_after_delivery(conn, package_id):
                                            print(f"✅ Successfully cleared drone gripper for delivered package {package_id}")
                                        else:
                                            print(f"⚠️ Warning: Could not clear drone gripper for package {package_id}")
                                        
                                        # Mark as ready for email sending (frontend will handle EmailJS)
                                        email_sent_packages.add(package_id)
                                        print(f"OTP {otp} generated and updated for package {package_id}, ready for email to {mail_id}")
                                        
                                        conn.commit()
                                        print(f"Package {package_id} delivered successfully, OTP ready for email, package remains in rack {selected_rack}, drone gripper cleared")
                                    else:
                                        print(f"Failed to update OTP for package {package_id}")
                                        conn.rollback()
                                else:
                                    print(f"No customer found for package {package_id}")
                                    
                                cursor.close()
                            except Exception as e:
                                print(f"Error processing delivery for package {package_id}: {e}")
                                conn.rollback()
                            finally:
                                conn.close()
                    break  # Stop monitoring once delivered
                    
                elif status == 'Failed':
                    print(f"Delivery failed for package {package_id}")
                    # Clear the rack if delivery failed
                    conn = get_db_connection()
                    if conn:
                        try:
                            clear_ddt_rack(conn, ddt_name, rack_column)
                            # Also clear drone gripper on failure
                            clear_drone_gripper_after_delivery(conn, package_id)
                            conn.commit()
                            print(f"Cleared rack {rack_column} and drone gripper due to delivery failure")
                        except Exception as e:
                            print(f"Error clearing rack/gripper after delivery failure: {e}")
                        finally:
                            conn.close()
                    break  # Stop monitoring on failure
                    
            else:
                print(f"Failed to get status for package {package_id}: HTTP {response.status_code}")
                
        except requests.RequestException as e:
            print(f"Error checking status for package {package_id}: {e}")
        except Exception as e:
            print(f"Unexpected error monitoring package {package_id}: {e}")
            
        time.sleep(3)  # Check every 3 seconds

@app.route('/api/packages', methods=['GET'])
def get_packages():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        status_filter = request.args.get('status')
        if status_filter:
            cursor.execute("""
                SELECT * FROM packagemanagement 
                WHERE current_status = %s 
                ORDER BY last_update_time DESC
            """, (status_filter,))
        else:
            cursor.execute("""
                SELECT * FROM packagemanagement 
                ORDER BY last_update_time DESC
            """)
        
        packages = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(packages)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delivery-drones', methods=['GET'])
def get_delivery_drones():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT DISTINCT dd.*
            FROM dronesdata dd
            INNER JOIN (
                SELECT DISTINCT assigned_drone_id 
                FROM packagemanagement 
                WHERE assigned_drone_id IS NOT NULL
            ) pm ON dd.drone_id = pm.assigned_drone_id
        """)
        
        drones = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return jsonify(drones)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/drone/<drone_id>', methods=['GET'])
def get_drone_data(drone_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("SELECT * FROM dronesdata WHERE drone_id = %s", (drone_id,))
        
        drone = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if drone:
            return jsonify(drone)
        else:
            return jsonify({"error": "Drone not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/drone-source-coordinates/<drone_id>', methods=['POST'])
def update_drone_source_coords(drone_id):
    """Updates source coordinates for a drone."""
    try:
        data = request.json
        source_lat = data.get('source_lat')
        source_lng = data.get('source_lng')
        
        if source_lat is None or source_lng is None:
            return jsonify({"error": "source_lat and source_lng are required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        success = update_drone_source_coordinates(conn, drone_id, source_lat, source_lng)
        
        if success:
            conn.commit()
            conn.close()
            return jsonify({
                "status": "success",
                "message": f"Source coordinates updated for drone {drone_id}",
                "drone_id": drone_id,
                "source_lat": source_lat,
                "source_lng": source_lng
            })
        else:
            conn.close()
            return jsonify({"error": "Failed to update source coordinates"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/drone-destination/<drone_id>', methods=['GET'])
def get_drone_destination(drone_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT destination_lat, destination_lng, warehouse_name
            FROM packagemanagement
            WHERE assigned_drone_id = %s
            LIMIT 1
        """, (drone_id,))
        
        destination = cursor.fetchone()
        
        if not destination:
            cursor.close()
            conn.close()
            return jsonify({"error": "No destination found for this drone"}), 404
        
        if destination['destination_lat'] and destination['destination_lng']:
            cursor.execute("""
                SELECT *
                FROM ddts
                WHERE latitude = %s AND longitude = %s
            """, (destination['destination_lat'], destination['destination_lng']))
            
            ddts = cursor.fetchall()
            
            for ddt in ddts:
                available_racks = []
                total_racks = ddt['total_racks'] or 0
                
                if total_racks > 0:
                    for i in range(1, total_racks + 1):
                        rack_column = f"rack_{i:02d}"
                        if rack_column in ddt and ddt[rack_column] is None:
                            available_racks.append({
                                'rack_number': i,
                                'rack_name': f"Rack {i:02d}",
                                'rack_column': rack_column
                            })
                
                ddt['available_racks'] = available_racks
                ddt['available_count'] = len(available_racks)
            
            destination['ddts'] = ddts
        else:
            destination['ddts'] = []
        
        if destination['warehouse_name']:
            cursor.execute("""
                SELECT latitude, longitude
                FROM warehouses
                WHERE name = %s
            """, (destination['warehouse_name'],))
            
            warehouse = cursor.fetchone()
            if warehouse:
                destination['warehouse_coords'] = warehouse
        
        cursor.close()
        conn.close()
        
        return jsonify(destination)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ddts', methods=['GET'])
def get_ddts():
    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cursor.execute("""
            SELECT * FROM ddts 
            WHERE latitude = %s AND longitude = %s
        """, (lat, lng))
        
        ddts = cursor.fetchall()
        
        for ddt in ddts:
            available_racks = []
            total_racks = ddt['total_racks'] or 0
            
            if total_racks > 0:
                for i in range(1, total_racks + 1):
                    rack_column = f"rack_{i:02d}"
                    if rack_column in ddt and ddt[rack_column] is None:
                        available_racks.append({
                            'rack_number': i,
                            'rack_name': f"Rack {i:02d}",
                            'rack_column': rack_column
                        })
            
            ddt['available_racks'] = available_racks
            ddt['available_count'] = len(available_racks)
        
        cursor.close()
        conn.close()
        
        return jsonify(ddts)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/get-control-key', methods=['POST', 'OPTIONS'])
def get_control_key():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    try:
        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if latitude is None or longitude is None:
            return jsonify({"error": "latitude and longitude are required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT control_key FROM ddts WHERE latitude = %s AND longitude = %s
        """, (latitude, longitude))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result or not result[0]:
            return jsonify({"error": "Control key not found for the given coordinates"}), 404
        
        control_key = result[0].strip()
        
        if not control_key.startswith('http'):
            control_key = f"https://{control_key}"
        
        return jsonify({
            "status": "success",
            "control_key": control_key,
            "latitude": latitude,
            "longitude": longitude
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/launch-package', methods=['POST'])
def launch_package():
    """Launch package with proper flow: get control_key -> launch -> monitor status"""
    try:
        data = request.json
        package_id = data.get('package_id')
        ddt_name = data.get('ddt_name')
        rack_column = data.get('rack_column')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not all([package_id, ddt_name, rack_column, latitude, longitude]):
            return jsonify({"error": "Missing required parameters"}), 400
        
        # Store rack mapping for later use when package is delivered
        package_rack_mapping[package_id] = rack_column
        print(f"Stored rack mapping: {package_id} -> {rack_column}")
        
        # Get control_key from database
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT control_key FROM ddts WHERE latitude = %s AND longitude = %s
        """, (latitude, longitude))
        
        result = cursor.fetchone()
        if not result or not result[0]:
            cursor.close()
            conn.close()
            return jsonify({"error": "Control key not found"}), 404
        
        control_key = result[0].strip()
        if not control_key.startswith('http'):
            control_key = f"https://{control_key}"
        
        # Initially update DDT rack with package_id (reserve the rack)
        success = update_ddt_rack_with_package(conn, package_id, ddt_name, rack_column)
        if not success:
            cursor.close()
            conn.close()
            return jsonify({"error": "Failed to update DDT rack"}), 500
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Launch package via external DDT control server
        launch_payload = {
            "package_id": package_id,
            "ddt_name": ddt_name,
            "rack_column": rack_column
        }
        
        try:
            response = requests.post(
                f"{control_key}/launch",
                json=launch_payload,
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                # Initialize status tracking
                launch_status_tracker[package_id] = "Processing"
                
                # Start background monitoring thread
                monitor_thread = Thread(
                    target=monitor_delivery_status,
                    args=(package_id, control_key, ddt_name, rack_column),
                    daemon=True
                )
                monitor_thread.start()
                
                return jsonify({
                    "status": "success",
                    "message": f"Package {package_id} launched successfully",
                    "package_id": package_id,
                    "control_key": control_key,
                    "selected_rack": rack_column
                })
            else:
                return jsonify({"error": f"Launch failed: HTTP {response.status_code}"}), 500
                
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to communicate with DDT server: {str(e)}"}), 500
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/package-status/<package_id>', methods=['GET'])
def get_package_status(package_id):
    """Get current status of a package"""
    status = launch_status_tracker.get(package_id, "Ready")
    selected_rack = package_rack_mapping.get(package_id)
    return jsonify({
        "package_id": package_id,
        "status": status,
        "email_sent": package_id in email_sent_packages,
        "selected_rack": selected_rack
    })

@app.route('/api/get-otp-data/<package_id>', methods=['GET'])
def get_otp_data(package_id):
    """Get OTP data for delivered package"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT mail_id, otp, rack FROM customers WHERE package_id = %s
        """, (package_id,))
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not result:
            return jsonify({"error": "Customer not found for package"}), 404
        
        mail_id, otp, rack = result
        
        if not otp:
            return jsonify({"error": "OTP not generated yet"}), 404
        
        return jsonify({
            "status": "success",
            "package_id": package_id,
            "mail_id": mail_id,
            "otp": otp,
            "rack": rack
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/reset-package/<package_id>', methods=['POST'])
def reset_package(package_id):
    """Reset package status and clear tracking"""
    try:
        data = request.json
        control_key = data.get('control_key')
        
        if control_key:
            # Send reset to external server
            try:
                requests.post(
                    f"{control_key}/reset",
                    timeout=5,
                    headers={"Content-Type": "application/json"}
                )
            except requests.RequestException as e:
                print(f"Failed to reset external server: {e}")
        
        # Clear local tracking
        if package_id in launch_status_tracker:
            del launch_status_tracker[package_id]
        if package_id in email_sent_packages:
            email_sent_packages.remove(package_id)
        if package_id in package_rack_mapping:
            del package_rack_mapping[package_id]
        
        return jsonify({
            "status": "success",
            "message": f"Package {package_id} reset successfully"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/generate-otp/<package_id>', methods=['POST'])
def generate_otp_for_package(package_id):
    """Generate OTP for package (called automatically when delivered)"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT mail_id FROM customers WHERE package_id = %s
        """, (package_id,))
        
        result = cursor.fetchone()
        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "Customer not found for package"}), 404
        
        mail_id = result[0]
        otp = generate_otp()
        
        cursor.execute("""
            UPDATE customers SET otp = %s WHERE package_id = %s
        """, (otp, package_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "mail_id": mail_id,
            "otp": otp,
            "package_id": package_id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delivery/launch', methods=['POST'])
def launch_delivery():
    try:
        data = request.json
        package_id = data.get('package_id')
        delivery_method = data.get('delivery_method')
        selected_rack = data.get('selected_rack')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE packagemanagement 
            SET current_status = 'Out for Delivery',
                dispatch_time = %s,
                last_update_time = %s
            WHERE package_id = %s
        """, (datetime.datetime.now(), datetime.datetime.now(), package_id))
        
        cursor.execute("""
            UPDATE dronesdata 
            SET dest_lat = (
                SELECT destination_lat FROM packagemanagement 
                WHERE package_id = %s
            ),
            dest_lng = (
                SELECT destination_lng FROM packagemanagement 
                WHERE package_id = %s
            )
            WHERE drone_id = (
                SELECT assigned_drone_id FROM packagemanagement 
                WHERE package_id = %s
            )
        """, (package_id, package_id, package_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": f"Delivery launched via {delivery_method}",
            "package_id": package_id,
            "delivery_method": delivery_method,
            "selected_rack": selected_rack
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# New endpoint to clear rack when customer picks up package
@app.route('/api/pickup-package/<package_id>', methods=['POST'])
def pickup_package(package_id):
    """Clear DDT rack when customer picks up package"""
    try:
        data = request.json
        ddt_name = data.get('ddt_name')
        rack_column = data.get('rack_column')
        
        if not all([ddt_name, rack_column]):
            return jsonify({"error": "Missing ddt_name or rack_column"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        # Clear the rack after customer pickup
        success = clear_ddt_rack(conn, ddt_name, rack_column)
        if success:
            conn.commit()
            print(f"Package {package_id} picked up, cleared {ddt_name} {rack_column}")
            
            # Clean up tracking data
            if package_id in package_rack_mapping:
                del package_rack_mapping[package_id]
            if package_id in launch_status_tracker:
                del launch_status_tracker[package_id]
            if package_id in email_sent_packages:
                email_sent_packages.remove(package_id)
            
            conn.close()
            return jsonify({
                "status": "success",
                "message": f"Package {package_id} picked up successfully, rack cleared"
            })
        else:
            conn.close()
            return jsonify({"error": "Failed to clear rack"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting DDT Control Server...")
    
    # Create customers table if it doesn't exist
    print("Checking/Creating database tables...")
    create_customers_table_if_not_exists()
    
    print("Key endpoints:")
    print("- POST /api/launch-package - Launch package with full flow")
    print("- GET /api/package-status/<package_id> - Get package status")
    print("- GET /api/get-otp-data/<package_id> - Get OTP data for delivered package")
    print("- POST /api/reset-package/<package_id> - Reset package")
    print("- POST /api/pickup-package/<package_id> - Clear rack after customer pickup")
    print("- POST /api/get-control-key - Get control key from coordinates")
    print("🆕 NEW: Automatic drone gripper clearing after package delivery!")
    app.run(debug=True, host='0.0.0.0', port=5090)
