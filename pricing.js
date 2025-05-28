
document.addEventListener('DOMContentLoaded', function() {
    // Get all tab elements
    const tabs = document.querySelectorAll('.tab');
    
    // Add click event listener to each tab
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all pricing sections
            const pricingSections = document.querySelectorAll('.pricing-section');
            pricingSections.forEach(section => section.classList.remove('active'));
            
            // Show the corresponding pricing section
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // Initialize calculators
    initializeLanguageCalculator();
    initializeScientificCalculator();
    initializeTechnicalCalculator();
    initializeTranslationCalculator();
});

/**
 * Calculates standard turnaround time based on word count
 * @param {number} wordCount - The number of words in the document
 * @returns {number} - Standard turnaround time in hours
 */
function calculateStandardTime(wordCount) {
    if (wordCount <= 3000) {
        return 24;
    } else if (wordCount <= 6000) {
        return 48;
    } else if (wordCount <= 9000) {
        return 72;
    } else if (wordCount <= 12000) {
        return 96;
    } else {
        return 120; // Default for documents over 12,000 words
    }
}

/**
 * Calculates rush fee multiplier based on requested time vs standard time
 * @param {number} requestedTime - Requested turnaround time in hours
 * @param {number} standardTime - Standard turnaround time in hours
 * @returns {number} - Rush fee multiplier
 */
function calculateRushFee(requestedTime, standardTime) {
    if (requestedTime >= standardTime) {
        return 1.0; // No rush fee
    } else if (standardTime - requestedTime >= 24) {
        return 1.5; // 50% rush fee for 24+ hours early
    } else if (standardTime - requestedTime >= 12) {
        return 1.25; // 25% rush fee for 12+ hours early
    } else {
        return 1.0; // No rush fee for less than 12 hours early
    }
}

/**
 * Resets highlighting of all cells in pricing tables
 */
function resetHighlighting() {
    const activeCells = document.querySelectorAll('.price-cell.active');
    activeCells.forEach(cell => cell.classList.remove('active'));
}

/**
 * Initializes the Language Editing Calculator
 */
function initializeLanguageCalculator() {
    const wordCountInput = document.getElementById('language-word-count');
    const submissionTypeSelect = document.getElementById('language-submission-type');
    const turnaroundInput = document.getElementById('language-turnaround');
    const priceDisplay = document.getElementById('language-price-display');
    const timeDisplay = document.getElementById('language-time-display');
    
    // Set base rates
    const rates = {
        original: {
            standard: 80.00
        },
        revised: {
            standard: 48.00
        }
    };
    
    // Update price when any input changes
    [wordCountInput, submissionTypeSelect, turnaroundInput].forEach(element => {
        element.addEventListener('input', updateLanguagePrice);
    });
    
    // Initial calculation
    updateLanguagePrice();
    
    function updateLanguagePrice() {
        // Get input values
        const wordCount = parseInt(wordCountInput.value) || 0;
        const submissionType = submissionTypeSelect.value;
        const requestedTime = parseInt(turnaroundInput.value) || 24;
        
        // Calculate standard turnaround time
        const standardTime = calculateStandardTime(wordCount);
        
        // Calculate rush fee if applicable
        const rushFeeMultiplier = calculateRushFee(requestedTime, standardTime);
        
        // Get the base rate
        const baseRate = rates[submissionType].standard;
        
        // Calculate price: (rate per 1000 words * word count / 1000) * rush fee
        const price = (baseRate * wordCount / 1000) * rushFeeMultiplier;
        
        // Update price display
        priceDisplay.textContent = '$' + price.toFixed(2);
        
        // Update time display
        timeDisplay.textContent = 'Standard Time: ' + standardTime + ' hours';
        
        // Show rush fee if applicable
        if (rushFeeMultiplier > 1) {
            const rushPercentage = ((rushFeeMultiplier - 1) * 100).toFixed(0);
            const rushFeeElement = document.createElement('span');
            rushFeeElement.className = 'rush-fee';
            rushFeeElement.textContent = `Rush Fee: +${rushPercentage}%`;
            
            // Remove any existing rush fee element first
            const existingRushFee = timeDisplay.querySelector('.rush-fee');
            if (existingRushFee) {
                timeDisplay.removeChild(existingRushFee);
            }
            
            timeDisplay.appendChild(rushFeeElement);
        } else {
            // Remove rush fee element if no rush fee
            const existingRushFee = timeDisplay.querySelector('.rush-fee');
            if (existingRushFee) {
                timeDisplay.removeChild(existingRushFee);
            }
        }
        
        // Highlight the corresponding cell in the table
        highlightLanguageCell(submissionType, 'standard');
    }
    
    function highlightLanguageCell(submissionType, serviceLevel) {
        // Reset highlighting first
        resetHighlighting();
        
        // Highlight the corresponding cell
        const cellId = `language-${submissionType}-${serviceLevel}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.classList.add('active');
        }
    }
}

/**
 * Initializes the Scientific Editing Calculator
 */
function initializeScientificCalculator() {
    const wordCountInput = document.getElementById('scientific-word-count');
    const serviceLevelSelect = document.getElementById('scientific-service-level');
    const submissionTypeSelect = document.getElementById('scientific-submission-type');
    const turnaroundInput = document.getElementById('scientific-turnaround');
    const priceDisplay = document.getElementById('scientific-price-display');
    const timeDisplay = document.getElementById('scientific-time-display');
    
    // Set base rates
    const rates = {
        original: {
            standard: 100.00,
            advanced: 140.00,
            premium: 180.00
        },
        revised: {
            standard: 60.00,
            advanced: 84.00,
            premium: 108.00
        }
    };
    
    // Update price when any input changes
    [wordCountInput, serviceLevelSelect, submissionTypeSelect, turnaroundInput].forEach(element => {
        element.addEventListener('input', updateScientificPrice);
    });
    
    // Initial calculation
    updateScientificPrice();
    
    function updateScientificPrice() {
        // Get input values
        const wordCount = parseInt(wordCountInput.value) || 0;
        const serviceLevel = serviceLevelSelect.value;
        const submissionType = submissionTypeSelect.value;
        const requestedTime = parseInt(turnaroundInput.value) || 24;
        
        // Calculate standard turnaround time
        const standardTime = calculateStandardTime(wordCount);
        
        // Calculate rush fee if applicable
        const rushFeeMultiplier = calculateRushFee(requestedTime, standardTime);
        
        // Get the base rate
        const baseRate = rates[submissionType][serviceLevel];
        
        // Calculate price: (rate per 1000 words * word count / 1000) * rush fee
        const price = (baseRate * wordCount / 1000) * rushFeeMultiplier;
        
        // Update price display
        priceDisplay.textContent = '$' + price.toFixed(2);
        
        // Update time display
        timeDisplay.textContent = 'Standard Time: ' + standardTime + ' hours';
        
        // Show rush fee if applicable
        if (rushFeeMultiplier > 1) {
            const rushPercentage = ((rushFeeMultiplier - 1) * 100).toFixed(0);
            const rushFeeElement = document.createElement('span');
            rushFeeElement.className = 'rush-fee';
            rushFeeElement.textContent = `Rush Fee: +${rushPercentage}%`;
            
            // Remove any existing rush fee element first
            const existingRushFee = timeDisplay.querySelector('.rush-fee');
            if (existingRushFee) {
                timeDisplay.removeChild(existingRushFee);
            }
            
            timeDisplay.appendChild(rushFeeElement);
        } else {
            // Remove rush fee element if no rush fee
            const existingRushFee = timeDisplay.querySelector('.rush-fee');
            if (existingRushFee) {
                timeDisplay.removeChild(existingRushFee);
            }
        }
        
        // Highlight the corresponding cell in the table
        highlightScientificCell(submissionType, serviceLevel);
    }
    
    function highlightScientificCell(submissionType, serviceLevel) {
        // Reset highlighting first
        resetHighlighting();
        
        // Highlight the corresponding cell
        const cellId = `scientific-${submissionType}-${serviceLevel}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.classList.add('active');
        }
    }
}

/**
 * Initializes the Technical Editing Calculator
 */
function initializeTechnicalCalculator() {
    const wordCountInput = document.getElementById('technical-word-count');
    const serviceLevelSelect = document.getElementById('technical-service-level');
    const submissionTypeSelect = document.getElementById('technical-submission-type');
    const turnaroundInput = document.getElementById('technical-turnaround');
    const priceDisplay = document.getElementById('technical-price-display');
    const timeDisplay = document.getElementById('technical-time-display');
    
    // Set base rates
    const rates = {
        original: {
            standard: 120.00,
            advanced: 160.00,
            premium: 200.00
        },
        revised: {
            standard: 70.00,
            advanced: 94.00,
            premium: 118.00
        }
    };
    
    // Update price when any input changes
    [wordCountInput, serviceLevelSelect, submissionTypeSelect, turnaroundInput].forEach(element => {
        element.addEventListener('input', updateTechnicalPrice);
    });
    
    // Initial calculation
    updateTechnicalPrice();
    
    function updateTechnicalPrice() {
        // Get input values
        const wordCount = parseInt(wordCountInput.value) || 0;
        const serviceLevel = serviceLevelSelect.value;
        const submissionType = submissionTypeSelect.value;
        const requestedTime = parseInt(turnaroundInput.value) || 24;
        
        // Calculate standard turnaround time
        const standardTime = calculateStandardTime(wordCount);
        
        // Calculate rush fee if applicable
        const rushFeeMultiplier = calculateRushFee(requestedTime, standardTime);
        
        // Get the base rate
        const baseRate = rates[submissionType][serviceLevel];
        
        // Calculate price: (rate per 1000 words * word count / 1000) * rush fee
        const price = (baseRate * wordCount / 1000) * rushFeeMultiplier;
        
        // Update price display
        priceDisplay.textContent = '$' + price.toFixed(2);
        
        // Update time display
        timeDisplay.textContent = 'Standard Time: ' + standardTime + ' hours';
        
        // Show rush fee if applicable
        if (rushFeeMultiplier > 1) {
            const rushPercentage = ((rushFeeMultiplier - 1) * 100).toFixed(0);
            const rushFeeElement = document.createElement('span');
            rushFeeElement.className = 'rush-fee';
            rushFeeElement.textContent = `Rush Fee: +${rushPercentage}%`;
            
            // Remove any existing rush fee element first
            const existingRushFee = timeDisplay.querySelector('.rush-fee');
            if (existingRushFee) {
                timeDisplay.removeChild(existingRushFee);
            }
            
            timeDisplay.appendChild(rushFeeElement);
        } else {
            // Remove rush fee element if no rush fee
            const existingRushFee = timeDisplay.querySelector('.rush-fee');
            if (existingRushFee) {
                timeDisplay.removeChild(existingRushFee);
            }
        }
        
        // Highlight the corresponding cell in the table
        highlightTechnicalCell(submissionType, serviceLevel);
    }
    
    function highlightTechnicalCell(submissionType, serviceLevel) {
        // Reset highlighting first
        resetHighlighting();
        
        // Highlight the corresponding cell
        const cellId = `technical-${submissionType}-${serviceLevel}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.classList.add('active');
        }
    }
}

/**
 * Initializes the Translation Calculator
 */
function initializeTranslationCalculator() {
    const wordCountInput = document.getElementById('translation-word-count');
    const submissionTypeSelect = document.getElementById('translation-submission-type');
    const turnaroundInput = document.getElementById('translation-turnaround');
    const priceDisplay = document.getElementById('translation-price-display');
    const timeDisplay = document.getElementById('translation-time-display');
    
    // Set base rates
    const rates = {
        original: {
            standard: 80.00
        },
        revised: {
            standard: 48.00
        }
    };
    
    // Update price when any input changes
    [wordCountInput, submissionTypeSelect, turnaroundInput].forEach(element => {
        element.addEventListener('input', updateTranslationPrice);
    });
    
    // Initial calculation
    updateTranslationPrice();
    
    function updateTranslationPrice() {
        // Get input values
        const wordCount = parseInt(wordCountInput.value) || 0;
        const submissionType = submissionTypeSelect.value;
        const requestedTime = parseInt(turnaroundInput.value) || 24;
        
        // Calculate standard turnaround time
        const standardTime = calculateStandardTime(wordCount);
        
        // Calculate rush fee if applicable
        const rushFeeMultiplier = calculateRushFee(requestedTime, standardTime);
        
        // Get the base rate
        const baseRate = rates[submissionType].standard;
        
        // Calculate price: (rate per 1000 words * word count / 1000) * rush fee
        const price = (baseRate * wordCount / 1000) * rushFeeMultiplier;
        
        // Update price display
        priceDisplay.textContent = '$' + price.toFixed(2);
        
        // Update time display
        timeDisplay.textContent = 'Standard Time: ' + standardTime + ' hours';
        
        // Show rush fee if applicable
        if (rushFeeMultiplier > 1) {
            const rushPercentage = ((rushFeeMultiplier - 1) * 100).toFixed(0);
            const rushFeeElement = document.createElement('span');
            rushFeeElement.className = 'rush-fee';
            rushFeeElement.textContent = `Rush Fee: +${rushPercentage}%`;
            
            // Remove any existing rush fee element first
            const existingRushFee = timeDisplay.querySelector('.rush-fee');
            if (existingRushFee) {
                timeDisplay.removeChild(existingRushFee);
            }
            
            timeDisplay.appendChild(rushFeeElement);
        } else {
            // Remove rush fee element if no rush fee
            const existingRushFee = timeDisplay.querySelector('.rush-fee');
            if (existingRushFee) {
                timeDisplay.removeChild(existingRushFee);
            }
        }
        
        // Highlight the corresponding cell in the table
        highlightTranslationCell(submissionType, 'standard');
    }
    
    function highlightTranslationCell(submissionType, serviceLevel) {
        // Reset highlighting first
        resetHighlighting();
        
        // Highlight the corresponding cell
        const cellId = `translation-${submissionType}-${serviceLevel}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.classList.add('active');
        }
    }
}

//     <!-- CODE FOR CURRENCY CONVERTER -->

const exchangeRates = {
    USD: {
        EUR: 0.91,
        GBP: 0.78,
        JPY: 112.65,
        CAD: 1.32,
        AUD: 1.47,
        CHF: 0.86,
        CNY: 6.94,
        INR: 83.25,
        MXN: 19.87
    },
    EUR: {
        USD: 1.10,
        GBP: 0.86,
        JPY: 123.84,
        CAD: 1.45,
        AUD: 1.62,
        CHF: 0.94,
        CNY: 7.63,
        INR: 91.48,
        MXN: 21.84
    },
    GBP: {
        USD: 1.28,
        EUR: 1.16,
        JPY: 143.77,
        CAD: 1.68,
        AUD: 1.88,
        CHF: 1.09,
        CNY: 8.86,
        INR: 106.21,
        MXN: 25.35
    },
    JPY: {
        USD: 0.0089,
        EUR: 0.0081,
        GBP: 0.0070,
        CAD: 0.0117,
        AUD: 0.0131,
        CHF: 0.0076,
        CNY: 0.0616,
        INR: 0.7389,
        MXN: 0.1764
    },
    CAD: {
        USD: 0.76,
        EUR: 0.69,
        GBP: 0.59,
        JPY: 85.34,
        AUD: 1.11,
        CHF: 0.65,
        CNY: 5.26,
        INR: 63.07,
        MXN: 15.05
    },
    AUD: {
        USD: 0.68,
        EUR: 0.62,
        GBP: 0.53,
        JPY: 76.63,
        CAD: 0.90,
        CHF: 0.58,
        CNY: 4.72,
        INR: 56.63,
        MXN: 13.52
    },
    CHF: {
        USD: 1.16,
        EUR: 1.06,
        GBP: 0.92,
        JPY: 130.99,
        CAD: 1.53,
        AUD: 1.71,
        CNY: 8.07,
        INR: 96.80,
        MXN: 23.10
    },
    CNY: {
        USD: 0.14,
        EUR: 0.13,
        GBP: 0.11,
        JPY: 16.23,
        CAD: 0.19,
        AUD: 0.21,
        CHF: 0.12,
        INR: 12.00,
        MXN: 2.86
    },
    INR: {
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0094,
        JPY: 1.35,
        CAD: 0.016,
        AUD: 0.018,
        CHF: 0.010,
        CNY: 0.083,
        MXN: 0.24
    },
    MXN: {
        USD: 0.050,
        EUR: 0.046,
        GBP: 0.039,
        JPY: 5.67,
        CAD: 0.066,
        AUD: 0.074,
        CHF: 0.043,
        CNY: 0.35,
        INR: 4.19
    }
};

// Ensure all currency pairs have rates
Object.keys(exchangeRates).forEach(fromCurrency => {
    exchangeRates[fromCurrency][fromCurrency] = 1;
    
    Object.keys(exchangeRates).forEach(toCurrency => {
        if (!exchangeRates[fromCurrency][toCurrency] && fromCurrency !== toCurrency) {
            // Calculate cross rate if direct rate is not available
            if (exchangeRates[toCurrency][fromCurrency]) {
                exchangeRates[fromCurrency][toCurrency] = 1 / exchangeRates[toCurrency][fromCurrency];
            }
        }
    });
});

// DOM elements
const floatButton = document.getElementById('the_conve_float_button');
const floatButtonLeft = document.getElementById('the_conve_float_button_left'); // New left button
const overlay = document.getElementById('the_conve_overlay');
const container = document.getElementById('the_conve_container');
const closeBtn = document.getElementById('the_conve_close');
const amountInput = document.getElementById('the_conve_amount');
const fromCurrency = document.getElementById('the_conve_from_currency');
const toCurrency = document.getElementById('the_conve_to_currency');
const fromValue = document.getElementById('the_conve_from_value');
const toValue = document.getElementById('the_conve_to_value');
const convertBtn = document.getElementById('the_conve_convert_btn');
const swapBtn = document.getElementById('the_conve_swap');
const resultsDiv = document.getElementById('the_conve_results');
const resultAmount = document.getElementById('the_conve_result_amount');
const amountError = document.getElementById('the_conve_amount_error');

// Format currency function
function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Update displayed values
function updateValues() {
    const amount = parseFloat(amountInput.value) || 0;
    fromValue.value = formatCurrency(amount, fromCurrency.value).replace(/[^\d.-]/g, '');
    
    if (amount > 0) {
        const rate = exchangeRates[fromCurrency.value][toCurrency.value];
        const converted = amount * rate;
        toValue.value = formatCurrency(converted, toCurrency.value).replace(/[^\d.-]/g, '');
        resultAmount.textContent = formatCurrency(converted, toCurrency.value);
    } else {
        toValue.value = '';
        resultAmount.textContent = formatCurrency(0, toCurrency.value);
    }
}

// Convert function
function convert() {
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        amountError.style.display = 'block';
        resultsDiv.style.display = 'none';
        return;
    }
    
    amountError.style.display = 'none';
    
    const rate = exchangeRates[fromCurrency.value][toCurrency.value];
    const converted = amount * rate;
    
    toValue.value = formatCurrency(converted, toCurrency.value).replace(/[^\d.-]/g, '');
    resultAmount.textContent = formatCurrency(converted, toCurrency.value);
    resultsDiv.style.display = 'block';
}

// Swap currencies
function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    updateValues();
}

// Open converter
function openConverter() {
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.classList.add('fadeIn');
        container.classList.add('active');
    }, 10);
}

// Close converter
function closeConverter() {
    overlay.classList.remove('fadeIn');
    overlay.classList.add('fadeOut');
    container.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('fadeOut');
    }, 300);
}

// Event listeners
floatButton.addEventListener('click', openConverter);
if (floatButtonLeft) { // Check if left button exists
    floatButtonLeft.addEventListener('click', openConverter); // Add event listener to left button
}
closeBtn.addEventListener('click', closeConverter);
overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
        closeConverter();
    }
});

amountInput.addEventListener('input', function() {
    updateValues();
    if (parseFloat(this.value) > 0) {
        amountError.style.display = 'none';
    }
});

fromCurrency.addEventListener('change', updateValues);
toCurrency.addEventListener('change', updateValues);
convertBtn.addEventListener('click', convert);
swapBtn.addEventListener('click', swapCurrencies);

// Initialize
amountInput.value = "1";
updateValues();

        // CODE FOR NEW CURRENCY CONVERTER

          /**
         * Currency Converter Application
         * Handles currency conversion with real-time rates
         */
         class CurrencyConverter {
            constructor() {
                // Exchange rates (in a real app, these would come from an API)
                this.exchangeRates = {
                    USD: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 153.2, CAD: 1.35, AUD: 1.51, CHF: 0.90, CNY: 7.10 },
                    EUR: { USD: 1.09, EUR: 1, GBP: 0.86, JPY: 166.5, CAD: 1.47, AUD: 1.64, CHF: 0.98, CNY: 7.72 },
                    GBP: { USD: 1.27, EUR: 1.16, GBP: 1, JPY: 193.6, CAD: 1.71, AUD: 1.91, CHF: 1.14, CNY: 8.97 },
                    JPY: { USD: 0.0065, EUR: 0.0060, GBP: 0.0052, JPY: 1, CAD: 0.0088, AUD: 0.0099, CHF: 0.0059, CNY: 0.046 },
                    CAD: { USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 113.5, CAD: 1, AUD: 1.12, CHF: 0.67, CNY: 5.26 },
                    AUD: { USD: 0.66, EUR: 0.61, GBP: 0.52, JPY: 101.3, CAD: 0.89, AUD: 1, CHF: 0.60, CNY: 4.70 },
                    CHF: { USD: 1.11, EUR: 1.02, GBP: 0.88, JPY: 170.0, CAD: 1.50, AUD: 1.67, CHF: 1, CNY: 7.87 },
                    CNY: { USD: 0.141, EUR: 0.130, GBP: 0.111, JPY: 21.6, CAD: 0.190, AUD: 0.213, CHF: 0.127, CNY: 1 }
                };

                // Cache DOM elements
                this.elements = {
                    fromAmount: document.getElementById('fromAmount'),
                    toAmount: document.getElementById('toAmount'),
                    fromCurrency: document.getElementById('fromCurrency'),
                    toCurrency: document.getElementById('toCurrency'),
                    swapBtn: document.getElementById('swapBtn'),
                    convertBtn: document.getElementById('convertBtn'),
                    resultAmount: document.getElementById('resultAmount'),
                    resultText: document.getElementById('resultText'),
                    form: document.getElementById('converterForm')
                };

                // Initialize event listeners
                this.initEventListeners();
                
                // Run initial conversion
                this.convert();
            }
            
            /**
             * Initialize all event listeners
             */
            initEventListeners() {
                this.elements.fromAmount.addEventListener('input', () => this.convert());
                this.elements.fromCurrency.addEventListener('change', () => this.convert());
                this.elements.toCurrency.addEventListener('change', () => this.convert());
                this.elements.swapBtn.addEventListener('click', () => this.swapCurrencies());
                this.elements.convertBtn.addEventListener('click', () => this.convert());
                this.elements.form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.convert();
                });
                
                // Add keyboard accessibility
                this.elements.swapBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.swapCurrencies();
                    }
                });
            }
            
            /**
             * Format number for display
             * @param {number} number - The number to format
             * @param {number} decimals - Number of decimal places
             * @returns {string} Formatted number
             */
            formatNumber(number, decimals = 2) {
                return number.toLocaleString(undefined, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                });
            }
            
            /**
             * Convert currencies based on current input values
             */
            convert() {
                const amount = parseFloat(this.elements.fromAmount.value);
                const from = this.elements.fromCurrency.value;
                const to = this.elements.toCurrency.value;
                
                // Show loading state
                this.setLoadingState(true);
                
                // Simulate API delay (would be a real API call in production)
                setTimeout(() => {
                    if (isNaN(amount)) {
                        this.elements.toAmount.value = '';
                        this.elements.resultAmount.textContent = '0.00 ' + to;
                        this.elements.resultText.textContent = '1 ' + from + ' = ' + 
                            this.formatNumber(this.exchangeRates[from][to]) + ' ' + to;
                    } else {
                        const rate = this.exchangeRates[from][to];
                        const converted = amount * rate;
                        
                        // Update UI with results
                        this.elements.toAmount.value = this.formatNumber(converted);
                        this.elements.resultAmount.textContent = this.formatNumber(converted) + ' ' + to;
                        this.elements.resultText.textContent = '1 ' + from + ' = ' + 
                            this.formatNumber(rate) + ' ' + to;
                    }
                    
                    // Remove loading state
                    this.setLoadingState(false);
                }, 300);
            }
            
            /**
             * Swap the from and to currencies
             */
            swapCurrencies() {
                const tempCurrency = this.elements.fromCurrency.value;
                this.elements.fromCurrency.value = this.elements.toCurrency.value;
                this.elements.toCurrency.value = tempCurrency;
                
                this.convert();
            }
            
            /**
             * Set or remove loading state on the converter
             * @param {boolean} isLoading - Whether the converter is in loading state
             */
            setLoadingState(isLoading) {
                const converter = document.querySelector('.n_we_conv_currency-converter');
                const convertBtn = this.elements.convertBtn;
                
                if (isLoading) {
                    converter.classList.add('n_we_conv_loading');
                    convertBtn.textContent = 'Converting...';
                    convertBtn.disabled = true;
                } else {
                    converter.classList.remove('n_we_conv_loading');
                    convertBtn.textContent = 'Convert Currency';
                    convertBtn.disabled = false;
                }
            }
        }

        // Initialize when DOM is fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            new CurrencyConverter();
        });


        // CODE FOR FAQ ON PRICING

        document.addEventListener('DOMContentLoaded', function() {
            // Main FAQ title toggle
            const mainTitle = document.querySelector('.yo_faq_main_title');
            const questionsContainer = document.querySelector('.yo_faq_questions_container');
            
            mainTitle.addEventListener('click', function() {
                this.classList.toggle('yo_faq_active');
                questionsContainer.classList.toggle('yo_faq_active');
            });
            
            // Individual questions toggle
            const questions = document.querySelectorAll('.yo_faq_question');
            
            questions.forEach(question => {
                question.addEventListener('click', function() {
                    // Toggle active class on question
                    this.classList.toggle('yo_faq_active');
                    
                    // Toggle active class on answer
                    const answer = this.nextElementSibling;
                    answer.classList.toggle('yo_faq_active');
                });
            });
        });