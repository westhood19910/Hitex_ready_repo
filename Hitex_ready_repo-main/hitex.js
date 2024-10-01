document.addEventListener("DOMContentLoaded", function() {
    const texts = [
        "Do you Need a redefined Manuscript?",
        "Welcome to Hitex Editex",
        "Your trusted partner in professional manuscript editing.",
        "Let Your Words Shine!",
        "Unlock Your Manuscript's Full Potential",
        "Submit Your Manuscript Today",
        "Fast and Reliable Services",
        " Theres is Premium Editing Services for Aspiring Authors",
        "Achieve Perfection with Expert Editing",
        "Elevate Your Writing to New Heights",
        "Enhance the Clarity and Impact of Your Manuscript",
        "Professional Editors with Subject Matter Expertise",
        "Transform Your Draft into a Masterpiece",
        "Quality Editing for Every Type of Manuscript",         
        "Precision and Accuracy in Every Edit",
        "Polish Your Manuscript to Perfection",
        "Expert Editing for Authors and Researchers",
        "Refine Your Work with Hitex Editex",
        "Make a Lasting Impression with Your Writing",
        "Customized Editing Solutions for Your Needs",
        "Trusted by Authors Worldwide",
        "Enhance Readability and Coherence",
        "Boost Your Chances of Publication",
        "Tailored Editing to Fit Your Unique Voice",
        "Comprehensive Editing Services at Competitive Rates",
        "Achieve Success with Professional Editing",
        "Your Manuscript Deserves the Best",
        "Experience the Hitex Editex Difference",
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