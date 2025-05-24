class MicrophoneTest {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;
        this.devices = [];
        this.selectedDevice = null;
        this.isShowingMic = false;
        this.micGrid = document.getElementById('micTestContainer');
        this.testButton = document.getElementById('testMicBtn');
        this.testButton.addEventListener('click', () => this.toggleMic());
        this.animationFrame = null;
        this.resizeObserver = null;
    }

    createMicInterface() {
        this.micGrid.innerHTML = '';

        // Create controls container
        const controls = document.createElement('div');
        controls.className = 'mic-controls';
        
        // Create device select
        const label = document.createElement('label');
        label.htmlFor = 'micDeviceSelect';
        label.textContent = 'Select Input Device:';
        label.style.color = 'white';
        
        this.deviceSelect = document.createElement('select');
        this.deviceSelect.id = 'micDeviceSelect';
        this.deviceSelect.className = 'mic-device-select';
        
        controls.appendChild(label);
        controls.appendChild(this.deviceSelect);

        // Create visualization container
        const vizContainer = document.createElement('div');
        vizContainer.className = 'visualization-container';
        
        // Waveform visualization
        const waveformLabel = document.createElement('div');
        waveformLabel.className = 'visualization-label';
        waveformLabel.textContent = 'Waveform';
        
        this.waveformCanvas = document.createElement('canvas');
        this.waveformCanvas.className = 'waveform-canvas';
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        
        // Spectrogram visualization
        const spectrogramLabel = document.createElement('div');
        spectrogramLabel.className = 'visualization-label';
        spectrogramLabel.textContent = 'Spectrogram';
        
        this.spectrogramCanvas = document.createElement('canvas');
        this.spectrogramCanvas.className = 'spectrogram-canvas';
        this.spectrogramCtx = this.spectrogramCanvas.getContext('2d');
        
        vizContainer.appendChild(waveformLabel);
        vizContainer.appendChild(this.waveformCanvas);
        vizContainer.appendChild(spectrogramLabel);
        vizContainer.appendChild(this.spectrogramCanvas);
        
        // Add to container
        this.micGrid.appendChild(controls);
        this.micGrid.appendChild(vizContainer);
        
        // Setup everything
        this.setupMicDevices();
        this.setupVisualization();
    }

    setupVisualization() {
        // Set up canvas sizes based on display size
        const updateCanvasSize = () => {
            ['waveformCanvas', 'spectrogramCanvas'].forEach(canvasName => {
                const canvas = this[canvasName];
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = rect.height * window.devicePixelRatio;
            });
        };

        // Listen for resize events
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.resizeObserver = new ResizeObserver(updateCanvasSize);
        this.resizeObserver.observe(this.waveformCanvas);
        this.resizeObserver.observe(this.spectrogramCanvas);
        
        // Initial size setup
        updateCanvasSize();
    }

    toggleMic() {
        if (this.isShowingMic) {
            this.hideMic();
        } else {
            this.showMic();
        }
    }

    showMic() {
        this.createMicInterface();
        this.micGrid.style.display = 'block';
        this.testButton.style.background = '#1e3c72';
        this.isShowingMic = true;
    }

    hideMic() {
        this.stopVisualization();
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.micGrid.innerHTML = '';
        this.micGrid.style.display = 'none';
        this.testButton.style.background = '#2a5298';
        this.isShowingMic = false;
    }

    async setupMicDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.warn('Audio input enumeration not supported');
            this.showError('Your browser does not support audio input enumeration');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the test stream

            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices = devices.filter(device => device.kind === 'audioinput');
            
            this.deviceSelect.innerHTML = '';
            
            // Add default device first
            const defaultOption = document.createElement('option');
            defaultOption.value = 'default';
            defaultOption.text = 'Default - ' + (this.devices.find(d => d.deviceId === 'default')?.label || 'System Microphone');
            this.deviceSelect.appendChild(defaultOption);
            
            // Add other devices
            this.devices
                .filter(device => device.deviceId !== 'default')
                .forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `Microphone ${this.devices.indexOf(device) + 1}`;
                    this.deviceSelect.appendChild(option);
                });

            // Add device selection handler
            this.deviceSelect.addEventListener('change', () => {
                this.selectedDevice = this.deviceSelect.value;
                this.startVisualization();
            });

            // Start visualization with default device
            this.startVisualization();
            
        } catch (error) {
            console.warn('Error accessing microphone:', error);
            this.showError(error.name === 'NotAllowedError' ? 
                'Please allow microphone access to use this feature' : 
                'Could not access microphone');
            this.deviceSelect.innerHTML = '<option value="default">Default Microphone</option>';
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = '#ff4444';
        errorDiv.style.padding = '16px';
        errorDiv.style.marginTop = '16px';
        errorDiv.style.background = 'rgba(255, 0, 0, 0.1)';
        errorDiv.style.borderRadius = '8px';
        errorDiv.textContent = message;
        this.micGrid.appendChild(errorDiv);
    }

    async startVisualization() {
        // Stop any existing stream
        this.stopVisualization();

        try {
            // Start new stream
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: this.selectedDevice ? { exact: this.selectedDevice } : undefined
                }
            });

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            this.visualize();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showError('Could not access the selected microphone');
        }
    }

    stopVisualization() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    visualize() {
        if (!this.analyser) return;

        const waveformData = new Uint8Array(this.analyser.frequencyBinCount);
        const spectrogramData = new Uint8Array(this.analyser.frequencyBinCount);
        
        const draw = () => {
            this.animationFrame = requestAnimationFrame(draw);

            // Draw waveform
            this.analyser.getByteTimeDomainData(waveformData);
            this.drawWaveform(waveformData);

            // Draw spectrogram
            this.analyser.getByteFrequencyData(spectrogramData);
            this.drawSpectrogram(spectrogramData);
        };

        draw();
    }

    drawWaveform(data) {
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        const ctx = this.waveformCtx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.strokeStyle = '#4CAF50';
        ctx.beginPath();

        const sliceWidth = width / data.length;
        let x = 0;

        for (let i = 0; i < data.length; i++) {
            const v = data[i] / 128.0;
            const y = v * height / 2;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }

    drawSpectrogram(data) {
        const width = this.spectrogramCanvas.width;
        const height = this.spectrogramCanvas.height;
        const ctx = this.spectrogramCtx;

        // Move previous content left
        const imageData = ctx.getImageData(1, 0, width - 1, height);
        ctx.putImageData(imageData, 0, 0);

        // Draw new column
        for (let i = 0; i < data.length; i++) {
            const value = data[i];
            const hue = (1.0 - (value / 255.0)) * 240; // Blue (240) to red (0)
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            const y = height * (1 - (i / data.length));
            ctx.fillRect(width - 1, y, 1, height / data.length + 1);
        }
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MicrophoneTest();
});
