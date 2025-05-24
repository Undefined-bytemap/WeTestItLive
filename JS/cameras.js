class CameraManager {
    constructor() {
        this.cameraGrid = document.getElementById('cameraGrid');
        this.testButton = document.getElementById('testCamerasBtn');
        this.activeStreams = new Map(); // Track active camera streams
        this.isShowingCameras = false;
        
        this.testButton.addEventListener('click', () => this.toggleCameras());
    }    async toggleCameras() {
        if (this.isShowingCameras) {
            this.hideCameras();
            return;
        }
        
        try {
            this.testButton.textContent = 'Loading cameras...';
            document.querySelector('.permission-note').style.display = 'block';
            // Get list of all available media devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            // Clear existing streams
            this.stopAllStreams();
            this.cameraGrid.innerHTML = '';

            // Start streams for each camera
            const promises = videoDevices.map(device => this.addCameraStream(device));            await Promise.all(promises);

            if (videoDevices.length === 0) {
                this.showMessage('No cameras detected');
                this.testButton.textContent = 'Test Cameras';
            } else {
                this.testButton.textContent = 'Stop Camera Test';
                this.isShowingCameras = true;
            }
        } catch (error) {
            console.error('Error accessing cameras:', error);
            this.showMessage('Error accessing cameras. Please ensure you have granted camera permissions.');
        }
    }

    async addCameraStream(device) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: device.deviceId }
            });            const wrapper = document.createElement('div');
            wrapper.className = 'camera-wrapper';

            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = stream;
            
            const label = document.createElement('div');
            label.className = 'camera-label';
            label.textContent = device.label || `Camera ${this.activeStreams.size}`;

            wrapper.appendChild(video);
            wrapper.appendChild(label);
            this.cameraGrid.appendChild(wrapper);
            
            this.activeStreams.set(device.deviceId, stream);
        } catch (error) {
            console.error(`Error setting up camera ${device.deviceId}:`, error);
        }
    }    hideCameras() {
        this.stopAllStreams();
        this.cameraGrid.innerHTML = '';
        this.testButton.textContent = 'Test Cameras';
        this.isShowingCameras = false;
        document.querySelector('.permission-note').style.display = 'none';
    }

    stopAllStreams() {
        this.activeStreams.forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });
        this.activeStreams.clear();
    }

    showMessage(message) {
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
