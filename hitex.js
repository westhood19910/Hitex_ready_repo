document.addEventListener('DOMContentLoaded', function() {
    const languageText = document.getElementById('languageText');
    let currentLanguage = 'english';
    let isTransitioning = false;
    
    // Initial fade-in animation
    setTimeout(function() {
        languageText.classList.add('fade-in');
    }, 300);
    
    // Translations object
    const translations = {
        english: "Igniting Innovation...",
        chinese: "点燃创新...",
        french: "Enflammer l'innovation...",
        spanish: "Encendiendo la innovación...",
        japanese: "イノベーションを点火...",
        arabic: "إشعال الابتكار...",
        korean: "혁신에 불을 붙이다...",
        portuguese: "Acendendo a inovação..."
    };
    
    // Function to change language with smooth transition
    function changeLanguage(lang) {
        if (isTransitioning || currentLanguage === lang) return;
        
        isTransitioning = true;
        currentLanguage = lang;
        
        // Fade out
        languageText.classList.add('languageText-hidden');
        
        // Change text and fade in after transition
        setTimeout(function() {
            languageText.textContent = translations[lang] || translations.english;
            languageText.classList.remove('languageText-hidden');
            setTimeout(() => {
                isTransitioning = false;
            }, 300);
        }, 300);
    }
    
    // Add hover and touch effect for language links
    const languageLinks = document.querySelectorAll('.language-link');
    languageLinks.forEach(link => {
        // For desktop - hover
        link.addEventListener('mouseover', function() {
            const lang = this.getAttribute('data-lang');
            changeLanguage(lang);
        });
        
        // For mobile - touch
        link.addEventListener('touchstart', function(e) {
            const lang = this.getAttribute('data-lang');
            changeLanguage(lang);
        }, {passive: true});
    });
    
    // Reset to English when not hovering over any link
    const languageSelector = document.querySelector('.language_selector');
    languageSelector.addEventListener('mouseleave', function() {
        changeLanguage('english');
    });
    
    // Function to make sure content fits without scrollbars
    function adjustLayout() {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        // Make sure we're always using the full height without overflow
        document.documentElement.style.height = `${windowHeight}px`;
        
        // Handle very small screens by adjusting font sizes dynamically
        if (windowHeight < 600) {
            const languageSelector = document.querySelector('.language_selector');
            const languageList = document.querySelector('.language-list');
            const langLinks = document.querySelectorAll('.language-link');
            
           
            langLinks.forEach(link => {
                link.style.padding = '0.5em 0';
            });
        }
    }
    
    // Run on load and resize
    adjustLayout();
    window.addEventListener('resize', adjustLayout);
});