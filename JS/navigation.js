// Navigation functionality for hamburger menu
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const navMenu = document.querySelector('.nav-menu');
    const navOverlay = document.querySelector('.nav-overlay');
    const body = document.body;

    function toggleMenu() {
        hamburgerBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
        navOverlay.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navMenu.classList.contains('active')) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    }

    function closeMenu() {
        hamburgerBtn.classList.remove('active');
        navMenu.classList.remove('active');
        navOverlay.classList.remove('active');
        body.style.overflow = '';
    }

    // Toggle menu when hamburger button is clicked
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMenu);
    }

    // Close menu when overlay is clicked
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMenu);
    }

    // Close menu when a nav link is clicked (for mobile)
    const navLinks = document.querySelectorAll('.nav-menu .nav-btn');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close menu on escape key press
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });

    // Close menu on window resize if screen becomes wide enough
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
            closeMenu();
        }
    });
});
