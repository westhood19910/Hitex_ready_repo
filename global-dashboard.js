// Global Dashboard System
(function() {
    'use strict';
    
    let dashboardActive = false;
    let currentUser = null;
    
    // Initialize dashboard system
    function initializeDashboard() {
        createDashboardHTML();
        checkAuthenticationStatus();
        setupEventListeners();
        
        // Check auth status periodically
        setInterval(checkAuthenticationStatus, 30000);
    }
    
    // Create dashboard HTML structure
    function createDashboardHTML() {
        const dashboardHTML = `
            <div id="globalDashboard" class="dashboard-overlay">
                <div class="dashboard-container">
                    <div class="dashboard-header">
                        <h3>Dashboard</h3>
                        <button class="dashboard-close" onclick="toggleDashboard()">&times;</button>
                    </div>
                    
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
                    </nav>
                    
                    <button class="dashboard-logout" onclick="logoutUser()">Sign Out</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', dashboardHTML);
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
    
    // Activate dashboard mode
    function activateDashboard(userData) {
        dashboardActive = true;
        currentUser = userData;
        
        // Update main navigation
        const mainNav = document.querySelector('.nav__bar_oi');
        if (mainNav) {
            mainNav.classList.add('logged-in');
        }
        
        // Update dashboard user info
        document.getElementById('dashboardUserName').textContent = 
            userData.firstName || userData.fullName || 'User';
        document.getElementById('dashboardUserEmail').textContent = 
            userData.email || '';
        
        // Show dashboard indicator
        showDashboardIndicator();
    }
    
    // Deactivate dashboard mode
    function deactivateDashboard() {
        dashboardActive = false;
        currentUser = null;
        
        // Remove logged-in class
        const mainNav = document.querySelector('.nav__bar_oi');
        if (mainNav) {
            mainNav.classList.remove('logged-in');
        }
        
        // Hide dashboard
        const dashboard = document.getElementById('globalDashboard');
        if (dashboard) {
            dashboard.classList.remove('active');
            dashboard.querySelector('.dashboard-container').classList.remove('active');
        }
        
        localStorage.removeItem('authToken');
    }
    
    // Show dashboard indicator
    function showDashboardIndicator() {
        const mainNav = document.querySelector('.nav__bar_oi');
        if (mainNav && !mainNav.querySelector('.dashboard-indicator')) {
            mainNav.addEventListener('click', function(e) {
                if (e.target === mainNav || e.target.closest('.nav__bar_oi-logo')) {
                    toggleDashboard();
                }
            });
        }
    }
    
    // Toggle dashboard visibility
    window.toggleDashboard = function() {
        if (!dashboardActive) return;
        
        const dashboard = document.getElementById('globalDashboard');
        const container = dashboard.querySelector('.dashboard-container');
        
        dashboard.classList.toggle('active');
        container.classList.toggle('active');
    };
    
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
    
    // Setup event listeners
    function setupEventListeners() {
        // Close dashboard when clicking overlay
        document.addEventListener('click', function(e) {
            const dashboard = document.getElementById('globalDashboard');
            if (e.target === dashboard) {
                toggleDashboard();
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const dashboard = document.getElementById('globalDashboard');
                if (dashboard.classList.contains('active')) {
                    toggleDashboard();
                }
            }
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDashboard);
    } else {
        initializeDashboard();
    }
    
})();