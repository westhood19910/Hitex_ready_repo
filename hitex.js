document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        document.getElementById('languageText').classList.add('fade-in');
    }, 500);
    const languageLinks = document.querySelectorAll('.language-link');
    languageLinks.forEach(link => {
        link.addEventListener('mouseover', function() {
            const lang = this.getAttribute('data-lang');
            const languageText = document.getElementById('languageText');
            languageText.classList.add('languageText-hidden');
            setTimeout(function() {
                switch(lang) {      
                    case 'english':
                        languageText.textContent = 'Igniting Innovation...';
                        break;
                    case 'chinese':
                        languageText.textContent = '点燃创新...';
                        break;
                    case 'french':
                        languageText.textContent = 'Enflammer l\'innovation...';
                        break;
                    case 'spanish':
                        languageText.textContent = 'Encendiendo la innovación...';
                        break;
                    case 'japanese':
                        languageText.textContent = 'イノベーションを点火...';
                        break;
                    case 'arabic':
                        languageText.textContent = 'إشعال الابتكار...';
                        break;
                    case 'korean':
                        languageText.textContent = '혁신에 불을 붙이다...';
                        break;
                    case 'portuguese':
                        languageText.textContent = 'Acendendo a inovação...';
                        break;
                    default:
                        languageText.textContent = 'Igniting Innovation...';
                }
                languageText.classList.remove('languageText-hidden');
            }, 300);
        });
    });
});