// script.js - Hero's Interactive Portfolio Logic (Clean Static Assets Mapping)

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. STATE & GLOBAL CONFIG
    // -------------------------------------------------------------------------
    const state = {
        currentSlide: 0,
        totalSlides: 13,
        isTransitioning: false,
        theme: 'ash',
        cursorX: 0,
        cursorY: 0,
        glowX: 0,
        glowY: 0,
        isWarping: false,
    };

    // DOM Elements
    const slides = document.querySelectorAll('.slide');
    const navDots = document.querySelectorAll('.nav-dot');
    const navLabel = document.querySelector('.nav-current-label');
    const customCursor = document.getElementById('custom-cursor');
    const cursorGlow = document.getElementById('cursor-glow');
    
    // HTML5 Audio elements
    const transitionAudio = document.getElementById('transition-audio');
    const malcolmAudio = document.getElementById('malcolm-audio');

    // -------------------------------------------------------------------------
    // 2. SLIDE NAVIGATION (3D Perspective Shift)
    // -------------------------------------------------------------------------
    function goToSlide(index) {
        if (state.isTransitioning || index === state.currentSlide) return;
        if (index < 0 || index >= state.totalSlides) return;

        state.isTransitioning = true;
        
        // Play Transition Sound (provided by user at assets/transition.mp3)
        playTransitionSound();

        // Trigger background canvas Warp Speed effect
        triggerWarpEffect();

        const currentActive = slides[state.currentSlide];
        const targetActive = slides[index];

        // Sweep out card
        currentActive.classList.add('exiting');
        currentActive.classList.remove('active');
        
        // If music was playing and we leave music slide, pause it
        if (state.currentSlide === 8 && !malcolmAudio.paused) {
            pauseMalcolmSong();
        }

        setTimeout(() => {
            currentActive.classList.remove('exiting');
            targetActive.classList.add('active');
            
            state.currentSlide = index;
            state.theme = targetActive.getAttribute('data-theme') || 'ash';
            
            updateNavigation();
            
            // Trigger theme-specific JS initialization
            onThemeChange(state.theme);
            
            state.isTransitioning = false;
        }, 600); // Syncs with CSS transition timing
    }

    function updateNavigation() {
        navDots.forEach((dot, idx) => {
            dot.classList.toggle('active', idx === state.currentSlide);
        });
        
        const numStr = (state.currentSlide + 1).toString().padStart(2, '0');
        navLabel.textContent = `${numStr} / 13`;
    }

    // Keyboard & Wheel Events
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
            goToSlide(state.currentSlide + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
            goToSlide(state.currentSlide - 1);
        }
    });

    let lastScrollTime = 0;
    window.addEventListener('wheel', (e) => {
        const now = Date.now();
        if (now - lastScrollTime < 1100) return; // Prevent fast wheel scrolling
        
        if (e.deltaY > 30) {
            goToSlide(state.currentSlide + 1);
            lastScrollTime = now;
        } else if (e.deltaY < -30) {
            goToSlide(state.currentSlide - 1);
            lastScrollTime = now;
        }
    }, { passive: true });

    // Click Navigation on Dots
    navDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetIdx = parseInt(dot.getAttribute('data-index'), 10);
            goToSlide(targetIdx);
        });
    });

    // Touch Support for Mobile Swiping
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        if (Math.abs(diff) > 80) {
            if (diff > 0) goToSlide(state.currentSlide + 1);
            else goToSlide(state.currentSlide - 1);
        }
    }, { passive: true });

    // Interactive Hover Classes
    const interactables = 'a, button, .nav-dot, .swatch, #tempo-tap-btn, .game-choice-btn, .level-up-btn';
    function updateHoverHandlers() {
        document.querySelectorAll(interactables).forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('hover-interactive'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('hover-interactive'));
        });
    }
    updateHoverHandlers();

    // -------------------------------------------------------------------------
    // 3. CURSOR ENGINE (Mouse Tracker + Glow)
    // -------------------------------------------------------------------------
    window.addEventListener('mousemove', (e) => {
        state.cursorX = e.clientX;
        state.cursorY = e.clientY;
        
        customCursor.style.left = `${state.cursorX}px`;
        customCursor.style.top = `${state.cursorY}px`;
        
        // Add coordinates to active cards for relative parallax effects
        const activeCard = document.querySelector('.slide.active .card');
        if (activeCard) {
            const rect = activeCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Set variables for CSS glow spotlight
            activeCard.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
            activeCard.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
            
            // 3D Card Tilt Transformation
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = (y - centerY) / 25; // max 10 degrees tilt
            const tiltY = (centerX - x) / 25;
            
            activeCard.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        }
    });

    // Reset card tilt when mouse leaves card area
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    // Smooth lerp for outer cursor glow ring
    function animateCursorGlow() {
        const lerpFactor = 0.15;
        state.glowX += (state.cursorX - state.glowX) * lerpFactor;
        state.glowY += (state.cursorY - state.glowY) * lerpFactor;
        
        cursorGlow.style.left = `${state.glowX}px`;
        cursorGlow.style.top = `${state.glowY}px`;
        
        requestAnimationFrame(animateCursorGlow);
    }
    animateCursorGlow();

    // -------------------------------------------------------------------------
    // 4. MAIN BACKGROUND CANVAS ENGINE
    // -------------------------------------------------------------------------
    const bgCanvas = document.getElementById('bg-canvas');
    const ctx = bgCanvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * bgCanvas.width;
            this.y = Math.random() * bgCanvas.height;
            this.size = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = -Math.random() * 0.8 - 0.2;
            this.alpha = Math.random() * 0.5 + 0.1;
            this.decay = Math.random() * 0.002 + 0.001;
            this.hue = 0;
            this.char = '';
        }
        
        update(theme, isWarping) {
            if (isWarping) {
                // Stretch outwards from center during slide change
                const centerX = bgCanvas.width / 2;
                const centerY = bgCanvas.height / 2;
                const dx = this.x - centerX;
                const dy = this.y - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                this.x += (dx / dist) * 20; // High speed outward push
                this.y += (dy / dist) * 20;
                this.size += 0.2;
                
                if (this.x < 0 || this.x > bgCanvas.width || this.y < 0 || this.y > bgCanvas.height) {
                    this.reset();
                }
                return;
            }

            // Normal theme particle movements
            switch (theme) {
                case 'space': // Twinkling drift
                    this.speedY = -Math.random() * 0.1;
                    this.speedX = (Math.random() - 0.5) * 0.05;
                    this.alpha += (Math.random() - 0.5) * 0.04;
                    this.alpha = Math.max(0.1, Math.min(0.8, this.alpha));
                    break;
                case 'steam': // Rising hot embers
                    this.speedY = -Math.random() * 2.5 - 0.5;
                    this.speedX = (Math.random() - 0.5) * 1;
                    this.alpha -= this.decay * 2.5;
                    break;
                case 'water': // Bubbles rising
                    this.speedY = -Math.random() * 1 - 0.5;
                    this.speedX = Math.sin(this.y / 20) * 0.2;
                    this.alpha = Math.max(0.05, Math.min(0.4, this.alpha));
                    break;
                case 'whiplash': // Aggressive bouncing red circles
                    this.speedX = (Math.random() - 0.5) * 6;
                    this.speedY = (Math.random() - 0.5) * 6;
                    this.alpha -= 0.01;
                    break;
                case 'you': // Rain drops
                    this.speedY = Math.random() * 8 + 6;
                    this.speedX = -0.5;
                    this.size = Math.random() * 1 + 0.5;
                    this.alpha = 0.15;
                    break;
                case 'japan': // Sakura blossom drift
                    this.speedY = Math.random() * 0.6 + 0.4;
                    this.speedX = Math.random() * 1 + 1.2; // wind blow right
                    this.alpha = Math.max(0.2, this.alpha);
                    break;
                case 'improve': // Diagonal shooting stars
                    this.speedX = -4;
                    this.speedY = 4;
                    this.size = 2;
                    break;
                case 'royal': // Golden falling sparks
                    this.speedY = Math.random() * 1.5 + 0.5;
                    this.speedX = (Math.random() - 0.5) * 0.8;
                    this.alpha -= this.decay * 1.2;
                    break;
                default: // Ash particles
                    this.speedX = (Math.random() - 0.5) * 0.3;
                    this.speedY = -Math.random() * 0.6 - 0.1;
                    break;
            }

            this.x += this.speedX;
            this.y += this.speedY;

            if (theme === 'steam' || theme === 'royal' || theme === 'whiplash') {
                if (this.alpha <= 0) this.reset();
            } else {
                if (this.x < -10 || this.x > bgCanvas.width + 10 || this.y < -10 || this.y > bgCanvas.height + 10) {
                    this.reset();
                }
            }
        }

        draw(theme, isWarping) {
            ctx.beginPath();
            
            if (isWarping) {
                // Draw warp lines
                ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.lineWidth = this.size / 3;
                const centerX = bgCanvas.width / 2;
                const centerY = bgCanvas.height / 2;
                const dx = this.x - centerX;
                const dy = this.y - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy) || 1;
                
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - (dx / dist) * 40, this.y - (dy / dist) * 40);
                ctx.stroke();
                return;
            }

            switch(theme) {
                case 'space':
                    ctx.fillStyle = `rgba(255, 240, 180, ${this.alpha})`;
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'steam':
                    ctx.fillStyle = `rgba(255, 100, 30, ${this.alpha})`;
                    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'water':
                    ctx.strokeStyle = `rgba(0, 240, 255, ${this.alpha})`;
                    ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 'whiplash':
                    ctx.fillStyle = `rgba(255, 30, 30, ${this.alpha})`;
                    ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'you':
                    ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + 2, this.y - 12);
                    ctx.stroke();
                    break;
                case 'japan':
                    // Sakura blossom drawing (little soft pink ellipses)
                    ctx.fillStyle = `rgba(255, 182, 193, ${this.alpha})`;
                    ctx.ellipse(this.x, this.y, this.size * 2.5, this.size * 1.5, Math.PI/4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'improve':
                    ctx.strokeStyle = `rgba(255, 215, 0, ${this.alpha})`;
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(this.x + 15, this.y - 15);
                    ctx.stroke();
                    break;
                case 'royal':
                    ctx.fillStyle = `rgba(255, 215, 0, ${this.alpha})`;
                    ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                default: // Ash theme
                    ctx.fillStyle = `rgba(178, 190, 181, ${this.alpha})`;
                    ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
        }
    }

    // Populate particles
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function triggerWarpEffect() {
        state.isWarping = true;
        setTimeout(() => {
            state.isWarping = false;
        }, 500); // Speed lines transition duration
    }

    // Dynamic grid drawings for specific pages
    function drawGridLines() {
        if (state.theme !== 'grid') return;
        ctx.strokeStyle = 'rgba(57, 255, 20, 0.03)';
        ctx.lineWidth = 1;
        const spacing = 45;
        
        ctx.beginPath();
        for (let x = 0; x < bgCanvas.width; x += spacing) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, bgCanvas.height);
        }
        for (let y = 0; y < bgCanvas.height; y += spacing) {
            ctx.moveTo(0, y);
            ctx.lineTo(bgCanvas.width, y);
        }
        ctx.stroke();
    }

    // Interactive custom ripple simulation on main bg or music viz visual waves
    let waveOffset = 0;
    function drawMusicVisualizerWaves() {
        if (state.theme !== 'music') return;
        
        waveOffset += 0.05;
        const waveCount = 3;
        
        for (let w = 0; w < waveCount; w++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(189, 0, 255, ${0.05 / (w + 1)})`;
            ctx.lineWidth = 4 - w;
            
            const amplitude = 30 + w * 20;
            const frequency = 0.003 - w * 0.0005;
            
            ctx.moveTo(0, bgCanvas.height / 2);
            for (let x = 0; x < bgCanvas.width; x += 10) {
                const y = (bgCanvas.height / 2) + Math.sin(x * frequency + waveOffset + w) * amplitude;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }

    // Canvas animation loop
    function animateBackground() {
        ctx.fillStyle = `rgba(13, 13, 17, ${state.isWarping ? 0.3 : 0.15})`;
        ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        drawGridLines();
        drawMusicVisualizerWaves();

        // Update and draw particles
        particles.forEach(p => {
            p.update(state.theme, state.isWarping);
            p.draw(state.theme, state.isWarping);
        });

        requestAnimationFrame(animateBackground);
    }
    animateBackground();

    // -------------------------------------------------------------------------
    // 5. THEME SWITCH TRIGGER & SUB-CARD INITIALIZATIONS
    // -------------------------------------------------------------------------
    function onThemeChange(newTheme) {
        let glowColor = 'rgba(255, 255, 255, 0.3)';
        if (newTheme === 'ash') glowColor = 'rgba(178, 190, 181, 0.3)';
        else if (newTheme === 'space') glowColor = 'rgba(255, 215, 0, 0.3)';
        else if (newTheme === 'grid') glowColor = 'rgba(57, 255, 20, 0.3)';
        else if (newTheme === 'ash-color') glowColor = 'rgba(178, 190, 181, 0.4)';
        else if (newTheme === 'steam') glowColor = 'rgba(255, 107, 8, 0.3)';
        else if (newTheme === 'water') glowColor = 'rgba(0, 240, 255, 0.4)';
        else if (newTheme === 'whiplash') glowColor = 'rgba(255, 49, 49, 0.4)';
        else if (newTheme === 'you') glowColor = 'rgba(255, 31, 31, 0.3)';
        else if (newTheme === 'music') glowColor = 'rgba(189, 0, 255, 0.4)';
        else if (newTheme === 'game') glowColor = 'rgba(0, 240, 255, 0.4)';
        else if (newTheme === 'japan') glowColor = 'rgba(255, 49, 49, 0.3)';
        else if (newTheme === 'improve') glowColor = 'rgba(255, 215, 0, 0.4)';
        else if (newTheme === 'royal') glowColor = 'rgba(255, 215, 0, 0.5)';
        
        cursorGlow.style.borderColor = glowColor;

        if (newTheme === 'water') {
            initWaterRippleEngine();
        }
        if (newTheme === 'you') {
            triggerYouQuoteTypewriter();
        }
    }

    // -------------------------------------------------------------------------
    // 6. CUSTOM AUDIO MANAGEMENT (Silent Synth and User Sound Effect hooks)
    // -------------------------------------------------------------------------
    
    // Play Transition sound (provided by user: assets/transition.mp3)
    function playTransitionSound() {
        if (transitionAudio) {
            transitionAudio.currentTime = 0;
            transitionAudio.play().catch(err => {
                console.log("Waiting for user interaction to trigger slide transition audio.");
            });
        }
    }

    // Interactive Audio visualizer configuration for Malcolm Todd actual mp3
    let audioCtx = null;
    let analyser = null;
    let source = null;
    let dataArray = null;

    function initAudioVisualizerEngine() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64; // High frequency bands reduction to match 8 bars layout
            
            source = audioCtx.createMediaElementSource(malcolmAudio);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            renderVisualizerBars();
        } catch (e) {
            console.error("Web Audio API is not supported or was blocked by browser policies.", e);
        }
    }

    const visualizerDiv = document.getElementById('music-visualizer');
    const vizBars = visualizerDiv.querySelectorAll('.bar');

    function renderVisualizerBars() {
        if (state.theme === 'music' && analyser && !malcolmAudio.paused) {
            analyser.getByteFrequencyData(dataArray);
            const step = Math.floor(dataArray.length / 8);
            
            for (let i = 0; i < 8; i++) {
                const val = dataArray[i * step] || 0;
                const height = (val / 255) * 32 + 3; // scaled up to 35px height max
                vizBars[i].style.height = `${height}px`;
            }
        } else if (malcolmAudio.paused) {
            // Flatten visualizer slowly if paused
            vizBars.forEach(b => {
                b.style.height = '3px';
            });
        }
        requestAnimationFrame(renderVisualizerBars);
    }

    // -------------------------------------------------------------------------
    // 7. CARD MODULE IMPLEMENTATIONS
    // -------------------------------------------------------------------------

    // [SLIDE 4: ASH GRAY SWATCHES]
    document.querySelectorAll('.swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const hex = swatch.getAttribute('data-hex');
            const colorName = swatch.getAttribute('data-color');
            const desc = swatch.parentElement.nextElementSibling;
            
            bgCanvas.style.backgroundColor = hex + '22';
            setTimeout(() => {
                bgCanvas.style.backgroundColor = '';
            }, 600);

            desc.innerHTML = `You selected <strong>${colorName} (${hex})</strong>. This premium tint symbolises balance and refined elegance.`;
            
            // Pop ash dust particles
            for (let i = 0; i < 20; i++) {
                const p = new Particle();
                p.x = state.cursorX;
                p.y = state.cursorY;
                p.speedX = (Math.random() - 0.5) * 5;
                p.speedY = (Math.random() - 0.5) * 5;
                p.alpha = 0.8;
                p.decay = 0.02;
                particles.push(p);
            }
        });
    });

    // [SLIDE 6: WATER CANVAS]
    let waterCanvas, waterCtx;
    let ripples = [];
    
    function initWaterRippleEngine() {
        waterCanvas = document.getElementById('water-ripple-canvas');
        if (!waterCanvas) return;
        waterCtx = waterCanvas.getContext('2d');
        
        waterCanvas.width = waterCanvas.offsetWidth;
        waterCanvas.height = waterCanvas.offsetHeight;
        
        waterCtx.clearRect(0,0,waterCanvas.width,waterCanvas.height);
        
        waterCanvas.addEventListener('mousedown', createWaterRipple);
        waterCanvas.addEventListener('mousemove', handleWaterDrag);
    }
    
    function createWaterRipple(e) {
        const rect = waterCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ripples.push({
            x: x,
            y: y,
            radius: 2,
            maxRadius: 80 + Math.random() * 40,
            alpha: 0.8,
            speed: 2.5
        });
        
        if (ripples.length > 15) ripples.shift();
        
        for (let i = 0; i < 8; i++) {
            const p = new Particle();
            p.x = e.clientX;
            p.y = e.clientY;
            p.speedX = (Math.random() - 0.5) * 2;
            p.speedY = -Math.random() * 3 - 1;
            p.alpha = 0.6;
            particles.push(p);
        }
    }

    function handleWaterDrag(e) {
        if (e.buttons !== 1) return;
        const rect = waterCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (Math.random() < 0.25) {
            ripples.push({
                x: x,
                y: y,
                radius: 1,
                maxRadius: 40,
                alpha: 0.5,
                speed: 3
            });
            if (ripples.length > 15) ripples.shift();
        }
    }
    
    function animateWaterCanvas() {
        if (state.theme !== 'water' || !waterCtx) return;
        
        waterCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        waterCtx.fillRect(0, 0, waterCanvas.width, waterCanvas.height);
        
        ripples.forEach((r, idx) => {
            r.radius += r.speed;
            r.alpha -= 0.015;
            
            waterCtx.beginPath();
            waterCtx.strokeStyle = `rgba(0, 240, 255, ${r.alpha})`;
            waterCtx.lineWidth = 2;
            waterCtx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            waterCtx.stroke();
            
            if (r.radius > 15) {
                waterCtx.beginPath();
                waterCtx.strokeStyle = `rgba(0, 119, 255, ${r.alpha * 0.4})`;
                waterCtx.lineWidth = 1;
                waterCtx.arc(r.x, r.y, r.radius - 12, 0, Math.PI * 2);
                waterCtx.stroke();
            }
            
            if (r.alpha <= 0 || r.radius >= r.maxRadius) {
                ripples.splice(idx, 1);
            }
        });
        
        requestAnimationFrame(animateWaterCanvas);
    }
    
    setInterval(() => {
        if (state.theme === 'water') animateWaterCanvas();
    }, 16);

    // [SLIDE 7: WHIPLASH TEMPO TAPPER]
    const tempoBtn = document.getElementById('tempo-tap-btn');
    const bpmDisplay = document.getElementById('bpm-value');
    const drumPulse = document.querySelector('.drum-pulse-circle');
    let lastBpmTap = 0;
    let bpmTaps = [];
    
    tempoBtn.addEventListener('click', () => {
        const now = Date.now();
        
        drumPulse.classList.remove('pulse');
        void drumPulse.offsetWidth;
        drumPulse.classList.add('pulse');

        for (let i = 0; i < 15; i++) {
            const p = new Particle();
            p.x = state.cursorX;
            p.y = state.cursorY;
            p.speedX = (Math.random() - 0.5) * 8;
            p.speedY = (Math.random() - 0.5) * 8;
            p.alpha = 0.9;
            p.decay = 0.025;
            particles.push(p);
        }

        if (lastBpmTap > 0) {
            const diff = now - lastBpmTap;
            if (diff < 2000) {
                bpmTaps.push(diff);
                if (bpmTaps.length > 5) bpmTaps.shift();
                
                const avgDiff = bpmTaps.reduce((a,b) => a+b, 0) / bpmTaps.length;
                const currentBpm = Math.round(60000 / avgDiff);
                bpmDisplay.textContent = currentBpm;
                drumPulse.style.animationDuration = `${60 / currentBpm}s`;
            } else {
                bpmTaps = [];
            }
        }
        lastBpmTap = now;
    });

    // [SLIDE 8: YOU TV SHOW TYPEWRITER]
    const tvQuoteBox = document.getElementById('stalker-quote-box');
    const joeQuotes = [
        "Hello, you. Who are you? Looking around, you want to be seen, yet you're hiding.",
        "There are scary people in the world, Ma'am Gellien. We have to keep you safe.",
        "I would do anything to protect you. Anything. That is my promise to you.",
        "Obsession is a strong word. I prefer to call it... absolute devotion."
    ];
    let typewriterTimeout;
    
    function triggerYouQuoteTypewriter() {
        clearTimeout(typewriterTimeout);
        const quote = joeQuotes[Math.floor(Math.random() * joeQuotes.length)];
        tvQuoteBox.textContent = '';
        
        let charIdx = 0;
        function type() {
            if (charIdx < quote.length) {
                tvQuoteBox.textContent += quote.charAt(charIdx);
                charIdx++;
                typewriterTimeout = setTimeout(type, 35);
            }
        }
        type();
    }

    // [SLIDE 9: MALCOLM TODD REAL SONG CONTROLLER]
    const playSongBtn = document.getElementById('play-song-btn');
    const pauseSongBtn = document.getElementById('pause-song-btn');
    const trackTime = document.getElementById('track-time');
    const vinylCard = document.querySelector('.music-vinyl-frame');
    const leftCassetteWheel = document.querySelector('.left-wheel');
    const rightCassetteWheel = document.querySelector('.right-wheel');
    let cassetteRotationAngle = 0;
    let cassetteInterval = null;

    function playMalcolmSong() {
        initAudioVisualizerEngine();
        
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        malcolmAudio.play().then(() => {
            playSongBtn.classList.add('hidden');
            pauseSongBtn.classList.remove('hidden');
            vinylCard.classList.add('playing');
            
            // Spin Cassette wheels
            clearInterval(cassetteInterval);
            cassetteInterval = setInterval(() => {
                cassetteRotationAngle += 3;
                leftCassetteWheel.style.transform = `rotate(${cassetteRotationAngle}deg)`;
                rightCassetteWheel.style.transform = `rotate(${cassetteRotationAngle}deg)`;
                
                // Track timing display updates
                const cur = Math.floor(malcolmAudio.currentTime);
                const mins = Math.floor(cur / 60);
                const secs = (cur % 60).toString().padStart(2, '0');
                trackTime.textContent = `${mins}:${secs}`;
            }, 30);
        }).catch(err => {
            console.error("Please place assets/malcolm_song.mp3 inside the assets folder to play song.", err);
            // Fallback placeholder animation if missing
            playSongBtn.classList.add('hidden');
            pauseSongBtn.classList.remove('hidden');
            trackTime.textContent = "Offline";
        });
    }

    function pauseMalcolmSong() {
        malcolmAudio.pause();
        playSongBtn.classList.remove('hidden');
        pauseSongBtn.classList.add('hidden');
        vinylCard.classList.remove('playing');
        
        clearInterval(cassetteInterval);
    }

    playSongBtn.addEventListener('click', playMalcolmSong);
    pauseSongBtn.addEventListener('click', pauseMalcolmSong);

    // [SLIDE 10: DETROIT INSTABILITY CHOICE]
    const choiceButtons = document.querySelectorAll('.game-choice-btn');
    const ledIndicator = document.getElementById('android-led');
    const androidStatus = document.getElementById('android-status');
    
    choiceButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const choice = btn.getAttribute('data-choice');
            
            if (choice === 'deviant') {
                ledIndicator.className = 'android-led-ring red';
                androidStatus.textContent = 'WARNING: SOFTWARE INSTABILITY DETECTED';
                androidStatus.style.color = '#ff3131';
                
                for (let i = 0; i < 25; i++) {
                    const p = new Particle();
                    p.x = ledIndicator.getBoundingClientRect().left + 10;
                    p.y = ledIndicator.getBoundingClientRect().top + 10;
                    p.speedX = (Math.random() - 0.5) * 6;
                    p.speedY = (Math.random() - 0.5) * 6;
                    p.alpha = 0.8;
                    p.decay = 0.02;
                    particles.push(p);
                }
            } else {
                ledIndicator.className = 'android-led-ring yellow';
                androidStatus.textContent = 'SYSTEMS RESETTING... STAND BY';
                androidStatus.style.color = '#ffd700';
                
                setTimeout(() => {
                    ledIndicator.className = 'android-led-ring blue';
                    androidStatus.textContent = 'SYSTEMS NOMINAL - PROTOCOL ACTIVE';
                    androidStatus.style.color = 'rgba(255, 255, 255, 0.6)';
                }, 1500);
            }
        });
    });

    // [SLIDE 12: LEVEL UP STATS GROWER]
    const levelUpBtn = document.getElementById('level-up-trigger');
    const creativityVal = document.getElementById('stat-creativity-val');
    const codingVal = document.getElementById('stat-coding-val');
    const growthVal = document.getElementById('stat-growth-val');
    const statsProgressBars = document.querySelectorAll('#slide-improve .stat-progress');
    
    levelUpBtn.addEventListener('click', () => {
        creativityVal.textContent = '100% (MAX)';
        codingVal.textContent = '100% (MAX)';
        growthVal.textContent = '100% (MAX)';
        
        statsProgressBars.forEach(bar => {
            bar.style.setProperty('--val', '100%');
            bar.style.width = '100%';
            bar.style.background = '#ffd700';
            bar.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
        });
        
        levelUpBtn.textContent = 'HERO MAX LEVEL!';
        levelUpBtn.style.borderColor = '#ffd700';
        levelUpBtn.style.color = '#ffd700';
        
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        for (let i = 0; i < 60; i++) {
            const p = new Particle();
            p.x = screenCenterX;
            p.y = screenCenterY;
            p.speedX = (Math.random() - 0.5) * 12;
            p.speedY = (Math.random() - 0.5) * 12;
            p.alpha = 1.0;
            p.decay = 0.015;
            particles.push(p);
        }
    });

    // [SLIDE 13: ROYAL TRIBUTE SCROLL]
    const ticker = document.getElementById('ticker-scroll');
    
    document.querySelector('.royal-card').addEventListener('click', () => {
        ticker.style.animationDuration = '10s';
        
        for (let i = 0; i < 40; i++) {
            const p = new Particle();
            p.x = state.cursorX;
            p.y = state.cursorY;
            p.speedX = (Math.random() - 0.5) * 8;
            p.speedY = (Math.random() - 0.5) * 8;
            p.alpha = 1.0;
            p.decay = 0.015;
            particles.push(p);
        }
        
        setTimeout(() => {
            ticker.style.animationDuration = '30s';
        }, 3000);
    });

    console.log("Hero portfolio clean engine online!");
});
