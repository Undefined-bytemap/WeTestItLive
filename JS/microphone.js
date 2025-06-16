class MicrophoneTest {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.analyser = null;
        this.devices = [];
        this.selectedDevice = null;
        this.micGrid = document.getElementById('micTestContainer');
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
        this.lastAnimationTime = 0;        this.animationInterval = 33; // Optimized to 30 FPS for better performance
        
        // Performance optimization - consolidated variables
        this.staticSpectrogramImageData = null;
        this.lastProgressX = -1;
        this.frequencyData = null; // Reused array for frequency data
        this.timeData = null; // Reused array for time domain data
        // Do not auto-start mic here; let DOMContentLoaded handler do it
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
          // Create a wrapper for the spectrogram to handle fullscreen
        const spectrogramWrapper = document.createElement('div');
        spectrogramWrapper.className = 'spectrogram-wrapper';
        
        this.spectrogramCanvas = document.createElement('canvas');
        this.spectrogramCanvas.className = 'spectrogram-canvas';
        this.spectrogramCtx = this.spectrogramCanvas.getContext('2d');
        
        // Create frequency markers container
        const frequencyMarkersContainer = document.createElement('div');
        frequencyMarkersContainer.className = 'frequency-markers';
        
        // Define key frequency points to mark (in Hz)
        const frequencyMarks = [
            { freq: 20000, label: '20kHz' },
            { freq: 10000, label: '10kHz' },
            { freq: 5000, label: '5kHz' },
            { freq: 2000, label: '2kHz' },
            { freq: 1000, label: '1kHz' },
            { freq: 500, label: '500Hz' },
            { freq: 250, label: '250Hz' },
            { freq: 60, label: '60Hz' }
        ];
        
        // Create marker for each frequency
        frequencyMarks.forEach(mark => {
            const marker = document.createElement('div');
            marker.className = 'frequency-marker';
            marker.textContent = mark.label;
            
            // Position based on logarithmic scale
            const logFreq = Math.log(1 + (mark.freq / 22050) * 20) / Math.log(21);
            const position = (1 - logFreq) * 100;
            marker.style.top = `${position}%`;
            
            frequencyMarkersContainer.appendChild(marker);
        });
        
        // Create fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'spectrogram-fullscreen-btn';
        
        // SVG icons for fullscreen
        const enterFullscreenSVG = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
        const exitFullscreenSVG = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>';
        
        fullscreenBtn.innerHTML = enterFullscreenSVG;
        fullscreenBtn.title = 'Toggle fullscreen';
        
        // Update button on fullscreen change
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement === spectrogramWrapper) {
                fullscreenBtn.innerHTML = exitFullscreenSVG;
                fullscreenBtn.title = 'Exit fullscreen';
            } else {
                fullscreenBtn.innerHTML = enterFullscreenSVG;
                fullscreenBtn.title = 'Enter fullscreen';
            }
        });
        
        // Toggle fullscreen on click
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                if (spectrogramWrapper.requestFullscreen) {
                    spectrogramWrapper.requestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
          // Add canvas, frequency markers, and button to wrapper
        spectrogramWrapper.appendChild(this.spectrogramCanvas);
        spectrogramWrapper.appendChild(frequencyMarkersContainer);
        spectrogramWrapper.appendChild(fullscreenBtn);
        // Move fullscreen button to bottom left
        fullscreenBtn.style.right = 'auto';
        fullscreenBtn.style.left = '8px';
        
        vizContainer.appendChild(waveformLabel);
        vizContainer.appendChild(this.waveformCanvas);
        vizContainer.appendChild(spectrogramLabel);
        vizContainer.appendChild(spectrogramWrapper);
        
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
        };        // Listen for resize events
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // Enhanced resize observer that handles fullscreen changes
        this.resizeObserver = new ResizeObserver(entries => {
            // Call the standard canvas size update
            updateCanvasSize();
            
            // Additional handling for fullscreen
            entries.forEach(entry => {
                if (entry.target === this.spectrogramCanvas && document.fullscreenElement) {
                    // We're in fullscreen mode, optimize for full viewport
                    this.staticSpectrogramImageData = null; // Force redraw
                    if (this.analyser && !this.isPlayingBack) {
                        // Redraw with higher resolution in fullscreen
                        this.updateVisualization();
                    }
                }
            });
        });
        
        this.resizeObserver.observe(this.waveformCanvas);
        this.resizeObserver.observe(this.spectrogramCanvas);
        
        // Initial size setup
        updateCanvasSize();    }

    showMic() {
        this.createMicInterface();
        this.micGrid.style.display = 'block';
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

            // Set selectedDevice to the current value of the select (default on first load)
            this.selectedDevice = this.deviceSelect.value;

            // Add device selection handler
            this.deviceSelect.addEventListener('change', () => {
                this.selectedDevice = this.deviceSelect.value;
                this.startVisualization();
            });

            // Start visualization with selected device
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
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096; // Increased from 2048 for better vertical detail
            this.analyser.smoothingTimeConstant = 0.2; // Reduced for more detailed response

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

            // Always start visualization loop for live mic
            this.visualize();

            // If a recording exists, show static spectrogram and clear waveform as overlay
            if (this.hasRecording) {
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
            this.analyser.fftSize = 4096; // Increased to match live visualization quality
            this.analyser.smoothingTimeConstant = 0.2; // Reduced for more detailed response

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

        // Restart live visualization since mic is always active
        this.startVisualization();
    }clearCanvases() {
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);
        // Use the same color/detail logic as drawSpectrogram for each frame
        const drawWidth = width - (width * 0.08);
        const totalFrames = this.spectrogramHistory.length;
        let prevX = null;
        for (let frame = 0; frame < totalFrames; frame++) {
            const data = this.spectrogramHistory[frame];
            const x = Math.floor(frame * (drawWidth / totalFrames));
            const nextX = Math.floor((frame + 1) * (drawWidth / totalFrames));
            const isFullscreen = document.fullscreenElement && document.fullscreenElement.contains(this.spectrogramCanvas);
            const binStep = isFullscreen ? Math.max(1, Math.floor(data.length / 512)) : Math.max(1, Math.floor(data.length / 256));
            const heightStep = height / Math.ceil(data.length / binStep);
            let prevY = null;
            for (let i = 0, bin = 0; i < data.length; i += binStep, bin++) {
                let sum = 0;
                const samplesPerBin = Math.min(binStep, 4);
                for (let j = 0; j < samplesPerBin; j++) {
                    const idx = Math.min(data.length - 1, i + j * (binStep / samplesPerBin));
                    sum += data[idx];
                }
                const value = sum / samplesPerBin;
                let hue, saturation, lightness;
                if (value < 50) {
                    hue = 240;
                    saturation = 90;
                    lightness = 15 + (value / 50) * 25;
                } else if (value < 100) {
                    hue = 240 - ((value - 50) / 50) * 60;
                    saturation = 95;
                    lightness = 40 + ((value - 50) / 50) * 10;
                } else if (value < 150) {
                    hue = 180 - ((value - 100) / 50) * 60;
                    saturation = 100;
                    lightness = 50;
                } else if (value < 200) {
                    hue = 120 - ((value - 150) / 50) * 60;
                    saturation = 100;
                    lightness = 50;
                } else {
                    hue = 60 - ((value - 200) / 55) * 60;
                    saturation = 100;
                    lightness = 50;
                }
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                const logFreq = Math.log(1 + (i / data.length) * 20) / Math.log(21);
                const y = height * (1 - logFreq);
                // Interpolate horizontally between x and nextX to fill gaps
                for (let interpX = x; interpX < nextX; interpX++) {
                    if (prevY !== null) {
                        const yStart = Math.round(Math.min(prevY, y));
                        const yEnd = Math.round(Math.max(prevY, y));
                        for (let interpY = yStart; interpY <= yEnd; interpY++) {
                            ctx.fillRect(interpX, interpY, 1, 1);
                        }
                    } else {
                        ctx.fillRect(interpX, y, 1, heightStep + 0.5);
                    }
                }
                prevY = y;
            }
            prevX = x;
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
        let progress = 0;
        if (audioDuration && audioDuration > 0 && !isNaN(audioDuration) && audioDuration !== Infinity) {
            progress = Math.min(audioCurrentTime / audioDuration, 1);
        } else if (this.spectrogramHistory.length > 0) {
            const frameCount = this.spectrogramHistory.length;
            const estimatedDuration = frameCount * (this.animationInterval / 1000);
            if (estimatedDuration > 0) {
                progress = Math.min(audioCurrentTime / estimatedDuration, 1);
            }
        }
        if (isNaN(progress) || progress < 0) progress = 0;
        const drawWidth = width - (width * 0.08);
        const progressX = Math.round(progress * drawWidth);
        const shouldDraw = this.isPlayingBack && !audioEnded && audioReadyState >= 2;
        if (!shouldDraw) return;
        // Always redraw the static spectrogram for clean background
        this.drawStaticSpectrogram();
        // Draw red progress line with enhanced visibility
        ctx.save();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 2;
        ctx.beginPath();
        ctx.moveTo(progressX, 0);
        ctx.lineTo(progressX, height);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        this.lastProgressX = progressX;
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
        
        // Adjust drawing area to account for frequency markers (50px on right side)
        const drawWidth = width - (width * 0.08); // Reserve 8% of width for markers
        
        // More efficient scrolling - use image data manipulation
        const imageData = ctx.getImageData(1, 0, drawWidth - 1, height);
        ctx.putImageData(imageData, 0, 0);

        // Enhanced spectrogram with improved vertical detail
        const isFullscreen = document.fullscreenElement && 
                            document.fullscreenElement.contains(this.spectrogramCanvas);
                            
        // Adjust bin step based on fullscreen state for better detail
        const binStep = isFullscreen ? 
                       Math.max(1, Math.floor(data.length / 512)) : // Much higher detail in fullscreen
                       Math.max(1, Math.floor(data.length / 256));  // Increased from 128 for better detail
        
        // Calculate height step with fractional precision for smoother rendering
        const heightStep = height / Math.ceil(data.length / binStep);
        
        // Use Float32Array for higher precision calculations
        const melValues = new Float32Array(Math.ceil(data.length / binStep));
        
        // Apply logarithmic frequency scaling (Mel scale approximation)
        // for better representation of how humans perceive frequency
        // Interpolated log-frequency rendering to fill gaps
        let prevY = null, prevColor = null;
        for (let i = 0, bin = 0; i < data.length; i += binStep, bin++) {
            // Sample multiple points around the bin for smoother transitions
            let sum = 0;
            const samplesPerBin = Math.min(binStep, 4);
            for (let j = 0; j < samplesPerBin; j++) {
                const idx = Math.min(data.length - 1, i + j * (binStep / samplesPerBin));
                sum += data[idx];
            }
            const value = sum / samplesPerBin;
            const scaledValue = Math.pow(value / 255, 0.7) * 255;
            let hue, saturation, lightness;
            if (value < 50) {
                hue = 240;
                saturation = 90;
                lightness = 15 + (value / 50) * 25;
            } else if (value < 100) {
                hue = 240 - ((value - 50) / 50) * 60;
                saturation = 95;
                lightness = 40 + ((value - 50) / 50) * 10;
            } else if (value < 150) {
                hue = 180 - ((value - 100) / 50) * 60;
                saturation = 100;
                lightness = 50;
            } else if (value < 200) {
                hue = 120 - ((value - 150) / 50) * 60;
                saturation = 100;
                lightness = 50;
            } else {
                hue = 60 - ((value - 200) / 55) * 60;
                saturation = 100;
                lightness = 50;
            }
            const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            // Use logarithmic scaling for y-axis to better represent human hearing
            const logFreq = Math.log(1 + (i / data.length) * 20) / Math.log(21);
            const y = height * (1 - logFreq);
            if (prevY !== null) {
                // Interpolate between prevY and y, filling the vertical space
                const yStart = Math.round(Math.min(prevY, y));
                const yEnd = Math.round(Math.max(prevY, y));
                for (let interpY = yStart; interpY <= yEnd; interpY++) {
                    // Linear interpolation of color (optional: for now, use current color)
                    ctx.fillStyle = color;
                    ctx.fillRect(drawWidth - 1, interpY, 1, 1);
                }
            } else {
                ctx.fillStyle = color;
                ctx.fillRect(drawWidth - 1, y, 1, heightStep + 0.5);
            }
            prevY = y;
            prevColor = color;
        }        // Draw recording indicator line
        if (this.isRecording) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(drawWidth - 1, 0);
            ctx.lineTo(drawWidth - 1, height);
            ctx.stroke();
        }
        
        // Draw a subtle separator line for frequency markers
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(drawWidth + 5, 0);
        ctx.lineTo(drawWidth + 5, height);
        ctx.stroke();
    }
}

// Initialize when the document is loaded
// Wait for #micTestContainer to exist before initializing
function initMicTestWhenReady() {
    const container = document.getElementById('micTestContainer');
    if (container) {
        try {
            console.log('[MicTest] Initializing microphone test...');
            const micTest = new MicrophoneTest();
            micTest.showMic();
            console.log('[MicTest] Microphone test initialized.');
        } catch (e) {
            console.error('[MicTest] Error initializing microphone test:', e);
        }
    } else {
        console.log('[MicTest] Waiting for micTestContainer...');
        setTimeout(initMicTestWhenReady, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMicTestWhenReady();
});
