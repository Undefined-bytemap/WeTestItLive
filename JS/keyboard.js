// Perfect Keyboard Testing Implementation
// Dynamically scalable full keyboard with proper key mapping

// Key mapping for physical keyboard keys to visual keys
const keyMap = {
    // Function keys
    'Escape': 'ESC',
    'F1': 'F1', 'F2': 'F2', 'F3': 'F3', 'F4': 'F4', 'F5': 'F5', 'F6': 'F6',
    'F7': 'F7', 'F8': 'F8', 'F9': 'F9', 'F10': 'F10', 'F11': 'F11', 'F12': 'F12',
    
    // Number row
    'Backquote': '`',
    'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4', 'Digit5': '5',
    'Digit6': '6', 'Digit7': '7', 'Digit8': '8', 'Digit9': '9', 'Digit0': '0',
    'Minus': '-', 'Equal': '=', 'Backspace': 'BACKSPACE',
    
    // QWERTY row
    'Tab': 'TAB',
    'KeyQ': 'Q', 'KeyW': 'W', 'KeyE': 'E', 'KeyR': 'R', 'KeyT': 'T',
    'KeyY': 'Y', 'KeyU': 'U', 'KeyI': 'I', 'KeyO': 'O', 'KeyP': 'P',
    'BracketLeft': '[', 'BracketRight': ']', 'Backslash': '\\',
    
    // ASDF row
    'CapsLock': 'CAPS LOCK',
    'KeyA': 'A', 'KeyS': 'S', 'KeyD': 'D', 'KeyF': 'F', 'KeyG': 'G',
    'KeyH': 'H', 'KeyJ': 'J', 'KeyK': 'K', 'KeyL': 'L',
    'Semicolon': ';', 'Quote': "'", 'Enter': 'ENTER',
    
    // ZXCV row
    'ShiftLeft': 'SHIFT', 'ShiftRight': 'SHIFT',
    'KeyZ': 'Z', 'KeyX': 'X', 'KeyC': 'C', 'KeyV': 'V', 'KeyB': 'B',
    'KeyN': 'N', 'KeyM': 'M', 'Comma': ',', 'Period': '.', 'Slash': '/',
    
    // Space row
    'ControlLeft': 'CTRL', 'ControlRight': 'CTRL',
    'MetaLeft': 'WIN',
    'AltLeft': 'ALT', 'AltRight': 'ALT',
    'Space': 'SPACE',
    'ContextMenu': 'MENU',
    
    // Arrow keys
    'ArrowUp': '↑',
    'ArrowLeft': '←',
    'ArrowDown': '↓',
    'ArrowRight': '→'
};

// Debug function to log unmapped keys
function logUnmappedKey(keyCode) {
    console.log(`Unmapped key pressed: ${keyCode}`);
}

// Function to find key element by text content and position
function findKeyElement(keyText, isRightSide = false) {
    const keys = document.querySelectorAll('.key');
    const matchingKeys = [];
    
    for (let key of keys) {
        // Handle keys with line breaks (like number row keys with symbols)
        const keyContent = key.textContent.trim();
        const keyHTML = key.innerHTML.trim();
        
        // Check for exact match first
        if (keyContent === keyText) {
            matchingKeys.push(key);
            continue;
        }
        
        // Check if this is a symbol key with <br> tags
        if (keyHTML.includes('<br>')) {
            // Extract the first part (main key) and second part (shift key)
            const parts = keyHTML.split('<br>');
            const mainKey = parts[0].trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
            const shiftKey = parts[1] ? parts[1].trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
            
            if (mainKey === keyText || shiftKey === keyText) {
                matchingKeys.push(key);
                continue;
            }
        }
        
        // Check if the first line matches (for multi-line keys)
        const firstLine = keyContent.split('\n')[0].trim();
        if (firstLine === keyText) {
            matchingKeys.push(key);
        }
    }
    
    // If we have multiple matches (like left/right Alt or Ctrl), determine which one based on position
    if (matchingKeys.length > 1) {
        // For keys that appear twice (Alt, Ctrl, Shift), the second occurrence is typically on the right
        if (isRightSide) {
            return matchingKeys[matchingKeys.length - 1]; // Return the last (rightmost) match
        } else {
            return matchingKeys[0]; // Return the first (leftmost) match
        }
    }
    
    return matchingKeys[0] || null;
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
        // Determine if this is a right-side key
        const isRightSide = keyCode.includes('Right');
        const keyElement = findKeyElement(mappedKey, isRightSide);
        
        if (keyElement && !keyElement.classList.contains('pressed')) {
            keyElement.classList.add('pressed');
            keyElement.classList.remove('tested'); // Remove tested state while pressed
        }
    } else {
        // Log unmapped keys for debugging
        logUnmappedKey(keyCode);
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
        // Determine if this is a right-side key
        const isRightSide = keyCode.includes('Right');
        const keyElement = findKeyElement(mappedKey, isRightSide);
        
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
          if(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].indexOf(event.code) > -1) {
            event.preventDefault();
        }
    }, false);
    
    // Make reset function globally available
    window.resetKeyboard = resetKeyboard;
});
