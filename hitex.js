document.addEventListener("DOMContentLoaded", function() {
    const texts = [
        "Enhancing science and technical communications for a better world.",
        "Bridging the communication gap between research and society",
        "Narrating ideas and innovation one word at a time.",
    ];

    let currentIndex = 0;
    const textElement = document.getElementById("languageText");
    let typingSpeed = 130; // Milliseconds per character
    let deletingSpeed = 10; // Milliseconds per character
    let pauseDuration = 4500; // How long to pause

    function typeText(text) {
        let charIndex = 0;
        textElement.textContent = "";
        
        function type() {
            if (charIndex < text.length) {
                textElement.textContent += text.charAt(charIndex);
                charIndex++;
                setTimeout(type, typingSpeed);
            } else {
                // Wait before starting to delete
                setTimeout(deleteText, pauseDuration);
            }
        }
        
        type();
    }

    function deleteText() {
        let text = textElement.textContent;
        
        function erase() {
            if (text.length > 0) {
                text = text.substring(0, text.length - 1);
                textElement.textContent = text;
                setTimeout(erase, deletingSpeed);
            } else {
                // Move to next text
                currentIndex = (currentIndex + 1) % texts.length;
                setTimeout(() => typeText(texts[currentIndex]), 500);
            }
        }
        
        erase();
    }

    // Start the animation
    typeText(texts[0]);
});

// CODE FOR LANGUAGE WELCOME MESSAGE
document.addEventListener("DOMContentLoaded", function() {
    const languageLinks = document.querySelectorAll('.language-link');
    const translations = {
        english: "Welcome",
        chinese: "欢迎",
        french: "Bienvenue",
        spanish: "Bienvenido",
        japanese: "ようこそ",
        arabic: "أهلا بك",
        korean: "환영합니다",
        portuguese: "Bem-vindo"
    };
    
    languageLinks.forEach(function(link) {
        const originalText = link.textContent;
        const lang = link.getAttribute('data-lang');
        
        link.addEventListener('mouseover', function() {
            link.textContent = translations[lang];
        });

        link.addEventListener('mouseout', function() {
            link.textContent = originalText;
        });
    });
});