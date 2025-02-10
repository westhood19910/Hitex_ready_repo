// JavaScript
document.addEventListener('scroll', () => {
    const spotlightCanvas = document.querySelector('.spotlight-canvas');
    const scrolled = window.scrollY;
    
    // Optional: Add parallax effect
    spotlightCanvas.style.transform = `translateY(${scrolled * 0.5}px)`;
});

// Optional: Add smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});