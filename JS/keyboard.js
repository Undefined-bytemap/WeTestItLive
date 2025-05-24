class KeyboardManager {
    constructor() {
        this.keyboardGrid = document.getElementById('keyboardGrid');
        this.testButton = document.getElementById('testKeyboardBtn');
        this.isShowingKeyboard = false;
        this.keyElements = new Map();
        
        this.testButton.addEventListener('click', () => this.toggleKeyboard());
        this.setupKeyboardEvents();
    }

    toggleKeyboard() {
        if (this.isShowingKeyboard) {
            this.hideKeyboard();
        } else {
            this.showKeyboard();
        }
    }

    showKeyboard() {
        this.createKeyboardLayout();
        this.keyboardGrid.style.display = 'block';
        this.testButton.textContent = 'Stop Keyboard Test';
        this.isShowingKeyboard = true;
    }

    hideKeyboard() {
        this.keyboardGrid.style.display = 'none';
        this.testButton.textContent = 'Test Keyboard';
        this.isShowingKeyboard = false;
        this.keyElements.clear();
    }

    createKeyboardLayout() {
        this.keyboardGrid.innerHTML = '';
        const layouts = [
            ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
            ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
            ['Caps Lock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
            ['Left Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Right Shift'],
            ['Left Ctrl', 'Left Win', 'Left Alt', 'Space', 'Right Alt', 'Right Win', 'Menu', 'Right Ctrl'],
            ['', '', '↑', '', '', '', '', ''],  // Arrow keys row
            ['', '←', '↓', '→', '', '', '', '']  // Arrow keys row
        ];

        layouts.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';

            row.forEach(key => {
                if (!key) return; // Skip empty spots in arrow key rows
                
                const keyElement = document.createElement('div');
                keyElement.className = 'key';
                
                // Special class handling
                if (key === 'Space') keyElement.className += ' spacebar';
                else if (['Backspace', 'Enter', 'Left Shift', 'Right Shift', 'Caps Lock'].includes(key)) 
                    keyElement.className += ' extra-wide';
                else if (['Tab', 'Left Ctrl', 'Right Ctrl', 'Left Alt', 'Right Alt', 'Left Win', 'Right Win'].includes(key)) 
                    keyElement.className += ' wide';
                else if (['↑', '↓', '←', '→'].includes(key))
                    keyElement.className += ' arrow-key';
                
                keyElement.textContent = key === 'Space' ? '' : key;
                
                // Handle arrow keys mapping
                let dataKey = key.toLowerCase();
                if (key === '↑') dataKey = 'arrowup';
                if (key === '↓') dataKey = 'arrowdown';
                if (key === '←') dataKey = 'arrowleft';
                if (key === '→') dataKey = 'arrowright';
                
                keyElement.dataset.key = dataKey;
                this.keyElements.set(dataKey, keyElement);
                rowDiv.appendChild(keyElement);
            });

            this.keyboardGrid.appendChild(rowDiv);
        });
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.isShowingKeyboard) return;
            
            const keyName = this.normalizeKeyName(e.code);
            const element = this.keyElements.get(keyName);
            
            if (element) {
                // Remove the released class if it exists
                element.classList.remove('released');
                // Add pressed class for the dark blue color and movement
                element.classList.add('pressed');
            }
            e.preventDefault();
        });

        document.addEventListener('keyup', (e) => {
            if (!this.isShowingKeyboard) return;
            
            const keyName = this.normalizeKeyName(e.code);
            const element = this.keyElements.get(keyName);
            
            if (element) {
                // Remove pressed class
                element.classList.remove('pressed');
                // Add released class for the light blue color
                element.classList.add('released');
            }
            e.preventDefault();
        });
    }

    normalizeKeyName(code) {
        // Handle number keys
        if (code.match(/Digit\d/)) {
            return code.replace('Digit', '');
        }
        
        // Handle special characters
        const specialChars = {
            'Minus': '-',
            'Equal': '=',
            'BracketLeft': '[',
            'BracketRight': ']',
            'Backslash': '\\',
            'Semicolon': ';',
            'Quote': "'",
            'Comma': ',',
            'Period': '.',
            'Slash': '/',
            'Backquote': '`',
            'ArrowUp': 'arrowup',
            'ArrowDown': 'arrowdown',
            'ArrowLeft': 'arrowleft',
            'ArrowRight': 'arrowright'
        };

        if (specialChars[code]) {
            return specialChars[code];
        }

        switch (code) {
            case 'Space': return 'space';
            case 'Backspace': return 'backspace';
            case 'CapsLock': return 'caps lock';
            case 'ShiftLeft': return 'left shift';
            case 'ShiftRight': return 'right shift';
            case 'ControlLeft': return 'left ctrl';
            case 'ControlRight': return 'right ctrl';
            case 'AltLeft': return 'left alt';
            case 'AltRight': return 'right alt';
            case 'MetaLeft': return 'left win';
            case 'MetaRight': return 'right win';
            case 'Enter': return 'enter';
            case 'Tab': return 'tab';
            default: return code.replace('Key', '').toLowerCase();
        }
    }
}

// Initialize the keyboard manager when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KeyboardManager();
});
