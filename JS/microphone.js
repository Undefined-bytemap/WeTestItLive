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
        
        // Recording functionality
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recordedAudio = null;
        this.isRecording = false;
        this.isPlayingBack = false;
        this.recordingStartTime = 0;
        this.spectrogramHistory = [];
        this.recordingDuration = 0;
        this.hasRecording = false;
        this.lastAnimationTime = 0;
        this.animationInterval = 33; // Optimized to 30 FPS for better performance
        
        // Performance optimization - consolidated variables
        this.staticSpectrogramImageData = null;
        this.lastProgressX = -1;
        this.frequencyData = null; // Reused array for frequency data
        this.timeData = null; // Reused array for time domain data
    }createMicInterface() {
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

        // Create recording controls
        const recordingControls = document.createElement('div');
        recordingControls.className = 'recording-controls';
        
        this.recordButton = document.createElement('button');
        this.recordButton.textContent = 'Record';
        this.recordButton.className = 'record-btn';
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        
        this.playButton = document.createElement('button');
        this.playButton.textContent = 'Play';
        this.playButton.className = 'play-btn';
        this.playButton.disabled = true;
        this.playButton.addEventListener('click', () => this.togglePlayback());
        
        this.resetButton = document.createElement('button');
        this.resetButton.textContent = 'Reset';
        this.resetButton.className = 'reset-btn';
        this.resetButton.disabled = true;
        this.resetButton.addEventListener('click', () => this.resetRecording());
        
        recordingControls.appendChild(this.recordButton);
        recordingControls.appendChild(this.playButton);
        recordingControls.appendChild(this.resetButton);

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
        this.micGrid.appendChild(recordingControls);
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
    }    async startVisualization() {
        // Stop any existing stream
        this.stopVisualization();

        try {
            // Start new stream
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // Optimized - reduced from 4096 for better performance
            this.analyser.smoothingTimeConstant = 0.3;

            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: this.selectedDevice ? { exact: this.selectedDevice } : undefined
                }
            });

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            source.connect(this.analyser);

            // Initialize reused arrays for better performance
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

            // Only start live visualization if no recording exists
            if (!this.hasRecording) {
                this.visualize();
            } else {
                // Show static recording and clear waveform
                this.drawStaticSpectrogram();
                this.clearWaveform();
            }
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.showError('Could not access the selected microphone');
        }
    }stopVisualization() {
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
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder = null;
        }
    }

    async toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        if (!this.mediaStream) {
            console.error('No media stream available for recording');
            return;
        }

        try {
            this.recordedChunks = [];
            this.spectrogramHistory = [];
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                this.recordedAudio = URL.createObjectURL(blob);
                this.recordingDuration = Date.now() - this.recordingStartTime;
                this.hasRecording = true;
                this.playButton.disabled = false;
                this.resetButton.disabled = false;
                
                // Disable record button after first recording
                this.recordButton.disabled = true;
                this.recordButton.textContent = 'Recording Complete';
                this.recordButton.style.background = '#95a5a6';
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            this.recordButton.textContent = 'Stop Recording';
            this.recordButton.style.background = '#e74c3c';
            
        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.hasRecording = true;
            this.recordButton.textContent = 'Recording Complete';
            this.recordButton.style.background = '#95a5a6';
            this.recordButton.disabled = true;
            
            // Clear cache to prepare for fresh static spectrogram
            this.staticSpectrogramImageData = null;
            this.lastProgressX = -1;
            
            // Draw static recorded spectrogram
            this.drawStaticSpectrogram();
        }
    }

    async togglePlayback() {
        if (this.isPlayingBack) {
            this.stopPlayback();
        } else {
            await this.startPlayback();
        }
    }    async startPlayback() {
        if (!this.recordedAudio) return;

        try {
            // Stop live visualization
            this.stopVisualization();
            
            // Create audio element for playback
            this.playbackAudio = new Audio(this.recordedAudio);
            
            // Wait for metadata to load to ensure duration is available
            await new Promise((resolve, reject) => {
                this.playbackAudio.addEventListener('loadedmetadata', resolve);
                this.playbackAudio.addEventListener('error', reject);
                this.playbackAudio.load();
            });
            
            this.playbackAudio.addEventListener('ended', () => {
                this.stopPlayback();
                this.startVisualization(); // Restart live visualization
            });

            // Setup audio context for playback analysis
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Ensure audio context is running
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048; // Optimized - consistent with live visualization
            this.analyser.smoothingTimeConstant = 0.3;

            const source = this.audioContext.createMediaElementSource(this.playbackAudio);
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            // Initialize reused arrays
            this.timeData = new Uint8Array(this.analyser.frequencyBinCount);

            this.isPlayingBack = true;
            this.lastProgressX = -1;
            this.playButton.textContent = 'Stop Playback';
            this.playButton.style.background = '#e74c3c';

            // Start playback and wait for it to actually begin playing
            const playPromise = this.playbackAudio.play();
            
            if (playPromise !== undefined) {
                await playPromise;
            }
            
            // Small delay to ensure audio context is processing
            await new Promise(resolve => setTimeout(resolve, 50));
            
            this.visualizePlayback();
            
        } catch (error) {
            console.error('Error starting playback:', error);
        }
    }    stopPlayback() {
        if (this.playbackAudio) {
            this.playbackAudio.pause();
            this.playbackAudio.currentTime = 0;
            this.playbackAudio = null;
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.isPlayingBack = false;
        this.lastProgressX = -1;
        this.playButton.textContent = 'Play';
        this.playButton.style.background = '';
        
        // Show static recorded spectrogram and stop waveform
        if (this.hasRecording) {
            this.drawStaticSpectrogram();
            this.clearWaveform();
        } else {
            // Only restart live visualization if no recording exists
            this.startVisualization();
        }
    }    resetRecording() {
        this.stopPlayback();
        
        // Clean up resources
        if (this.recordedAudio) {
            URL.revokeObjectURL(this.recordedAudio);
        }
        
        this.recordedChunks = [];
        this.spectrogramHistory = [];
        this.recordedAudio = null;
        this.recordingDuration = 0;
        this.hasRecording = false;
        this.playButton.disabled = true;
        this.resetButton.disabled = true;
        this.playButton.textContent = 'Play';
        this.playButton.style.background = '';
        
        // Clear performance optimization caches
        this.staticSpectrogramImageData = null;
        this.lastProgressX = -1;
        
        // Re-enable record button
        this.recordButton.disabled = false;
        this.recordButton.textContent = 'Record';
        this.recordButton.style.background = '#e74c3c';
        
        this.clearCanvases();
        
        // Restart live visualization if mic is active
        if (this.isShowingMic) {
            this.startVisualization();
        }
    }    clearCanvases() {
        // Clear waveform
        const waveformWidth = this.waveformCanvas.width;
        const waveformHeight = this.waveformCanvas.height;
        this.waveformCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.waveformCtx.fillRect(0, 0, waveformWidth, waveformHeight);
        
        // Clear spectrogram
        const spectrogramWidth = this.spectrogramCanvas.width;
        const spectrogramHeight = this.spectrogramCanvas.height;
        this.spectrogramCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.spectrogramCtx.fillRect(0, 0, spectrogramWidth, spectrogramHeight);
    }clearWaveform() {
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        this.waveformCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.waveformCtx.fillRect(0, 0, width, height);
    }

    drawStaticSpectrogram() {
        if (!this.spectrogramHistory.length) return;

        const width = this.spectrogramCanvas.width;
        const height = this.spectrogramCanvas.height;
        const ctx = this.spectrogramCtx;

        // Use cached image data if available
        if (this.staticSpectrogramImageData && 
            this.staticSpectrogramImageData.width === width && 
            this.staticSpectrogramImageData.height === height) {
            ctx.putImageData(this.staticSpectrogramImageData, 0, 0);
            return;
        }

        // Clear spectrogram
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // Draw the complete recorded spectrogram with optimized rendering
        const frameWidth = Math.max(1, width / this.spectrogramHistory.length);
        
        // Optimized - reduced max bins for better performance
        const maxBins = Math.min(256, this.spectrogramHistory[0]?.length || 256);
        const binStep = Math.max(1, Math.floor((this.spectrogramHistory[0]?.length || 256) / maxBins));
        
        for (let frame = 0; frame < this.spectrogramHistory.length; frame++) {
            const data = this.spectrogramHistory[frame];
            const x = frame * frameWidth;
            
            const binHeight = Math.max(1, height / maxBins);
            
            for (let i = 0; i < data.length; i += binStep) {
                const value = data[i];
                const hue = (1.0 - (value / 255.0)) * 240; // Blue (240) to red (0)
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                const y = height * (1 - (i / data.length));
                ctx.fillRect(x, y, frameWidth + 1, binHeight + 1);
            }
        }

        // Cache the static spectrogram for reuse
        this.staticSpectrogramImageData = ctx.getImageData(0, 0, width, height);
    }visualize() {
        if (!this.analyser) return;

        const draw = (currentTime) => {
            if (!this.analyser || this.hasRecording) return; // Stop if we have a recording
            
            // Use consistent throttling for better performance
            if (currentTime - this.lastAnimationTime < this.animationInterval) {
                this.animationFrame = requestAnimationFrame(draw);
                return;
            }
            this.lastAnimationTime = currentTime;
            
            this.animationFrame = requestAnimationFrame(draw);

            // Only draw waveform and spectrogram when live (no recording)
            if (!this.hasRecording) {
                // Draw waveform - reuse arrays for better performance
                this.analyser.getByteTimeDomainData(this.timeData);
                this.drawWaveform(this.timeData);

                // Draw spectrogram - reuse arrays for better performance
                this.analyser.getByteFrequencyData(this.frequencyData);
                this.drawSpectrogram(this.frequencyData);
            }

            // Store spectrogram data if recording (with optimized throttling)
            if (this.isRecording) {
                // More aggressive throttling for longer recordings to save memory
                const recordingDuration = (Date.now() - this.recordingStartTime) / 1000;
                const shouldSample = recordingDuration < 20 || this.spectrogramHistory.length % 3 === 0;
                
                if (shouldSample) {
                    this.spectrogramHistory.push([...this.frequencyData]);
                }
            }
        };

        draw(0);
    }    visualizePlayback() {
        if (!this.analyser || !this.isPlayingBack) return;
        
        const draw = (currentTime) => {
            if (!this.isPlayingBack) return;
            
            // Optimized frame rate for better performance
            if (currentTime - this.lastAnimationTime < this.animationInterval) {
                this.animationFrame = requestAnimationFrame(draw);
                return;
            }
            this.lastAnimationTime = currentTime;
            
            this.animationFrame = requestAnimationFrame(draw);

            // Draw waveform from playback
            if (this.audioContext && this.audioContext.state === 'running') {
                this.analyser.getByteTimeDomainData(this.timeData);
                this.drawWaveform(this.timeData);
            }

            // Draw playback progress on static spectrogram
            this.drawPlaybackSpectrogram();
        };

        draw(0);
    }    drawPlaybackSpectrogram() {
        if (!this.spectrogramHistory.length || !this.playbackAudio) return;

        const width = this.spectrogramCanvas.width;
        const height = this.spectrogramCanvas.height;
        const ctx = this.spectrogramCtx;

        // Calculate current playback position using audio element's currentTime
        const audioDuration = this.playbackAudio.duration;
        const audioCurrentTime = this.playbackAudio.currentTime;
        const audioEnded = this.playbackAudio.ended;
        const audioPaused = this.playbackAudio.paused;
        const audioReadyState = this.playbackAudio.readyState;

        // Use audio element's progress for accurate synchronization
        let progress = 0;
        if (audioDuration && audioDuration > 0 && !isNaN(audioDuration) && audioDuration !== Infinity) {
            progress = Math.min(audioCurrentTime / audioDuration, 1);
        } else if (this.spectrogramHistory.length > 0) {
            // Use the recorded spectrogram frame count as timing reference
            const frameCount = this.spectrogramHistory.length;
            const estimatedDuration = frameCount * (this.animationInterval / 1000);
            if (estimatedDuration > 0) {
                progress = Math.min(audioCurrentTime / estimatedDuration, 1);
            }
        }
        
        // Ensure progress is valid
        if (isNaN(progress) || progress < 0) {
            progress = 0;
        }
        
        const progressX = Math.round(progress * width);

        // Only draw when playback is active and audio element is ready
        const shouldDraw = this.isPlayingBack && !audioEnded && audioReadyState >= 2;
        
        if (!shouldDraw) {
            return;
        }

        // Always redraw the static spectrogram for clean background
        this.drawStaticSpectrogram();

        // Draw red progress line with enhanced visibility
        const visibleProgressX = Math.max(1, progressX);
        
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.moveTo(visibleProgressX, 0);
        ctx.lineTo(visibleProgressX, height);
        ctx.stroke();
        
        // Reset shadow to avoid affecting other drawings
        ctx.shadowBlur = 0;
        
        this.lastProgressX = visibleProgressX;
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
    }    drawSpectrogram(data) {
        const width = this.spectrogramCanvas.width;
        const height = this.spectrogramCanvas.height;
        const ctx = this.spectrogramCtx;

        // More efficient scrolling - use image data manipulation
        const imageData = ctx.getImageData(1, 0, width - 1, height);
        ctx.putImageData(imageData, 0, 0);

        // Draw new column with optimized frequency bins
        const binStep = Math.max(1, Math.floor(data.length / 128)); // Reduced from 256 for better performance
        const heightStep = height / Math.ceil(data.length / binStep);
        
        for (let i = 0; i < data.length; i += binStep) {
            const value = data[i];
            const hue = (1.0 - (value / 255.0)) * 240; // Blue (240) to red (0)
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            const y = height * (1 - (i / data.length));
            ctx.fillRect(width - 1, y, 1, heightStep + 1);
        }

        // Draw recording indicator line
        if (this.isRecording) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width - 1, 0);
            ctx.lineTo(width - 1, height);
            ctx.stroke();
        }
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MicrophoneTest();
});
