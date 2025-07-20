// ========================= SIMPLE VERSION - FRIEND NETWORK =========================
let scene, camera, renderer, nodes = [], lines = [];
let raycaster, mouse;

// ========================= THREE.JS INITIALIZATION =========================
function initThreeJS() {
    console.log('Starting simple Three.js setup...');
    
    try {
        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        const canvas = document.querySelector('#threejs-bg');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }
        
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add simple lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0x6366f1, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Initialize raycaster
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // Create simple network
        createSimpleNetwork();
        
        // Position camera
        camera.position.z = 15;
        
        // Handle resize
        window.addEventListener('resize', onWindowResize);
        
        // Start animation
        animate();
        
        console.log('Three.js setup complete!');
        
    } catch (error) {
        console.error('Three.js setup error:', error);
    }
}

function createSimpleNetwork() {
    // Create simple spheres as nodes
    const nodeGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const nodeMaterial = new THREE.MeshPhongMaterial({
        color: 0x6366f1,
        emissive: 0x6366f1,
        emissiveIntensity: 0.2
    });

    // Create nodes in a circle
    const nodeCount = 8;
    for(let i = 0; i < nodeCount; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
        
        const angle = (i / nodeCount) * Math.PI * 2;
        const radius = 6;
        
        node.position.x = Math.cos(angle) * radius;
        node.position.y = Math.sin(angle) * radius;
        node.position.z = 0;
        
        node.userData = {
            pulsePhase: Math.random() * Math.PI * 2
        };
        
        nodes.push(node);
        scene.add(node);
    }

    // Create connections
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x6366f1,
        transparent: true,
        opacity: 0.5
    });

    for(let i = 0; i < nodes.length; i++) {
        const nextIndex = (i + 1) % nodes.length;
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            nodes[i].position,
            nodes[nextIndex].position
        ]);
        
        const line = new THREE.Line(lineGeometry, lineMaterial);
        lines.push(line);
        scene.add(line);
    }
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Simple rotation
    if (scene) {
        scene.rotation.y += 0.002;
    }

    // Animate nodes
    const time = Date.now() * 0.001;
    nodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.userData.pulsePhase) * 0.1 + 1;
        node.scale.set(pulse, pulse, pulse);
    });

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ========================= APP INITIALIZATION =========================
function initializeApp() {
    console.log('Initializing app...');
    
    // Hide loading screen after 1 second
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        if (mainApp) {
            mainApp.style.display = 'block';
            setTimeout(() => {
                mainApp.classList.add('loaded');
                initializeInteractions();
            }, 100);
        }
    }, 1000);
}

function initializeInteractions() {
    console.log('Setting up interactions...');
    
    // Add user functionality
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', handleAddUser);
    }

    // Add friendship functionality
    const addFriendshipBtn = document.getElementById('addFriendshipBtn');
    if (addFriendshipBtn) {
        addFriendshipBtn.addEventListener('click', handleAddFriendship);
    }

    // Suggest friends functionality
    const suggestBtn = document.getElementById('suggestBtn');
    if (suggestBtn) {
        suggestBtn.addEventListener('click', handleSuggestFriends);
    }
    
    updateUserDropdown();
}

// ========================= API HANDLERS =========================
async function handleAddUser() {
    const input = document.getElementById('newUserInput');
    const username = input.value.trim();
    
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    const resultArea = document.getElementById('resultArea');
    resultArea.textContent = 'Adding user...';
    
    try {
        const response = await fetch('/run-backend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: `add_user ${username}` })
        });
        
        const result = await response.text();
        resultArea.textContent = result;
        input.value = '';
        updateUserDropdown();
        
        // Trigger confetti if available
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
        
    } catch (error) {
        resultArea.textContent = 'Error: ' + error.message;
        console.error(error);
    }
}

async function handleAddFriendship() {
    const input1 = document.getElementById('friend1Input');
    const input2 = document.getElementById('friend2Input');
    const user1 = input1.value.trim();
    const user2 = input2.value.trim();
    
    if (!user1 || !user2) {
        alert('Please enter both usernames');
        return;
    }
    
    const resultArea = document.getElementById('resultArea');
    resultArea.textContent = 'Creating connection...';
    
    try {
        const response = await fetch('/run-backend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: `add_friendship ${user1} ${user2}` })
        });
        
        const result = await response.text();
        resultArea.textContent = result;
        input1.value = '';
        input2.value = '';
        updateUserDropdown();
        
        // Trigger confetti if available
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 80,
                spread: 60,
                colors: ['#ff6b6b', '#6366f1']
            });
        }
        
    } catch (error) {
        resultArea.textContent = 'Error: ' + error.message;
        console.error(error);
    }
}

async function handleSuggestFriends() {
    const dropdown = document.getElementById('userDropdown');
    const username = dropdown.value;
    
    if (!username) {
        alert('Please select a user');
        return;
    }
    
    const resultArea = document.getElementById('resultArea');
    resultArea.textContent = 'AI is thinking...';
    
    try {
        const response = await fetch('/run-backend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: `suggest ${username}` })
        });
        
        const result = await response.text();
        resultArea.textContent = result;
        
        // Trigger celebration confetti
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
        
    } catch (error) {
        resultArea.textContent = 'Error: ' + error.message;
        console.error(error);
    }
}

async function updateUserDropdown() {
    try {
        const response = await fetch('/users');
        const users = await response.json();
        const dropdown = document.getElementById('userDropdown');
        
        if (dropdown) {
            dropdown.innerHTML = '';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user;
                option.textContent = user;
                dropdown.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// ========================= INITIALIZATION =========================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting simple version...');
    
    try {
        initThreeJS();
        initializeApp();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// ========================= ERROR HANDLING =========================
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});
