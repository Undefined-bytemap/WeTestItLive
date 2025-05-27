document.addEventListener('DOMContentLoaded', function() {
    // Function to remove the JavaScript disabled message
    function hideJsDisabledMessage() {
        const jsDisabledMessage = document.getElementById('javascript-disabled-message');
        if (jsDisabledMessage) {
            jsDisabledMessage.style.display = 'none';
        }
    }

    // Run the function as soon as the DOM is loaded
    hideJsDisabledMessage();
});
