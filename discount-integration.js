// Session validation - ADD THIS AT THE TOP OF THE FILE
function validateDashboardSession() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.replace('client-login.html');
        return false;
    }
    return true;
}

// Call session validation before any other initialization
if (!validateDashboardSession()) {
    throw new Error('Session invalid - redirecting to login');
}

console.log('Initializing HiTex EdiTex Dashboard...');
const API_BASE = 'https://all-branched-end.onrender.com';
let currentSection = 'dashboard';
let manuscripts = [];
let invoices = [];
let paymentHistory = [];
let dashboardSummary = null;
let currentUser = null;
let discountEligibilityData = null;
let userMessages = [];
let unreadMessageCount = 0;
let verificationState = {
    institutionalEmail: null,
    verificationSent: false,
    awaitingCode: false
};

// FUZZY MATCHING UTILITIES
function levenshteinDistance(str1, str2) {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[len2][len1];
}

function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - distance) / longer.length;
}

function normalizeInstitutionName(name) {
    return name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[^\w\s]/g, '')
        .replace(/\buniversity\b/g, 'univ')
        .replace(/\bcollege\b/g, 'coll')
        .replace(/\binstitute\b/g, 'inst')
        .replace(/\btechnology\b/g, 'tech')
        .replace(/\bof\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function generateSearchVariations(originalName) {
    const variations = [originalName];
    const name = originalName.toLowerCase();
    
    // Common abbreviations to full forms
    const expansions = {
        'mit': 'massachusetts institute of technology',
        'ucla': 'university of california los angeles',
        'usc': 'university of southern california',
        'nyu': 'new york university',
        'ucsd': 'university of california san diego',
        'ucsb': 'university of california santa barbara',
        'ucb': 'university of california berkeley',
        'gt': 'georgia institute of technology',
        'cmu': 'carnegie mellon university',
        'uic': 'university of illinois chicago',
        'ut': 'university of texas',
        'uw': 'university of washington'
    };

    // Full forms to common abbreviations
    const abbreviations = {
        'massachusetts institute of technology': 'mit',
        'university of california los angeles': 'ucla',
        'university of southern california': 'usc',
        'new york university': 'nyu',
        'georgia institute of technology': 'georgia tech',
        'carnegie mellon university': 'cmu'
    };

    // Add expansions
    if (expansions[name]) {
        variations.push(expansions[name]);
    }

    // Add abbreviations
    if (abbreviations[name]) {
        variations.push(abbreviations[name]);
    }

    // Add variations with/without common words
    if (name.includes(' university')) {
        variations.push(name.replace(' university', ''));
        variations.push(name.replace(' university', ' univ'));
    }
    if (name.includes(' college')) {
        variations.push(name.replace(' college', ''));
        variations.push(name.replace(' college', ' coll'));
    }
    if (name.includes(' institute')) {
        variations.push(name.replace(' institute', ' inst'));
    }

    // Add "University of" prefix variations
    if (!name.startsWith('university of')) {
        variations.push(`university of ${name}`);
    }

    return [...new Set(variations)]; // Remove duplicates
}

// ENHANCED INSTITUTION RECOGNITION FUNCTION
async function recognizeInstitutionWithFuzzyMatching(userInput) {
    console.log('Starting enhanced institution recognition for:', userInput);
    
    let bestMatch = null;
    let bestScore = 0;
    let allResults = [];

    try {
        // Generate search variations
        const searchVariations = generateSearchVariations(userInput);
        console.log('Search variations:', searchVariations);

        // Try each variation
        for (const variation of searchVariations) {
            try {
               const apiResponse = await fetch(`${API_BASE}/api/search-universities?name=${encodeURIComponent(variation)}`);
                const universities = await apiResponse.json();
                
                if (universities && universities.length > 0) {
                    allResults.push(...universities);
                }
            } catch (error) {
                console.log(`Search failed for variation: ${variation}`, error);
            }
        }

        // Remove duplicates based on name
        const uniqueResults = [];
        const seen = new Set();
        for (const uni of allResults) {
            if (!seen.has(uni.name.toLowerCase())) {
                seen.add(uni.name.toLowerCase());
                uniqueResults.push(uni);
            }
        }

        console.log(`Found ${uniqueResults.length} unique universities from API`);

        // If we have exact matches, prioritize them
        for (const university of uniqueResults) {
            if (university.name.toLowerCase() === userInput.toLowerCase()) {
                return {
                    recognized: true,
                    data: university,
                    confidence: 1.0,
                    matchType: 'exact'
                };
            }
        }

        // Calculate similarity scores for fuzzy matching
        for (const university of uniqueResults) {
            const similarity = calculateSimilarity(userInput, university.name);
            const normalizedSimilarity = calculateSimilarity(
                normalizeInstitutionName(userInput), 
                normalizeInstitutionName(university.name)
            );
            
            // Use the higher of the two similarity scores
            const score = Math.max(similarity, normalizedSimilarity);
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = university;
            }
        }

        // Define confidence thresholds
        const HIGH_CONFIDENCE = 0.85;
        const MEDIUM_CONFIDENCE = 0.70;
        
        if (bestScore >= HIGH_CONFIDENCE) {
            console.log(`High confidence match found: ${bestMatch.name} (${bestScore.toFixed(2)})`);
            return {
                recognized: true,
                data: bestMatch,
                confidence: bestScore,
                matchType: 'high-fuzzy'
            };
        } else if (bestScore >= MEDIUM_CONFIDENCE) {
            console.log(`Medium confidence match found: ${bestMatch.name} (${bestScore.toFixed(2)})`);
            return {
                recognized: true,
                data: bestMatch,
                confidence: bestScore,
                matchType: 'medium-fuzzy',
                suggestedName: bestMatch.name
            };
        } else {
            console.log(`No confident match found. Best score: ${bestScore.toFixed(2)}`);
            return {
                recognized: false,
                confidence: bestScore,
                bestGuess: bestMatch ? bestMatch.name : null
            };
        }

    } catch (error) {
        console.error('Enhanced institution recognition failed:', error);
        return {
            recognized: false,
            error: error.message
        };
    }
}


// ==========================================
// DASHBOARD INITIALIZATION
// ==========================================

// UPDATED DASHBOARD INITIALIZATION
// ==========================================

// UPDATE the existing DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'client-login.html';
        return;
    }
    
    console.log('Dashboard initializing with invoice integration...');
    
    // Show loading state
    document.getElementById('profileName').textContent = 'Loading...';
    
    const headers = { 'Authorization': `Bearer ${token}` };

    // Load core data with invoice integration
    await loadProfileInfo(headers);
    await loadManuscriptsWithInvoices(headers);
    await loadDashboardSummary(headers);
    await loadInvoices(headers);
    await loadPaymentHistory(headers);
    await loadUserMessages(headers);
    
    // Update dashboard with new invoice data
    updateDashboardStats();
    setupNavigation();
    
    // Initialize discount system
    setTimeout(async () => {
        await initializeDiscountSystem();
    }, 500);
    
    await checkAdminAccess();
    addInvoiceStyles();
    
    document.getElementById('logoutButton').addEventListener('click', logout);
    
    console.log('Dashboard initialization complete with invoice integration');

    console.log('Dashboard initialization complete with invoice integration and manuscript notifications');

});

// ==========================================
// CORE DASHBOARD FUNCTIONS
// ==========================================

async function loadProfileInfo(headers, retryCount = 0) {
    try {
        const response = await fetch(`${API_BASE}/profile`, { headers });
        
        if (!response.ok) {
            if (response.status >= 500 && retryCount < 2) {
                console.log(`Server error loading profile, retrying... (${retryCount + 1}/3)`);
                setTimeout(() => {
                    loadProfileInfo(headers, retryCount + 1);
                }, 1000);
                return;
            }
            throw new Error(`HTTP ${response.status}: Failed to load profile`);
        }
        
        const profileData = await response.json();
        
        if (!profileData.firstName && retryCount < 3) {
            console.log(`Profile data not ready, retrying... (${retryCount + 1}/3)`);
            setTimeout(() => {
                loadProfileInfo(headers, retryCount + 1);
            }, 1000);
            return;
        }
        
        if (profileData) {
            currentUser = profileData;
            
            let displayName = profileData.firstName;
            if (!displayName && profileData.fullName) {
                displayName = profileData.fullName.split(' ')[0];
            }
            
            document.getElementById('profileName').textContent = displayName || 'Author';
            document.getElementById('profileEmail').textContent = profileData.email || '';
            
            console.log('Profile loaded successfully:', displayName);
        }
    } catch (err) {
        console.error('Failed to load profile info:', err);
        if (err.name === 'TypeError' && retryCount < 2) {
            setTimeout(() => {
                loadProfileInfo(headers, retryCount + 1);
            }, 1000);
        } else {
            document.getElementById('profileName').textContent = 'Author';
        }
    }
}

async function loadManuscriptsWithInvoices(headers) {
    try {
        const response = await fetch(`${API_BASE}/my-manuscripts-with-invoices`, { headers });
        manuscripts = await response.json();
        
        const list = document.getElementById('manuscriptList');
        list.innerHTML = '';
        
        if (manuscripts.length === 0) {
            list.innerHTML = '<tr><td colspan="7" style="text-align:center;">You have not submitted any manuscripts yet.</td></tr>';
            return;
        }
        
        manuscripts.forEach((doc, index) => {
            const statusClass = `state-${(doc.status || 'new').toLowerCase().replace(/\s+/g, '-')}`;
            const hasUnpaidInvoice = doc.hasUnpaidInvoice;
            const totalBilled = doc.totalBilled || 0;
            
            const row = list.insertRow();
            row.innerHTML = `
                <td>${new Date(doc.uploadDate).toLocaleDateString()}</td>
                <td>
                    ${doc.originalName || doc.title}
                    ${hasUnpaidInvoice ? '<br><small style="color: #dc3545;"><i class="fas fa-exclamation-triangle"></i> Payment Required</small>' : ''}
                </td>
                <td>${doc.wordCount || 'N/A'}</td>
                <td>${doc.serviceType || 'Standard Edit'}</td>
                <td><span class="state-indicator ${statusClass}">${doc.status || 'New'}</span></td>
                <td>$${totalBilled.toFixed(2)}</td>
                <td>
                    <button class="op-button op-primary" onclick="viewManuscript(${index})">View</button>
                    ${hasUnpaidInvoice ? 
                        `<button class="op-button op-caution" onclick="payInvoice(${index})">Pay Now</button>` : 
                        ''}
                    <button class="op-button op-info" onclick="downloadManuscript(${index})">Download</button>
                </td>
            `;
        });
        
        // Update table header to include billing column
        updateManuscriptTableHeader();
        
    } catch (err) {
        console.error('Failed to load manuscripts with invoices:', err);
    }
}


// FIND the existing updateDashboardStats function and REPLACE it with:

function updateDashboardStats() {
    // Use dashboard summary data if available
    if (dashboardSummary) {
        document.getElementById('totalManuscripts').textContent = dashboardSummary.manuscripts.total;
        document.getElementById('activeProjects').textContent = dashboardSummary.manuscripts.active;
        document.getElementById('completedProjects').textContent = dashboardSummary.manuscripts.completed;
        document.getElementById('outstandingBalance').textContent = `$${dashboardSummary.financial.outstandingBalance.toFixed(2)}`;
    } else {
        // Fallback to existing calculation
        document.getElementById('totalManuscripts').textContent = manuscripts.length;
        document.getElementById('activeProjects').textContent = manuscripts.filter(m => 
            ['assigned', 'in-progress', 'review'].includes((m.status || '').toLowerCase())
        ).length;
        document.getElementById('completedProjects').textContent = manuscripts.filter(m => 
            (m.status || '').toLowerCase() === 'completed'
        ).length;
        
        const outstandingBalance = manuscripts.reduce((sum, m) => {
            return sum + (m.hasUnpaidInvoice ? (m.totalBilled || 0) : 0);
        }, 0);
        document.getElementById('outstandingBalance').textContent = `$${outstandingBalance.toFixed(2)}`;
    }
    
    // Update recent activity with invoice information
    const recentActivity = document.getElementById('recentActivity');
    if (dashboardSummary && dashboardSummary.recentActivity.length > 0) {
        recentActivity.innerHTML = dashboardSummary.recentActivity.map(activity => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--grey);">
                <strong>${activity.description}</strong>
                <br><small>${new Date(activity.createdAt).toLocaleDateString()} - $${activity.amount.toFixed(2)}</small>
            </div>
        `).join('');
    } else if (manuscripts.length > 0) {
        const recent = manuscripts.slice(0, 3);
        recentActivity.innerHTML = recent.map(m => `
            <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--grey);">
                <strong>${m.originalName || m.title}</strong> - Status: ${m.status || 'New'}
                ${m.hasUnpaidInvoice ? '<br><small style="color: #dc3545;">Payment Required</small>' : ''}
                <br><small>${new Date(m.uploadDate).toLocaleDateString()}</small>
            </div>
        `).join('');
    } else {
        recentActivity.innerHTML = '<p>No recent activity to display.</p>';
    }

    // Add invoice notifications if there are unpaid invoices
    addInvoiceNotifications();
    addManuscriptNotifications();
    displayActiveProjects();
}

function displayActiveProjects() {
    const container = document.getElementById('activeProjectsList');
    if (!container) return;
    
    const activeProjects = manuscripts.filter(m => 
        ['assigned', 'in-progress', 'in progress', 'review'].includes((m.status || '').toLowerCase())
    );
    
    if (activeProjects.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No active projects at the moment.</p>';
        return;
    }
    
    container.innerHTML = activeProjects.map(m => `
        <div style="border: 1px solid #ddd; padding: 1.5rem; margin-bottom: 1rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0;">${m.originalName}</h3>
                    <p style="margin: 0; color: #666;">
                        Submitted: ${new Date(m.uploadDate).toLocaleDateString()} | 
                        Word Count: ${m.wordCount || 'N/A'}
                    </p>
                </div>
                <span class="state-indicator state-${(m.status || 'new').toLowerCase().replace(/\s+/g, '-')}">
                    ${m.status}
                </span>
            </div>
            <p style="margin: 1rem 0;"><strong>Service Type:</strong> ${m.serviceType || 'Standard Edit'}</p>
            ${m.editorNotes ? `
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
                    <strong>Latest Update:</strong>
                    <p style="margin: 0.5rem 0 0 0;">${m.editorNotes}</p>
                </div>
            ` : ''}
            <div style="margin-top: 1rem;">
                <button class="op-button op-info" onclick="viewManuscript(${manuscripts.indexOf(m)})">View Details</button>
                <button class="op-button op-secondary" onclick="messageEditor(${manuscripts.indexOf(m)})">Message Editor</button>
            </div>
        </div>
    `).join('');
}

// ADD MANUSCRIPT COMPLETION NOTIFICATIONS
function addManuscriptNotifications() {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;

    // Remove existing manuscript notifications first
    const existingManuscriptNotifications = notifications.querySelectorAll('.manuscript-notification');
    existingManuscriptNotifications.forEach(notification => notification.remove());

    // Check for completed manuscripts that haven't been acknowledged
    const completedManuscripts = manuscripts.filter(m => 
        m.status === 'completed' && 
        !localStorage.getItem(`notified_${m._id}`)
    );

    completedManuscripts.forEach(manuscript => {
        const alertHTML = `
            <div class="alert-item manuscript-notification" style="background: #d4edda; border-left: 4px solid #28a745; animation: slideInFromTop 0.5s ease-out;">
                <h4><i class="fas fa-check-circle"></i> Manuscript Ready!</h4>
                <p>Your manuscript "<strong>${manuscript.originalName || manuscript.title}</strong>" has been completed and is ready for download.</p>
                ${manuscript.editorNotes ? `
                    <div style="background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 4px; margin: 0.5rem 0;">
                        <strong>Editor's Notes:</strong>
                        <p style="margin: 0.25rem 0 0 0;">${manuscript.editorNotes}</p>
                    </div>
                ` : ''}
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="op-button op-confirm" onclick="viewCompletedManuscript('${manuscript._id}')">
                        <i class="fas fa-eye"></i> View & Download
                    </button>
                    <button class="op-button op-info" onclick="dismissManuscriptNotification('${manuscript._id}')">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        notifications.insertAdjacentHTML('afterbegin', alertHTML);
    });
}

function viewCompletedManuscript(manuscriptId) {
    const index = manuscripts.findIndex(m => m._id === manuscriptId);
    if (index !== -1) {
        viewManuscript(index);
        localStorage.setItem(`notified_${manuscriptId}`, 'true');
        dismissManuscriptNotification(manuscriptId);
    }
}

function dismissManuscriptNotification(manuscriptId) {
    const notifications = document.querySelectorAll('.manuscript-notification');
    notifications.forEach(notification => notification.remove());
    localStorage.setItem(`notified_${manuscriptId}`, 'true');
}

// OPTIONAL: AUTO-REFRESH FOR NEW MANUSCRIPTS
function startManuscriptPolling() {
    setInterval(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const headers = { 'Authorization': `Bearer ${token}` };
        const previousCount = manuscripts.length;
        
        await loadManuscriptsWithInvoices(headers);
        
        // Check if there are new completed manuscripts
        if (manuscripts.length > previousCount || 
            manuscripts.some(m => m.status === 'completed' && !localStorage.getItem(`notified_${m._id}`))) {
            addManuscriptNotifications();
        }
    }, 60000); // Check every minute
}

function setupNavigation() {
    // Add invoices LINK to navigation if it doesn't exist
    const navigation = document.querySelector('.pillar-directory ul');
    if (navigation && !document.querySelector('a[href="invoice.html"]')) {
        const invoicesNavItem = document.createElement('li');
        invoicesNavItem.innerHTML = '<a href="invoice.html" class="pillar-link">Invoices & Payments</a>';
        
        // Insert after "My Submissions" and before "Active Projects"
        const projectsNavItem = document.querySelector('[data-section="projects"]');
        if (projectsNavItem) {
            projectsNavItem.parentNode.insertBefore(invoicesNavItem, projectsNavItem);
        } else {
            navigation.appendChild(invoicesNavItem);
        }
    }

    // Setup navigation event listeners
    document.querySelectorAll('.pillar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const section = e.target.getAttribute('data-section');
            const href = e.target.getAttribute('href');
            
            // Let external links work normally
            if (href && href.endsWith('.html')) {
                return; // Don't prevent default - allow navigation
            }
            
            // Handle internal sections only
            if (section) {
                e.preventDefault();
                showSection(section);
                document.querySelectorAll('.pillar-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    });
}

function showSection(sectionName) {
    document.querySelectorAll('.view-segment').forEach(section => {
        section.style.display = 'none';
    });
    
    const section = document.getElementById(sectionName + '-section');
    if (section) {
        section.style.display = 'block';
        currentSection = sectionName;
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.switcher-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.switcher-pane').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // If switching to message tabs, display appropriate messages
    if (['inbox', 'unread', 'archived'].includes(tabName)) {
        displayMessages(tabName === 'inbox' ? 'inbox' : tabName);
    }
}
// ==========================================
// MANUSCRIPT MANAGEMENT FUNCTIONS
// ==========================================

function viewManuscript(index) {
    const manuscript = manuscripts[index];
    const modal = document.getElementById('manuscriptModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = manuscript.originalName || manuscript.title;
    
    // Build invoice section HTML
    let invoiceHTML = '';
    if (manuscript.invoices && manuscript.invoices.length > 0) {
        const unpaidInvoices = manuscript.invoices.filter(inv => inv.paymentStatus === 'unpaid');
        const paidInvoices = manuscript.invoices.filter(inv => inv.paymentStatus === 'paid');
        
        invoiceHTML = `
            <div style="margin: 1.5rem 0; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
                <strong>Billing Information:</strong>
                ${unpaidInvoices.length > 0 ? `
                    <div style="margin: 0.5rem 0; padding: 0.5rem; background: #fff3cd; border-left: 3px solid #ffc107;">
                        <strong>Unpaid Invoices (${unpaidInvoices.length}):</strong>
                        ${unpaidInvoices.map(inv => `
                            <div style="margin: 0.25rem 0;">
                                ${inv.invoiceNumber} - $${inv.total.toFixed(2)} 
                                <button class="op-button op-small op-caution" onclick="viewInvoiceDetails('${inv.invoiceNumber}')">Pay</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${paidInvoices.length > 0 ? `
                    <div style="margin: 0.5rem 0;">
                        <strong>Payment History:</strong>
                        ${paidInvoices.map(inv => `
                            <div style="margin: 0.25rem 0; color: #28a745;">
                                ${inv.invoiceNumber} - $${inv.total.toFixed(2)} (Paid)
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div style="margin-top: 0.5rem;">
                    <strong>Total Billed:</strong> $${manuscript.totalBilled.toFixed(2)}
                </div>
            </div>
        `;
    }
    
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
        ${invoiceHTML}
        ${manuscript.quote ? `
            <div style="margin-bottom: 1rem;">
                <strong>Quote:</strong> ${manuscript.quote}
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
            ${manuscript.hasUnpaidInvoice ? `
                <button class="op-button op-caution" onclick="payInvoice(${index})">Pay Invoice</button>
            ` : `
                <button class="op-button op-info" onclick="generateInvoiceForManuscript(${index})">Generate Invoice</button>
            `}
            <button class="op-button op-info" onclick="messageEditor(${index})">Message Editor</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeModal() {
    document.querySelectorAll('.overlay-dialog').forEach(modal => {
        modal.style.display = 'none';
    });
}

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

// REFRESH CODE

async function refreshDashboard() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    const refreshBtn = event.target;
    refreshBtn.textContent = 'Refreshing...';
    refreshBtn.disabled = true;
    
    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        await loadManuscriptsWithInvoices(headers);
        updateDashboardStats();
        
        // Remove any existing refresh notificationssss
        const existingRefreshNotifications = document.querySelectorAll('.refresh-notification');
        existingRefreshNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = 'alert-item refresh-notification'; // Add specific class
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
// INSTITUTIONAL DISCOUNT SYSTEM - FIXED VERSION
// ==========================================

async function initializeDiscountSystem() {
    console.log('Initializing discount system...');
    
    // Always insert components first
    insertDiscountComponents();
    
    // ALWAYS check eligibility regardless of dismissal for institutional signup users
    await checkUserDiscountEligibility();
    
    // Load discount history
    await loadUserDiscountHistory();
    
    console.log('Discount system initialized');
}

function insertDiscountComponents() {
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (dashboardSection) {
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
            metricsMatrix.insertAdjacentHTML('afterend', discountCodesHTML);
        }
    }
}

// MAIN DISCOUNT ELIGIBILITY CHECK - SINGLE CLEAN VERSION
async function checkUserDiscountEligibility() {
    console.log('Starting discount eligibility check with fuzzy matching...');
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('No auth token found');
        return;
    }
    
    try {
        // Get user profile directly
        const profileResponse = await fetch(`${API_BASE}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!profileResponse.ok) {
            console.log('Failed to fetch profile');
            return;
        }
        
        const profile = await profileResponse.json();
        console.log('User profile loaded:', profile);
        console.log('User institution from signup:', profile.currentInstitution);
        
        // CRITICAL: If no institution entered during signup, show nothing
        if (!profile.currentInstitution || profile.currentInstitution.trim() === '') {
            console.log('No institution entered during signup - no alerts needed');
            return;
        }
        
        console.log('Institution found during signup:', profile.currentInstitution);
        
        // Check if user already has verified institutional status
        if (profile.institutionalEmailVerified && profile.eligibleDiscountId) {
            console.log('User already verified - showing success message');
            showVerifiedInstitutionalStatus(profile);
            return;
        }
        
        // Use enhanced recognition with fuzzy matching
        const recognitionResult = await recognizeInstitutionWithFuzzyMatching(profile.currentInstitution);
        
        console.log('Recognition result:', recognitionResult);
        
        if (recognitionResult.recognized) {
            if (recognitionResult.matchType === 'medium-fuzzy' && recognitionResult.suggestedName) {
                // Show recognition alert with name suggestion
                showRecognizedInstitutionAlertWithSuggestion(
                    profile.currentInstitution, 
                    recognitionResult.data,
                    recognitionResult.suggestedName
                );
            } else {
                // Show standard recognition alert
                showRecognizedInstitutionAlert(profile.currentInstitution, recognitionResult.data);
            }
        } else {
            // Show unrecognized alert, possibly with best guess
            showUnrecognizedInstitutionAlert(profile.currentInstitution, recognitionResult.bestGuess);
        }
        
    } catch (error) {
        console.error('Error in discount eligibility check:', error);
    }
}

// ENHANCED ALERT FUNCTIONS WITH FUZZY MATCHING FEEDBACK
// OPTION 2A: Institution recognized with suggestion (for medium confidence matches)
function showRecognizedInstitutionAlertWithSuggestion(institutionName, institutionData, suggestedName) {
    console.log('Showing recognized institution alert with suggestion for:', institutionData.name);
    
    const notifications = document.getElementById('notifications');
    if (!notifications) {
        console.error('Notifications element not found!');
        return;
    }
    
    clearExistingInstitutionalAlerts();
    
    const alertHTML = `
        <div class="institutional-discount-alert" id="institutionalAlert" style="
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            position: relative;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
        ">
            
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 2rem; margin-right: 15px;">🎓</div>
                <h3 style="margin: 0; font-size: 1.4rem;">Institution Recognized!</h3>
            </div>
            
            <p style="margin-bottom: 15px; line-height: 1.6; opacity: 0.95;">
                We found a close match for <strong>"${institutionName}"</strong>: <strong>${suggestedName}</strong>. 
                Please verify your institutional email to unlock your <strong>15% discount</strong> on all editing services.
            </p>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="verify-email-btn" onclick="startEmailVerification()" style="
                    background: white;
                    color: #45a049;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Verify Institutional Email</button>
                <button onclick="dismissInstitutionalAlert()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                ">Maybe Later</button>
            </div>
        </div>
    `;
    
    notifications.insertAdjacentHTML('afterbegin', alertHTML);
    console.log('Recognized institution alert with suggestion added to DOM');
}


// OPTION 2: Institution is recognized in API (standard version)
function showRecognizedInstitutionAlert(institutionName, institutionData) {
    console.log('Showing recognized institution alert for:', institutionData.name);
    
    const notifications = document.getElementById('notifications');
    if (!notifications) {
        console.error('Notifications element not found!');
        return;
    }
    
    clearExistingInstitutionalAlerts();
    
    const alertHTML = `
        <div class="institutional-discount-alert" id="institutionalAlert" style="
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            position: relative;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
        ">
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 2rem; margin-right: 15px;">🎓</div>
                <h3 style="margin: 0; font-size: 1.4rem;">Institution Recognized!</h3>
            </div>
            
            <p style="margin-bottom: 15px; line-height: 1.6; opacity: 0.95;">
                We recognize <strong>"${institutionData.name}"</strong> from your signup! 
                Please verify your institutional email to unlock your <strong>15% discount</strong> on all editing services.
            </p>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="verify-email-btn" onclick="startEmailVerification()" style="
                    background: white;
                    color: #45a049;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Verify Institutional Email</button>
                <button onclick="dismissInstitutionalAlert()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                ">Maybe Later</button>
            </div>
        </div>
    `;
    
    notifications.insertAdjacentHTML('afterbegin', alertHTML);
    console.log('Recognized institution alert added to DOM');
}

// ENHANCED UNRECOGNIZED ALERT WITH BEST GUESS
function showUnrecognizedInstitutionAlert(institutionName, bestGuess = null) {
    console.log('Showing unrecognized institution alert for:', institutionName);
    
    const notifications = document.getElementById('notifications');
    if (!notifications) {
        console.error('Notifications element not found!');
        return;
    }
    
    clearExistingInstitutionalAlerts();
    
    let suggestionText = '';
    if (bestGuess) {
        suggestionText = `<br><small style="opacity: 0.8;">Did you mean <strong>${bestGuess}</strong>?</small>`;
    }
    
    const alertHTML = `
        <div class="institutional-discount-alert" id="institutionalAlert" style="
            background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            position: relative;
            box-shadow: 0 4px 20px rgba(255, 152, 0, 0.3);
        ">
            
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 2rem; margin-right: 15px;">🏛️</div>
                <h3 style="margin: 0; font-size: 1.4rem;">Institution Verification Available!</h3>
            </div>
            
            <p style="margin-bottom: 15px; line-height: 1.6; opacity: 0.95;">
                You entered <strong>"${institutionName}"</strong> during signup. While this institution isn't in our partner database, 
                we can still verify if you qualify for discounts through email verification.${suggestionText}
            </p>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="verify-email-btn" onclick="startEmailVerification()" style="
                    background: white;
                    color: #f57c00;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">Verify Institutional Email</button>
                <button onclick="dismissInstitutionalAlert()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                ">Maybe Later</button>
            </div>
        </div>
    `;
    
    notifications.insertAdjacentHTML('afterbegin', alertHTML);
    console.log('Unrecognized institution alert added to DOM');
}

// Show success message for already verified users
function showVerifiedInstitutionalStatus(profile) {
    console.log('Showing verified status for user');
    
    const notifications = document.getElementById('notifications');
    if (!notifications) return;
    
    clearExistingInstitutionalAlerts();
    
    const alertHTML = `
        <div class="institutional-discount-alert" id="institutionalAlert" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin: 20px 0;
            position: relative;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        ">
            
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 2rem; margin-right: 15px;">✅</div>
                <h3 style="margin: 0; font-size: 1.4rem;">Institutional Discount Active!</h3>
            </div>
            
            <p style="margin-bottom: 15px; line-height: 1.6; opacity: 0.95;">
                Your institutional email has been verified! You're eligible for <strong>15% off</strong> all editing services.
                Check your discount codes section below.
            </p>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button onclick="generateInstitutionalDiscount()" style="
                    background: white;
                    color: #764ba2;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                ">Generate New Code</button>
                <button onclick="dismissInstitutionalAlert()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                ">Dismiss</button>
            </div>
        </div>
    `;
    
    notifications.insertAdjacentHTML('afterbegin', alertHTML);
    
    // Also show discount codes section
    const discountSection = document.getElementById('discountCodesSection');
    if (discountSection) {
        discountSection.style.display = 'block';
    }
}

// Helper function to clear existing institutional alerts
function clearExistingInstitutionalAlerts() {
    const existingAlert = document.getElementById('institutionalAlert');
    if (existingAlert) {
        existingAlert.remove();
    }
}

// Dismiss alert function
async function dismissInstitutionalAlert() {
    const alert = document.getElementById('institutionalAlert');
    if (alert) {
        alert.remove();
    }
    
    // Create message reminder
    try {
        const token = localStorage.getItem('authToken');
        const profile = currentUser;
        
        if (profile && profile.currentInstitution) {
            await fetch(`${API_BASE}/create-discount-reminder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    institutionName: profile.currentInstitution
                })
            });
            
            // Reload messages
            await loadUserMessages({ 'Authorization': `Bearer ${token}` });
        }
    } catch (error) {
        console.error('Error creating discount reminder:', error);
    }
    
    console.log('Institutional alert dismissed');
}



// EMAIL VERIFICATION FUNCTIONS
async function startEmailVerification() {
    console.log('Starting email verification process');
    
    // If we're already awaiting a code, show the code input modal
    if (verificationState.awaitingCode && verificationState.institutionalEmail) {
        showVerificationCodeModal();
        return;
    }
    
    // Show email input modal instead of prompt
    showEmailInputModal();
}
// ENDED

async function confirmEmailVerification(institutionalEmail, code) {
    console.log('Confirming email verification');
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/confirm-institutional-email-for-discount`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ institutionalEmail, code })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`Email verified successfully! You're now eligible for ${result.discountPercentage}% discount on all services.`);
            
            // Clear verification state on success
            verificationState = {
                institutionalEmail: null,
                verificationSent: false,
                awaitingCode: false
            };
            
            // Clear the current alert
            dismissInstitutionalAlert();
            
            // Reload the discount system to show verified status
            setTimeout(() => {
                checkUserDiscountEligibility();
                loadUserDiscountHistory();
            }, 1000);
            
        } else {
            // FIXED: Better handling of verification failures
            if (result.error.includes('Invalid or expired')) {
                if (confirm('The verification code is invalid or has expired. Would you like us to send a new code?')) {
                    requestNewVerificationCode(); // Don't ask for email again
                }
            } else {
                alert('Verification failed: ' + result.error);
            }
        }
        
    } catch (error) {
        console.error('Error confirming email verification:', error);
        alert('Failed to verify email. Please try again.');
    }
}

// ENDED

// NEW: Separate function to prompt for verification code (fixes popup disappearing issue)

function promptForVerificationCode() {
    if (!verificationState.institutionalEmail) {
        alert('Please start the verification process first');
        startEmailVerification();
        return;
    }
    
    // Show modal instead of prompt
    showVerificationCodeModal();
}

// NEW: Function to request a new verification code without re-entering email (fixes issue #2)
async function requestNewVerificationCode() {
    if (!verificationState.institutionalEmail) {
        alert('Please start the verification process first');
        startEmailVerification();
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/verify-institutional-email-for-discount`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ institutionalEmail: verificationState.institutionalEmail })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`New verification code sent to ${verificationState.institutionalEmail}!`);
            setTimeout(() => {
                promptForVerificationCode();
            }, 1000);
        } else {
            alert('Error sending new code: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error requesting new verification code:', error);
        alert('Failed to send new verification code. Please try again.');
    }
}

// NEW: Function to create appropriate verification button based on state

function createVerificationButton() {
    const buttonText = verificationState.awaitingCode ? 
        'Enter Verification Code' : 
        'Verify Institutional Email';
    
    const clickFunction = verificationState.awaitingCode ? 
        'promptForVerificationCode()' : 
        'startEmailVerification()';
    
    return `<button class="verify-email-btn" onclick="${clickFunction}" style="
        background: white;
        color: #45a049;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    ">${buttonText}</button>`;
}

function showEmailInputModal() {
    const modal = document.getElementById('emailVerificationModal');
    const title = document.getElementById('verificationModalTitle');
    const body = document.getElementById('verificationModalBody');
    
    title.textContent = 'Verify Institutional Email';
    body.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <p>Please enter your institutional email address to verify your discount eligibility:</p>
        </div>
        <div class="form-group">
            <label for="institutionalEmailInput">Institutional Email:</label>
            <input type="email" id="institutionalEmailInput" placeholder="your.name@university.edu" style="width: 100%; padding: 8px; margin: 8px 0;">
        </div>
        <div style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
            <p>We'll send a 6-digit verification code to this email address.</p>
        </div>
        <div class="form-actions">
            <button type="button" class="op-button" onclick="closeVerificationModal()">Cancel</button>
            <button type="button" class="prompt-button" onclick="sendVerificationCode()" id="sendCodeBtn">Send Code</button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Focus on input and allow Enter key
    setTimeout(() => {
        const input = document.getElementById('institutionalEmailInput');
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendVerificationCode();
            }
        });
    }, 100);
}

// NEW: Send verification code (called from modal)
async function sendVerificationCode() {
    const emailInput = document.getElementById('institutionalEmailInput');
    const institutionalEmail = emailInput.value.trim();
    
    if (!institutionalEmail || !institutionalEmail.includes('@')) {
        alert('Please enter a valid email address');
        emailInput.focus();
        return;
    }
    
    const sendBtn = document.getElementById('sendCodeBtn');
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled = true;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/verify-institutional-email-for-discount`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ institutionalEmail })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Update verification state
            verificationState.institutionalEmail = institutionalEmail;
            verificationState.verificationSent = true;
            verificationState.awaitingCode = true;
            
            // Show success message and switch to code input
            setTimeout(() => {
                showVerificationCodeModal();
            }, 500);
            
        } else {
            alert('Error: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error sending verification code:', error);
        alert('Failed to send verification email. Please try again.');
    } finally {
        sendBtn.textContent = 'Send Code';
        sendBtn.disabled = false;
    }
}

function showVerificationCodeModal() {
    const modal = document.getElementById('emailVerificationModal');
    const title = document.getElementById('verificationModalTitle');
    const body = document.getElementById('verificationModalBody');
    
    title.textContent = 'Enter Verification Code';
    body.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <p>We've sent a 6-digit verification code to:</p>
            <p style="font-weight: bold; color: #2c5aa0;">${verificationState.institutionalEmail}</p>
        </div>
        <div class="form-group">
            <label for="verificationCodeInput">Verification Code:</label>
            <input type="text" id="verificationCodeInput" placeholder="123456" maxlength="6" 
                   style="width: 100%; padding: 12px; margin: 8px 0; text-align: center; font-size: 1.2rem; letter-spacing: 2px;">
        </div>
        <div style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
            <p>Enter the 6-digit code from your email. The code expires in 15 minutes.</p>
        </div>
        <div class="form-actions">
            <button type="button" class="op-button op-info" onclick="resendVerificationCode()">Resend Code</button>
            <button type="button" class="op-button" onclick="closeVerificationModal()">Cancel</button>
            <button type="button" class="prompt-button" onclick="submitVerificationCode()" id="submitCodeBtn">Verify</button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Focus on input and format code as user types
    setTimeout(() => {
        const input = document.getElementById('verificationCodeInput');
        input.focus();
        
        // Format input (numbers only, max 6 digits)
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
        });
        
        // Allow Enter key to submit
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.length === 6) {
                submitVerificationCode();
            }
        });
    }, 100);
}

// NEW: Submit verification code (called from modal)
async function submitVerificationCode() {
    const codeInput = document.getElementById('verificationCodeInput');
    const code = codeInput.value.trim();
    
    if (!code || code.length !== 6) {
        alert('Please enter a valid 6-digit code');
        codeInput.focus();
        return;
    }
    
    const submitBtn = document.getElementById('submitCodeBtn');
    submitBtn.textContent = 'Verifying...';
    submitBtn.disabled = true;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/confirm-institutional-email-for-discount`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                institutionalEmail: verificationState.institutionalEmail, 
                code: code 
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Success! Close modal and show success
            closeVerificationModal();
            
            alert(`Email verified successfully! You're now eligible for ${result.discountPercentage}% discount on all services.`);
            
            // Clear verification state
            verificationState = {
                institutionalEmail: null,
                verificationSent: false,
                awaitingCode: false
            };
            
            // Clear the current alert and reload discount system
            dismissInstitutionalAlert();
            
            setTimeout(() => {
                checkUserDiscountEligibility();
                loadUserDiscountHistory();
            }, 1000);
            
        } else {
            // Handle verification failures
            if (result.error.includes('Invalid or expired')) {
                const retry = confirm('The verification code is invalid or has expired. Would you like us to send a new code?');
                if (retry) {
                    resendVerificationCode();
                }
            } else {
                alert('Verification failed: ' + result.error);
            }
        }
        
    } catch (error) {
        console.error('Error confirming email verification:', error);
        alert('Failed to verify email. Please try again.');
    } finally {
        submitBtn.textContent = 'Verify';
        submitBtn.disabled = false;
    }
}

async function resendVerificationCode() {
    if (!verificationState.institutionalEmail) {
        alert('Please start the verification process again');
        closeVerificationModal();
        startEmailVerification();
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/verify-institutional-email-for-discount`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ institutionalEmail: verificationState.institutionalEmail })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`New verification code sent to ${verificationState.institutionalEmail}!`);
            // Clear the input field for new code
            const input = document.getElementById('verificationCodeInput');
            if (input) {
                input.value = '';
                input.focus();
            }
        } else {
            alert('Error sending new code: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error resending verification code:', error);
        alert('Failed to send new verification code. Please try again.');
    }
}

// NEW: Close verification modal
function closeVerificationModal() {
    const modal = document.getElementById('emailVerificationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// DISCOUNT CODE FUNCTIONS
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
            dismissInstitutionalAlert();
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

function refreshDiscountCodes() {
    loadUserDiscountHistory();
}

// ==========================================
// ADMIN PANEL FUNCTIONS
// ==========================================

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

function showAdminPanel() {
    const navigation = document.querySelector('.pillar-directory ul');
    if (navigation && !document.querySelector('[data-section="admin"]')) {
        const adminNavItem = document.createElement('li');
        adminNavItem.innerHTML = '<a href="#" class="pillar-link" data-section="admin">Admin Panel</a>';
        navigation.appendChild(adminNavItem);
        
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
        // Create the Add Institution Modal for admin users
        const modalHTML = `
            <div id="addInstitutionModal" class="overlay-dialog" style="display: none;">
                <div class="dialog-box">
                    <button class="dialog-dismiss" onclick="closeModal()">&times;</button>
                    <h3>Add Partner Institution</h3>
                    <form style="margin-top: 1rem;">
                        <div class="form-group">
                            <label for="institutionName">Institution Name:</label>
                            <input type="text" id="institutionName" required>
                        </div>
                        <div class="form-group">
                            <label for="emailDomains">Email Domains (comma separated):</label>
                            <input type="text" id="emailDomains" placeholder="university.edu, college.edu" required>
                        </div>
                        <div class="form-group">
                            <label for="discountPercentage">Discount Percentage:</label>
                            <input type="number" id="discountPercentage" min="1" max="50" required>
                        </div>
                        <div class="form-group">
                            <label for="contactEmail">Contact Email:</label>
                            <input type="email" id="contactEmail">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="op-button" onclick="closeModal()">Cancel</button>
                            <button type="submit" class="prompt-button">Add Institution</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Insert the modal into the document body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupNavigation();
        loadPartnerInstitutions();
        refreshAnalytics();
    }
}

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

function openAddInstitutionModal() {
    const modal = document.getElementById('addInstitutionModal');
    if (modal) {
        modal.style.display = 'flex';
    }
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

function addInvoiceStyles() {
    const invoiceStyles = `
        <style>
        .payment-history-item:hover {
            background: #f8f9fa;
            cursor: pointer;
        }
        
        .invoice-filters {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .invoice-filters select {
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .invoice-notification {
            animation: slideInFromTop 0.5s ease-out;
        }
        
        .op-button.op-small {
            padding: 0.25rem 0.5rem;
            font-size: 0.8rem;
            margin-left: 0.5rem;
        }
        
        .state-unpaid {
            background: #f8d7da;
            color: #721c24;
        }
        
        .state-paid {
            background: #d4edda;
            color: #155724;
        }
        
        .state-pending {
            background: #fff3cd;
            color: #856404;
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

        .institutional-discount-alert {
            animation: slideInFromTop 0.5s ease-out;
        }

        @keyframes slideInFromTop {
            from {
                transform: translateY(-20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            .payment-history-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
            
            .invoice-filters {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .discount-code-display {
                flex-direction: column;
                gap: 1rem;
            }
        }

         .message-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    margin-bottom: 1rem;
    overflow: hidden;
    transition: all 0.3s ease;
}

.message-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.message-unread {
    background: #f0f7ff;
    border-left: 4px solid #2c5aa0;
}

.message-read {
    background: white;
}

.message-priority-high {
    border-left-color: #dc3545 !important;
}

.message-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    gap: 1rem;
}

.message-icon {
    font-size: 1.5rem;
}

.message-info {
    flex: 1;
}

.message-info strong {
    display: block;
    margin-bottom: 0.25rem;
}

.message-info small {
    color: #666;
    font-size: 0.85rem;
}

.unread-indicator {
    color: #2c5aa0;
    font-size: 1.2rem;
}

.message-body {
    padding: 0 1rem 1rem 4rem;
    color: #444;
    line-height: 1.6;
}

.message-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
}
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', invoiceStyles);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userProfile');
        window.location.href = 'client-login.html';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.overlay-dialog');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// ADD NEW INVOICE FUNCTIONS AFTER EXISTING FUNCTIONS

async function loadDashboardSummary(headers) {
    try {
        const response = await fetch(`${API_BASE}/dashboard-summary`, { headers });
        dashboardSummary = await response.json();
        console.log('Dashboard summary loaded:', dashboardSummary);
    } catch (err) {
        console.error('Failed to load dashboard summary:', err);
    }
}

// Load user invoices
async function loadInvoices(headers) {
    try {
        const response = await fetch(`${API_BASE}/my-invoices?limit=20`, { headers });
        const data = await response.json();
        invoices = data.invoices || [];
        console.log('Invoices loaded:', invoices.length);
    } catch (err) {
        console.error('Failed to load invoices:', err);
    }
}

// Load payment history
async function loadPaymentHistory(headers) {
    try {
        const response = await fetch(`${API_BASE}/payment-history?limit=10`, { headers });
        const data = await response.json();
        paymentHistory = data.payments || [];
        console.log('Payment history loaded:', paymentHistory.length);
    } catch (err) {
        console.error('Failed to load payment history:', err);
    }
}

async function loadUserMessages(headers) {
    try {
        const response = await fetch(`${API_BASE}/my-messages?filter=inbox&limit=50`, { headers });
        const data = await response.json();
        userMessages = data.messages || [];
        unreadMessageCount = data.unreadCount || 0;
        
        console.log('Messages loaded:', userMessages.length, 'Unread:', unreadMessageCount);
        
        updateMessageCount();
        displayMessages();
    } catch (err) {
        console.error('Failed to load messages:', err);
    }
}

function updateMessageCount() {
    const messagesTab = document.querySelector('[onclick="switchTab(\'inbox\')"]');
    if (messagesTab && unreadMessageCount > 0) {
        messagesTab.textContent = `Inbox (${unreadMessageCount})`;
    }
}

function displayMessages(filter = 'inbox') {
    const container = document.getElementById(`${filter}-tab`);
    if (!container) return;
    
    let filteredMessages = userMessages;
    if (filter === 'unread') {
        filteredMessages = userMessages.filter(m => !m.read && !m.archived);
    } else if (filter === 'archived') {
        filteredMessages = userMessages.filter(m => m.archived);
    } else {
        filteredMessages = userMessages.filter(m => !m.archived);
    }
    
    if (filteredMessages.length === 0) {
        container.innerHTML = '<p style="padding: 2rem; color: var(--text-light); text-align: center;">No messages in this folder.</p>';
        return;
    }
    
    const messagesHTML = filteredMessages.map(message => {
        const messageTypeIcon = getMessageIcon(message.type);
        const priorityClass = message.priority === 'high' ? 'message-priority-high' : '';
        const readClass = message.read ? 'message-read' : 'message-unread';
        
        return `
            <div class="message-item ${readClass} ${priorityClass}" data-message-id="${message._id}">
                <div class="message-header" onclick="toggleMessage('${message._id}')">
                    <div class="message-icon">${messageTypeIcon}</div>
                    <div class="message-info">
                        <strong>${message.subject}</strong>
                        <small>${new Date(message.createdAt).toLocaleString()}</small>
                    </div>
                    ${!message.read ? '<span class="unread-indicator">●</span>' : ''}
                </div>
                <div class="message-body" id="message-body-${message._id}" style="display: none;">
                    <p>${message.content}</p>
                    ${message.metadata && message.metadata.manuscriptId ? `
                        <button class="op-button op-info op-small" onclick="viewManuscriptFromMessage('${message.metadata.manuscriptId}')">
                            View Manuscript
                        </button>
                    ` : ''}
                    ${message.type === 'discount' ? `
                   <button class="op-button op-confirm op-small" onclick="verifyFromMessage('${message._id}')">
                     Verify Now
                       </button>
                      ` : ''}
                    <div class="message-actions">
                        ${!message.archived ? `
                            <button class="op-button op-secondary op-small" onclick="archiveMessage('${message._id}')">Archive</button>
                        ` : ''}
                        <button class="op-button op-caution op-small" onclick="deleteMessage('${message._id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="message-list">${messagesHTML}</div>`;
}

async function verifyFromMessage(messageId) {
    // Mark message as read first
    await markMessageAsRead(messageId);
    
    // Switch to dashboard section
    showSection('dashboard');
    
    // Update active navigation
    document.querySelectorAll('.pillar-link').forEach(l => l.classList.remove('active'));
    const dashboardLink = document.querySelector('[data-section="dashboard"]');
    if (dashboardLink) dashboardLink.classList.add('active');
    
    // Wait for section to load, then directly open the email input modal
    setTimeout(() => {
        showEmailInputModal();
    }, 500);
}

function getMessageIcon(type) {
    const icons = {
        'manuscript': '📄',
        'discount': '🎓',
        'system': '⚙️',
        'general': '✉️'
    };
    return icons[type] || '✉️';
}

async function toggleMessage(messageId) {
    const messageBody = document.getElementById(`message-body-${messageId}`);
    const message = userMessages.find(m => m._id === messageId);
    
    if (!message) return;
    
    if (messageBody.style.display === 'none') {
        messageBody.style.display = 'block';
        
        if (!message.read) {
            await markMessageAsRead(messageId);
        }
    } else {
        messageBody.style.display = 'none';
    }
}

async function markMessageAsRead(messageId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/message/${messageId}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const message = userMessages.find(m => m._id === messageId);
            if (message) {
                message.read = true;
                unreadMessageCount = Math.max(0, unreadMessageCount - 1);
                updateMessageCount();
                
                const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
                if (messageElement) {
                    messageElement.classList.remove('message-unread');
                    messageElement.classList.add('message-read');
                    const unreadIndicator = messageElement.querySelector('.unread-indicator');
                    if (unreadIndicator) unreadIndicator.remove();
                }
            }
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

async function archiveMessage(messageId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/message/${messageId}/archive`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const message = userMessages.find(m => m._id === messageId);
            if (message) {
                message.archived = true;
                displayMessages('inbox');
            }
        }
    } catch (error) {
        console.error('Error archiving message:', error);
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/message/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            userMessages = userMessages.filter(m => m._id !== messageId);
            displayMessages('inbox');
        }
    } catch (error) {
        console.error('Error deleting message:', error);
    }
}

function viewManuscriptFromMessage(manuscriptId) {
    const index = manuscripts.findIndex(m => m._id === manuscriptId);
    if (index !== -1) {
        viewManuscript(index);
        showSection('submissions');
    }
}


// Add invoice notifications to the notifications area
function addInvoiceNotifications() {
    const notifications = document.getElementById('notifications');
    if (!notifications) return;

    // Remove existing invoice notifications
    const existingInvoiceNotifications = notifications.querySelectorAll('.invoice-notification');
    existingInvoiceNotifications.forEach(notification => notification.remove());

    // Count unpaid invoices
    const unpaidInvoices = invoices.filter(invoice => invoice.paymentStatus === 'unpaid');
    
    if (unpaidInvoices.length > 0) {
        const totalOwed = unpaidInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
        
        const alertHTML = `
            <div class="alert-item invoice-notification" style="background: #fff3cd; border-left: 4px solid #ffc107;">
                <h4><i class="fas fa-exclamation-triangle"></i> Payment Required</h4>
                <p>You have ${unpaidInvoices.length} unpaid invoice${unpaidInvoices.length > 1 ? 's' : ''} totaling 
                   <strong>$${totalOwed.toFixed(2)}</strong>. Please pay to continue editing services.</p>
                <div style="margin-top: 1rem;">
                    <button class="op-button op-caution" onclick="showInvoicesSection()">View Invoices</button>
                    ${unpaidInvoices.length === 1 ? 
                        `<button class="op-button op-primary" onclick="paySpecificInvoice('${unpaidInvoices[0]._id}')">Pay Now</button>` : 
                        ''}
                </div>
            </div>
        `;
        
        notifications.insertAdjacentHTML('afterbegin', alertHTML);
    }
}

// Show invoices section in navigation
function showInvoicesSection() {
    showSection('invoices');
    
    // Update active navigation
    document.querySelectorAll('.pillar-link').forEach(l => l.classList.remove('active'));
    document.querySelector('[data-section="invoices"]').classList.add('active');
}

// Pay specific invoice
async function paySpecificInvoice(invoiceId) {
    window.open(`invoice.html?id=${invoiceId}`, '_blank');
}

// Pay invoice for manuscript
function payInvoice(manuscriptIndex) {
    const manuscript = manuscripts[manuscriptIndex];
    if (manuscript.invoices && manuscript.invoices.length > 0) {
        const unpaidInvoice = manuscript.invoices.find(inv => inv.paymentStatus === 'unpaid');
        if (unpaidInvoice) {
            window.open(`invoice.html?id=${unpaidInvoice.invoiceNumber}`, '_blank');
        }
    }
}

// View invoice details
function viewInvoiceDetails(invoiceId) {
    window.open(`invoice.html?id=${invoiceId}`, '_blank');
}

// Generate new invoice for manuscript
async function generateInvoiceForManuscript(manuscriptIndex) {
    const manuscript = manuscripts[manuscriptIndex];
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${API_BASE}/create-invoice-for-manuscript/${manuscript._id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serviceType: manuscript.serviceType || 'Standard Editing',
                notes: `Invoice for manuscript: ${manuscript.originalName}`
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Invoice generated successfully!');
            // Reload manuscript data
            await loadManuscriptsWithInvoices({ 'Authorization': `Bearer ${token}` });
            await loadInvoices({ 'Authorization': `Bearer ${token}` });
            updateDashboardStats();
            
            // Open the new invoice
            window.open(`invoice.html?id=${result.invoiceNumber}`, '_blank');
        } else {
            alert('Error generating invoice: ' + result.error);
        }

    } catch (error) {
        console.error('Error generating invoice:', error);
        alert('Failed to generate invoice. Please try again.');
    }
}

// Update manuscript table header to include billing
function updateManuscriptTableHeader() {
    const existingHeader = document.querySelector('#manuscripts-section table thead tr');
    if (existingHeader && !existingHeader.innerHTML.includes('Total Billed')) {
        // Find the Actions column and insert Billing before it
        const actionsHeader = existingHeader.querySelector('th:last-child');
        if (actionsHeader) {
            const billingHeader = document.createElement('th');
            billingHeader.textContent = 'Total Billed';
            existingHeader.insertBefore(billingHeader, actionsHeader);
        }
    }
}

// Populate invoices section with data
function populateInvoicesSection() {
    // Update metrics
    const unpaidInvoices = invoices.filter(inv => inv.paymentStatus === 'unpaid');
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid');
    
    const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Calculate this month's payments
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthPayments = paymentHistory
        .filter(payment => {
            const paymentDate = new Date(payment.createdAt);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum, payment) => sum + payment.amount, 0);

    // Find most used payment method
    const methodCounts = {};
    paymentHistory.forEach(payment => {
        methodCounts[payment.method] = (methodCounts[payment.method] || 0) + 1;
    });
    const preferredMethod = Object.keys(methodCounts).reduce((a, b) => 
        methodCounts[a] > methodCounts[b] ? a : b, 'Card'
    );

    document.getElementById('totalOutstanding').textContent = `${totalOutstanding.toFixed(2)}`;
    document.getElementById('totalPaid').textContent = `${totalPaid.toFixed(2)}`;
    document.getElementById('thisMonthPayments').textContent = `${thisMonthPayments.toFixed(2)}`;
    document.getElementById('preferredMethod').textContent = formatPaymentMethod(preferredMethod);

    // Populate invoices table
    populateInvoicesTable();
    populatePaymentHistory();
}

// Populate invoices table
function populateInvoicesTable(filterStatus = 'all') {
    const tbody = document.getElementById('invoicesList');
    if (!tbody) return;

    tbody.innerHTML = '';

    let filteredInvoices = invoices;
    if (filterStatus !== 'all') {
        filteredInvoices = invoices.filter(inv => inv.paymentStatus === filterStatus);
    }

    if (filteredInvoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No invoices found.</td></tr>';
        return;
    }

    filteredInvoices.forEach(invoice => {
        const statusClass = `state-${invoice.paymentStatus.replace(/\s+/g, '-')}`;
        const serviceDescription = invoice.services[0]?.description || 'Editing Service';
        
        const row = `
            <tr>
                <td>
                    <strong>${invoice.invoiceNumber}</strong>
                    ${invoice.manuscriptId ? `<br><small>Manuscript ID: ${invoice.manuscriptId}</small>` : ''}
                </td>
                <td>${new Date(invoice.issueDate).toLocaleDateString()}</td>
                <td>${serviceDescription}</td>
                <td>${invoice.total.toFixed(2)}</td>
                <td>
                    <span class="state-indicator ${statusClass}">
                        ${invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                    </span>
                </td>
                <td>
                    <button class="op-button op-info" onclick="viewInvoiceDetails('${invoice.invoiceNumber}')">View</button>
                    ${invoice.paymentStatus === 'unpaid' ? 
                        `<button class="op-button op-caution" onclick="paySpecificInvoice('${invoice.invoiceNumber}')">Pay</button>` : 
                        ''}
                    <button class="op-button op-secondary" onclick="downloadInvoicePDF('${invoice.invoiceNumber}')">PDF</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Populate payment history
function populatePaymentHistory() {
    const container = document.getElementById('paymentHistoryContainer');
    if (!container) return;

    if (paymentHistory.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No payment history available.</p>';
        return;
    }

    const historyHTML = paymentHistory.map(payment => `
        <div class="payment-history-item" style="
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 1rem; 
            border-bottom: 1px solid #eee;
            hover: background: #f8f9fa;
        ">
            <div>
                <strong>Transaction ${payment.transactionId}</strong>
                <br>
                <small style="color: #666;">
                    ${payment.invoice ? payment.invoice.invoiceNumber : 'N/A'} • 
                    ${formatPaymentMethod(payment.method)} • 
                    ${new Date(payment.createdAt).toLocaleDateString()}
                </small>
            </div>
            <div style="text-align: right;">
                <strong style="color: #28a745;">${payment.amount.toFixed(2)}</strong>
                <br>
                <span class="state-indicator state-${payment.status}">
                    ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                </span>
            </div>
        </div>
    `).join('');

    container.innerHTML = historyHTML;
}

// Filter invoices by status
function filterInvoices() {
    const filterStatus = document.getElementById('invoiceStatusFilter').value;
    populateInvoicesTable(filterStatus);
}

// Refresh invoice data
async function refreshInvoiceData() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
        await loadInvoices(headers);
        await loadPaymentHistory(headers);
        await loadDashboardSummary(headers);
        
        populateInvoicesSection();
        updateDashboardStats();
        
        // Show success message
        const notifications = document.getElementById('notifications');
        if (notifications) {
            const successHTML = `
                <div class="alert-item" style="background: #d4edda; border-left: 4px solid #28a745; color: #155724;">
                    <h4>Data Refreshed</h4>
                    <p>Invoice and payment data has been updated successfully.</p>
                </div>
            `;
            notifications.insertAdjacentHTML('afterbegin', successHTML);
        }
        
    } catch (error) {
        console.error('Error refreshing invoice data:', error);
        alert('Failed to refresh data. Please try again.');
    }
}

// Download payment report
async function downloadPaymentReport() {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${API_BASE}/download-payment-report`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            // Fallback: generate CSV in browser
            generatePaymentReportCSV();
        }
    } catch (error) {
        console.error('Error downloading payment report:', error);
        generatePaymentReportCSV();
    }
}

// Generate payment report CSV (fallback)
function generatePaymentReportCSV() {
    const headers = ['Date', 'Transaction ID', 'Invoice Number', 'Amount', 'Method', 'Status'];
    const csvContent = [
        headers.join(','),
        ...paymentHistory.map(payment => [
            new Date(payment.createdAt).toLocaleDateString(),
            payment.transactionId,
            payment.invoice ? payment.invoice.invoiceNumber : 'N/A',
            payment.amount.toFixed(2),
            payment.method,
            payment.status
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Download invoice PDF
async function downloadInvoicePDF(invoiceNumber) {
    const token = localStorage.getItem('authToken');
    
    try {
        const response = await fetch(`${API_BASE}/download-invoice-pdf/${invoiceNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Invoice_${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('PDF download not available. Please view the invoice online.');
            viewInvoiceDetails(invoiceNumber);
        }
    } catch (error) {
        console.error('Error downloading PDF:', error);
        alert('Failed to download PDF. Opening invoice view instead.');
        viewInvoiceDetails(invoiceNumber);
    }
}

// Format payment method for display
function formatPaymentMethod(method) {
    const methods = {
        'card': 'Credit/Debit Card',
        'paypal': 'PayPal',
        'bank': 'Bank Transfer'
    };
    return methods[method] || method.charAt(0).toUpperCase() + method.slice(1);
}

// Helper function to create element from HTML string
function createElementFromHTML(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}


// GLOBAL FUNCTION EXPORTS
// Make functions available globally for onclick handlers
window.dismissInstitutionalAlert = dismissInstitutionalAlert;
window.startEmailVerification = startEmailVerification;
window.confirmEmailVerification = confirmEmailVerification;
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
window.promptForVerificationCode = promptForVerificationCode;
window.requestNewVerificationCode = requestNewVerificationCode;
window.showEmailInputModal = showEmailInputModal;
window.sendVerificationCode = sendVerificationCode;
window.showVerificationCodeModal = showVerificationCodeModal;
window.submitVerificationCode = submitVerificationCode;
window.resendVerificationCode = resendVerificationCode;
window.closeVerificationModal = closeVerificationModal;
window.showInvoicesSection = showInvoicesSection;
window.paySpecificInvoice = paySpecificInvoice;
window.payInvoice = payInvoice;
window.viewInvoiceDetails = viewInvoiceDetails;
window.generateInvoiceForManuscript = generateInvoiceForManuscript;
window.filterInvoices = filterInvoices;
window.refreshInvoiceData = refreshInvoiceData;
window.downloadPaymentReport = downloadPaymentReport;
window.downloadInvoicePDF = downloadInvoicePDF;
window.viewCompletedManuscript = viewCompletedManuscript;
window.dismissManuscriptNotification = dismissManuscriptNotification;
window.addManuscriptNotifications = addManuscriptNotifications;
window.toggleMessage = toggleMessage;
window.archiveMessage = archiveMessage;
window.deleteMessage = deleteMessage;
window.viewManuscriptFromMessage = viewManuscriptFromMessage;
window.verifyFromMessage = verifyFromMessage;


console.log('Dashboard invoice integration loaded successfully!');
