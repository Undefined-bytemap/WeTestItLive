// Network and WiFi Test Implementation
class NetworkTest {
    constructor() {
        this.networkGrid = document.getElementById('networkTestContainer');
        this.testButton = document.getElementById('testNetworkBtn');
        this.isShowingNetwork = false;
        this.connectionInfo = null;
        this.updateInterval = null;
        
        this.testButton.addEventListener('click', () => this.toggleNetwork());
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.updateOnlineStatus(true));
        window.addEventListener('offline', () => this.updateOnlineStatus(false));
    }

    toggleNetwork() {
        if (this.isShowingNetwork) {
            this.hideNetwork();
        } else {
            this.showNetwork();
        }
    }

    showNetwork() {
        this.createNetworkInterface();
        this.networkGrid.style.display = 'block';
        this.testButton.textContent = 'Stop Network Test';
        this.isShowingNetwork = true;
        
        // Start continuous updates
        this.startNetworkMonitoring();
    }

    hideNetwork() {
        this.networkGrid.style.display = 'none';
        this.testButton.textContent = 'Test Network & WiFi';
        this.isShowingNetwork = false;
        
        // Stop monitoring
        this.stopNetworkMonitoring();
    }createNetworkInterface() {
        this.networkGrid.innerHTML = '';

        // Info Note Section
        const noteSection = document.createElement('div');
        noteSection.className = 'network-note';
        noteSection.textContent = 'I dont Currently have a backend that can support a true speed test. The following information is gathered from the browser\'s Network Information API and may not reflect actual internet speed.';

        // Connection Status Section
        const statusSection = document.createElement('div');
        statusSection.className = 'network-test-area';
        statusSection.innerHTML = `
            <h3>Connection Status</h3>
            <div class="connection-info">
                <div class="info-item">
                    <span>Online Status:</span>
                    <span id="onlineStatus">${navigator.onLine ? 'Online' : 'Offline'}</span>
                </div>
                <div class="info-item">
                    <span>Connection Type:</span>
                    <span id="connectionType">Checking...</span>
                </div>
                <div class="info-item">
                    <span>Effective Type:</span>
                    <span id="effectiveType">Checking...</span>
                </div>
                <div class="info-item">
                    <span>Downlink Speed:</span>
                    <span id="downlinkSpeed">Checking...</span>
                </div>
                <div class="info-item">
                    <span>Round Trip Time:</span>
                    <span id="rttValue">Checking...</span>
                </div>
                <div class="info-item">
                    <span>Data Saver:</span>
                    <span id="dataSaver">Checking...</span>
                </div>
            </div>
        `;

        this.networkGrid.appendChild(noteSection);
        this.networkGrid.appendChild(statusSection);
    }

    startNetworkMonitoring() {
        this.updateConnectionInfo();
        
        // Update connection info every 2 seconds
        this.updateInterval = setInterval(() => {
            this.updateConnectionInfo();
        }, 2000);
    }    stopNetworkMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }    updateConnectionInfo() {
        if (!this.isShowingNetwork) return;

        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            document.getElementById('connectionType').textContent = connection.type || 'Unknown';
            document.getElementById('effectiveType').textContent = connection.effectiveType || 'Unknown';
            document.getElementById('downlinkSpeed').textContent = connection.downlink ? `${connection.downlink} Mbps` : 'Unknown';
            document.getElementById('rttValue').textContent = connection.rtt ? `${connection.rtt} ms` : 'Unknown';
            document.getElementById('dataSaver').textContent = connection.saveData ? 'Enabled' : 'Disabled';
        } else {
            document.getElementById('connectionType').textContent = 'API not supported';
            document.getElementById('effectiveType').textContent = 'API not supported';
            document.getElementById('downlinkSpeed').textContent = 'API not supported';
            document.getElementById('rttValue').textContent = 'API not supported';
            document.getElementById('dataSaver').textContent = 'API not supported';
        }
    }    updateOnlineStatus(isOnline) {
        if (this.isShowingNetwork) {
            const statusElement = document.getElementById('onlineStatus');
            if (statusElement) {
                statusElement.textContent = isOnline ? 'Online' : 'Offline';
                statusElement.style.color = isOnline ? '#4caf50' : '#f44336';
            }
        }
    }
}

// Initialize the network test when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NetworkTest();
});