from flask import Flask, jsonify, render_template, request, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv # type: ignore
import os
import mysql.connector

load_dotenv()

app = Flask(__name__)
app.secret_key = "ppppp"  # Required for session management
app.config.from_object('config.Config')

# Database Configuration
db_config = {
    'user': 'root',
    'password': '1234',
    'host': 'localhost',
    'database': 'electronics_store'
}

db = SQLAlchemy(app)
# Function to get database connection
def get_db_connection():
    return mysql.connector.connect(**db_config)

# Check if user is logged in
def is_logged_in():
    return 'user_id' in session

# Main route - redirect to login if not logged in
@app.route('/')
def index():
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('index.html')

@app.route('/card')
def card():
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('card.html')

@app.route('/nri')
def nri():
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('nri.html')

@app.route('/payment')
def payment_website():
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('payment_website.html')

@app.route('/upi')
def upi():
    if not is_logged_in():
        return redirect(url_for('login'))
    return render_template('upi.html')

# Login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    # If already logged in, redirect to index
    if is_logged_in():
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user and password == user['password']:  # In production, use password hashing!
            session['user_id'] = user['id']
            session['email'] = user['email']
            session['name'] = user['name']
            flash('Login successful!', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password. Please register if you don\'t have an account.', 'error')
    
    return render_template('login.html')

# Logout route
@app.route('/logout')
def logout():
    # Clear the user session
    session.clear()
    # Redirect to login with a logout parameter
    return redirect(url_for('login', logout='success'))

# Register route
@app.route('/register', methods=['GET', 'POST'])
def register():
    # If already logged in, redirect to index
    if is_logged_in():
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']  # In production, hash this password
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            flash('Email already registered. Please login.', 'error')
            cursor.close()
            conn.close()
            return redirect(url_for('login'))
        
        # Insert new user
        cursor.execute('INSERT INTO users (name, email, password) VALUES (%s, %s, %s)',
                      (name, email, password))
        conn.commit()
        cursor.close()
        conn.close()
        
        flash('Registration successful! Please login with your new account.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html')

# ✅ Get all products
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = '''
    SELECT p.id, p.name, p.price, p.image_url, p.subcategory_id, s.name AS subcategory, c.name AS category
    FROM products p
    JOIN subcategories s ON p.subcategory_id = s.id
    JOIN categories c ON s.category_id = c.id
    '''
    cursor.execute(query)
    products = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(products)

# ✅ Get all categories
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM categories')
    categories = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(categories)

# ✅ Get subcategories by category ID
@app.route('/api/subcategories/<int:category_id>', methods=['GET'])
def get_subcategories(category_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM subcategories WHERE category_id = %s', (category_id,))
    subcategories = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(subcategories)

if __name__ == '__main__':
    app.run(debug=True)