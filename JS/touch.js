class TouchTest {
    constructor() {
        this.touchGrid = document.getElementById('touchTestContainer');
        this.testButton = document.getElementById('testTouchBtn');
        this.isShowingTouch = false;
        this.touches = new Map(); // Store active touches
        this.trails = new Map(); // Store trail points for each touch
        this.maxTrailPoints = 50; // Maximum points to keep in trail
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        this.testArea = null;
        this.fullscreenBtn = null;
        this.boundAnimate = this.animate.bind(this);
        this.boundSetupCanvas = this.setupCanvas.bind(this);
        
        // Initialize touch interface immediately but keep it hidden
        this.createTouchInterface();
        
        this.testButton.addEventListener('click', () => this.toggleTouch());
        
        // Handle window resize events to adjust canvas
        window.addEventListener('resize', () => {
            if (this.isShowingTouch && this.canvas) {
                this.setupCanvas();
            }
        });
    }

    toggleTouch() {
        if (this.isShowingTouch) {
            this.hideTouch();
        } else {
            this.showTouch();
        }
    }

    showTouch() {
        this.touchGrid.style.display = 'block';
        this.testButton.textContent = 'Stop Touch Test';
        this.testButton.style.background = '#1e3c72';
        this.isShowingTouch = true;
        
        // Make sure canvas is properly sized
        this.setupCanvas();
        
        // Start animation if not running
        if (!this.animationFrame) {
            this.animate();
        }
    }

    hideTouch() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.touchGrid.style.display = 'none';
        this.testButton.textContent = 'Test Touch Screen';
        this.testButton.style.background = '#2a5298';
        this.isShowingTouch = false;
        
        // Clear touches and trails
        this.touches.clear();
        this.trails.clear();
        
        // Exit fullscreen if active
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }

    createTouchInterface() {
        // Clear existing content
        this.touchGrid.innerHTML = '';

        // Create test area
        this.testArea = document.createElement('div');
        this.testArea.className = 'touch-test-area';
        
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'touch-canvas';
        this.testArea.appendChild(this.canvas);
        
        // Add fullscreen button
        this.fullscreenBtn = document.createElement('button');
        this.fullscreenBtn.className = 'fullscreen-btn';
        this.fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
        this.fullscreenBtn.title = 'Go fullscreen';
        
        this.testArea.appendChild(this.fullscreenBtn);
        this.touchGrid.appendChild(this.testArea);

        // Initialize canvas context
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize canvas with default size
        this.setupCanvas();        // Add touch event handlers
        this.testArea.addEventListener('touchstart', (e) => {
            // Allow touchstart events on the fullscreen button to work normally
            if (e.target === this.fullscreenBtn || e.target.parentNode === this.fullscreenBtn) {
                return;
            }
            e.preventDefault();
            this.handleTouchStart(e);
        }, { passive: false });

        this.testArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        }, { passive: false });

        this.testArea.addEventListener('touchend', (e) => {
            // Allow touchend events on the fullscreen button to work normally
            if (e.target === this.fullscreenBtn || e.target.parentNode === this.fullscreenBtn) {
                return;
            }
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });

        this.testArea.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        }, { passive: false });        // Add fullscreen handler with both click and touch support
        this.fullscreenBtn.addEventListener('click', this.handleFullscreen.bind(this));
        this.fullscreenBtn.addEventListener('touchstart', (e) => {
            // Prevent other touch handlers from interfering
            e.stopPropagation();
        }, { passive: false });
        this.fullscreenBtn.addEventListener('touchend', (e) => {
            e.preventDefault(); // Prevent default to avoid triggering additional events
            e.stopPropagation(); // Stop propagation to prevent other handlers
            this.handleFullscreen();
        }, { passive: false });

        // Handle fullscreen changes
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                // Entering fullscreen
                if (this.fullscreenBtn) {
                    this.fullscreenBtn.style.display = 'none';
                }
            } else {
                // Exiting fullscreen
                if (this.fullscreenBtn) {
                    this.fullscreenBtn.style.display = 'flex';
                }
            }
            
            // Resize canvas when fullscreen state changes
            if (this.canvas) {
                this.setupCanvas();
            }
        });
    }    setupCanvas() {
        // Get the actual visible size of the canvas element
        const rect = this.canvas.getBoundingClientRect();
        
        // Set canvas dimensions accounting for device pixel ratio
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        
        // Scale the context to match pixel ratio
        this.ctx.resetTransform();
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Draw a grid background to show canvas is active
        this.drawGrid();
    }
    
    handleFullscreen() {
        if (document.fullscreenElement) {
            // Already in fullscreen, exit
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            // Enter fullscreen
            if (this.testArea.requestFullscreen) {
                this.testArea.requestFullscreen();
            } else if (this.testArea.webkitRequestFullscreen) {
                this.testArea.webkitRequestFullscreen();
            } else if (this.testArea.msRequestFullscreen) {
                this.testArea.msRequestFullscreen();
            }
        }
    }
    
    drawGrid() {
        // Draw grid lines to show canvas is active
        if (!this.isShowingTouch) return;
        
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= width; x += width / 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += height / 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // Draw center lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(width / 2, 0);
        this.ctx.lineTo(width / 2, height);
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
    }

    handleTouchStart(e) {
        for (let touch of e.changedTouches) {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Store touch position
            this.touches.set(touch.identifier, { x, y });
            
            // Initialize trail for this touch
            this.trails.set(touch.identifier, [{ x, y }]);
            
            // Create color for this touch
            const hue = (touch.identifier * 60) % 360;
            this.touches.set(touch.identifier, { 
                x, 
                y, 
                color: `hsl(${hue}, 100%, 70%)`,
                id: touch.identifier,
                timestamp: Date.now()
            });
        }
    }

    handleTouchMove(e) {
        for (let touch of e.changedTouches) {
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Get existing touch data
            const touchData = this.touches.get(touch.identifier);
            if (touchData) {
                // Update position
                touchData.x = x;
                touchData.y = y;
                touchData.timestamp = Date.now();
                
                // Update trail
                const trail = this.trails.get(touch.identifier);
                if (trail) {
                    trail.push({ x, y, timestamp: Date.now() });
                    if (trail.length > this.maxTrailPoints) {
                        trail.shift();
                    }
                }
            }
        }
    }

    handleTouchEnd(e) {
        for (let touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
            
            // Keep the trail for a short time before removing it
            setTimeout(() => {
                this.trails.delete(touch.identifier);
            }, 1000);
        }
    }

    animate() {
        if (!this.isShowingTouch) {
            return;
        }
        
        // Get canvas dimensions
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid();

        // Draw trails
        this.trails.forEach((trail, id) => {
            if (trail.length < 2) return;
            
            const touchData = this.touches.get(id);
            const color = touchData ? touchData.color : 'white';
            
            // Create gradient based on trail points
            const gradient = this.ctx.createLinearGradient(
                trail[0].x, trail[0].y,
                trail[trail.length - 1].x, trail[trail.length - 1].y
            );
            
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(1, color || 'rgba(255, 255, 255, 0.6)');
            
            this.ctx.beginPath();
            this.ctx.moveTo(trail[0].x, trail[0].y);
            
            for (let i = 1; i < trail.length; i++) {
                this.ctx.lineTo(trail[i].x, trail[i].y);
            }
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        });

        // Draw touch points
        this.touches.forEach((touch) => {
            const {x, y, color, id} = touch;
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 40);
            gradient.addColorStop(0, color || 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 40, 0, Math.PI * 2);
            this.ctx.fill();

            // Center dot
            this.ctx.fillStyle = color || 'white';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Show touch ID
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Touch ${id}`, x, y - 20);
        });

        this.animationFrame = requestAnimationFrame(this.boundAnimate);
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TouchTest();
});
