document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('[data-dropdown]');
    
    // Toggle mobile menu
    mobileMenuButton.addEventListener('click', () => {
        navLinks.classList.toggle('show');
        // Close all dropdowns when closing mobile menu
        if (!navLinks.classList.contains('show')) {
            dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
        }
    });

    // Handle dropdown interactions
    dropdowns.forEach(dropdown => {
        const button = dropdown.querySelector('.nav-button');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Check if we're in mobile view
            if (window.innerWidth <= 768) {
                // Toggle height animation for mobile
                if (dropdown.classList.contains('active')) {
                    dropdownMenu.style.maxHeight = '0px';
                    dropdown.classList.remove('active');
                } else {
                    // Close other dropdowns
                    dropdowns.forEach(d => {
                        d.classList.remove('active');
                        d.querySelector('.dropdown-menu').style.maxHeight = '0px';
                    });
                    // Open clicked dropdown
                    dropdownMenu.style.maxHeight = dropdownMenu.scrollHeight + 'px';
                    dropdown.classList.add('active');
                }
            } else {
                // Desktop behavior
                const isActive = dropdown.classList.contains('active');
                dropdowns.forEach(d => d.classList.remove('active'));
                if (!isActive) dropdown.classList.add('active');
            }
        });

        // Desktop hover behavior
        if (window.innerWidth > 768) {
            dropdown.addEventListener('mouseenter', () => {
                dropdowns.forEach(d => d.classList.remove('active'));
                dropdown.classList.add('active');
            });
            
            dropdown.addEventListener('mouseleave', () => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.querySelector('.dropdown-menu').style.maxHeight = '0px';
        });
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('show');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
                dropdown.querySelector('.dropdown-menu').style.maxHeight = '';
            });
        }
    });
});