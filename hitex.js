document.addEventListener('DOMContentLoaded', function() {
    // --- Elements and Translations ---
    const languageText = document.getElementById('languageText');
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
    const languages = Object.keys(translations);

    // --- Animation State & Configuration ---
    let languageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let animationTimeoutId;

    const typingSpeed = 120;
    const deletingSpeed = 60;
    const delayBetweenTexts = 2000;

    /**
     * Main function for the typing animation loop.
     */
    function typeWriterLoop() {
        const currentLangKey = languages[languageIndex];
        const fullText = translations[currentLangKey];
        let timeoutSpeed = isDeleting ? deletingSpeed : typingSpeed;

        if (isDeleting) {
            languageText.textContent = fullText.substring(0, languageText.textContent.length - 1);
        } else {
            languageText.textContent = fullText.substring(0, charIndex + 1);
            charIndex++;
        }

        if (!isDeleting && languageText.textContent === fullText) {
            isDeleting = true;
            timeoutSpeed = delayBetweenTexts;
        } else if (isDeleting && languageText.textContent === '') {
            isDeleting = false;
            languageIndex = (languageIndex + 1) % languages.length;
            charIndex = 0;
            timeoutSpeed = 500;
        }

        animationTimeoutId = setTimeout(typeWriterLoop, timeoutSpeed);
    }

    /**
     * Pauses the animation and shows a specific language text instantly.
     * @param {string} lang - The language key (e.g., 'french').
     */
    function showStaticText(lang) {
        clearTimeout(animationTimeoutId);
        languageText.textContent = translations[lang] || translations.english;
    }

    // --- Event Listeners ---
    const languageLinks = document.querySelectorAll('.language-link');
    const languageSelector = document.querySelector('.language_selector');

    languageLinks.forEach(link => {
        const lang = link.getAttribute('data-lang');

        // On both click and tap, this function will run
        link.addEventListener('click', function(event) {
            // 1. Stop the link from navigating immediately
            event.preventDefault();

            // 2. Get the destination URL from the link itself
            const destinationUrl = this.href;

            // 3. Instantly show the static text for the selected language
            showStaticText(lang);

            // 4. Wait for a short moment (e.g., 300ms) then navigate
            setTimeout(() => {
                window.location.href = destinationUrl;
            }, 300);
        });
    });

    // Resume animation when the mouse leaves the language selector area
    languageSelector.addEventListener('mouseleave', () => {
        clearTimeout(animationTimeoutId); // Clear any existing timeout
        isDeleting = true; // Set to deleting to cleanly transition back into the loop
        typeWriterLoop();  // Restart the animation loop
    });
    
    // --- Layout Adjustment (Unchanged) ---
    function adjustLayout() {
        const windowHeight = window.innerHeight;
        document.documentElement.style.height = `${windowHeight}px`;

        if (windowHeight < 600) {
            const langLinks = document.querySelectorAll('.language-link');
            langLinks.forEach(link => {
                link.style.padding = '0.5em 0';
            });
        }
    }

    // --- Initializations ---
    adjustLayout();
    window.addEventListener('resize', adjustLayout);
    
    // Start the typing animation
    typeWriterLoop();
});