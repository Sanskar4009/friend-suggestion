// ========================= SMOOTH ANIMATIONS & ELEGANT UX =========================
let currentUser = null;
let lenis;

// Three.js variables
let scene, camera, renderer, nodes = [], lines = [];
let raycaster, mouse;
let targetRotation = { x: 0, y: 0 };
let currentRotation = { x: 0, y: 0 };

// Enhanced visual effects
let particles = [];
let sparkles = [];
let hoveredNode = null;
let nodeClickEffects = [];
let interactiveWave = null;

// Confetti variables
let confettiCanvas;
let confettiCtx;

// ========================= THREE.JS INITIALIZATION =========================
function initThreeJS() {
    console.log('Starting Three.js setup...');
    
    try {
        // Scene setup
        scene = new THREE.Scene();
        console.log('Scene created');
        
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        console.log('Camera created');
        
        const canvas = document.querySelector('#threejs-bg');
        if (!canvas) {
            throw new Error('Canvas element #threejs-bg not found');
        }
        
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        console.log('Renderer created');
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        console.log('Ambient light added');
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0x6366f1, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        console.log('Directional light added');

        // Add colored point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0xff6b6b, 0.5, 50);
        pointLight1.position.set(-10, 10, 5);
        scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x4ecdc4, 0.5, 50);
        pointLight2.position.set(10, -10, -5);
        scene.add(pointLight2);
        console.log('Point lights added');

        // Initialize raycaster for interactivity
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        console.log('Raycaster initialized');

        // Create visual effects
        console.log('Creating visual effects...');
        createFloatingParticles();
        console.log('Floating particles created');
        
        createSparkles();
        console.log('Sparkles created');
        
        createBackgroundGeometry();
        console.log('Background geometry created');
        
        addAtmosphericEffects();
        console.log('Atmospheric effects added');
        
        interactiveWave = createInteractiveWaves();
        console.log('Interactive waves created');
        
        createNetworkNodes();
        console.log('Network nodes created');
        
        // Position camera
        camera.position.z = 15;
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
        // Add mouse interaction
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('click', onMouseClick);
        
        // Start animation loop
        animate();
        console.log('Animation loop started');
        
    } catch (error) {
        console.error('Three.js initialization error:', error);
        throw error;
    }
}

function createNetworkNodes() {
    // Create node geometry
    const nodeGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const nodeMaterial = new THREE.MeshPhongMaterial({
        color: 0x6366f1,
        emissive: 0x6366f1,
        emissiveIntensity: 0.2,
        shininess: 90
    });

    // Create multiple nodes in a network formation
    for(let i = 0; i < 15; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
        
        // Position nodes in a spherical pattern
        const radius = 8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        node.position.x = radius * Math.sin(phi) * Math.cos(theta);
        node.position.y = radius * Math.sin(phi) * Math.sin(theta);
        node.position.z = radius * Math.cos(phi);
        
        nodes.push(node);
        scene.add(node);
        
        // Add pulsing animation data
        node.userData = {
            pulsePhase: Math.random() * Math.PI * 2,
            originalScale: node.scale.x
        };
    }

    // Create connections between nodes
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x6366f1,
        transparent: true,
        opacity: 0.3
    });

    for(let i = 0; i < nodes.length; i++) {
        // Connect to 2-3 nearest nodes
        const connections = Math.floor(Math.random() * 2) + 2;
        for(let j = 0; j < connections; j++) {
            const targetIndex = (i + j + 1) % nodes.length;
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                nodes[i].position,
                nodes[targetIndex].position
            ]);
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            lines.push({
                line: line,
                start: i,
                end: targetIndex
            });
            scene.add(line);
        }
    }
}

function updateConnections() {
    lines.forEach(({line, start, end}) => {
        const positions = new Float32Array([
            nodes[start].position.x, nodes[start].position.y, nodes[start].position.z,
            nodes[end].position.x, nodes[end].position.y, nodes[end].position.z
        ]);
        line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        line.geometry.attributes.position.needsUpdate = true;
    });
}

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update target rotation based on mouse position
    targetRotation.x += (mouse.y - targetRotation.x) * 0.05;
    targetRotation.y += (mouse.x - targetRotation.y) * 0.05;
    
    // Check for node hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodes);
    
    // Reset previous hovered node
    if (hoveredNode) {
        hoveredNode.material.emissiveIntensity = 0.2;
        hoveredNode.userData.hovered = false;
    }
    
    // Set new hovered node
    if (intersects.length > 0) {
        hoveredNode = intersects[0].object;
        hoveredNode.material.emissiveIntensity = 0.5;
        hoveredNode.userData.hovered = true;
        document.body.style.cursor = 'pointer';
    } else {
        hoveredNode = null;
        document.body.style.cursor = 'default';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // Smooth camera rotation
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.1;
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.1;
    
    scene.rotation.x = currentRotation.x;
    scene.rotation.y = currentRotation.y;

    // Animate nodes
    const time = Date.now() * 0.001;
    nodes.forEach((node, i) => {
        // Pulsing effect
        let pulse = Math.sin(time * 2 + node.userData.pulsePhase) * 0.1 + 1;
        
        // Click pulse effect
        if (node.userData.clickPulse) {
            pulse *= node.userData.clickPulse;
            node.userData.clickPulse -= 0.05;
            if (node.userData.clickPulse <= 1) {
                node.userData.clickPulse = null;
            }
        }
        
        // Hover effect
        if (node.userData.hovered) {
            pulse *= 1.3;
        }
        
        node.scale.set(pulse, pulse, pulse);
        
        // Subtle floating motion
        node.position.y += Math.sin(time + i) * 0.001;
    });

    // Update connection lines
    updateConnections();

    // Animate particles
    particles.forEach(particle => {
        particle.position.add(particle.userData.direction.clone().multiplyScalar(particle.userData.speed));
        
        // Reset position if too far
        if (particle.position.length() > 50) {
            particle.position.copy(particle.userData.originalPosition);
        }
    });

    // Animate sparkles
    sparkles.forEach(sparkle => {
        sparkle.rotation.z += sparkle.userData.rotationSpeed;
        
        // Pulsing effect
        sparkle.material.opacity = sparkle.userData.originalOpacity * (0.5 + 0.5 * Math.sin(time + sparkle.userData.pulsePhase));
    });

    // Animate node click effects
    nodeClickEffects.forEach((effect, index) => {
        effect.scale.set(effect.userData.scale, effect.userData.scale, effect.userData.scale);
        effect.material.opacity -= effect.userData.fadeSpeed;
        
        // Remove effect after fading out
        if (effect.material.opacity <= 0) {
            scene.remove(effect);
            nodeClickEffects.splice(index, 1);
        }
    });

    // Update interactive waves
    const wave = scene.getObjectByName('interactiveWave');
    if (wave) {
        updateInteractiveWaves(wave, mouse.x, mouse.y);
    }

    // Update interactive wave
    if (interactiveWave) {
        updateInteractiveWaves(interactiveWave, mouse.x, mouse.y);
    }

    renderer.render(scene, camera);
}

// ========================= INITIALIZATION =========================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting initialization...');
    
    try {
        console.log('Initializing Three.js...');
        initThreeJS();
        console.log('Three.js initialized successfully');
        
        console.log('Initializing app...');
        initializeApp();
        console.log('App initialization started');
        
        console.log('Initializing Lenis...');
        initializeLenis();
        console.log('Lenis initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Initialize Lenis smooth scrolling
function initializeLenis() {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2
    });

    // Bind lenis to requestAnimationFrame
    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    
    requestAnimationFrame(raf);

    // Optional: Add scroll listeners for custom animations
    lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
        // You can add custom scroll-based animations here
    });
}

async function initializeApp() {
    console.log('App initialization starting...');
    
    try {
        // Show loading for 1.5 seconds (short and sweet)
        setTimeout(() => {
            console.log('Hiding loading screen...');
            hideLoadingScreen();
            showMainApp();
        }, 1500);
    } catch (error) {
        console.error('App initialization error:', error);
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 800);
}

function showMainApp() {
    const mainApp = document.getElementById('mainApp');
    mainApp.style.display = 'block';
    
    // Smooth entrance
    setTimeout(() => {
        mainApp.classList.add('loaded');
    }, 100);
    
    // Initialize everything after the app loads
    setTimeout(() => {
        initializeInteractions();
        updateUserDropdown();
        startSubtleAnimations();
        addAdvancedHoverEffects();
        addRippleEffect();
    }, 600);
}

// ========================= SUBTLE BACKGROUND ANIMATIONS =========================
function startSubtleAnimations() {
    // Animate cards in sequence
    const cards = document.querySelectorAll('[data-animate]');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animationPlayState = 'running';
        }, index * 100);
    });
}

// ========================= SMOOTH INTERACTIONS =========================
function initializeInteractions() {
    // Add user functionality
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', async () => {
            await handleAddUser();
        });
    }

    // Add friendship functionality
    const addFriendshipBtn = document.getElementById('addFriendshipBtn');
    if (addFriendshipBtn) {
        addFriendshipBtn.addEventListener('click', async () => {
            await handleAddFriendship();
        });
    }

    // Suggest friends functionality
    const suggestBtn = document.getElementById('suggestBtn');
    if (suggestBtn) {
        suggestBtn.addEventListener('click', async () => {
            await handleSuggestFriends();
        });
    }

    // Add smooth focus effects
    addFocusEffects();
    
    // Add hover effects
    addHoverEffects();
    
    // Add advanced UI interactions
    addAdvancedHoverEffects();
}

// ========================= API HANDLERS =========================
async function handleAddUser() {
    const input = document.getElementById('newUserInput');
    const username = input.value.trim();
    
    if (!username) {
        showNotification('Please enter a username', 'error');
        shakeElement(input);
        return;
    }
    
    showLoadingInResults('Adding user...');
    
    try {
        const response = await fetch('/run-backend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: `add_user ${username}` })
        });
        
        const result = await response.text();
        displayResultWithAnimation(result);
        clearInputSmoothly(input);
        updateUserDropdown();
        showNotification('User added successfully', 'success');
        
        // Trigger success confetti
        triggerSuccessConfetti();
        
    } catch (error) {
        showNotification('Failed to add user', 'error');
        console.error(error);
    }
}

async function handleAddFriendship() {
    const input1 = document.getElementById('friend1Input');
    const input2 = document.getElementById('friend2Input');
    const user1 = input1.value.trim();
    const user2 = input2.value.trim();
    
    if (!user1 || !user2) {
        showNotification('Please enter both usernames', 'error');
        if (!user1) shakeElement(input1);
        if (!user2) shakeElement(input2);
        return;
    }
    
    // Animate the connector
    animateConnector();
    showLoadingInResults('Creating connection...');
    
    try {
        const response = await fetch('/run-backend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: `add_friendship ${user1} ${user2}` })
        });
        
        const result = await response.text();
        displayResultWithAnimation(result);
        clearInputSmoothly(input1);
        clearInputSmoothly(input2);
        updateUserDropdown();
        showNotification('Connection created', 'success');
        
        // Trigger connection confetti
        triggerConnectionConfetti();
        
    } catch (error) {
        showNotification('Failed to create connection', 'error');
        console.error(error);
    }
}

async function handleSuggestFriends() {
    const dropdown = document.getElementById('userDropdown');
    const username = dropdown.value;
    
    if (!username) {
        showNotification('Please select a user', 'error');
        shakeElement(dropdown);
        return;
    }
    
    showLoadingInResults('AI is thinking...');
    
    try {
        const response = await fetch('/run-backend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: `suggest ${username}` })
        });
        
        const result = await response.text();
        displayResultWithTypewriter(result);
        showNotification('Suggestions generated', 'success');
        
        // Trigger celebration confetti
        triggerConfetti();
        
    } catch (error) {
        showNotification('Failed to get suggestions', 'error');
        console.error(error);
    }
}

// ========================= SMOOTH ANIMATIONS =========================
function animateConnector() {
    const connector = document.querySelector('.connector');
    if (!connector) return;
    
    connector.style.transform = 'scaleX(1.5)';
    connector.style.opacity = '1';
    
    setTimeout(() => {
        connector.style.transform = 'scaleX(1)';
        connector.style.opacity = '0.6';
    }, 300);
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease-in-out';
    
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
    
    // Add shake animation if not exists
    if (!document.getElementById('shake-animation')) {
        const style = document.createElement('style');
        style.id = 'shake-animation';
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);
    }
}

function clearInputSmoothly(input) {
    input.style.transform = 'scale(0.98)';
    input.style.opacity = '0.7';
    
    setTimeout(() => {
        input.value = '';
        input.style.transform = 'scale(1)';
        input.style.opacity = '1';
    }, 150);
}

// ========================= RESULT DISPLAY =========================
function showLoadingInResults(message) {
    const resultArea = document.getElementById('resultArea');
    resultArea.style.opacity = '0.5';
    resultArea.textContent = message;
    
    // Add a subtle pulsing effect
    resultArea.style.animation = 'pulse 1.5s ease-in-out infinite';
}

function displayResultWithAnimation(result) {
    const resultArea = document.getElementById('resultArea');
    
    // Fade out
    resultArea.style.opacity = '0';
    resultArea.style.animation = '';
    
    setTimeout(() => {
        resultArea.textContent = result;
        resultArea.style.opacity = '1';
        
        // Subtle scale animation
        resultArea.style.transform = 'scale(0.98)';
        setTimeout(() => {
            resultArea.style.transform = 'scale(1)';
        }, 200);
    }, 150);
}

function displayResultWithTypewriter(result) {
    const resultArea = document.getElementById('resultArea');
    resultArea.style.animation = '';
    resultArea.style.opacity = '1';
    resultArea.textContent = '';
    
    let i = 0;
    const typeSpeed = 20; // Faster typing for better UX
    
    function typeCharacter() {
        if (i < result.length) {
            resultArea.textContent += result.charAt(i);
            i++;
            setTimeout(typeCharacter, typeSpeed);
        }
    }
    
    typeCharacter();
}

// ========================= USER DROPDOWN =========================
async function updateUserDropdown() {
    try {
        const response = await fetch('/users');
        const users = await response.json();
        const dropdown = document.getElementById('userDropdown');
        
        if (dropdown) {
            // Smooth update
            dropdown.style.opacity = '0.5';
            
            setTimeout(() => {
                dropdown.innerHTML = '';
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user;
                    option.textContent = user;
                    dropdown.appendChild(option);
                });
                
                dropdown.style.opacity = '1';
            }, 150);
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        showNotification('Failed to load users', 'error');
    }
}

// ========================= NOTIFICATIONS =========================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Animate out
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ========================= FOCUS & HOVER EFFECTS =========================
function addFocusEffects() {
    const inputs = document.querySelectorAll('.input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', () => {
            input.style.transform = 'scale(1)';
        });
    });
}

function addHoverEffects() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
        
        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(0) scale(0.98)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-2px) scale(1)';
        });
    });
}

// ========================= ENHANCED UI INTERACTIONS =========================
function addAdvancedHoverEffects() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Add subtle glow effect
            card.style.boxShadow = '0 20px 40px rgba(99, 102, 241, 0.2), 0 0 20px rgba(99, 102, 241, 0.1)';
            card.style.transform = 'translateY(-5px) scale(1.02)';
            
            // Trigger subtle particle burst
            createUIParticleBurst(card);
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '';
            card.style.transform = '';
        });
    });
    
    // Add magnetic button effects
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) translateY(-2px)`;
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
        });
    });
}

function createUIParticleBurst(element) {
    // Create small confetti burst over UI elements
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
        particleCount: 20,
        spread: 30,
        origin: { x, y },
        colors: ['#6366f1', '#4ecdc4'],
        scalar: 0.6,
        drift: 0.1
    });
}

function addRippleEffect() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// ========================= ERROR HANDLING =========================
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});

// ========================= PERFORMANCE =========================
// Debounce function for better performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================= ENHANCED VISUAL EFFECTS =========================
function createFloatingParticles() {
    try {
        console.log('Creating floating particles...');
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterials = [
            new THREE.MeshPhongMaterial({ color: 0x6366f1, transparent: true, opacity: 0.6 }),
            new THREE.MeshPhongMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.4 }),
            new THREE.MeshPhongMaterial({ color: 0x4ecdc4, transparent: true, opacity: 0.5 }),
            new THREE.MeshPhongMaterial({ color: 0xfeca57, transparent: true, opacity: 0.3 })
        ];

        for(let i = 0; i < 20; i++) { // Reduced from 50 to 20 for performance
            const material = particleMaterials[Math.floor(Math.random() * particleMaterials.length)];
            const particle = new THREE.Mesh(particleGeometry, material);
            
            // Random position in a large sphere
            const radius = 25 + Math.random() * 15;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            particle.position.x = radius * Math.sin(phi) * Math.cos(theta);
            particle.position.y = radius * Math.sin(phi) * Math.sin(theta);
            particle.position.z = radius * Math.cos(phi);
            
            particle.userData = {
                originalPosition: particle.position.clone(),
                speed: 0.001 + Math.random() * 0.002,
                direction: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize()
            };
            
            particles.push(particle);
            scene.add(particle);
        }
        console.log('Floating particles created successfully');
    } catch (error) {
        console.error('Error creating floating particles:', error);
    }
}

function createSparkles() {
    try {
        console.log('Creating sparkles...');
        const sparkleGeometry = new THREE.RingGeometry(0.05, 0.1, 6);
        const sparkleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        for(let i = 0; i < 10; i++) { // Reduced from 20 to 10
            const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial.clone());
            
            // Random position around the network area
            sparkle.position.x = (Math.random() - 0.5) * 30;
            sparkle.position.y = (Math.random() - 0.5) * 30;
            sparkle.position.z = (Math.random() - 0.5) * 30;
            
            sparkle.userData = {
                rotationSpeed: 0.01 + Math.random() * 0.02,
                pulsePhase: Math.random() * Math.PI * 2,
                originalOpacity: sparkle.material.opacity
            };
            
            sparkles.push(sparkle);
            scene.add(sparkle);
        }
        console.log('Sparkles created successfully');
    } catch (error) {
        console.error('Error creating sparkles:', error);
    }
}

function createNodeClickEffect(position) {
    const effectGeometry = new THREE.RingGeometry(0.3, 1.5, 16);
    const effectMaterial = new THREE.MeshBasicMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });

    const effect = new THREE.Mesh(effectGeometry, effectMaterial);
    effect.position.copy(position);
    effect.lookAt(camera.position);
    
    effect.userData = {
        scale: 0.1,
        maxScale: 3,
        fadeSpeed: 0.02
    };
    
    nodeClickEffects.push(effect);
    scene.add(effect);
}

function onMouseClick(event) {
    // Check for node clicks
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodes);
    
    if (intersects.length > 0) {
        const clickedNode = intersects[0].object;
        createNodeClickEffect(clickedNode.position);
        
        // Trigger confetti
        triggerConfetti();
        
        // Add pulse effect to clicked node
        clickedNode.userData.clickPulse = 2.0;
    }
}

// ========================= CONFETTI CELEBRATIONS =========================
function triggerConfetti() {
    // Multiple confetti bursts for celebration
    const colors = ['#6366f1', '#ff6b6b', '#4ecdc4', '#feca57', '#ff9ff3', '#54a0ff'];
    
    // Center burst
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors
    });
    
    // Side bursts
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: colors
        });
    }, 100);
    
    setTimeout(() => {
        confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: colors
        });
    }, 200);
}

function triggerSuccessConfetti() {
    // Success-specific confetti pattern
    const colors = ['#4ecdc4', '#6366f1', '#feca57'];
    
    confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: colors,
        shapes: ['star', 'circle']
    });
}

function triggerConnectionConfetti() {
    // Connection-specific confetti with hearts and links
    const colors = ['#ff6b6b', '#ff9ff3', '#6366f1'];
    
    // Heart burst effect
    confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: colors,
        shapes: ['circle'],
        scalar: 1.2
    });
    
    // Follow up with smaller burst
    setTimeout(() => {
        confetti({
            particleCount: 30,
            spread: 40,
            origin: { y: 0.7 },
            colors: colors
        });
    }, 300);
}

// ========================= DYNAMIC BACKGROUND PATTERNS =========================
function createBackgroundGeometry() {
    // Create floating geometric shapes
    const geometries = [
        new THREE.TetrahedronGeometry(0.5),
        new THREE.OctahedronGeometry(0.4),
        new THREE.IcosahedronGeometry(0.3)
    ];
    
    const materials = [
        new THREE.MeshPhongMaterial({ 
            color: 0x6366f1, 
            transparent: true, 
            opacity: 0.1,
            wireframe: true 
        }),
        new THREE.MeshPhongMaterial({ 
            color: 0xff6b6b, 
            transparent: true, 
            opacity: 0.08,
            wireframe: true 
        }),
        new THREE.MeshPhongMaterial({ 
            color: 0x4ecdc4, 
            transparent: true, 
            opacity: 0.06,
            wireframe: true 
        })
    ];
    
    for(let i = 0; i < 15; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = materials[Math.floor(Math.random() * materials.length)];
        const shape = new THREE.Mesh(geometry, material);
        
        // Position in background layer
        shape.position.x = (Math.random() - 0.5) * 60;
        shape.position.y = (Math.random() - 0.5) * 60;
        shape.position.z = (Math.random() - 0.5) * 60 - 20; // Behind main content
        
        shape.userData = {
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            }
        };
        
        scene.add(shape);
        particles.push(shape); // Reuse particles array for background shapes
    }
}

function addAtmosphericEffects() {
    // Create a subtle fog effect
    scene.fog = new THREE.Fog(0x000011, 30, 100);
    
    // Add more dynamic lighting
    const spotLight = new THREE.SpotLight(0x6366f1, 0.5, 100, Math.PI / 6, 0.1, 1);
    spotLight.position.set(0, 20, 20);
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);
    
    // Add rim lighting
    const rimLight = new THREE.DirectionalLight(0xff6b6b, 0.3);
    rimLight.position.set(-10, 0, -10);
    scene.add(rimLight);
}

// ========================= INTERACTIVE BACKGROUND WAVES =========================
function createInteractiveWaves() {
    // Create a grid of points that react to mouse movement
    const waveGeometry = new THREE.PlaneGeometry(50, 50, 32, 32);
    const waveMaterial = new THREE.MeshPhongMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.1,
        wireframe: true,
        side: THREE.DoubleSide
    });
    
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.rotation.x = Math.PI / 2;
    wave.position.z = -30;
    
    scene.add(wave);
    
    // Store original positions
    const positions = waveGeometry.attributes.position.array;
    const originalPositions = new Float32Array(positions.length);
    originalPositions.set(positions);
    wave.userData.originalPositions = originalPositions;
    
    return wave;
}

function updateInteractiveWaves(wave, mouseX, mouseY) {
    if (!wave || !wave.userData.originalPositions) return;
    
    const positions = wave.geometry.attributes.position.array;
    const originalPositions = wave.userData.originalPositions;
    const time = Date.now() * 0.001;
    
    for (let i = 0; i < positions.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];
        
        // Distance from mouse position
        const mouseInfluence = Math.max(0, 1 - Math.sqrt(
            Math.pow(x - mouseX * 25, 2) + Math.pow(y - mouseY * 25, 2)
        ) / 10);
        
        // Wave animation
        const waveHeight = Math.sin(time + x * 0.1) * Math.cos(time + y * 0.1) * 2;
        
        // Mouse interaction
        const mouseEffect = mouseInfluence * 5;
        
        positions[i + 2] = waveHeight + mouseEffect;
    }
    
    wave.geometry.attributes.position.needsUpdate = true;
}