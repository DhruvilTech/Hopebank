document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('mobileMenu');
    const navLinks = document.getElementById('navLinks');
    const body = document.body;

    // Toggle mobile menu
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        body.classList.toggle('menu-open');
    });


    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            body.classList.remove('menu-open');
        }
    });

    // Profile Dropdown Toggle
    const profileIcon = document.querySelector('.profile-icon');
    const profileDropdown = document.querySelector('.profile-dropdown');

    if (profileIcon) {
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });

        // For mobile: close dropdown when clicking a link
        const dropdownLinks = document.querySelectorAll('.dropdown-content a');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function() {
                profileDropdown.classList.remove('active');
                // If mobile menu is open, close it too
                document.querySelector('.nav-links').classList.remove('active');
                document.querySelector('.menu-toggle').classList.remove('active');
            });
        });
    }

    // Add this to your existing DOMContentLoaded event listener
    const causesDropdown = document.querySelector('.causes-dropdown');
    const causesBtn = document.querySelector('.causes-btn');

    if (causesBtn && window.innerWidth <= 768) {
        causesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            causesDropdown.classList.toggle('active');
        });
    }
});