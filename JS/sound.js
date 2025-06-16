class SoundTest {
    constructor() {
        this.audioContext = null;
        this.devices = [];
        this.selectedDevice = null;        
        this.lickProgress = 0;
        this.lastClickTime = 0;
        this.hasPlayedLick = false;
        this.isShowingSound = true; // Always expanded
        this.activeOscillator = null;
        this.activeGainNode = null;
        this.soundGrid = document.getElementById('soundTestContainer');
        // Remove button logic: don't look for or use testButton
        this.lickNotes = [
            { note: 'D4' }, // duh
            { note: 'E4' }, // na
            { note: 'F4' }, // na
            { note: 'G4' }, // na
            { note: 'E4' }, // naaa
            { note: 'C4' }, // na
            { note: 'D4' }  // na
        ];
        this.noteFrequencies = {
            'C4': 261.63,
            'D4': 293.66,
            'E4': 329.63,
            'F4': 349.23,
            'G4': 392.00
        };
        this.animationFrame = null;
        // Always show sound interface on load
        this.showSound();
    }

    createSoundInterface() {
        this.soundGrid.innerHTML = '';
        // Only create the device select dropdown ONCE, not in setupAudioDevices
        const deviceSelect = document.createElement('div');
        deviceSelect.className = 'device-select';
        const label = document.createElement('label');
        label.htmlFor = 'audioDeviceSelect';
        label.textContent = 'Audio Output Device:';
        this.deviceSelect = document.createElement('select');
        this.deviceSelect.id = 'audioDeviceSelect';
        this.deviceSelect.className = 'audio-device-select';
        deviceSelect.appendChild(label);
        deviceSelect.appendChild(this.deviceSelect);
        this.soundGrid.appendChild(deviceSelect);
        // Create frequency control
        const freqControl = document.createElement('div');
        freqControl.className = 'freq-control';
        
        const freqLabel = document.createElement('label');
        freqLabel.htmlFor = 'frequencySlider';
        freqLabel.textContent = 'Test Tone Frequency: 440 Hz';
        
        this.freqSlider = document.createElement('input');
        this.freqSlider.type = 'range';
        this.freqSlider.id = 'frequencySlider';
        this.freqSlider.min = '20';
        this.freqSlider.max = '2000';
        this.freqSlider.value = '440';
        
        this.freqSlider.addEventListener('input', () => {
            freqLabel.textContent = `Test Tone Frequency: ${this.freqSlider.value} Hz`;
        });
        
        freqControl.appendChild(freqLabel);
        freqControl.appendChild(this.freqSlider);        // Create speaker grid
        const speakerGrid = document.createElement('div');
        speakerGrid.className = 'speaker-grid';
        
        const leftBtn = document.createElement('button');
        leftBtn.id = 'testLeftBtn';
        leftBtn.className = 'speaker-btn left';
        leftBtn.textContent = 'Test Left Speaker';
        
        const rightBtn = document.createElement('button');
        rightBtn.id = 'testRightBtn';
        rightBtn.className = 'speaker-btn right';
        rightBtn.textContent = 'Test Right Speaker';
        
        speakerGrid.appendChild(leftBtn);
        speakerGrid.appendChild(rightBtn);
          // Add to container        this.soundGrid.appendChild(deviceSelect);
        this.soundGrid.appendChild(freqControl);
        this.soundGrid.appendChild(speakerGrid);
          // Setup event handlers
        this.setupAudioDevices();
        this.setupSpeakerButtons();
    }

    toggleSound() {
        if (this.isShowingSound) {
            this.hideSound();
        } else {
            this.showSound();
        }
    }

    showSound() {
        this.createSoundInterface();
        this.soundGrid.style.display = 'block';
        this.isShowingSound = true;
    }

    hideSound() {
        this.soundGrid.innerHTML = '';
        this.soundGrid.style.display = 'none';
        this.isShowingSound = false;
        this.stopSound();
    }

    setupSpeakerButtons() {
        const setupButton = (buttonId, channel) => {
            const button = document.getElementById(buttonId);
            const startSound = () => this.playTest(channel);
            const stopSound = () => this.stopSound();

            // Mouse events
            button.addEventListener('mousedown', startSound);
            button.addEventListener('mouseup', stopSound);
            button.addEventListener('mouseleave', stopSound);

            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startSound();
            });
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                stopSound();
            });
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                stopSound();
            });
        };

        setupButton('testLeftBtn', 'left');
        setupButton('testRightBtn', 'right');
    }    async setupAudioDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.warn('Audio device enumeration not supported');
            return;
        }

        try {
            // Request microphone permission to get device labels
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            const outputDevices = devices.filter(device => device.kind === 'audiooutput');
            
            // Clear previous options
            this.deviceSelect.innerHTML = '';
            
            // Add default device first
            const defaultOption = document.createElement('option');
            defaultOption.value = 'default';
            defaultOption.text = 'Default - ' + (outputDevices.find(d => d.deviceId === 'default')?.label || 'System Audio');
            this.deviceSelect.appendChild(defaultOption);
            
            // Add other output devices
            outputDevices
                .filter(device => device.deviceId !== 'default')
                .forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `Audio Device ${outputDevices.indexOf(device) + 1}`;
                    this.deviceSelect.appendChild(option);
                });

            // Add device selection handler
            this.deviceSelect.addEventListener('change', () => {
                this.selectedDevice = this.deviceSelect.value;
                if (this.audioContext) {
                    // Try to switch audio output if supported
                    const audioElement = document.createElement('audio');
                    if (audioElement.setSinkId) {
                        this.audioContext.setSinkId?.(this.selectedDevice).catch(console.error);
                    } else {
                        console.warn('Audio output device selection not supported in this browser');
                    }
                }
            });
            
        } catch (error) {
            console.warn('Could not enumerate audio devices:', error);
            this.deviceSelect.innerHTML = '<option value="default">System Default Audio</option>';
        }
    }    stopSound() {
        if (this.activeOscillator && this.activeGainNode) {
            // Quick fade-out to prevent click on stop
            const currentTime = this.audioContext.currentTime;
            this.activeGainNode.gain.cancelScheduledValues(currentTime);
            this.activeGainNode.gain.setValueAtTime(this.activeGainNode.gain.value, currentTime);
            this.activeGainNode.gain.linearRampToValueAtTime(0, currentTime + 0.01); // Very quick 10ms fade-out
            
            // Stop oscillator after fade-out completes
            this.activeOscillator.stop(currentTime + 0.01);
            this.activeOscillator = null;
            this.activeGainNode = null;
        }
    }

    async initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }    async playTest(channel) {
        await this.initAudio();
        
        const now = Date.now();
        if (now - this.lastClickTime > 2000) {
            this.lickProgress = 0;
        }
        this.lastClickTime = now;

        this.stopSound();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const stereoPanner = this.audioContext.createStereoPanner();

        oscillator.connect(gainNode);
        gainNode.connect(stereoPanner);
        stereoPanner.connect(this.audioContext.destination);
        
        stereoPanner.pan.value = channel === 'left' ? -1 : 1;
        
        let frequency;
        if (!this.hasPlayedLick && this.lickProgress < this.lickNotes.length) {
            frequency = this.noteFrequencies[this.lickNotes[this.lickProgress].note];
            this.lickProgress++;
            if (this.lickProgress >= this.lickNotes.length) {
                this.hasPlayedLick = true;
            }
        } else {
            frequency = parseFloat(this.freqSlider.value);
        }

        oscillator.frequency.value = frequency;        oscillator.type = 'sine';
        
        // Start at zero-crossing to prevent crackling
        const currentTime = this.audioContext.currentTime;
        
        // Set gain immediately - no crackling since sine wave starts at zero-crossing
        gainNode.gain.setValueAtTime(0.3, currentTime);
        
        // Store references for clean stop
        this.activeOscillator = oscillator;
        this.activeGainNode = gainNode;
        
        // Start oscillator immediately - sine wave naturally starts at zero amplitude
        oscillator.start(currentTime);
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SoundTest();
});
