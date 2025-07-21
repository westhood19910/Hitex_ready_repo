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
    let languageIndex = 0; // Current language index from the 'languages' array
    let charIndex = 0;     // Current character index for the text being typed
    let isDeleting = false; // Flag to check if we are deleting or typing
    let animationTimeoutId;  // To hold the timeout ID for pausing/resuming

    const typingSpeed = 120;       // Speed of typing in ms
    const deletingSpeed = 60;        // Speed of deleting in ms
    const delayBetweenTexts = 2000;  // Pause after a text is fully typed

    /**
     * Main function for the typing animation loop.
     * It uses a recursive setTimeout to type, pause, delete, and switch languages.
     */
    function typeWriterLoop() {
        const currentLangKey = languages[languageIndex];
        const fullText = translations[currentLangKey];
        let timeoutSpeed = isDeleting ? deletingSpeed : typingSpeed;

        // Logic for typing or deleting
        if (isDeleting) {
            // Remove a character
            languageText.textContent = fullText.substring(0, languageText.textContent.length - 1);
        } else {
            // Add a character
            languageText.textContent = fullText.substring(0, charIndex + 1);
            charIndex++;
        }

        // --- State Transition Logic ---

        // If text is fully typed, set a pause before starting to delete
        if (!isDeleting && languageText.textContent === fullText) {
            isDeleting = true;
            timeoutSpeed = delayBetweenTexts; // Set the pause duration
        } 
        // If text is fully deleted, move to the next language and start typing
        else if (isDeleting && languageText.textContent === '') {
            isDeleting = false;
            languageIndex = (languageIndex + 1) % languages.length; // Loop back to the start
            charIndex = 0; // Reset character index for the new text
            timeoutSpeed = 500; // A brief pause before typing the new text
        }

        // Call the loop again after the calculated timeout
        animationTimeoutId = setTimeout(typeWriterLoop, timeoutSpeed);
    }

    /**
     * Pauses the animation and shows a specific language text instantly.
     * Used for hover/touch interaction.
     * @param {string} lang - The language key (e.g., 'french').
     */
    function showStaticText(lang) {
        clearTimeout(animationTimeoutId); // Stop the animation loop
        languageText.textContent = translations[lang] || translations.english;
    }

    // --- Event Listeners ---
    const languageLinks = document.querySelectorAll('.language-link');
    languageLinks.forEach(link => {
        const lang = link.getAttribute('data-lang');
        // Pause animation and show text on hover/touch
        link.addEventListener('mouseover', () => showStaticText(lang));
        link.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent potential unwanted page scroll or other touch behaviors
            showStaticText(lang);
        }, { passive: false });
    });

    // Resume animation when the mouse leaves the language selector area
    const languageSelector = document.querySelector('.language_selector');
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