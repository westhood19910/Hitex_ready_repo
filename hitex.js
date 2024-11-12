document.addEventListener("DOMContentLoaded", function() {
    const texts = [
        "Enhancing science and technical communications for a better world.",
        "Bridging the communication gap between research and society",
        "Narrating ideas and innovation one word at a time.",
    ];

    let currentIndex = 0;
    const textElement = document.getElementById("languageText");

    function changeText() {
       
        textElement.classList.add("languageText-hidden");

        setTimeout(function() {
         
            textElement.textContent = texts[currentIndex];
            textElement.classList.remove("languageText-hidden");

            currentIndex = (currentIndex + 1) % texts.length;
        }, 1000); 
    }

    changeText();

    setInterval(changeText, 3000);
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