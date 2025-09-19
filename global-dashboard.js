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
    
    // Create dashboard HTML structure - Based on navigation-pillar structure
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
                
                <div class="dashboard-bottom">
                    <span class="dashboard-welcome-message" id="dashboardWelcomeMessage"></span>
                </div>
            </div>
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
    
    // Show welcome message temporarily
    function showWelcomeMessage(userName) {
        const welcomeElement = document.getElementById('dashboardWelcomeMessage');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome back, ${userName}!`;
            welcomeElement.classList.remove('fade-out');
            
            // Clear any existing timeout
            if (welcomeTimeout) {
                clearTimeout(welcomeTimeout);
            }
            
            // Set timeout to fade out after 5 seconds
            welcomeTimeout = setTimeout(() => {
                welcomeElement.classList.add('fade-out');
                
                // Remove text after fade animation completes
                setTimeout(() => {
                    welcomeElement.textContent = '';
                }, 500);
            }, 5000);
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
        
        // Show welcome message for 5 seconds
        showWelcomeMessage(firstName);
    }
    
    // Deactivate dashboard mode
    function deactivateDashboard() {
        dashboardActive = false;
        currentUser = null;
        
        // Clear welcome message timeout
        if (welcomeTimeout) {
            clearTimeout(welcomeTimeout);
            welcomeTimeout = null;
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
    
    // Logout function
    window.logoutUser = function() {
        if (confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userProfile');
            deactivateDashboard();
            
            // Redirect to home if on dashboard page
            if (window.location.pathname.includes('client-dashboard')) {
                window.location.href = 'index.html';
            }
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