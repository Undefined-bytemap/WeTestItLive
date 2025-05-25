class PixelTest {
    constructor() {
        this.pixelGrid = document.getElementById('pixelTestContainer');
        this.testButton = document.getElementById('testPixelBtn');
        this.isShowingPixel = false;
        this.currentColor = 'red';
        this.colors = ['red', 'green', 'blue'];
        this.colorIndex = 0;
        this.isTransitioning = false;
        
        this.testButton.addEventListener('click', () => this.togglePixel());
    }

    togglePixel() {
        if (this.isShowingPixel) {
            this.hidePixel();
        } else {
            this.showPixel();
        }
    }

    showPixel() {
        this.createPixelInterface();
        this.pixelGrid.style.display = 'block';
        this.testButton.style.background = '#1e3c72';
        this.isShowingPixel = true;
    }

    hidePixel() {
        this.pixelGrid.innerHTML = '';
        this.pixelGrid.style.display = 'none';
        this.testButton.style.background = '#2a5298';
        this.isShowingPixel = false;
    }    async changeColor(testArea) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.colorIndex = (this.colorIndex + 1) % this.colors.length;
        this.currentColor = this.colors[this.colorIndex];
        testArea.style.backgroundColor = this.currentColor;
        
        // Short delay to prevent rapid changes
        await new Promise(resolve => setTimeout(resolve, 150));
        this.isTransitioning = false;
    }

    createPixelInterface() {
        this.pixelGrid.innerHTML = '';

        const testArea = document.createElement('div');
        testArea.className = 'pixel-test-area';
        testArea.style.backgroundColor = this.currentColor;
        testArea.style.opacity = '1';
        
        // Add fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'fullscreen-btn';
        fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
        
        testArea.appendChild(fullscreenBtn);
        this.pixelGrid.appendChild(testArea);

        // Event handlers
        testArea.addEventListener('click', async (e) => {
            if (e.target === fullscreenBtn) return; // Don't change color when clicking fullscreen
            await this.changeColor(testArea);
        });        fullscreenBtn.addEventListener('click', () => {
            if (testArea.requestFullscreen) {
                testArea.requestFullscreen();
            } else if (testArea.webkitRequestFullscreen) {
                testArea.webkitRequestFullscreen();
            } else if (testArea.msRequestFullscreen) {
                testArea.msRequestFullscreen();
            }
            
            // Hide button after going fullscreen
            fullscreenBtn.style.display = 'none';
        });

        // Show button again when exiting fullscreen
        document.addEventListener('fullscreenchange', () => {
            if (!document.fullscreenElement) {
                fullscreenBtn.style.display = 'flex';
            }
        });

        document.addEventListener('webkitfullscreenchange', () => {
            if (!document.webkitFullscreenElement) {
                fullscreenBtn.style.display = 'flex';
            }
        });

        document.addEventListener('msfullscreenchange', () => {
            if (!document.msFullscreenElement) {
                fullscreenBtn.style.display = 'flex';
            }
        });
    }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PixelTest();
});