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


// CODE FOR PROBATION

function fd29_setCircleProgress(elementId, percent) {
    const circle = document.getElementById(elementId);
    const radius = circle.getAttribute('r');
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100 * circumference);
    circle.style.strokeDashoffset = offset;
}

// Animate the circles when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        fd29_setCircleProgress('cr01', 40);
        fd29_setCircleProgress('cr02', 80);
        fd29_setCircleProgress('cr03', 57);
        fd29_setCircleProgress('cr04', 83);
        fd29_setCircleProgress('cr05', 90);
        fd29_setCircleProgress('cr06', 75);
    }, 300);
});