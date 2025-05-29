class MouseManager {
    constructor() {
        this.mouseGrid = document.getElementById('mouseTestContainer');
        
        // Canvas setup
        this.graphCanvas = document.getElementById('mouseGraph');
        this.deltaCanvas = document.getElementById('mouseDelta');
        this.graphCtx = this.graphCanvas.getContext('2d');
        this.deltaCtx = this.deltaCanvas.getContext('2d');
        
        // Mouse tracking variables
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
          // Movement history for graph
        this.movementHistory = [];
        this.maxHistoryPoints = 100;
        
        // Click counting
        this.leftClickCount = 0;
        this.rightClickCount = 0;
        this.leftClickCounter = document.getElementById('leftClickCount');
        this.rightClickCounter = document.getElementById('rightClickCount');
        this.clickTestArea = document.getElementById('clickTestArea');
        
        this.setupMouseEvents();
        this.setupClickEvents();
        this.boundAnimate = this.animate.bind(this);
        this.animationFrame = null;
        
        // Auto-start the mouse test
        this.startMouse();
    }

    toggleMouse() {
        if (this.isShowingMouse) {
            this.hideMouse();
        } else {
            this.showMouse();
        }
    }    setupClickEvents() {
        // Add click event listeners to the click test area
        this.clickTestArea.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent context menu on right click
            
            if (e.button === 0) { // Left click
                this.leftClickCount++;
                this.leftClickCounter.textContent = this.leftClickCount;
            } else if (e.button === 2) { // Right click
                this.rightClickCount++;
                this.rightClickCounter.textContent = this.rightClickCount;
            }
        });
        
        // Prevent context menu on right click in the test area
        this.clickTestArea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }    resetClickCounters() {
        this.leftClickCount = 0;
        this.rightClickCount = 0;
        this.leftClickCounter.textContent = '0';
        this.rightClickCounter.textContent = '0';
    }

    startMouse() {
        this.mouseGrid.style.display = 'block';
        this.setupCanvasSize();
        this.resetClickCounters(); // Reset counters when starting test
        this.animate();
    }

    setupCanvasSize() {
        const updateCanvasSize = (canvas) => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        updateCanvasSize(this.graphCanvas);
        updateCanvasSize(this.deltaCanvas);

        // Set up graph center points
        this.graphCenterX = this.graphCanvas.width / 2;
        this.graphCenterY = this.graphCanvas.height / 2;
        this.deltaCenterX = this.deltaCanvas.width / 2;
        this.deltaCenterY = this.deltaCanvas.height / 2;

        // Set up delta display scale
        this.deltaScale = Math.min(this.deltaCanvas.width, this.deltaCanvas.height) * 0.4;
    }    setupMouseEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            if (this.lastX !== 0 && this.lastY !== 0) {
                this.deltaX = (e.clientX - this.lastX) * 2;
                this.deltaY = (e.clientY - this.lastY) * 2;
                
                // Add to movement history
                this.movementHistory.push({
                    x: this.deltaX,
                    y: this.deltaY,
                    time: Date.now()
                });
                
                // Limit history size
                if (this.movementHistory.length > this.maxHistoryPoints) {
                    this.movementHistory.shift();
                }
            }
            
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });
    }    animate() {
        // Clear both canvases
        this.graphCtx.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
        this.deltaCtx.clearRect(0, 0, this.deltaCanvas.width, this.deltaCanvas.height);

        // Draw grid lines on both canvases
        this.drawGrid(this.graphCtx, this.graphCanvas);
        this.drawGrid(this.deltaCtx, this.deltaCanvas);

        // Draw movement graph
        this.drawMovementGraph();

        // Draw delta indicator
        this.drawDeltaIndicator();

        // Decay delta values
        this.deltaX *= 0.95;
        this.deltaY *= 0.95;

        this.animationFrame = requestAnimationFrame(this.boundAnimate);
    }

    drawGrid(ctx, canvas) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += canvas.width / 10) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += canvas.height / 10) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // Draw center lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
    }    drawMovementGraph() {
        if (this.movementHistory.length < 2) return;

        const now = Date.now();
        this.graphCtx.lineWidth = 2;

        // Calculate the visible time window (3 seconds)
        const timeWindow = 3000; // 3 seconds
        const oldestAllowedTime = now - timeWindow;
        
        // Filter history to show only last 3 seconds
        const visibleHistory = this.movementHistory.filter(point => point.time >= oldestAllowedTime);
        
        if (visibleHistory.length < 2) return;

        const graphHeight = this.graphCanvas.height;
        const maxMovement = 50; // Maximum expected movement in pixels
        
        // Draw X movement (blue line)
        this.graphCtx.strokeStyle = '#4a9eff';
        this.graphCtx.beginPath();
        visibleHistory.forEach((point, index) => {
            const x = (point.time - oldestAllowedTime) / timeWindow * this.graphCanvas.width;
            const y = graphHeight / 2 - (point.x / maxMovement) * (graphHeight / 4);
            
            if (index === 0) {
                this.graphCtx.moveTo(x, y);
            } else {
                this.graphCtx.lineTo(x, y);
            }
        });
        this.graphCtx.stroke();
        
        // Draw Y movement (red line)
        this.graphCtx.strokeStyle = '#ff4a4a';
        this.graphCtx.beginPath();
        visibleHistory.forEach((point, index) => {
            const x = (point.time - oldestAllowedTime) / timeWindow * this.graphCanvas.width;
            const y = graphHeight / 2 - (point.y / maxMovement) * (graphHeight / 4);
            
            if (index === 0) {
                this.graphCtx.moveTo(x, y);
            } else {
                this.graphCtx.lineTo(x, y);
            }
        });
        this.graphCtx.stroke();
        
        // Draw legend
        this.graphCtx.font = '12px Arial';
        this.graphCtx.fillStyle = '#4a9eff';
        this.graphCtx.fillText('X Movement', 10, 20);
        this.graphCtx.fillStyle = '#ff4a4a';
        this.graphCtx.fillText('Y Movement', 10, 40);
    }

    drawDeltaIndicator() {
        const dotX = this.deltaCenterX + (this.deltaX / this.deltaScale) * (this.deltaCanvas.width / 2);
        const dotY = this.deltaCenterY + (this.deltaY / this.deltaScale) * (this.deltaCanvas.height / 2);

        // Draw line from center to dot
        this.deltaCtx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.deltaCtx.lineWidth = 2;
        this.deltaCtx.beginPath();
        this.deltaCtx.moveTo(this.deltaCenterX, this.deltaCenterY);
        this.deltaCtx.lineTo(dotX, dotY);
        this.deltaCtx.stroke();

        // Draw dot
        this.deltaCtx.fillStyle = 'red';
        this.deltaCtx.beginPath();
        this.deltaCtx.arc(dotX, dotY, 5, 0, Math.PI * 2);
        this.deltaCtx.fill();
    }
}

// Initialize the mouse manager when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MouseManager();
});