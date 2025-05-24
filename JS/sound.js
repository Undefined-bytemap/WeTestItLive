class SoundTest {    constructor() {
        this.audioContext = null;
        this.devices = [];
        this.selectedDevice = null;        
        this.lickProgress = 0;
        this.lastClickTime = 0;
        this.hasPlayedLick = false;
        this.isShowingSound = false;
        this.soundGrid = document.getElementById('soundTestContainer');
        this.testButton = document.getElementById('testSoundBtn');
        this.testButton.addEventListener('click', () => this.toggleSound());
        
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
    }

    createSoundInterface() {
        this.soundGrid.innerHTML = '';        // Create device select
        const deviceSelect = document.createElement('div');
        deviceSelect.className = 'device-select';
        
        const label = document.createElement('label');
        label.htmlFor = 'audioDeviceSelect';
        label.textContent = 'Audio Output Device:';
        
        this.deviceSelect = document.createElement('select');
        this.deviceSelect.id = 'audioDeviceSelect';
        
        deviceSelect.appendChild(label);
        deviceSelect.appendChild(this.deviceSelect);

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
        this.testButton.textContent = 'Stop Sound Test';
        this.isShowingSound = true;
    }

    hideSound() {
        this.soundGrid.innerHTML = '';
        this.soundGrid.style.display = 'none';
        this.testButton.textContent = 'Test Sound';
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
            this.devices = devices.filter(device => device.kind === 'audiooutput');
            
            this.deviceSelect.innerHTML = '';
            
            // Add default device first
            const defaultOption = document.createElement('option');
            defaultOption.value = 'default';
            defaultOption.text = 'Default - ' + (this.devices.find(d => d.deviceId === 'default')?.label || 'System Audio');
            this.deviceSelect.appendChild(defaultOption);
            
            // Add other devices
            this.devices
                .filter(device => device.deviceId !== 'default')
                .forEach(device => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `Audio Device ${this.devices.indexOf(device) + 1}`;
                    this.deviceSelect.appendChild(option);
                });

            // Add device selection handler
            this.deviceSelect.addEventListener('change', () => {
                this.selectedDevice = this.deviceSelect.value;
                if (this.audioContext) {
                    this.audioContext.setSinkId?.(this.selectedDevice).catch(console.error);
                }
            });
            
        } catch (error) {
            console.warn('Could not enumerate audio devices:', error);
            this.deviceSelect.innerHTML = '<option value="default">System Default Audio</option>';
        }
    }    stopSound() {
        if (this.activeOscillator) {
            this.activeOscillator.stop();
            this.activeOscillator = null;
        }
    }

    async initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    async playTest(channel) {
        await this.initAudio();
        
        const now = Date.now();
        if (now - this.lastClickTime > 2000) {
            this.lickProgress = 0;
        }
        this.lastClickTime = now;

        this.stopSound();        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const stereoPanner = this.audioContext.createStereoPanner();

        oscillator.connect(gainNode);
        gainNode.connect(stereoPanner);
        stereoPanner.connect(this.audioContext.destination);
        
        stereoPanner.pan.value = channel === 'left' ? -1 : 1;
        
        if (!this.hasPlayedLick && this.lickProgress < this.lickNotes.length) {
            oscillator.frequency.value = this.noteFrequencies[this.lickNotes[this.lickProgress].note];
            this.lickProgress++;
            if (this.lickProgress >= this.lickNotes.length) {
                this.hasPlayedLick = true;
            }
        } else {
            oscillator.frequency.value = parseFloat(this.freqSlider.value);
        }
          oscillator.type = 'sine';
        this.activeOscillator = oscillator;
        oscillator.start();
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SoundTest();
});
