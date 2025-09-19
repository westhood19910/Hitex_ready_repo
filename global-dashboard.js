// Global Static Dashboard System
(function() {
    'use strict';
    
    let dashboardActive = false;
    let currentUser = null;
    
    // Initialize dashboard system
    function initializeDashboard() {
        createDashboardHTML();
        checkAuthenticationStatus();
        
        // Check auth status periodically
        setInterval(checkAuthenticationStatus, 30000);
    }
    
    // Create dashboard HTML structure
    function createDashboardHTML() {
        const dashboardHTML = `
            <div id="globalDashboard" class="dashboard-container">
                <div class="dashboard-user-info">
                    <div class="dashboard-avatar" id="dashboardAvatar"></div>
                    <div>
                        <div id="dashboardUserName">Loading...</div>
                        <div id="dashboardUserEmail" style="font-size: 0.8rem; color: #666;"></div>
                    </div>
                </div>
                
                <nav class="dashboard-nav">
                    <ul>
                        <li><a href="client-dashboard.html">Dashboard Overview</a></li>
                        <li><a href="client-dashboard.html#submissions">My Submissions</a></li>
                        <li><a href="client-dashboard.html#projects">Active Projects</a></li>
                        <li><a href="client-dashboard.html#communications">Messages</a></li>
                        <li><a href="client-dashboard.html#invoices">Invoices & Payments</a></li>
                        <li><a href="client-dashboard.html#resources">Resources</a></li>
                        <li><a href="profile.html">Edit Profile</a></li>
                        <li><a href="client-dashboard.html#support">Support</a></li>
                    </ul>
                    
                    <button class="dashboard-logout" onclick="logoutUser()">Sign Out</button>
                </nav>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', dashboardHTML);
    }
    
    // Check if user is authenticated
    async function checkAuthenticationStatus() {
        const token = localStorage.getItem('authToken');
        
        if (token) {
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
        } else {
            deactivateDashboard();
        }
    }
    
    // Activate dashboard mode
    function activateDashboard(userData) {
        if (dashboardActive) return; // Prevent multiple activations
        
        dashboardActive = true;
        currentUser = userData;
        
        // Show the dashboard
        const dashboard = document.getElementById('globalDashboard');
        if (dashboard) {
            dashboard.classList.add('logged-in');
        }
        
        // Update main navigation
        const mainNav = document.querySelector('.nav__bar_oi');
        if (mainNav) {
            mainNav.classList.add('logged-in');
        }
        
        // Adjust body padding to accommodate dashboard
        document.body.classList.add('dashboard-active');
        
        // Update dashboard user info
        document.getElementById('dashboardUserName').textContent = 
            userData.firstName || userData.fullName || 'User';
        document.getElementById('dashboardUserEmail').textContent = 
            userData.email || '';
    }
    
    // Deactivate dashboard mode
    function deactivateDashboard() {
        if (!dashboardActive) return; // Prevent multiple deactivations
        
        dashboardActive = false;
        currentUser = null;
        
        // Hide the dashboard
        const dashboard = document.getElementById('globalDashboard');
        if (dashboard) {
            dashboard.classList.remove('logged-in');
        }
        
        // Remove logged-in class from main nav
        const mainNav = document.querySelector('.nav__bar_oi');
        if (mainNav) {
            mainNav.classList.remove('logged-in');
        }
        
        // Remove body padding adjustment
        document.body.classList.remove('dashboard-active');
        
        // Clear token if it exists
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
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
    
})();