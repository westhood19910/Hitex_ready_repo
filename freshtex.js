// This single event listener will manage all the scripts for your site.
document.addEventListener('DOMContentLoaded', () => {
    
    // --- UTILITY FUNCTIONS ---

    // A throttle function is needed for the scroll animation handler
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // --- YOUR FEATURES, WRAPPED IN INITIALIZER FUNCTIONS ---

    function initLanguageDropdown() {
        const toggleButton = document.querySelector('.toggle-button-2');
        const languageList = document.querySelector('#languagelist');
        if (!toggleButton || !languageList) return;

        toggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            languageList.classList.toggle("show");
        });

        document.addEventListener('click', (event) => {
            if (!languageList.contains(event.target) && !toggleButton.contains(event.target)) {
                languageList.classList.remove('show');
            }
        });
    }

    function initCopyrightNav() {
        const navItems = document.querySelectorAll('.cop_ryt_nav_item');
        const contentSection = document.getElementById('cop_ryt_content_section');
        if (!navItems.length || !contentSection) return;
        
        const sectionContent = { /* ... your content data here ... */ };

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                const sectionKey = item.getAttribute('data-section');
                contentSection.innerHTML = sectionContent[sectionKey] || 'Content not found.';
            });
        });
    }

    function initClock() {
        const secondHand = document.querySelector('.second-hand');
        const minuteHand = document.querySelector('.minute-hand');
        const hourHand = document.querySelector('.hour-hand');
        if (!secondHand || !minuteHand || !hourHand) return;

        function updateClock() {
            const now = new Date();
            const seconds = now.getSeconds();
            const minutes = now.getMinutes();
            const hours = now.getHours() % 12;

            const secondDegrees = (seconds / 60) * 360;
            const minuteDegrees = ((minutes + seconds / 60) / 60) * 360;
            const hourDegrees = ((hours + minutes / 60) / 12) * 360;
            
            secondHand.style.transform = `rotate(${secondDegrees}deg)`;
            minuteHand.style.transform = `rotate(${minuteDegrees}deg)`;
            hourHand.style.transform = `rotate(${hourDegrees}deg)`;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    function initFaq() {
        const faqItems = document.querySelectorAll('.est-90-fr-001');
        if (!faqItems.length) return;

        faqItems.forEach(item => {
            item.addEventListener('click', function() {
                this.classList.toggle('active');
                const answer = this.nextElementSibling;
                if (answer) {
                    answer.classList.toggle('active');
                }
            });
        });
    }

    function initIdlePopup() {
        const idlePopup = document.getElementById('idlePopup');
        const idlePopupOverlay = document.getElementById('idlePopupOverlay');
        if (!idlePopup || !idlePopupOverlay) return;

        let idleTime = 0;
        let popupShown = false;

        function showPopup() {
            if (!popupShown) {
                idlePopup.classList.add('show');
                idlePopupOverlay.classList.add('show');
                popupShown = true;
            }
        }

        function closePopup() {
            idlePopup.classList.remove('show');
            idlePopupOverlay.classList.remove('show');
            popupShown = false;
            resetIdleTime();
        }

        function resetIdleTime() {
            idleTime = 0;
        }

        function timerIncrement() {
            idleTime++;
            if (idleTime >= 30) { // 30 second timer
                showPopup();
            }
        }

        setInterval(timerIncrement, 1000);
        const resetEvents = ['mousemove', 'keypress', 'click', 'touchstart', 'scroll'];
        resetEvents.forEach(event => document.addEventListener(event, resetIdleTime, true));
        idlePopupOverlay.addEventListener('click', closePopup);
    }
    
    // The function for your custom alerts for login, etc.
    // This should be global so other scripts can access it, or loaded first.
    window.showCustomAlert = function(message, type = 'success') {
        const alertBox = document.createElement('div');
        alertBox.style.position = 'fixed';
        alertBox.style.top = '20px';
        alertBox.style.left = '50%';
        alertBox.style.transform = 'translateX(-50%)';
        alertBox.style.padding = '1rem 1.5rem';
        alertBox.style.borderRadius = '8px';
        alertBox.style.color = 'white'; // Replaced var(--white) for simplicity
        alertBox.style.fontWeight = 'bold';
        alertBox.style.zIndex = '2000';
        alertBox.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
        alertBox.style.backgroundColor = type === 'success' ? '#032672' : '#D54C4F'; // Replaced vars
        alertBox.textContent = message;
        document.body.appendChild(alertBox);
        setTimeout(() => alertBox.remove(), 3000);
    }


    // --- INITIALIZE EVERYTHING ---
    // Now we call all the functions to set up the page features.
    // By checking for elements first, these functions won't cause errors on pages where the HTML doesn't exist.
    
    initLanguageDropdown();
    initCopyrightNav();
    initClock();
    initFaq();
    initIdlePopup();
    // Add initializers for your other features here...

});