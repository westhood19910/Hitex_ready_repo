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