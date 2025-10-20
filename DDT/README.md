# ShadowFly Flask Backend

This Flask application provides the backend for the ShadowFly package management system.

## Setup Instructions

1. **Install Dependencies**
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

## Database Setup

1. **Create Required Tables**
   \`\`\`bash
   # Run the SQL script to create tables
   psql -h localhost -U postgres -d shadowfly -f scripts/create_tables.sql
   \`\`\`

2. **Create Sample Data**
   \`\`\`bash
   # Create sample data for testing
   python scripts/create_sample_data.py
   python scripts/create_admin_sample_data.py
   \`\`\`

3. **Database Setup**
   - Ensure PostgreSQL is running
   - Create database 'shadowfly' if it doesn't exist
   - Make sure your database has the required tables:
     - `customers` table
     - `packagemanagement` table

4. **Create Sample Data** (Optional)
   \`\`\`bash
   python scripts/create_sample_data.py
   \`\`\`

5. **Run the Application**
   \`\`\`bash
   python app.py
   \`\`\`

6. **Access the Application**
   - Home: http://localhost:5000/
   - User Login: http://localhost:5000/user-login
   - Admin Login: http://localhost:5000/admin-login

## Features

- **User Authentication**: OTP-based login system
- **Database Integration**: PostgreSQL connection with proper error handling
- **Session Management**: Secure session handling for user data
- **API Endpoints**: RESTful API for frontend integration
- **Admin Dashboard**: Administrative interface (preserved from original)
- **Enhanced Admin Authentication**: Supports both hardcoded and database-stored admin credentials
- **DDT Integration**: Displays DDT rack status and package information
- **Dynamic Dashboard**: Real-time loading of DDT and package data
- **Improved Security**: Session-based authentication for admin users

## API Endpoints

- `POST /validate-otp`: Validate user OTP
- `GET /api/package-data`: Get package details for authenticated user
- `GET /package-details`: Package details page
- `GET /logout`: Clear session and logout

## Database Queries

The application performs the following database operations:

1. **OTP Validation**: `SELECT * FROM customers WHERE otp = %s`
2. **Package Details**: `SELECT package_id, current_status, item_details FROM packagemanagement WHERE package_id = %s`
3. **Customer Details**: Retrieved during OTP validation

## Security Notes

- Change the Flask secret key in production
- Use environment variables for database credentials
- Implement proper admin authentication for production use
- Add CSRF protection for forms
- Use HTTPS in production

## Test Credentials

### Admin Login
- **Hardcoded Admin**: username: `admin@shadowfly`, password: `drone12345`
- **Database Admin**: username: `admin_user`, password: `password123`
- **Database Manager**: username: `manager`, password: `manager456`

### User OTPs
- `123456` (PKG001 - Rack R001)
- `789012` (PKG002 - Rack R002)
- `111111` (PKG003 - Rack R003)
- `222222` (PKG004 - Rack R004)
