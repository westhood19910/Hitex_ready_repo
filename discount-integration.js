// Dashboard Discount Integration
// Add this to your existing dashboard JavaScript file

// Configuration
const DISCOUNT_API_BASE = 'http://localhost:3000'; // Update with your backend URL
let currentUser = null;
let discountEligibilityData = null;

// Initialize discount system when dashboard loads
function initializeDiscountSystem() {
    // Check if discount banner was previously dismissed
    const bannerDismissed = localStorage.getItem('discountBannerDismissed');
    
    if (!bannerDismissed) {
        checkUserDiscountEligibility();
    }
    
    // Add discount section to existing dashboard
    insertDiscountComponents();
    
    // Load user's existing discount codes
    loadUserDiscountHistory();
}

// Insert discount components into existing dashboard structure
function insertDiscountComponents() {
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (dashboardSection) {
        // Create discount banner HTML
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
        
        // Create discount codes section HTML
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

// Check if user is eligible for institutional discounts
async function checkUserDiscountEligibility() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const response = await fetch(`${DISCOUNT_API_BASE}/check-discount-eligibility`, {
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
            // User has institutional email but institution isn't a partner
            showPartnershipSuggestion(data);
        }
        
    } catch (error) {
        console.error('Error checking discount eligibility:', error);
    }
}

// Show discount eligibility banner
function showDiscountEligibilityBanner(eligibilityData) {
    const banner = document.getElementById('institutionalDiscountBanner');
    const institutionSpan = document.getElementById('eligibleInstitutionName');
    const discountSpan = document.getElementById('eligibleDiscountPercent');
    
    if (banner && institutionSpan && discountSpan) {
        institutionSpan.textContent = eligibilityData.institution.name;
        discountSpan.textContent = eligibilityData.institution.discountPercentage;
        banner.style.display = 'block';
        
        // Add to notifications if notifications section exists
        addDiscountNotification(eligibilityData);
    }
}

// Generate institutional discount code
async function generateInstitutionalDiscount() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${DISCOUNT_API_BASE}/generate-discount-code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Hide banner and show success
            dismissDiscountNotification();
            showDiscountCodeSuccess(data.discountCode);
            loadUserDiscountHistory(); // Refresh codes
        } else {
            alert('Error generating discount code: ' + data.error);
        }
        
    } catch (error) {
        console.error('Error generating discount code:', error);
        alert('Failed to generate discount code. Please try again.');
    }
}

// Show discount code success
function showDiscountCodeSuccess(discountCode) {
    // Create success notification
    const successHTML = `
        <div class="alert-item" style="background: #e8f5e8; border-left: 4px solid #4caf50;">
            <h4>Discount Code Generated!</h4>
            <p>Your institutional discount code <strong>${discountCode}</strong> is ready to use. 
               You can find it in your discount codes section below.</p>
        </div>
    `;
    
    // Add to notifications
    const notifications = document.getElementById('notifications');
    if (notifications) {
        notifications.insertAdjacentHTML('afterbegin', successHTML);
    }
    
    // Show discount codes section
    const discountSection = document.getElementById('discountCodesSection');
    if (discountSection) {
        discountSection.style.display = 'block';
    }
}

// Load user's discount history
async function loadUserDiscountHistory() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${DISCOUNT_API_BASE}/my-discount-codes`, {
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

// Display user's discount codes
function displayUserDiscountCodes(codes) {
    const activeCode = codes.find(code => !code.isUsed && new Date(code.expiresAt) > new Date());
    const discountSection = document.getElementById('discountCodesSection');
    const activeCodeDiv = document.getElementById('activeDiscountCode');
    const noCodesDiv = document.getElementById('noDiscountCodes');
    
    if (activeCode) {
        // Show active discount code
        document.getElementById('userDiscountCode').textContent = activeCode.code;
        document.getElementById('userDiscountPercent').textContent = activeCode.discountPercentage;
        document.getElementById('userDiscountExpiry').textContent = 
            new Date(activeCode.expiresAt).toLocaleDateString();
        
        activeCodeDiv.style.display = 'block';
        noCodesDiv.style.display = 'none';
        discountSection.style.display = 'block';
        
    } else if (codes.length > 0) {
        // Has codes but all used/expired
        noCodesDiv.innerHTML = '<p>Your previous discount codes have been used or expired.</p>';
        activeCodeDiv.style.display = 'none';
        noCodesDiv.style.display = 'block';
        discountSection.style.display = 'block';
        
    } else {
        // No codes at all
        discountSection.style.display = 'none';
    }
}

// Copy discount code to clipboard
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
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            alert('Discount code copied: ' + code);
        } catch (fallbackError) {
            alert('Please copy this code manually: ' + code);
        }
        
        document.body.removeChild(textArea);
    }
}

// Dismiss discount notification
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

// Add discount notification to existing notifications
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

// Show partnership suggestion for non-partner institutions
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

// Integration with payment flow (for get-quote.html or checkout)
function initializePaymentDiscountIntegration() {
    // Add discount section to payment form
    const paymentFormHTML = `
        <div class="discount-application-section" style="margin: 2rem 0; padding: 1.5rem; background: #f8f9ff; border-radius: 8px;">
            <h4>Apply Discount Code</h4>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <input 
                    type="text" 
                    id="paymentDiscountCode" 
                    placeholder="Enter discount code"
                    style="flex: 1; padding: 0.7rem; border: 1px solid #ddd; border-radius: 4px; text-transform: uppercase;"
                    maxlength="20"
                >
                <button 
                    type="button" 
                    onclick="applyDiscountToOrder()" 
                    class="op-button op-primary"
                    style="padding: 0.7rem 1.5rem;"
                >
                    Apply
                </button>
            </div>
            <div id="paymentDiscountSummary" class="discount-summary" style="display: none;">
                <div style="background: white; padding: 1rem; border-radius: 6px; border-left: 4px solid #4caf50;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Subtotal:</span>
                        <span id="paymentSubtotal">$0.00</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #4caf50;">
                        <span>Institutional Discount (<span id="paymentDiscountPercent">0</span>%):</span>
                        <span id="paymentDiscountAmount">-$0.00</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; border-top: 1px solid #eee; padding-top: 0.5rem; margin-top: 0.5rem;">
                        <span>Total:</span>
                        <span id="paymentFinalAmount">$0.00</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert before payment buttons if on payment page
    const paymentSection = document.querySelector('.payment-section, #payment-form, .checkout-form');
    if (paymentSection) {
        paymentSection.insertAdjacentHTML('beforeend', paymentFormHTML);
        
        // Auto-populate user's discount code if available
        loadUserDiscountForPayment();
    }
}

// Load user's discount code for payment
async function loadUserDiscountForPayment() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${DISCOUNT_API_BASE}/my-discount-codes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) return;
        
        const codes = await response.json();
        const activeCode = codes.find(code => !code.isUsed && new Date(code.expiresAt) > new Date());
        
        if (activeCode) {
            const discountInput = document.getElementById('paymentDiscountCode');
            if (discountInput) {
                discountInput.value = activeCode.code;
                discountInput.style.background = '#e8f5e8';
                discountInput.style.borderColor = '#4caf50';
                
                // Add helper text
                const helperText = document.createElement('p');
                helperText.style.fontSize = '0.9rem';
                helperText.style.color = '#4caf50';
                helperText.style.margin = '0.5rem 0 0 0';
                helperText.textContent = `Your institutional discount code (${activeCode.discountPercentage}% off) has been pre-filled.`;
                discountInput.parentNode.insertBefore(helperText, discountInput.nextSibling);
            }
        }
        
    } catch (error) {
        console.error('Error loading discount code for payment:', error);
    }
}

// Apply discount to order total
async function applyDiscountToOrder() {
    const discountCode = document.getElementById('paymentDiscountCode')?.value?.trim();
    const orderAmountInput = document.getElementById('orderAmount') || document.querySelector('[name="orderAmount"], [id*="total"], [id*="amount"]');
    
    if (!discountCode) {
        alert('Please enter a discount code');
        return;
    }
    
    if (!orderAmountInput) {
        alert('Cannot find order amount. Please refresh the page and try again.');
        return;
    }
    
    const orderAmount = parseFloat(orderAmountInput.value || orderAmountInput.textContent?.replace(/[^0-9.]/g, '') || 0);
    
    if (orderAmount <= 0) {
        alert('Please enter a valid order amount first');
        return;
    }
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${DISCOUNT_API_BASE}/validate-discount-code`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ discountCode, orderAmount })
        });
        
        const data = await response.json();
        
        if (data.valid) {
            displayPaymentDiscountSummary(data);
            
            // Update hidden form fields if they exist
            updatePaymentFormFields(data);
            
        } else {
            alert(data.error || 'Invalid or expired discount code');
            clearDiscountSummary();
        }
        
    } catch (error) {
        console.error('Error validating discount code:', error);
        alert('Failed to validate discount code. Please try again.');
    }
}

// Display discount summary in payment
function displayPaymentDiscountSummary(discountData) {
    const summary = document.getElementById('paymentDiscountSummary');
    
    if (summary) {
        document.getElementById('paymentSubtotal').textContent = `${discountData.originalAmount.toFixed(2)}`;
        document.getElementById('paymentDiscountPercent').textContent = discountData.discountPercentage;
        document.getElementById('paymentDiscountAmount').textContent = `-${discountData.discountAmount.toFixed(2)}`;
        document.getElementById('paymentFinalAmount').textContent = `${discountData.finalAmount.toFixed(2)}`;
        
        summary.style.display = 'block';
        
        // Store discount data for form submission
        window.appliedDiscountData = discountData;
    }
}

// Update form fields with discount data
function updatePaymentFormFields(discountData) {
    // Update or create hidden fields for discount information
    const form = document.querySelector('form');
    if (!form) return;
    
    // Remove existing discount fields
    form.querySelectorAll('[name^="discount"]').forEach(field => field.remove());
    
    // Add discount fields
    const discountFields = [
        { name: 'discountCode', value: document.getElementById('paymentDiscountCode').value },
        { name: 'discountId', value: discountData.discountId },
        { name: 'discountPercentage', value: discountData.discountPercentage },
        { name: 'discountAmount', value: discountData.discountAmount },
        { name: 'finalAmount', value: discountData.finalAmount }
    ];
    
    discountFields.forEach(field => {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = field.name;
        hiddenInput.value = field.value;
        form.appendChild(hiddenInput);
    });
    
    // Update displayed total if there's a total element
    const totalElements = document.querySelectorAll('[id*="total"], [class*="total"], .final-amount');
    totalElements.forEach(element => {
        if (element.tagName === 'INPUT') {
            element.value = discountData.finalAmount.toFixed(2);
        } else {
            element.textContent = `${discountData.finalAmount.toFixed(2)}`;
        }
    });
}

// Clear discount summary
function clearDiscountSummary() {
    const summary = document.getElementById('paymentDiscountSummary');
    if (summary) {
        summary.style.display = 'none';
    }
    
    // Clear stored discount data
    delete window.appliedDiscountData;
}

// CSS styles for discount components
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add styles to head
    document.head.insertAdjacentHTML('beforeend', discountStyles);
    
    // Initialize discount system
    initializeDiscountSystem();
    
    // Initialize payment integration if on payment page
    if (window.location.pathname.includes('quote') || 
        window.location.pathname.includes('payment') || 
        window.location.pathname.includes('checkout')) {
        initializePaymentDiscountIntegration();
    }
});

// Export functions for global access
window.dismissDiscountNotification = dismissDiscountNotification;
window.generateInstitutionalDiscount = generateInstitutionalDiscount;
window.copyUserDiscountCode = copyUserDiscountCode;
window.refreshDiscountCodes = refreshDiscountCodes;
window.applyDiscountToOrder = applyDiscountToOrder;