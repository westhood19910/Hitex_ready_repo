document.addEventListener("DOMContentLoaded", function() {
    const languageLinks = document.querySelectorAll(".language-link");
    const content = document.getElementById("content");

    languageLinks.forEach(function(link) {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            const selectedLang = this.getAttribute("data-lang");

            // Define content for each language
            const languageContent = {
                english: {
                    heading: "English Content",
                    text: "This is the English version of the content."
                },
                chinese: {
                    heading: "中文内容",
                    text: "这是中文版本的内容。"
                },
                french: {
                    heading: "Contenu en français",
                    text: "Ceci est la version française du contenu."
                },
                spanish: {
                    heading: "Contenido en español",
                    text: "Esta es la versión en español del contenido."
                },
                japanese: {
                    heading: "日本語の内容",
                    text: "これは日本語バージョンのコンテンツです。"
                }
            };

            // Update the content based on the selected language
            content.innerHTML = `
                <h1>${languageContent[selectedLang].heading}</h1>
                <p>${languageContent[selectedLang].text}</p>
            `;
        });
    });
});
