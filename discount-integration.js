alert('JavaScript file is loading!');
const API_BASE = 'https://all-branched-end.onrender.com';
let currentSection = 'dashboard';
let manuscripts = [];
let currentUser = null;
let discountEligibilityData = null;

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

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'client-login.html';
        return;
    }
    
    console.log('Dashboard initializing...');
    
    // Show loading state
    document.getElementById('profileName').textContent = 'Loading...';
    
    const headers = { 'Authorization': `Bearer ${token}` };

    // Load core data
    await loadProfileInfo(headers);
    await loadManuscripts(headers);
    updateDashboardStats();
    setupNavigation();
    
    // Initialize discount system with proper timing
    setTimeout(async () => {
        await initializeDiscountSystem();
    }, 500);
    
    await checkAdminAccess();
    addDiscountStyles();
    
    document.getElementById('logoutButton').addEventListener('click', logout);
    
    console.log('Dashboard initialization complete');
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

async function loadManuscripts(headers) {
    try {
        const response = await fetch(`${API_BASE}/my-manuscripts`, { headers });
        manuscripts = await response.json();
        
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

function updateDashboardStats() {
    document.getElementById('totalManuscripts').textContent = manuscripts.length;
    document.getElementById('activeProjects').textContent = manuscripts.filter(m => 
        ['assigned', 'in-progress', 'review'].includes((m.status || '').toLowerCase())
    ).length;
    document.getElementById('completedProjects').textContent = manuscripts.filter(m => 
        (m.status || '').toLowerCase() === 'completed'
    ).length;
    
    document.getElementById('outstandingBalance').textContent = '$0.00';
    
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

function setupNavigation() {
    document.querySelectorAll('.pillar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            if (section) {
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
            <button class="alert-dismiss-btn" onclick="dismissInstitutionalAlert()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                opacity: 0.8;
                font-weight: bold;
            ">&times;</button>
            
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
            <button class="alert-dismiss-btn" onclick="dismissInstitutionalAlert()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                opacity: 0.8;
                font-weight: bold;
            ">&times;</button>
            
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
            <button class="alert-dismiss-btn" onclick="dismissInstitutionalAlert()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                opacity: 0.8;
                font-weight: bold;
            ">&times;</button>
            
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
            <button class="alert-dismiss-btn" onclick="dismissInstitutionalAlert()" style="
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                opacity: 0.8;
                font-weight: bold;
            ">&times;</button>
            
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
function dismissInstitutionalAlert() {
    const alert = document.getElementById('institutionalAlert');
    if (alert) {
        alert.remove();
    }
    
    // Don't set localStorage to prevent dismissal - we want these to show on each login
    // until the user actually verifies their email
    console.log('Institutional alert dismissed');
}



// EMAIL VERIFICATION FUNCTIONS
async function startEmailVerification() {
    console.log('Starting email verification process');
    
    const institutionalEmail = prompt('Please enter your institutional email address to verify your discount eligibility:');
    
    if (!institutionalEmail || !institutionalEmail.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }
    
    const loadingBtn = document.querySelector('.verify-email-btn');
    if (loadingBtn) {
        loadingBtn.textContent = 'Sending verification code...';
        loadingBtn.disabled = true;
    }
    
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
            alert(`Verification code sent to ${institutionalEmail}! Please check your email.`);
            
            // Wait a moment, then ask for the code
            setTimeout(() => {
                const verificationCode = prompt(`Please enter the 6-digit verification code sent to ${institutionalEmail}:`);
                
                if (verificationCode && verificationCode.trim().length === 6) {
                    confirmEmailVerification(institutionalEmail, verificationCode.trim());
                } else {
                    alert('Please enter a valid 6-digit verification code');
                }
            }, 1000);
            
        } else {
            alert('Error: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error starting email verification:', error);
        alert('Failed to send verification email. Please try again.');
    } finally {
        if (loadingBtn) {
            loadingBtn.textContent = 'Verify Institutional Email';
            loadingBtn.disabled = false;
        }
    }
}

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
            
            // Clear the current alert
            dismissInstitutionalAlert();
            
            // Reload the discount system to show verified status
            setTimeout(() => {
                checkUserDiscountEligibility();
                loadUserDiscountHistory();
            }, 1000);
            
        } else {
            alert('Verification failed: ' + result.error);
            
            // Offer to resend code
            if (confirm('Would you like to request a new verification code?')) {
                startEmailVerification();
            }
        }
        
    } catch (error) {
        console.error('Error confirming email verification:', error);
        alert('Failed to verify email. Please try again.');
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

function addDiscountStyles() {
    const discountStyles = `
        <style>
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
            .discount-code-display {
                flex-direction: column;
                gap: 1rem;
            }
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', discountStyles);
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

// ==========================================
// GLOBAL FUNCTION EXPORTS
// ==========================================

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