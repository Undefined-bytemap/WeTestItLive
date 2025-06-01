class CameraManager {
    constructor() {
        this.cameraGrid = document.getElementById('cameraGrid');
        this.activeStreams = new Map(); // Track active camera streams
        this.detectionInterval = null;
        this.knownDevices = new Set(); // Track known camera device IDs
        
        // Auto-start cameras on page load
        this.startCameras();
    }

    async startCameras() {
        try {
            // Only attempt to modify DOM elements if they exist
            if (this.cameraGrid) {
                this.cameraGrid.style.display = 'grid';
            }
            
            const permissionNote = document.querySelector('.permission-note');
            if (permissionNote) {
                permissionNote.style.display = 'block';
            }
            
            await this.detectAndAddCameras();
            
            // Start continuous detection every second
            this.detectionInterval = setInterval(() => {
                this.detectAndAddCameras();
            }, 1000);
        } catch (error) {
            console.error('Error accessing cameras:', error);
            // Only show message if we can
            if (this.cameraGrid) {
                this.showMessage('Error accessing cameras. Please ensure you have granted camera permissions.');
            }
        }
    }

    async detectAndAddCameras() {
        try {
            // Get list of all available media devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            // Check for new cameras
            for (const device of videoDevices) {
                if (!this.knownDevices.has(device.deviceId) && !this.activeStreams.has(device.deviceId)) {
                    this.knownDevices.add(device.deviceId);
                    await this.addCameraStream(device);
                }
            }

            // Remove cameras that are no longer available
            const currentDeviceIds = new Set(videoDevices.map(d => d.deviceId));
            for (const [deviceId, stream] of this.activeStreams) {
                if (!currentDeviceIds.has(deviceId)) {
                    stream.getTracks().forEach(track => track.stop());
                    this.activeStreams.delete(deviceId);
                    this.knownDevices.delete(deviceId);
                    // Remove the video element from DOM
                    const videoElement = this.cameraGrid.querySelector(`[data-device-id="${deviceId}"]`);
                    if (videoElement) {
                        videoElement.remove();
                    }
                }
            }

            if (videoDevices.length === 0 && this.cameraGrid.children.length === 0) {
                this.showMessage('No cameras detected');
            }
        } catch (error) {
            console.error('Error detecting cameras:', error);
        }
    }    async addCameraStream(device) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: device.deviceId }
            });

            // Only add to DOM if we have a container
            if (this.cameraGrid) {
                const wrapper = document.createElement('div');
                wrapper.className = 'camera-wrapper';
                wrapper.setAttribute('data-device-id', device.deviceId);

                const video = document.createElement('video');
                video.autoplay = true;
                video.playsInline = true;
                video.srcObject = stream;
                
                const label = document.createElement('div');
                label.className = 'camera-label';
                label.textContent = device.label || `Camera ${this.activeStreams.size + 1}`;

                wrapper.appendChild(video);
                wrapper.appendChild(label);
                this.cameraGrid.appendChild(wrapper);
            }
            
            this.activeStreams.set(device.deviceId, stream);
        } catch (error) {
            console.error(`Error setting up camera ${device.deviceId}:`, error);
        }
    }

    showMessage(message) {
        // Only attempt to show message if we have a container
        if (!this.cameraGrid) {
            console.log('Message (no UI):', message);
            return;
        }
        const messageElement = document.createElement('div');
        messageElement.className = 'camera-message';
        messageElement.textContent = message;
        this.cameraGrid.appendChild(messageElement);
    }
}

// Initialize the camera manager when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CameraManager();
});
