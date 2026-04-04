from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import hashlib
import threading
import platform   # ✅ added

app = Flask(__name__, static_folder='.')

BACKEND_DIR = os.path.join(os.getcwd(), 'backend')

# ✅ OS-based executable selection
if platform.system() == "Windows":
    MAIN_EXE = os.path.abspath(os.path.join(BACKEND_DIR, 'main.exe'))
else:
    MAIN_EXE = os.path.join(BACKEND_DIR, 'main')

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
        if os.path.exists(USERS_TXT):
            with open(USERS_TXT, 'r') as f:
                if username in [line.strip() for line in f if line.strip()]:
                    return 'Username already exists.', 400

        with open(USERS_TXT, 'a') as f:
            f.write(username + '\n')

        hashed = hash_password(password)
        with open(PASSWORDS_TXT, 'a') as f:
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

        with open(PASSWORDS_TXT, 'r') as f:
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


@app.route('/run-backend', methods=['GET', 'POST'])
def run_backend():
    if request.method == 'GET':
        return jsonify({"success": False, "message": "GET method not allowed"}), 405
    data = request.get_json()
    command = data.get('command', '')

    with file_lock:
        with open(INPUT_TXT, 'w') as f:
            f.write(command + '\n')

    try:
        # ✅ FIXED: use MAIN_EXE
        subprocess.run([MAIN_EXE], check=True, cwd=BACKEND_DIR)
    except Exception as e:
        return jsonify({"success": False, "message": f"Error running backend: {e}"}), 500

    try:
        with file_lock:
            with open(OUTPUT_TXT, 'r') as f:
                result = f.read().strip()
    except Exception as e:
        return jsonify({"success": False, "message": f"Error reading output: {e}"}), 500

    # Parse the result and return structured JSON
    if result.startswith('User added:'):
        user = result.split(': ', 1)[1]
        return jsonify({"success": True, "message": f"User {user} added successfully"})
    elif result == 'User already exists.':
        return jsonify({"success": False, "message": "User already exists"})
    elif result.startswith('Friendship added:'):
        connection = result.split(': ', 1)[1]
        return jsonify({"success": True, "message": f"Connection created: {connection}"})
    elif result == 'Friendship already exists.':
        return jsonify({"success": False, "message": "Connection already exists"})
    elif result == 'One or both users do not exist.':
        return jsonify({"success": False, "message": "One or both users do not exist"})
    elif result == 'Cannot connect user to themselves.':
        return jsonify({"success": False, "message": "Cannot connect user to themselves"})
    elif result.startswith('Friend suggestions for'):
        return jsonify({"success": True, "message": result})
    elif result == 'No suggestions.':
        return jsonify({"success": True, "message": "No friend suggestions available"})
    elif result == 'Unknown command.':
        return jsonify({"success": False, "message": "Unknown command"})
    else:
        return jsonify({"success": False, "message": result})


@app.route('/users', methods=['GET'])
def get_users():
    users = []
    with file_lock:
        try:
            with open(USERS_TXT, 'r') as f:
                users = [line.strip() for line in f if line.strip()]
        except:
            pass

    return jsonify(users)


@app.route('/clear', methods=['POST'])
def clear_data():
    try:
        with file_lock:
            # Clear all data files
            open(USERS_TXT, 'w').close()
            open(PASSWORDS_TXT, 'w').close()
            open(os.path.join(BACKEND_DIR, 'friendships.txt'), 'w').close()
        return jsonify({"success": True, "message": "Data cleared successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error clearing data: {e}"}), 500


@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)


# ✅ deployment ready
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)