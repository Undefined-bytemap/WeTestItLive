class StressTest {
    constructor() {
        this.stressGrid = document.getElementById('stressTestContainer');
        this.testButton = document.getElementById('testStressBtn');
        this.isShowingStress = false;
        this.isRunning = false;
        this.workers = [];
        this.maxThreads = navigator.hardwareConcurrency || 4;
        this.selectedThreads = Math.max(1, Math.min(4, this.maxThreads));
        this.metrics = {
            cpu: 0,
            memory: 0,
            battery: 100,
            startTime: null,
            lastUpdate: 0
        };
        this.results = [];
        this.animationFrame = null;
        
        // Canvas for visualization
        this.cpuCanvas = null; // New: CPU canvas
        this.cpuCtx = null;    // New: CPU canvas context
        this.ramCanvas = null; // New: RAM canvas
        this.ramCtx = null;    // New: RAM canvas context
        
        // Bind methods
        this.boundAnimate = this.animate.bind(this);
        this.boundUpdateMetrics = this.updateMetrics.bind(this);
        
        // Add event listener for the test button
        this.testButton.addEventListener('click', () => this.toggleStress());
    }

    toggleStress() {
        if (this.isShowingStress) {
            this.hideStress();
        } else {
            this.showStress();
        }
    }    showStress() {
        this.createStressInterface();
        this.stressGrid.style.display = 'block';
        this.testButton.textContent = 'Stop Hardware Test';
        this.testButton.style.background = '#1e3c72';
        this.isShowingStress = true;
        
        // Set up canvas and start animation
        this.setupCanvases(); // Modified: setupCanvases instead of setupCanvas
        this.animate();
        
        // Start metrics updates
        this.updateMetrics();
    }

    hideStress() {
        // Stop all running tests
        this.stopStressTest();
        
        // Cancel animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.stressGrid.style.display = 'none';
        this.testButton.textContent = 'Test Hardware';
        this.testButton.style.background = '#2a5298';
        this.isShowingStress = false;
    }createStressInterface() {
        this.stressGrid.innerHTML = '';

        // Create main container
        const testArea = document.createElement('div');
        testArea.className = 'stress-test-area';
        
        // Create controls section
        const controls = document.createElement('div');
        controls.className = 'stress-controls';
        
        // Thread selector
        const threadSelector = document.createElement('div');
        threadSelector.className = 'thread-selector';
        
        const threadLabel = document.createElement('label');
        threadLabel.textContent = 'Threads:';
        threadSelector.appendChild(threadLabel);
        
        const threadSelect = document.createElement('select');
        threadSelect.id = 'threadCount';
        
        // Add options for thread counts
        for (let i = 1; i <= this.maxThreads; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i.toString();
            if (i === this.selectedThreads) {
                option.selected = true;
            }
            threadSelect.appendChild(option);
        }
        
        threadSelect.addEventListener('change', () => {
            this.selectedThreads = parseInt(threadSelect.value);
        });
        
        threadSelector.appendChild(threadSelect);
        controls.appendChild(threadSelector);
        
        // Control buttons
        const controlButtons = document.createElement('div');
        controlButtons.className = 'control-buttons';
        
        const startBtn = document.createElement('button');
        startBtn.className = 'start-btn';
        startBtn.textContent = 'Start';
        startBtn.addEventListener('click', () => this.startStressTest());
        
        const stopBtn = document.createElement('button');
        stopBtn.className = 'stop-btn';
        stopBtn.textContent = 'Stop';
        stopBtn.disabled = true;
        stopBtn.addEventListener('click', () => this.stopStressTest());
        
        controlButtons.appendChild(startBtn);
        controlButtons.appendChild(stopBtn);
        controls.appendChild(controlButtons);
        
        testArea.appendChild(controls);
        
        // Create metrics section
        const metricsSection = document.createElement('div');
        metricsSection.className = 'stress-metrics';
        
        // CPU metric
        const cpuMetric = document.createElement('div');
        cpuMetric.className = 'metric-card';
        
        const cpuTitle = document.createElement('div');
        cpuTitle.className = 'metric-title';
        cpuTitle.textContent = 'CPU Load';
        
        const cpuValue = document.createElement('div');
        cpuValue.className = 'metric-value';
        cpuValue.id = 'cpuValue';
        cpuValue.textContent = '0%';
        
        const cpuProgress = document.createElement('div');
        cpuProgress.className = 'metric-progress';
        
        const cpuBar = document.createElement('div');
        cpuBar.className = 'metric-bar';
        cpuBar.id = 'cpuBar';
        cpuBar.style.width = '0%';
        
        cpuProgress.appendChild(cpuBar);
        cpuMetric.appendChild(cpuTitle);
        cpuMetric.appendChild(cpuValue);
        cpuMetric.appendChild(cpuProgress);
        
        // Memory metric
        const memoryMetric = document.createElement('div');
        memoryMetric.className = 'metric-card';
        
        const memoryTitle = document.createElement('div');
        memoryTitle.className = 'metric-title';
        memoryTitle.textContent = 'Memory Usage';
        
        const memoryValue = document.createElement('div');
        memoryValue.className = 'metric-value';
        memoryValue.id = 'memoryValue';
        memoryValue.textContent = '0 MB';
        
        const memoryProgress = document.createElement('div');
        memoryProgress.className = 'metric-progress';
        
        const memoryBar = document.createElement('div');
        memoryBar.className = 'metric-bar';
        memoryBar.id = 'memoryBar';
        memoryBar.style.width = '0%';
        
        memoryProgress.appendChild(memoryBar);
        memoryMetric.appendChild(memoryTitle);
        memoryMetric.appendChild(memoryValue);
        memoryMetric.appendChild(memoryProgress);
        
        // Battery metric
        const batteryMetric = document.createElement('div');
        batteryMetric.className = 'metric-card';
        
        const batteryTitle = document.createElement('div');
        batteryTitle.className = 'metric-title';
        batteryTitle.textContent = 'Battery';
        
        const batteryValue = document.createElement('div');
        batteryValue.className = 'metric-value';
        batteryValue.id = 'batteryValue';
        batteryValue.textContent = 'Checking...';
        
        const batteryProgress = document.createElement('div');
        batteryProgress.className = 'metric-progress';
        
        const batteryBar = document.createElement('div');
        batteryBar.className = 'metric-bar';
        batteryBar.id = 'batteryBar';
        batteryBar.style.width = '100%';
        
        batteryProgress.appendChild(batteryBar);
        batteryMetric.appendChild(batteryTitle);
        batteryMetric.appendChild(batteryValue);
        batteryMetric.appendChild(batteryProgress);
        
        // Test duration metric
        const durationMetric = document.createElement('div');
        durationMetric.className = 'metric-card';
        
        const durationTitle = document.createElement('div');
        durationTitle.className = 'metric-title';
        durationTitle.textContent = 'Duration';
        
        const durationValue = document.createElement('div');
        durationValue.className = 'metric-value';
        durationValue.id = 'durationValue';
        durationValue.textContent = '00:00';
        
        durationMetric.appendChild(durationTitle);
        durationMetric.appendChild(durationValue);
        
        // Add metrics to metrics section
        metricsSection.appendChild(cpuMetric);
        metricsSection.appendChild(memoryMetric);
        metricsSection.appendChild(batteryMetric);
        metricsSection.appendChild(durationMetric);
        
        testArea.appendChild(metricsSection);
        
        // Create visualization section (similar to mouse test)
        const visualization = document.createElement('div');
        visualization.className = 'stress-visualization';
        
        // New: Create a container for the two graphs
        const graphsContainer = document.createElement('div');
        graphsContainer.className = 'performance-graphs-container';

        // Performance graph for CPU
        const cpuPerformanceGraph = document.createElement('div');
        cpuPerformanceGraph.className = 'performance-graph cpu-graph'; // Added cpu-graph class
        
        this.cpuCanvas = document.createElement('canvas');
        this.cpuCanvas.className = 'stress-canvas';
        cpuPerformanceGraph.appendChild(this.cpuCanvas);
        graphsContainer.appendChild(cpuPerformanceGraph); // Add to new container

        // Performance graph for RAM
        const ramPerformanceGraph = document.createElement('div');
        ramPerformanceGraph.className = 'performance-graph ram-graph'; // Added ram-graph class

        this.ramCanvas = document.createElement('canvas');
        this.ramCanvas.className = 'stress-canvas';
        ramPerformanceGraph.appendChild(this.ramCanvas);
        graphsContainer.appendChild(ramPerformanceGraph); // Add to new container
        
        visualization.appendChild(graphsContainer); // Add graphs container to visualization
        
        // Threads info
        const threadsInfo = document.createElement('div');
        threadsInfo.className = 'threads-info';
        threadsInfo.id = 'threadsInfo';
        visualization.appendChild(threadsInfo);
        
        // Short info panel
        const infoPanel = document.createElement('div');
        infoPanel.className = 'info-panel';
        infoPanel.textContent = 'This test runs intensive calculations on multiple threads to stress your system. It helps identify thermal throttling and performance issues.';
        visualization.appendChild(infoPanel);
        
        testArea.appendChild(visualization);
        
        // Add everything to the grid
        this.stressGrid.appendChild(testArea);
        
        // Store button references
        this.startBtn = startBtn;
        this.stopBtn = stopBtn;
        this.threadSelect = threadSelect;
        
        // Set up context for canvases
        this.cpuCtx = this.cpuCanvas.getContext('2d');
        this.ramCtx = this.ramCanvas.getContext('2d');
    }

    setupCanvases() { // Renamed from setupCanvas
        if (!this.cpuCanvas || !this.ramCanvas) return;
        
        const setupSingleCanvas = (canvas, ctx) => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            this.drawGrid(ctx, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio); // Pass context and dimensions
        };

        setupSingleCanvas(this.cpuCanvas, this.cpuCtx);
        setupSingleCanvas(this.ramCanvas, this.ramCtx);
    }

    drawGrid(ctx, width, height) { // Modified to accept ctx, width, height
        if (!ctx) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Draw vertical lines
        for (let x = 0; x <= width; x += width / 10) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = 0; y <= height; y += height / 5) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Label for 100%
        ctx.fillText('100%', 5, 5);
        
        // Label for 0%
        ctx.fillText('0%', 5, height - 15);
    }

    startStressTest() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.threadSelect.disabled = true;
        
        // Reset metrics
        this.metrics.startTime = Date.now();
        this.results = [];
        
        // Update threads info
        this.updateThreadsInfo();
        
        // Create and start worker threads
        this.createWorkers();
    }

    stopStressTest() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.threadSelect.disabled = false;
        
        // Terminate all workers
        this.terminateWorkers();
        
        // Clear threads info
        document.getElementById('threadsInfo').innerHTML = '';
    }

    createWorkers() {
        // Terminate existing workers first
        this.terminateWorkers();
        
        // Create new workers
        for (let i = 0; i < this.selectedThreads; i++) {
            const worker = new Worker(URL.createObjectURL(new Blob([`
                // Worker for CPU stress test
                let running = true;
                let counter = 0;
                
                // Function to perform intensive calculations
                function stressTest() {
                    const start = performance.now();
                    
                    // Complex math operations to stress CPU
                    while (performance.now() - start < 100) {
                        for (let i = 0; i < 10000; i++) {
                            counter++;
                            const x = Math.sin(counter) * Math.cos(counter);
                            const y = Math.sqrt(Math.abs(x));
                            const z = Math.pow(y, 2) + Math.atan(x);
                        }
                    }
                    
                    // Report status
                    postMessage({
                        type: 'progress',
                        threadId: ${i},
                        counter: counter
                    });
                    
                    // Continue if still running
                    if (running) {
                        setTimeout(stressTest, 0);
                    }
                }
                
                // Listen for commands
                onmessage = function(e) {
                    if (e.data.command === 'stop') {
                        running = false;
                        postMessage({
                            type: 'stopped',
                            threadId: ${i}
                        });
                    }
                };
                
                // Start stress test
                stressTest();
            `], { type: 'application/javascript' })));
            
            worker.onmessage = (e) => {
                if (e.data.type === 'progress') {
                    // Update thread progress
                    this.updateThreadProgress(e.data.threadId, e.data.counter);
                }
            };
            
            this.workers.push({
                id: i,
                worker: worker,
                counter: 0
            });
        }
    }

    terminateWorkers() {
        // Send stop command to all workers
        this.workers.forEach(worker => {
            if (worker.worker) {
                worker.worker.postMessage({ command: 'stop' });
                worker.worker.terminate();
            }
        });
        
        this.workers = [];
    }

    updateThreadsInfo() {
        const threadsInfoEl = document.getElementById('threadsInfo');
        if (!threadsInfoEl) return;
        
        threadsInfoEl.innerHTML = '';
        
        for (let i = 0; i < this.selectedThreads; i++) {
            const threadInfo = document.createElement('div');
            threadInfo.className = 'thread-info';
            threadInfo.id = `thread-${i}`;
            threadInfo.textContent = `Thread ${i + 1}: Initializing...`;
            threadsInfoEl.appendChild(threadInfo);
        }
    }

    updateThreadProgress(threadId, counter) {
        const threadEl = document.getElementById(`thread-${threadId}`);
        if (threadEl) {
            threadEl.textContent = `Thread ${threadId + 1}: ${counter.toLocaleString()} ops`;
        }
        
        // Update worker counter
        const worker = this.workers.find(w => w.id === threadId);
        if (worker) {
            worker.counter = counter;
        }
    }

    async updateMetrics() {
        if (!this.isShowingStress) return;
        
        try {
            // Update memory usage
            if (window.performance && window.performance.memory) {
                const memUsed = window.performance.memory.usedJSHeapSize;
                const memTotal = window.performance.memory.jsHeapSizeLimit;
                const memPercent = Math.round((memUsed / memTotal) * 100);
                
                document.getElementById('memoryValue').textContent = `${Math.round(memUsed / (1024 * 1024))} MB`;
                document.getElementById('memoryBar').style.width = `${memPercent}%`;
                
                this.metrics.memory = memPercent;
            } else {
                document.getElementById('memoryValue').textContent = 'Not available';
            }
            
            // Update battery info
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                const level = Math.round(battery.level * 100);
                
                document.getElementById('batteryValue').textContent = battery.charging ? 
                    `${level}% (Charging)` : `${level}%`;
                document.getElementById('batteryBar').style.width = `${level}%`;
                
                this.metrics.battery = level;
            } else {
                document.getElementById('batteryValue').textContent = 'Not available';
            }
            
            // Update test duration
            if (this.metrics.startTime && this.isRunning) {
                const elapsed = Date.now() - this.metrics.startTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                
                document.getElementById('durationValue').textContent = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else if (!this.isRunning) {
                document.getElementById('durationValue').textContent = '00:00:00';
            }
            
            // Approximate CPU usage based on frame rate
            const now = performance.now();
            const timeDiff = now - this.metrics.lastUpdate;
            
            if (timeDiff > 0) {
                // Calculate target vs actual frames for a rough CPU metric
                const targetFrameTime = 16.67; // 60fps
                // Ensure cpuLoad is a number and not NaN, default to 0 if timeDiff is problematic
                let cpuLoad = (timeDiff > 0 && targetFrameTime > 0) ? Math.min(100, Math.round((targetFrameTime / timeDiff) * 100)) : 0;
                if (isNaN(cpuLoad)) cpuLoad = 0;


                // Adjust based on active workers
                const adjustedLoad = this.isRunning ?
                    Math.max(cpuLoad, 50 + (this.selectedThreads / this.maxThreads) * 50) :
                    cpuLoad;
                
                const finalCpuLoad = Math.max(0, Math.min(100, Math.round(adjustedLoad)));

                document.getElementById('cpuValue').textContent = `${finalCpuLoad}%`;
                document.getElementById('cpuBar').style.width = `${finalCpuLoad}%`;
                
                this.metrics.cpu = finalCpuLoad;
                
                // Add to results for graph
                if (this.isRunning) {
                    this.results.push({
                        time: now,
                        cpu: finalCpuLoad,
                        memory: this.metrics.memory
                    });
                    
                    // Limit results array size
                    if (this.results.length > 100) {
                        this.results.shift();
                    }
                }
            }
            
            this.metrics.lastUpdate = now;
        } catch (error) {
            console.error('Error updating metrics:', error);
        }
        
        // Schedule next update
        setTimeout(this.boundUpdateMetrics, 1000);
    }    animate() {
        if (!this.isShowingStress) return;
        
        // CPU Canvas
        const cpuWidth = this.cpuCanvas.width / window.devicePixelRatio;
        const cpuHeight = this.cpuCanvas.height / window.devicePixelRatio;
        
        this.cpuCtx.fillStyle = '#1a1a1a';
        this.cpuCtx.fillRect(0, 0, cpuWidth, cpuHeight);
        this.drawGrid(this.cpuCtx, cpuWidth, cpuHeight);
        
        // RAM Canvas
        const ramWidth = this.ramCanvas.width / window.devicePixelRatio;
        const ramHeight = this.ramCanvas.height / window.devicePixelRatio;

        this.ramCtx.fillStyle = '#1a1a1a';
        this.ramCtx.fillRect(0, 0, ramWidth, ramHeight);
        this.drawGrid(this.ramCtx, ramWidth, ramHeight);
        
        // Draw performance graph
        if (this.results.length > 1) {
            const drawLine = (ctx, dataKey, color, canvasWidth, canvasHeight) => {
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                const startIdx = Math.max(0, this.results.length - canvasWidth);
                
                for (let i = startIdx; i < this.results.length; i++) {
                    const x = canvasWidth - (this.results.length - i);
                    const y = canvasHeight - ((this.results[i][dataKey] || 0) / 100 * canvasHeight);
                    
                    if (i === startIdx) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            };

            // Draw CPU usage line on CPU canvas
            drawLine(this.cpuCtx, 'cpu', '#4caf50', cpuWidth, cpuHeight);
            
            // Draw memory usage line on RAM canvas
            if (this.results.some(r => r.memory !== undefined)) { // Check if memory data exists
                drawLine(this.ramCtx, 'memory', '#2196f3', ramWidth, ramHeight);
            }
            
            // Add legend to CPU canvas
            this.cpuCtx.font = '12px Arial';
            this.cpuCtx.fillStyle = '#4caf50';
            this.cpuCtx.fillText('CPU Usage', 10, 20);

            // Add legend to RAM canvas
            this.ramCtx.font = '12px Arial';
            this.ramCtx.fillStyle = '#2196f3';
            this.ramCtx.fillText('Memory Usage', 10, 20);
        }
        
        // Request next frame
        this.animationFrame = requestAnimationFrame(this.boundAnimate);
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StressTest();
});
