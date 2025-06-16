// Perfect Keyboard Testing Implementation
// Dynamically scalable 60% keyboard with proper key mapping

// Key mapping for physical keyboard keys to visual keys
const keyMap = {
    'Escape': 'Esc',
    'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5',
    'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
    'Minus': '-', 'Equal': '=', 'Backspace': 'Backspace',
    'Tab': 'Tab',
    'KeyQ': 'Q', 'KeyW': 'W', 'KeyE': 'E', 'KeyR': 'R', 'KeyT': 'T',
    'KeyY': 'Y', 'KeyU': 'U', 'KeyI': 'I', 'KeyO': 'O', 'KeyP': 'P',
    'BracketLeft': '[', 'BracketRight': ']', 'Backslash': '\\',
    'CapsLock': 'Caps Lock',
    'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D', 'KeyF': 'F', 'KeyG': 'G',
    'KeyH': 'H', 'KeyJ': 'J', 'KeyK': 'K', 'KeyL': 'L',
    'Semicolon': ';', 'Quote': "'", 'Enter': 'Enter',
    'ShiftLeft': 'Shift', 'ShiftRight': 'Shift',
    'KeyZ': 'Z', 'KeyX': 'X', 'KeyC': 'C', 'KeyV': 'V', 'KeyB': 'B',
    'KeyN': 'N', 'KeyM': 'M', 'Comma': ',', 'Period': '.', 'Slash': '/',
    'ControlLeft': 'Ctrl', 'ControlRight': 'Ctrl',
    'MetaLeft': 'Win', 'MetaRight': 'Win',
    'AltLeft': 'Alt', 'AltRight': 'Alt',
    'Space': 'Space',
    'ContextMenu': 'Menu'
};

// Function to find key element by text content
function findKeyElement(keyText) {
    const keys = document.querySelectorAll('.key');
    for (let key of keys) {
        if (key.textContent.trim() === keyText) {
            return key;
        }
    }
    return null;
}

// Handle key press (down)
function handleKeyDown(event) {
    // Check if feedback modal is open or if focus is on an input/textarea
    const feedbackModal = document.getElementById('feedbackModal');
    const isModalOpen = feedbackModal && feedbackModal.style.display !== 'none';
    const isInputFocused = document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA' || 
         document.activeElement.contentEditable === 'true');
    
    // Don't capture keyboard events if modal is open or input is focused
    if (isModalOpen || isInputFocused) {
        return;
    }
    
    event.preventDefault(); // Prevent default browser behavior
    
    const keyCode = event.code;
    const mappedKey = keyMap[keyCode];
    
    if (mappedKey) {
        const keyElement = findKeyElement(mappedKey);
        if (keyElement && !keyElement.classList.contains('pressed')) {
            keyElement.classList.add('pressed');
            keyElement.classList.remove('tested'); // Remove tested state while pressed
        }
    }
}

// Handle key release (up)
function handleKeyUp(event) {
    // Check if feedback modal is open or if focus is on an input/textarea
    const feedbackModal = document.getElementById('feedbackModal');
    const isModalOpen = feedbackModal && feedbackModal.style.display !== 'none';
    const isInputFocused = document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || 
         document.activeElement.tagName === 'TEXTAREA' || 
         document.activeElement.contentEditable === 'true');
    
    // Don't capture keyboard events if modal is open or input is focused
    if (isModalOpen || isInputFocused) {
        return;
    }
    
    const keyCode = event.code;
    const mappedKey = keyMap[keyCode];
    
    if (mappedKey) {
        const keyElement = findKeyElement(mappedKey);
        if (keyElement) {
            keyElement.classList.remove('pressed');
            keyElement.classList.add('tested'); // Mark as tested after release
        }
    }
}

// Reset all keys to untested state
function resetKeyboard() {
    document.querySelectorAll('.key').forEach(key => {
        key.classList.remove('pressed', 'tested');
    });
}

// Initialize keyboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Add focus to the document to ensure key events are captured
    document.body.focus();
    document.body.setAttribute('tabindex', '0');
      // Prevent page scrolling with arrow keys and spacebar (but only when not in input fields)
    document.addEventListener('keydown', function(event) {
        // Check if feedback modal is open or if focus is on an input/textarea
        const feedbackModal = document.getElementById('feedbackModal');
        const isModalOpen = feedbackModal && feedbackModal.style.display !== 'none';
        const isInputFocused = document.activeElement && 
            (document.activeElement.tagName === 'INPUT' || 
             document.activeElement.tagName === 'TEXTAREA' || 
             document.activeElement.contentEditable === 'true');
        
        // Don't prevent default if modal is open or input is focused
        if (isModalOpen || isInputFocused) {
            return;
        }
        
        if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.code) > -1) {
            event.preventDefault();
        }
    }, false);
    
    // Make reset function globally available
    window.resetKeyboard = resetKeyboard;
});
