// Complete Dashboard JavaScript with Integrated Discount System
// Configuration
const API_BASE = 'https://all-branched-end.onrender.com';

// Global variables for dashboard state
let currentSection = 'dashboard';
let manuscripts = [];
let currentUser = null;
let discountEligibilityData = null;

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    // Initialize core dashboard
    await loadProfileInfo(headers);
    await loadManuscripts(headers);
    updateDashboardStats();
    setupNavigation();
    
    // Initialize discount system
    await initializeDiscountSystem();
    
    // Check for admin access
    await checkAdminAccess();
    
    // Add discount styles to page
    addDiscountStyles();
    
    // Setup logout
    document.getElementById('logoutButton').addEventListener('click', logout);
});

// ==========================================
// CORE DASHBOARD FUNCTIONS
// ==========================================

// Load profile information
async function loadProfileInfo(headers) {
    try {
        const response = await fetch(`${API_BASE}/profile`, { headers });
        const profileData = await response.json();
        if (profileData) {
            currentUser = profileData;
            document.getElementById('profileName').textContent = profileData.fullName || 'Author';
            document.getElementById('profileEmail').textContent = profileData.email || '';
        }
    } catch (err) {
        console.error('Failed to load profile info:', err);
    }
}

// Load manuscripts data
async function loadManuscripts(headers) {
    try {
        const response = await fetch(`${API_BASE}/my-manuscripts`, { headers });
        manuscripts = await response.json();
        
        // Populate submissions table
        const list = document.getElementById('manuscriptList');
        list.innerHTML = '';
        
        if (manuscripts.length === 0) {
            list.innerHTML = '<tr><td colspan="6" style="text-align:center;">You have not submitted any manuscripts yet.</td></tr>';
            return;
        }
        
        manuscripts.forEach((doc, index) => {
            const statusClass = `state-${(doc.status || 'new').toLowerCase().replace(/\s+/g, '-')}`;
            const row = list.insertRow();
            row.innerHTML = `
                <td>${new Date(doc.uploadDate).toLocaleDateString()}</td>
                <td>${doc.originalName || doc.title}</td>
                <td>${doc.wordCount || 'N/A'}</td>
                <td>${doc.serviceType || 'Standard Edit'}</td>
                <td><span class="state-indicator ${statusClass}">${doc.status || 'New'}</span></td>
                <td>
                    <button class="op-button op-primary" onclick="viewManuscript(${index})">View</button>
                    <button class="op-button op-info" onclick="downloadManuscript(${index})">Download</button>
                </td>
            `;
        });
    } catch (err) {
        console.error('Failed to load manuscripts:', err);
    }
}

// Update dashboard statistics
function updateDashboardStats() {
    document.getElementById('totalManuscripts').textContent = manuscripts.length;
    document.getElementById('activeProjects').textContent = manuscripts.filter(m => 
        ['assigned', 'in-progress', 'review'].includes((m.status || '').toLowerCase())
    ).length;
    document.getElementById('completedProjects').textContent = manuscripts.filter(m => 
        (m.status || '').toLowerCase() === 'completed'
    ).length;
    
    // Mock outstanding balance - in real app, this would come from API
    document.getElementById('outstandingBalance').textContent = '$0.00';
    
    // Update recent activity
    const recentActivity = document.getElementById('recentActivity');
    if (manuscripts.length > 0) {
        const recent = manuscripts.slice(0, 3);
        recentActivity.innerHTML = recent.map(m => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--grey);">
                <strong>${m.originalName || m.title}</strong> - Status: ${m.status || 'New'}
                <br><small>${new Date(m.uploadDate).toLocaleDateString()}</small>
            </div>
        `).join('');
    } else {
        recentActivity.innerHTML = '<p>No recent activity to display.</p>';
    }
}

// Setup navigation
function setupNavigation() {
    document.querySelectorAll('.pillar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            if (section) {
                showSection(section);
                
                // Update active nav
                document.querySelectorAll('.pillar-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    });
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.view-segment').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const section = document.getElementById(sectionName + '-section');
    if (section) {
        section.style.display = 'block';
        currentSection = sectionName;
    }
}

// Tab switching functionality
function switchTab(tabName) {
    document.querySelectorAll('.switcher-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.switcher-pane').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
}

// ==========================================
// MANUSCRIPT MANAGEMENT FUNCTIONS
// ==========================================

// View manuscript details
function viewManuscript(index) {
    const manuscript = manuscripts[index];
    const modal = document.getElementById('manuscriptModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = manuscript.originalName || manuscript.title;
    modalBody.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Upload Date:</strong> ${new Date(manuscript.uploadDate).toLocaleDateString()}
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Word Count:</strong> ${manuscript.wordCount || 'Not specified'}
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Service Type:</strong> ${manuscript.serviceType || 'Standard Edit'}
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Status:</strong> <span class="state-indicator state-${(manuscript.status || 'new').toLowerCase().replace(/\s+/g, '-')}">${manuscript.status || 'New'}</span>
        </div>
        <div style="margin-bottom: 1rem;">
            <strong>Description:</strong> ${manuscript.description || 'No description provided'}
        </div>
        ${manuscript.quote ? `
            <div style="margin-bottom: 1rem;">
                <strong>Quote:</strong> $${manuscript.quote}
            </div>
        ` : ''}
        ${manuscript.editorNotes ? `
            <div style="margin-bottom: 1rem;">
                <strong>Editor Notes:</strong> ${manuscript.editorNotes}
            </div>
        ` : ''}
        <div style="margin-top: 1.5rem;">
            <button class="op-button op-primary" onclick="downloadManuscript(${index})">Download Original</button>
            ${manuscript.editedVersion ? `
                <button class="op-button op-confirm" onclick="downloadEditedVersion(${index})">Download Edited Version</button>
            ` : ''}
            <button class="op-button op-info" onclick="messageEditor(${index})">Message Editor</button>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('manuscriptModal').style.display = 'none';
}

// Download manuscript
async function downloadManuscript(index) {
    const manuscript = manuscripts[index];
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${API_BASE}/download/${manuscript._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = manuscript.originalName || 'manuscript.docx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Failed to download manuscript');
        }
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading manuscript');
    }
}

// Download edited version
async function downloadEditedVersion(index) {
    const manuscript = manuscripts[index];
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${API_BASE}/download-edited/${manuscript._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${manuscript.originalName || 'manuscript'}_edited.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Edited version not available yet');
        }
    } catch (error) {
        console.error('Download error:', error);
        alert('Error downloading edited manuscript');
    }
}

// Message editor functionality
function messageEditor(index) {
    const manuscript = manuscripts[index];
    const message = prompt(`Send a message about "${manuscript.originalName || manuscript.title}":`);
    if (message && message.trim()) {
        alert('Message sent to editor successfully!');
        
        const notifications = document.getElementById('notifications');
        const newNotification = document.createElement('div');
        newNotification.className = 'alert-item';
        newNotification.innerHTML = `
            <h4>Message Sent</h4>
            <p>Your message about "${manuscript.originalName || manuscript.title}" has been sent to the editor.</p>
        `;
        notifications.insertBefore(newNotification, notifications.firstChild);
    }
}

// Export submissions
function exportSubmissions() {
    if (manuscripts.length === 0) {
        alert('No submissions to export');
        return;
    }
    const headers = ['Date Submitted', 'Title', 'Word Count', 'Service Type', 'Status'];
    const csvContent = [
        headers.join(','),
        ...manuscripts.map(m => [
            new Date(m.uploadDate).toLocaleDateString(),
            `"${m.originalName || m.title}"`,
            m.wordCount || 'N/A',
            `"${m.serviceType || 'Standard Edit'}"`,
            m.status || 'New'
        ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my_submissions.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Refresh dashboard
async function refreshDashboard() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    const refreshBtn = event.target;
    refreshBtn.textContent = 'Refreshing...';
    refreshBtn.disabled = true;
    
    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        await loadManuscripts(headers);
        updateDashboardStats();
        
        const notification = document.createElement('div');
        notification.className = 'alert-item';
        notification.innerHTML = `
            <h4>Dashboard Updated</h4>
            <p>Your dashboard has been refreshed with the latest information.</p>
        `;
        document.getElementById('notifications').insertBefore(notification, document.getElementById('notifications').firstChild);
        
    } catch (error) {
        console.error('Refresh error:', error);
        alert('Failed to refresh dashboard');
    } finally {
        refreshBtn.textContent = 'Refresh';
        refreshBtn.disabled = false;
    }
}

// ==========================================
// INSTITUTIONAL DISCOUNT SYSTEM
// ==========================================

// Initialize discount system
async function initializeDiscountSystem() {
    const bannerDismissed = localStorage.getItem('discountBannerDismissed');
    
    if (!bannerDismissed) {
        await checkUserDiscountEligibility();
    }
    
    insertDiscountComponents();
    await loadUserDiscountHistory();
}

// Insert discount components into dashboard
function insertDiscountComponents() {
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (dashboardSection) {
        const discountBannerHTML = `
            <div id="institutionalDiscountBanner" class="discount-notification-banner" style="display: none;">
                <div class="banner-content">
                    <button class="banner-dismiss" onclick="dismissDiscountNotification()">&times;</button>
                    <div class="banner-header">
                        <div class="banner-icon">🎓</div>
                        <h3>Institutional Discount Available!</h3>
                    </div>
                    <p class="banner-message">
                        Great news! You're eligible for a <strong><span id="eligibleDiscountPercent">0</span>%</strong> 
                        discount on all editing services through your institutional affiliation with 
                        <strong><span id="eligibleInstitutionName">your institution</span></strong>.
                    </p>
                    <div class="banner-actions">
                        <button class="prompt-button" onclick="generateInstitutionalDiscount()">Claim Discount</button>
                        <button class="op-button op-info" onclick="dismissDiscountNotification()">Maybe Later</button>
                    </div>
                </div>
            </div>
        `;
        
        const discountCodesHTML = `
            <div id="discountCodesSection" class="data-enclosure" style="display: none;">
                <div class="enclosure-header">
                    <h2>Your Discount Codes</h2>
                    <button class="op-button op-info" onclick="refreshDiscountCodes()">Refresh</button>
                </div>
                <div id="discountCodesList">
                    <div id="activeDiscountCode" class="discount-code-item" style="display: none;">
                        <div class="discount-code-details">
                            <h4>Active Institutional Discount</h4>
                            <div class="discount-code-display">
                                <span class="discount-code-value" id="userDiscountCode">LOADING...</span>
                                <button class="copy-code-btn" onclick="copyUserDiscountCode()">Copy Code</button>
                            </div>
                            <p class="discount-info">
                                Save <span id="userDiscountPercent">0</span>% on your next order • 
                                Expires: <span id="userDiscountExpiry">--</span>
                            </p>
                        </div>
                    </div>
                    <div id="noDiscountCodes" class="no-codes-message">
                        <p>No discount codes available. Check if you're eligible for institutional discounts!</p>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after the metrics matrix
        const metricsMatrix = dashboardSection.querySelector('.metrics-matrix');
        if (metricsMatrix) {
            metricsMatrix.insertAdjacentHTML('afterend', discountBannerHTML + discountCodesHTML);
        }
    }
}

// Check discount eligibility
async function checkUserDiscountEligibility() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const response = await fetch(`${API_BASE}/check-discount-eligibility`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.log('Discount eligibility check failed');
            return;
        }
        
        const data = await response.json();
        discountEligibilityData = data;
        
        if (data.eligible) {
            showDiscountEligibilityBanner(data);
        } else if (data.hasInstitutionalEmail) {
            showPartnershipSuggestion(data);
        }
        
    } catch (error) {
        console.error('Error checking discount eligibility:', error);
    }
}

// Show discount banner
function showDiscountEligibilityBanner(eligibilityData) {
    const banner = document.getElementById('institutionalDiscountBanner');
    const institutionSpan = document.getElementById('eligibleInstitutionName');
    const discountSpan = document.getElementById('eligibleDiscountPercent');
    
    if (banner && institutionSpan && discountSpan) {
        institutionSpan.textContent = eligibilityData.institution.name;
        discountSpan.textContent = eligibilityData.institution.discountPercentage;
        banner.style.display = 'block';
        
        addDiscountNotification(eligibilityData);
    }
}

// Generate discount code
async function generateInstitutionalDiscount() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/generate-discount-code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            dismissDiscountNotification();
            showDiscountCodeSuccess(data.discountCode);
            loadUserDiscountHistory();
        } else {
            alert('Error generating discount code: ' + data.error);
        }
        
    } catch (error) {
        console.error('Error generating discount code:', error);
        alert('Failed to generate discount code. Please try again.');
    }
}

// Show success message
function showDiscountCodeSuccess(discountCode) {
    const successHTML = `
        <div class="alert-item" style="background: #e8f5e8; border-left: 4px solid #4caf50;">
            <h4>Discount Code Generated!</h4>
            <p>Your institutional discount code <strong>${discountCode}</strong> is ready to use. 
               You can find it in your discount codes section below.</p>
        </div>
    `;
    
    const notifications = document.getElementById('notifications');
    if (notifications) {
        notifications.insertAdjacentHTML('afterbegin', successHTML);
    }
    
    const discountSection = document.getElementById('discountCodesSection');
    if (discountSection) {
        discountSection.style.display = 'block';
    }
}

// Load user discount history
async function loadUserDiscountHistory() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/my-discount-codes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) return;
        
        const codes = await response.json();
        displayUserDiscountCodes(codes);
        
    } catch (error) {
        console.error('Error loading discount codes:', error);
    }
}

// Display discount codes
function displayUserDiscountCodes(codes) {
    const activeCode = codes.find(code => !code.isUsed && new Date(code.expiresAt) > new Date());
    const discountSection = document.getElementById('discountCodesSection');
    const activeCodeDiv = document.getElementById('activeDiscountCode');
    const noCodesDiv = document.getElementById('noDiscountCodes');
    
    if (activeCode) {
        document.getElementById('userDiscountCode').textContent = activeCode.code;
        document.getElementById('userDiscountPercent').textContent = activeCode.discountPercentage;
        document.getElementById('userDiscountExpiry').textContent = 
            new Date(activeCode.expiresAt).toLocaleDateString();
        
        activeCodeDiv.style.display = 'block';
        noCodesDiv.style.display = 'none';
        discountSection.style.display = 'block';
        
    } else if (codes.length > 0) {
        noCodesDiv.innerHTML = '<p>Your previous discount codes have been used or expired.</p>';
        activeCodeDiv.style.display = 'none';
        noCodesDiv.style.display = 'block';
        discountSection.style.display = 'block';
        
    } else {
        discountSection.style.display = 'none';
    }
}

// Copy discount code
async function copyUserDiscountCode() {
    const codeElement = document.getElementById('userDiscountCode');
    const code = codeElement.textContent;
    
    try {
        await navigator.clipboard.writeText(code);
        
        const copyBtn = document.querySelector('.copy-code-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.style.background = '#4caf50';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
        }, 2000);
        
    } catch (error) {
        console.error('Failed to copy code:', error);
        alert('Please copy this code manually: ' + code);
    }
}

// Dismiss notification
function dismissDiscountNotification() {
    const banner = document.getElementById('institutionalDiscountBanner');
    if (banner) {
        banner.style.display = 'none';
        localStorage.setItem('discountBannerDismissed', 'true');
    }
}

// Refresh discount codes
function refreshDiscountCodes() {
    loadUserDiscountHistory();
}

// Add discount notification
function addDiscountNotification(eligibilityData) {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;
    
    const discountNotificationHTML = `
        <div class="alert-item" style="background: #f3e5f5; border-left: 4px solid #9c27b0;">
            <h4>🎓 Institutional Discount Available</h4>
            <p>You're eligible for ${eligibilityData.institution.discountPercentage}% off 
               through ${eligibilityData.institution.name}. 
               <a href="#" onclick="generateInstitutionalDiscount()" style="color: #9c27b0; font-weight: bold;">
                   Claim your discount code
               </a>
            </p>
        </div>
    `;
    
    notifications.insertAdjacentHTML('afterbegin', discountNotificationHTML);
}

// Show partnership suggestion
function showPartnershipSuggestion(data) {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;
    
    const suggestionHTML = `
        <div class="alert-item" style="background: #fff3e0; border-left: 4px solid #ff9800;">
            <h4>📧 Institutional Partnership</h4>
            <p>We notice you have an institutional email. While your institution isn't currently 
               a discount partner, we'd love to explore a partnership. 
               <a href="mailto:partnerships@hitexeditex.com" style="color: #ff9800; font-weight: bold;">
                   Contact us
               </a> to discuss institutional discounts.
            </p>
        </div>
    `;
    
    notifications.insertAdjacentHTML('afterbegin', suggestionHTML);
}

// ==========================================
// ADMIN PANEL FUNCTIONS
// ==========================================

// Check admin access
async function checkAdminAccess() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showAdminPanel();
        }
    } catch (error) {
        console.log('User does not have admin access');
    }
}

// Show admin panel
function showAdminPanel() {
    // Add admin section to navigation if it doesn't exist
    const navigation = document.querySelector('.pillar-directory ul');
    if (navigation && !document.querySelector('[data-section="admin"]')) {
        const adminNavItem = document.createElement('li');
        adminNavItem.innerHTML = '<a href="#" class="pillar-link" data-section="admin">Admin Panel</a>';
        navigation.appendChild(adminNavItem);
        
        // Add admin section to main content
        const mainViewport = document.querySelector('.primary-viewport');
        const adminSectionHTML = `
            <section id="admin-section" class="view-segment" style="display: none;">
                <header class="viewport-heading">
                    <h1>Admin Panel</h1>
                </header>
                
                <div class="data-enclosure">
                    <div class="enclosure-header">
                        <h2>Partner Institutions</h2>
                        <button class="prompt-button" onclick="openAddInstitutionModal()">Add Institution</button>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Institution Name</th>
                                <th>Email Domains</th>
                                <th>Discount %</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="institutionsTableBody">
                        </tbody>
                    </table>
                </div>
                
                <div class="data-enclosure">
                    <div class="enclosure-header">
                        <h2>Discount Usage Analytics</h2>
                        <button class="op-button op-info" onclick="refreshAnalytics()">Refresh</button>
                    </div>
                    <div class="metrics-matrix">
                        <div class="metric-capsule">
                            <h3>Total Codes Generated</h3>
                            <div class="figure" id="totalCodes">0</div>
                            <div class="delta">All time</div>
                        </div>
                        <div class="metric-capsule">
                            <h3>Codes Used</h3>
                            <div class="figure" id="usedCodes">0</div>
                            <div class="delta">Successful conversions</div>
                        </div>
                        <div class="metric-capsule">
                            <h3>Conversion Rate</h3>
                            <div class="figure" id="conversionRate">0%</div>
                            <div class="delta">Usage efficiency</div>
                        </div>
                    </div>
                </div>
            </section>
        `;
        
        mainViewport.insertAdjacentHTML('beforeend', adminSectionHTML);
        
        // Re-setup navigation to include admin
        setupNavigation();
        
        // Load admin data
        loadPartnerInstitutions();
        refreshAnalytics();
    }
}

// Load partner institutions
async function loadPartnerInstitutions() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/admin/partner-institutions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const institutions = await response.json();
        displayInstitutions(institutions);
    } catch (error) {
        console.error('Error loading partner institutions:', error);
    }
}

// Display institutions table
function displayInstitutions(institutions) {
    const tbody = document.getElementById('institutionsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    institutions.forEach(institution => {
        const row = `
            <tr>
                <td>${institution.institutionName}</td>
                <td>${institution.emailDomains.join(', ')}</td>
                <td>${institution.discountPercentage}%</td>
                <td>
                    <span class="state-indicator ${institution.isActive ? 'state-completed' : 'state-new'}">
                        ${institution.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="op-button op-info" onclick="editInstitution('${institution._id}')">Edit</button>
                    <button class="op-button op-caution" onclick="deactivateInstitution('${institution._id}')">
                        ${institution.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Refresh analytics
async function refreshAnalytics() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/admin/discount-analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const analytics = await response.json();
        
        document.getElementById('totalCodes').textContent = analytics.summary.totalCodes;
        document.getElementById('usedCodes').textContent = analytics.summary.usedCodes;
        
        const conversionRate = analytics.summary.totalCodes > 0 ? 
            ((analytics.summary.usedCodes / analytics.summary.totalCodes) * 100).toFixed(1) : '0';
        document.getElementById('conversionRate').textContent = conversionRate + '%';
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Placeholder admin functions (implement as needed)
function openAddInstitutionModal() {
    alert('Add Institution modal would open here');
}

function editInstitution(id) {
    alert(`Edit institution ${id}`);
}

async function deactivateInstitution(institutionId) {
    if (!confirm('Are you sure you want to change the status of this institution?')) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/admin/partner-institutions/${institutionId}/deactivate`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('Institution status updated successfully');
            loadPartnerInstitutions();
        } else {
            alert('Failed to update institution status');
        }
    } catch (error) {
        console.error('Error updating institution:', error);
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Add discount styles to the page
function addDiscountStyles() {
    const discountStyles = `
        <style>
        .discount-notification-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin: 2rem 0;
            position: relative;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .discount-notification-banner::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(30px, -30px);
        }

        .banner-content {
            position: relative;
            z-index: 2;
        }

        .banner-dismiss {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.3s ease;
        }

        .banner-dismiss:hover {
            opacity: 1;
        }

        .banner-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }

        .banner-icon {
            font-size: 2rem;
            margin-right: 1rem;
        }

        .banner-header h3 {
            margin: 0;
            font-size: 1.5rem;
        }

        .banner-message {
            line-height: 1.6;
            margin-bottom: 1.5rem;
            opacity: 0.95;
        }

        .banner-actions {
            display: flex;
            gap: 1rem;
        }

        .discount-code-item {
            background: #f8f9ff;
            border: 1px solid #e1e5fe;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1rem;
        }

        .discount-code-display {
            background: white;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .discount-code-value {
            font-family: 'Courier New', monospace;
            font-size: 1.3rem;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 2px;
        }

        .copy-code-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.3s ease;
        }

        .copy-code-btn:hover {
            background: #5a6fd8;
        }

        .discount-info {
            margin: 1rem 0 0 0;
            color: #666;
            font-size: 0.9rem;
            text-align: center;
        }

        .no-codes-message {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 2rem;
        }

        @media (max-width: 768px) {
            .banner-actions {
                flex-direction: column;
            }
            
            .discount-code-display {
                flex-direction: column;
                gap: 1rem;
            }
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', discountStyles);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('discountBannerDismissed');
        window.location.href = 'login.html';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('manuscriptModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ==========================================
// GLOBAL FUNCTION EXPORTS
// ==========================================

// Make functions available globally for onclick handlers
window.dismissDiscountNotification = dismissDiscountNotification;
window.generateInstitutionalDiscount = generateInstitutionalDiscount;
window.copyUserDiscountCode = copyUserDiscountCode;
window.refreshDiscountCodes = refreshDiscountCodes;
window.viewManuscript = viewManuscript;
window.closeModal = closeModal;
window.downloadManuscript = downloadManuscript;
window.downloadEditedVersion = downloadEditedVersion;
window.messageEditor = messageEditor;
window.exportSubmissions = exportSubmissions;
window.refreshDashboard = refreshDashboard;
window.switchTab = switchTab;
window.logout = logout;
window.openAddInstitutionModal = openAddInstitutionModal;
window.editInstitution = editInstitution;
window.deactivateInstitution = deactivateInstitution;
window.refreshAnalytics = refreshAnalytics;