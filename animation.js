// Enhanced Animation System
class EnhancedAnimations {
    constructor() {
        this.particles = [];
        this.mousePosition = { x: 0, y: 0 };
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.setupMouseTracking();
        this.createInteractiveParticles();
        this.setupCardHoverEffects();
        this.setupButtonRippleEffect();
        this.startAnimationLoop();
        this.isInitialized = true;
    }

    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
            this.createTrailParticle(e.clientX, e.clientY);
        });
    }

    createTrailParticle(x, y) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 4px;
            height: 4px;
            background: rgba(99, 102, 241, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            animation: mouseTrail 1s ease-out forwards;
        `;

        document.body.appendChild(particle);

        // Add keyframes for mouse trail if not already added
        if (!document.querySelector('#mouseTrailStyles')) {
            const style = document.createElement('style');
            style.id = 'mouseTrailStyles';
            style.textContent = `
                @keyframes mouseTrail {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }

    createInteractiveParticles() {
        const container = document.querySelector('.container');
        if (!container) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'interactive-particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(99, 102, 241, 0.4);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
            `;
            
            container.appendChild(particle);
            this.particles.push({
                element: particle,
                x: Math.random() * container.offsetWidth,
                y: Math.random() * container.offsetHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 3 + 1
            });
        }
    }

    setupCardHoverEffects() {
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                this.createCardParticleExplosion(card);
                this.addCardGlow(card);
            });

            card.addEventListener('mouseleave', () => {
                this.removeCardGlow(card);
            });
        });
    }

    createCardParticleExplosion(card) {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            const angle = (i / 8) * Math.PI * 2;
            const velocity = 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            particle.style.cssText = `
                position: fixed;
                left: ${centerX}px;
                top: ${centerY}px;
                width: 3px;
                height: 3px;
                background: rgba(99, 102, 241, 0.8);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                transform: translate(-50%, -50%);
            `;

            document.body.appendChild(particle);

            let x = centerX;
            let y = centerY;
            let opacity = 1;
            let size = 3;

            const animate = () => {
                x += vx * 0.02;
                y += vy * 0.02;
                opacity -= 0.03;
                size *= 0.98;

                particle.style.left = x + 'px';
                particle.style.top = y + 'px';
                particle.style.opacity = opacity;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }
            };

            requestAnimationFrame(animate);
        }
    }

    addCardGlow(card) {
        card.style.boxShadow = `
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 0 40px rgba(99, 102, 241, 0.3),
            0 0 80px rgba(99, 102, 241, 0.1)
        `;
    }

    removeCardGlow(card) {
        card.style.boxShadow = `
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 0 30px rgba(99, 102, 241, 0.2)
        `;
    }

    setupButtonRippleEffect() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.createRipple(e, button);
            });
        });
    }

    createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
            z-index: 10;
        `;

        element.style.position = 'relative';
        element.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    startAnimationLoop() {
        const animate = () => {
            this.updateParticles();
            requestAnimationFrame(animate);
        };
        animate();
    }

    updateParticles() {
        if (!this.particles.length) return;

        const container = document.querySelector('.container');
        if (!container) return;

        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Bounce off edges
            if (particle.x <= 0 || particle.x >= container.offsetWidth) {
                particle.vx *= -1;
            }
            if (particle.y <= 0 || particle.y >= container.offsetHeight) {
                particle.vy *= -1;
            }

            // Mouse interaction
            const dx = this.mousePosition.x - (particle.x + container.offsetLeft);
            const dy = this.mousePosition.y - (particle.y + container.offsetTop);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.vx += (dx / distance) * force * 0.01;
                particle.vy += (dy / distance) * force * 0.01;
            }

            // Apply friction
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Update DOM element
            particle.element.style.left = particle.x + 'px';
            particle.element.style.top = particle.y + 'px';
            particle.element.style.opacity = 0.4 + Math.sin(Date.now() * 0.001 + particle.x) * 0.3;
        });
    }

    // Enhanced loading animations
    enhanceLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const loader = loadingScreen.querySelector('.loader');
        
        // Add floating particles to loading screen
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(99, 102, 241, 0.6);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: floatParticle ${3 + Math.random() * 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
            `;
            loadingScreen.appendChild(particle);
        }

        // Add keyframes for floating particles
        if (!document.querySelector('#floatingParticleStyles')) {
            const style = document.createElement('style');
            style.id = 'floatingParticleStyles';
            style.textContent = `
                @keyframes floatParticle {
                    0%, 100% {
                        transform: translateY(0px) scale(1);
                        opacity: 0.3;
                    }
                    50% {
                        transform: translateY(-20px) scale(1.2);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Text typing effect
    typeText(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        const timer = setInterval(() => {
            element.textContent += text.charAt(i);
            i++;
            if (i > text.length) {
                clearInterval(timer);
            }
        }, speed);
    }

    // Stagger animation for multiple elements
    staggerAnimation(elements, animationClass, delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                element.classList.add(animationClass);
            }, index * delay);
        });
    }
}

// Initialize enhanced animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedAnimations = new EnhancedAnimations();
    
    // Enhance loading screen
    window.enhancedAnimations.enhanceLoadingScreen();
    
    // Add enhanced entrance animations
    setTimeout(() => {
        const cards = document.querySelectorAll('.card');
        window.enhancedAnimations.staggerAnimation(cards, 'enhanced-entrance', 150);
    }, 500);
});

// Add CSS for enhanced animations
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    .enhanced-entrance {
        animation: enhancedEntrance 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes enhancedEntrance {
        0% {
            opacity: 0;
            transform: translateY(50px) rotateX(15deg) scale(0.9);
            filter: blur(5px);
        }
        50% {
            opacity: 0.8;
            transform: translateY(-10px) rotateX(-3deg) scale(1.02);
            filter: blur(2px);
        }
        100% {
            opacity: 1;
            transform: translateY(0) rotateX(0deg) scale(1);
            filter: blur(0px);
        }
    }
    
    .card:hover .card-particles .particle {
        animation: particleHover 2s ease-in-out infinite;
    }
    
    @keyframes particleHover {
        0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
        }
        50% {
            transform: translateY(-15px) scale(1.3);
            opacity: 1;
        }
    }
`;
document.head.appendChild(enhancedStyles);