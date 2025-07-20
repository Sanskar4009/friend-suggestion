from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import hashlib
import threading

app = Flask(__name__, static_folder='')
BACKEND_DIR = os.path.join(os.getcwd(), 'backend')
MAIN_EXE = os.path.join(BACKEND_DIR, 'main.exe')
INPUT_TXT = os.path.join(BACKEND_DIR, 'input.txt')
OUTPUT_TXT = os.path.join(BACKEND_DIR, 'output.txt')
USERS_TXT = os.path.join(BACKEND_DIR, 'users.txt')
PASSWORDS_TXT = os.path.join(BACKEND_DIR, 'passwords.txt')
file_lock = threading.Lock()

def hash_password(password):
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return 'Username and password required.', 400
    with file_lock:
        # Check if user exists
        if os.path.exists(USERS_TXT):
            with open(USERS_TXT, 'r', encoding='utf-8') as f:
                if username in [line.strip() for line in f if line.strip()]:
                    return 'Username already exists.', 400
        # Add to users.txt
        with open(USERS_TXT, 'a', encoding='utf-8') as f:
            f.write(username + '\n')
        # Add to passwords.txt
        hashed = hash_password(password)
        with open(PASSWORDS_TXT, 'a', encoding='utf-8') as f:
            f.write(f'{username}:{hashed}\n')
    return 'Account created.', 200

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    if not username or not password:
        return 'Username and password required.', 400
    hashed = hash_password(password)
    with file_lock:
        if not os.path.exists(PASSWORDS_TXT):
            return 'No users registered.', 400
        with open(PASSWORDS_TXT, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                u, p = line.strip().split(':', 1)
                if u == username:
                    if p == hashed:
                        return 'Login successful.', 200
                    else:
                        return 'Incorrect password.', 400
    return 'User not found.', 400

@app.route('/run-backend', methods=['POST'])
def run_backend():
    data = request.get_json()
    command = data.get('command', '')
    # Write command to input.txt
    with file_lock:
        with open(INPUT_TXT, 'w', encoding='utf-8') as f:
            f.write(command + '\n')
    # Run main.exe
    try:
        subprocess.run([MAIN_EXE], cwd=BACKEND_DIR, check=True)
    except Exception as e:
        return f'Error running backend: {e}', 500
    # Read output.txt
    try:
        with file_lock:
            with open(OUTPUT_TXT, 'r', encoding='utf-8') as f:
                result = f.read()
    except Exception as e:
        result = f'Error reading output: {e}'
    return result

@app.route('/users', methods=['GET'])
def get_users():
    users = []
    with file_lock:
        try:
            with open(USERS_TXT, 'r', encoding='utf-8') as f:
                users = [line.strip() for line in f if line.strip()]
        except Exception:
            pass
    return jsonify(users)

@app.route('/', methods=['GET'])
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>', methods=['GET'])
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(port=3000, debug=True) 