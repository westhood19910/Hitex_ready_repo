// Global Dashboard System - Static Version with Navigation-Pillar Styling
(function() {
    'use strict';
    
    let dashboardActive = false;
    let currentUser = null;
    let welcomeTimeout = null;
    
    // Initialize dashboard system
    function initializeDashboard() {
        createDashboardHTML();
        checkAuthenticationStatus();
        
        // Check auth status periodically
        setInterval(checkAuthenticationStatus, 30000);
    }
    
    // Create dashboard HTML structure - Removed bottom section
    function createDashboardHTML() {
        const dashboardHTML = `
            <div id="globalDashboard" class="dashboard-container">
                <div class="dashboard-top">
                    <button class="dashboard-logout" onclick="logoutUser()">Sign Out</button>
                    
                    <nav class="dashboard-nav">
                        <ul>
                            <li><a href="client-dashboard.html">Dashboard</a></li>
                            <li><a href="client-dashboard.html#submissions">Submissions</a></li>
                            <li><a href="client-dashboard.html#projects">Projects</a></li>
                            <li><a href="client-dashboard.html#communications">Messages</a></li>
                            <li><a href="client-dashboard.html#invoices">Invoices</a></li>
                            <li><a href="client-dashboard.html#resources">Resources</a></li>
                            <li><a href="profile.html">Profile</a></li>
                            <li><a href="client-dashboard.html#support">Support</a></li>
                        </ul>
                    </nav>
                    
                    <div class="dashboard-user-info">
                        <div class="dashboard-avatar" id="dashboardAvatar"></div>
                        <div class="dashboard-user-details">
                            <div class="dashboard-user-name" id="dashboardUserName">Loading...</div>
                            <div class="dashboard-user-email" id="dashboardUserEmail"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Absolute positioned welcome message -->
            <div class="dashboard-welcome-message" id="dashboardWelcomeMessage"></div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', dashboardHTML);
    }
    
    // Check if user is authenticated
    async function checkAuthenticationStatus() {
        const token = localStorage.getItem('authToken');
        
        if (token && !dashboardActive) {
            try {
                // Verify token with server
                const response = await fetch('https://all-branched-end.onrender.com/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    activateDashboard(userData);
                } else {
                    deactivateDashboard();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                deactivateDashboard();
            }
        } else if (!token && dashboardActive) {
            deactivateDashboard();
        }
    }
    
    // Show welcome message temporarily (only once per login session)
    function showWelcomeMessage(userName) {
        // Check if welcome message has already been shown for this session
        const welcomeShown = localStorage.getItem('welcomeMessageShown');
        if (welcomeShown === 'true') return; // Don't show again
        
        const welcomeElement = document.getElementById('dashboardWelcomeMessage');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome back, ${userName}!`;
            welcomeElement.classList.add('show');
            
            // Mark as shown in localStorage
            localStorage.setItem('welcomeMessageShown', 'true');
            
            // Clear any existing timeout
            if (welcomeTimeout) {
                clearTimeout(welcomeTimeout);
            }
            
            // Set timeout to fade out after 15 seconds
            welcomeTimeout = setTimeout(() => {
                welcomeElement.classList.add('fade-out');
                welcomeElement.classList.remove('show');
                
                // Remove text after fade animation completes
                setTimeout(() => {
                    welcomeElement.textContent = '';
                    welcomeElement.classList.remove('fade-out');
                }, 500);
            }, 15000); // 15 seconds
        }
    }
    
    // Activate dashboard mode
    function activateDashboard(userData) {
        dashboardActive = true;
        currentUser = userData;
        
        // Show dashboard bar
        const dashboard = document.getElementById('globalDashboard');
        if (dashboard) {
            dashboard.classList.add('active');
        }
        
        // Add body class for content adjustment
        document.body.classList.add('dashboard-active');
        
        // Update dashboard user info
        const firstName = userData.firstName || userData.fullName || 'User';
        document.getElementById('dashboardUserName').textContent = firstName;
        document.getElementById('dashboardUserEmail').textContent = userData.email || '';
        
        // Show welcome message for 15 seconds (only once per login session)
        showWelcomeMessage(firstName);
    }
    
    // Deactivate dashboard mode
    function deactivateDashboard() {
        dashboardActive = false;
        currentUser = null;
        
        // Clear welcome message flag when logging out
        localStorage.removeItem('welcomeMessageShown');
        
        // Clear welcome message timeout
        if (welcomeTimeout) {
            clearTimeout(welcomeTimeout);
            welcomeTimeout = null;
        }
        
        // Hide and clear welcome message
        const welcomeElement = document.getElementById('dashboardWelcomeMessage');
        if (welcomeElement) {
            welcomeElement.classList.remove('show', 'fade-out');
            welcomeElement.textContent = '';
        }
        
        // Hide dashboard bar
        const dashboard = document.getElementById('globalDashboard');
        if (dashboard) {
            dashboard.classList.remove('active');
        }
        
        // Remove body class
        document.body.classList.remove('dashboard-active');
        
        localStorage.removeItem('authToken');
    }
    
    // Logout function - Always redirects to home page
    window.logoutUser = function() {
        if (confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            deactivateDashboard();
            
            // Always redirect to home page after logout
            window.location.href = 'index.html';
        }
    };
    
    // Export function for manual activation (for login pages)
    window.checkAuthenticationStatus = checkAuthenticationStatus;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
    
})();