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
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.classList.add('active');
            } else {
                console.error('Target element for tab not found:', targetId);
            }
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

    if (!wordCountInput || !submissionTypeSelect || !turnaroundInput || !priceDisplay || !timeDisplay) {
        console.error('One or more elements for the Language Calculator are missing.');
        return;
    }

    const rates = {
        original: { standard: 80.00 },
        revised: { standard: 48.00 }
    };

    function updateLanguagePrice() {
        const wordCount = parseInt(wordCountInput.value) || 0;
        const submissionType = submissionTypeSelect.value;
        const requestedTime = parseInt(turnaroundInput.value) || 24;
        const standardTime = calculateStandardTime(wordCount);
        const rushFeeMultiplier = calculateRushFee(requestedTime, standardTime);
        const baseRate = rates[submissionType]?.standard;

        if (baseRate === undefined) {
            console.error('Base rate not found for submission type:', submissionType);
            priceDisplay.textContent = '$0.00';
            return;
        }

        const price = (baseRate * wordCount / 1000) * rushFeeMultiplier;
        priceDisplay.textContent = '$' + price.toFixed(2);
        timeDisplay.textContent = 'Standard Time: ' + standardTime + ' hours';

        const existingRushFee = timeDisplay.querySelector('.rush-fee');
        if (existingRushFee) {
            timeDisplay.removeChild(existingRushFee);
        }

        if (rushFeeMultiplier > 1) {
            const rushPercentage = ((rushFeeMultiplier - 1) * 100).toFixed(0);
            const rushFeeElement = document.createElement('span');
            rushFeeElement.className = 'rush-fee';
            rushFeeElement.textContent = ` Rush Fee: +${rushPercentage}%`; // Added space for better display
            timeDisplay.appendChild(rushFeeElement);
        }
        highlightLanguageCell(submissionType, 'standard');
    }

    function highlightLanguageCell(submissionType, serviceLevel) {
        resetHighlighting();
        const cellId = `language-${submissionType}-${serviceLevel}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.classList.add('active');
        } else {
            // console.warn('Highlight cell not found:', cellId); // Optional: warn if cell missing
        }
    }

    [wordCountInput, submissionTypeSelect, turnaroundInput].forEach(element => {
        element.addEventListener('input', updateLanguagePrice);
    });
    updateLanguagePrice();
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

    if (!wordCountInput || !serviceLevelSelect || !submissionTypeSelect || !turnaroundInput || !priceDisplay || !timeDisplay) {
        console.error('One or more elements for the Scientific Calculator are missing.');
        return;
    }

    const rates = {
        original: { standard: 100.00, advanced: 140.00, premium: 180.00 },
        revised: { standard: 60.00, advanced: 84.00, premium: 108.00 }
    };

    function updateScientificPrice() {
        const wordCount = parseInt(wordCountInput.value) || 0;
        const serviceLevel = serviceLevelSelect.value;
        const submissionType = submissionTypeSelect.value;
        const requestedTime = parseInt(turnaroundInput.value) || 24;
        const standardTime = calculateStandardTime(wordCount);
        const rushFeeMultiplier = calculateRushFee(requestedTime, standardTime);
        const baseRate = rates[submissionType]?.[serviceLevel];

        if (baseRate === undefined) {
            console.error('Base rate not found for submission/service level:', submissionType, serviceLevel);
            priceDisplay.textContent = '$0.00';
            return;
        }

        const price = (baseRate * wordCount / 1000) * rushFeeMultiplier;
        priceDisplay.textContent = '$' + price.toFixed(2);
        timeDisplay.textContent = 'Standard Time: ' + standardTime + ' hours';

        const existingRushFee = timeDisplay.querySelector('.rush-fee');
        if (existingRushFee) {
            timeDisplay.removeChild(existingRushFee);
        }

        if (rushFeeMultiplier > 1) {
            const rushPercentage = ((rushFeeMultiplier - 1) * 100).toFixed(0);
            const rushFeeElement = document.createElement('span');
            rushFeeElement.className = 'rush-fee';
            rushFeeElement.textContent = ` Rush Fee: +${rushPercentage}%`;
            timeDisplay.appendChild(rushFeeElement);
        }
        highlightScientificCell(submissionType, serviceLevel);
    }

    function highlightScientificCell(submissionType, serviceLevel) {
        resetHighlighting();
        const cellId = `scientific-${submissionType}-${serviceLevel}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.classList.add('active');
        }
    }

    [wordCountInput, serviceLevelSelect, submissionTypeSelect, turnaroundInput].forEach(element => {
        element.addEventListener('input', updateScientificPrice);
    });
    updateScientificPrice();
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

    if (!wordCountInput || !serviceLevelSelect || !submissionTypeSelect || !turnaroundInput || !priceDisplay || !timeDisplay) {
        console.error('One or more elements for the Technical Calculator are missing.');
        return;
    }

    const rates = {
        original: { standard: 120.00, advanced: 160.00, premium: 200.00 },
        revised: { standard: 70.00, advanced: 94.00, premium: 118.00 }
    };

    function updateTechnicalPrice() {
        const wordCount = parseInt(wordCountInput.value) || 0;
        const serviceLevel = serviceLevelSelect.value;
        const submissionType = submissionTypeSelect.value;
        const requestedTime = parseInt(turnaroundInput.value) || 24;
        const standardTime = calculateStandardTime(wordCount);
        const rushFeeMultiplier = calculateRushFee(requestedTime, standardTime);
        const baseRate = rates[submissionType]?.[serviceLevel];

        if (baseRate === undefined) {
            console.error('Base rate not found for submission/service level:', submissionType, serviceLevel);
            priceDisplay.textContent = '$0.00';
            return;
        }

        const price = (baseRate * wordCount / 1000) * rushFeeMultiplier;
        priceDisplay.textContent = '$' + price.toFixed(2);
        timeDisplay.textContent = 'Standard Time: ' + standardTime + ' hours';

        const existingRushFee = timeDisplay.querySelector('.rush-fee');
        if (existingRushFee) {
            timeDisplay.removeChild(existingRushFee);
        }

        if (rushFeeMultiplier > 1) {
            const rushPercentage = ((rushFeeMultiplier - 1) * 100).toFixed(0);
            const rushFeeElement = document.createElement('span');
            rushFeeElement.className = 'rush-fee';
            rushFeeElement.textContent = ` Rush Fee: +${rushPercentage}%`;
            timeDisplay.appendChild(rushFeeElement);
        }
        highlightTechnicalCell(submissionType, serviceLevel);
    }

    function highlightTechnicalCell(submissionType, serviceLevel) {
        resetHighlighting();
        const cellId = `technical-${submissionType}-${serviceLevel}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.classList.add('active');
        }
    }

    [wordCountInput, serviceLevelSelect, submissionTypeSelect, turnaroundInput].forEach(element => {
        element.addEventListener('input', updateTechnicalPrice);
    });
    updateTechnicalPrice();
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

    if (!wordCountInput || !submissionTypeSelect || !turnaroundInput || !priceDisplay || !timeDisplay) {
        console.error('One or more elements for the Translation Calculator are missing.');
        return;
    }

    const rates = {
        original: { standard: 80.00 },
        revised: { standard: 48.00 }
    };

    function updateTranslationPrice() {
        const wordCount = parseInt(wordCountInput.value) || 0;
        const submissionType = submissionTypeSelect.value;
        const requestedTime = parseInt(turnaroundInput.value) || 24;
        const standardTime = calculateStandardTime(wordCount);
        const rushFeeMultiplier = calculateRushFee(requestedTime, standardTime);
        const baseRate = rates[submissionType]?.standard;

        if (baseRate === undefined) {
            console.error('Base rate not found for submission type:', submissionType);
            priceDisplay.textContent = '$0.00';
            return;
        }

        const price = (baseRate * wordCount / 1000) * rushFeeMultiplier;
        priceDisplay.textContent = '$' + price.toFixed(2);
        timeDisplay.textContent = 'Standard Time: ' + standardTime + ' hours';

        const existingRushFee = timeDisplay.querySelector('.rush-fee');
        if (existingRushFee) {
            timeDisplay.removeChild(existingRushFee);
        }

        if (rushFeeMultiplier > 1) {
            const rushPercentage = ((rushFeeMultiplier - 1) * 100).toFixed(0);
            const rushFeeElement = document.createElement('span');
            rushFeeElement.className = 'rush-fee';
            rushFeeElement.textContent = ` Rush Fee: +${rushPercentage}%`;
            timeDisplay.appendChild(rushFeeElement);
        }
        highlightTranslationCell(submissionType, 'standard');
    }

    function highlightTranslationCell(submissionType, serviceLevel) {
        resetHighlighting();
        const cellId = `translation-${submissionType}-${serviceLevel}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.classList.add('active');
        }
    }

    [wordCountInput, submissionTypeSelect, turnaroundInput].forEach(element => {
        element.addEventListener('input', updateTranslationPrice);
    });
    updateTranslationPrice();
}


//  // Exchange rates remain global as they are just data
const exchangeRates = {
    USD: { EUR: 0.91, GBP: 0.78, JPY: 112.65, CAD: 1.32, AUD: 1.47, CHF: 0.86, CNY: 6.94, INR: 83.25, MXN: 19.87 },
    EUR: { USD: 1.10, GBP: 0.86, JPY: 123.84, CAD: 1.45, AUD: 1.62, CHF: 0.94, CNY: 7.63, INR: 91.48, MXN: 21.84 },
    GBP: { USD: 1.28, EUR: 1.16, JPY: 143.77, CAD: 1.68, AUD: 1.88, CHF: 1.09, CNY: 8.86, INR: 106.21, MXN: 25.35 },
    JPY: { USD: 0.0089, EUR: 0.0081, GBP: 0.0070, CAD: 0.0117, AUD: 0.0131, CHF: 0.0076, CNY: 0.0616, INR: 0.7389, MXN: 0.1764 },
    CAD: { USD: 0.76, EUR: 0.69, GBP: 0.59, JPY: 85.34, AUD: 1.11, CHF: 0.65, CNY: 5.26, INR: 63.07, MXN: 15.05 },
    AUD: { USD: 0.68, EUR: 0.62, GBP: 0.53, JPY: 76.63, CAD: 0.90, CHF: 0.58, CNY: 4.72, INR: 56.63, MXN: 13.52 },
    CHF: { USD: 1.16, EUR: 1.06, GBP: 0.92, JPY: 130.99, CAD: 1.53, AUD: 1.71, CNY: 8.07, INR: 96.80, MXN: 23.10 },
    CNY: { USD: 0.14, EUR: 0.13, GBP: 0.11, JPY: 16.23, CAD: 0.19, AUD: 0.21, CHF: 0.12, INR: 12.00, MXN: 2.86 },
    INR: { USD: 0.012, EUR: 0.011, GBP: 0.0094, JPY: 1.35, CAD: 0.016, AUD: 0.018, CHF: 0.010, CNY: 0.083, MXN: 0.24 },
    MXN: { USD: 0.050, EUR: 0.046, GBP: 0.039, JPY: 5.67, CAD: 0.066, AUD: 0.074, CHF: 0.043, CNY: 0.35, INR: 4.19 }
};

// Ensure all currency pairs have rates (this part is fine to run early as it's data manipulation)
Object.keys(exchangeRates).forEach(fromCurrency => {
    exchangeRates[fromCurrency][fromCurrency] = 1; // Self rate
    Object.keys(exchangeRates).forEach(toCurrency => {
        if (!exchangeRates[fromCurrency][toCurrency] && fromCurrency !== toCurrency) {
            if (exchangeRates[toCurrency] && exchangeRates[toCurrency][fromCurrency]) {
                exchangeRates[fromCurrency][toCurrency] = 1 / exchangeRates[toCurrency][fromCurrency];
            } else {
                // console.warn(`Cannot calculate cross rate for ${fromCurrency} to ${toCurrency}`);
            }
        }
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // DOM elements for the first currency converter
    const floatButton = document.getElementById('the_conve_float_button');
    const floatButtonLeft = document.getElementById('the_conve_float_button_left');
    const overlay = document.getElementById('the_conve_overlay');
    const container = document.getElementById('the_conve_container');
    const closeBtn = document.getElementById('the_conve_close');
    const amountInput = document.getElementById('the_conve_amount');
    const fromCurrencySelect = document.getElementById('the_conve_from_currency'); // Renamed to avoid conflict if 'fromCurrency' is used elsewhere
    const toCurrencySelect = document.getElementById('the_conve_to_currency');     // Renamed
    const fromValue = document.getElementById('the_conve_from_value');
    const toValue = document.getElementById('the_conve_to_value');
    const convertBtn = document.getElementById('the_conve_convert_btn');
    const swapBtn = document.getElementById('the_conve_swap');
    const resultsDiv = document.getElementById('the_conve_results');
    const resultAmount = document.getElementById('the_conve_result_amount');
    const amountError = document.getElementById('the_conve_amount_error');

    // Check if essential elements exist before proceeding
    if (!floatButton || !overlay || !container || !closeBtn || !amountInput || !fromCurrencySelect || !toCurrencySelect || !convertBtn || !swapBtn || !resultsDiv) {
        console.error("Essential elements for the first currency converter are missing. Converter may not function.");
        // return; // You might choose to return if core elements are missing
    }

    // Format currency function
    function formatCurrency(amount, currency) {
        // Fallback for currency if it's somehow undefined/null during formatting
        const displayCurrency = currency || 'USD';
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: displayCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (e) {
            // console.error("Error formatting currency:", e, "Amount:", amount, "Currency:", currency);
            // Fallback to simple formatting if Intl fails (e.g., invalid currency code)
            return `${displayCurrency} ${amount.toFixed(2)}`;
        }
    }

    // Update displayed values
    function updateValues() {
        if (!amountInput || !fromCurrencySelect || !toCurrencySelect || !fromValue || !toValue || !resultAmount) return; // Guard clause

        const amount = parseFloat(amountInput.value) || 0;
        const fromCurr = fromCurrencySelect.value;
        const toCurr = toCurrencySelect.value;

        fromValue.value = formatCurrency(amount, fromCurr).replace(/[^\d.-]/g, '');

        if (amount > 0 && exchangeRates[fromCurr] && exchangeRates[fromCurr][toCurr] !== undefined) {
            const rate = exchangeRates[fromCurr][toCurr];
            const converted = amount * rate;
            toValue.value = formatCurrency(converted, toCurr).replace(/[^\d.-]/g, '');
            resultAmount.textContent = formatCurrency(converted, toCurr);
        } else {
            toValue.value = '';
            resultAmount.textContent = formatCurrency(0, toCurr);
            if (!(exchangeRates[fromCurr] && exchangeRates[fromCurr][toCurr] !== undefined)) {
                // console.warn(`Exchange rate not found for ${fromCurr} to ${toCurr}`);
            }
        }
    }

    // Convert function
    function convert() {
        if (!amountInput || !amountError || !resultsDiv || !fromCurrencySelect || !toCurrencySelect || !toValue || !resultAmount) return; // Guard clause

        const amount = parseFloat(amountInput.value);

        if (isNaN(amount) || amount <= 0) { // Check for isNaN as well
            amountError.style.display = 'block';
            resultsDiv.style.display = 'none';
            return;
        }

        amountError.style.display = 'none';
        const fromCurr = fromCurrencySelect.value;
        const toCurr = toCurrencySelect.value;


        if (exchangeRates[fromCurr] && exchangeRates[fromCurr][toCurr] !== undefined) {
            const rate = exchangeRates[fromCurr][toCurr];
            const converted = amount * rate;
            toValue.value = formatCurrency(converted, toCurr).replace(/[^\d.-]/g, '');
            resultAmount.textContent = formatCurrency(converted, toCurr);
            resultsDiv.style.display = 'block';
        } else {
            // console.error(`Conversion failed: Exchange rate not found for ${fromCurr} to ${toCurr}`);
            resultsDiv.style.display = 'none'; // Hide results if rate is missing
        }
    }

    // Swap currencies
    function swapCurrencies() {
        if (!fromCurrencySelect || !toCurrencySelect) return; // Guard clause
        const temp = fromCurrencySelect.value;
        fromCurrencySelect.value = toCurrencySelect.value;
        toCurrencySelect.value = temp;
        updateValues();
    }

    // Open converter
    function openConverter() {
        if (!overlay || !container) return; // Guard clause
        overlay.style.display = 'flex';
        setTimeout(() => {
            overlay.classList.add('fadeIn');
            container.classList.add('active');
        }, 10);
    }

    // Close converter
    function closeConverter() {
        if (!overlay || !container) return; // Guard clause
        overlay.classList.remove('fadeIn');
        overlay.classList.add('fadeOut');
        container.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
            overlay.classList.remove('fadeOut');
        }, 300);
    }

    // Event listeners for first currency converter
    if (floatButton) floatButton.addEventListener('click', openConverter);
    if (floatButtonLeft) floatButtonLeft.addEventListener('click', openConverter); // Check if left button exists
    if (closeBtn) closeBtn.addEventListener('click', closeConverter);
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeConverter();
            }
        });
    }

    if (amountInput) {
        amountInput.addEventListener('input', function() {
            updateValues();
            if (parseFloat(this.value) > 0) {
                if(amountError) amountError.style.display = 'none';
            }
        });
    }

    if (fromCurrencySelect) fromCurrencySelect.addEventListener('change', updateValues);
    if (toCurrencySelect) toCurrencySelect.addEventListener('change', updateValues);
    if (convertBtn) convertBtn.addEventListener('click', convert);
    if (swapBtn) swapBtn.addEventListener('click', swapCurrencies);

    // Initialize first currency converter
    if (amountInput) {
        amountInput.value = "1"; // Set default value
        updateValues(); // Initial calculation and display
    }
});


// CODE FOR NEW CURRENCY CONVERTER (Second Version - Class based)
document.addEventListener('DOMContentLoaded', () => {
    class CurrencyConverter {
        constructor() {
            this.exchangeRatesData = { // Renamed to avoid conflict with global exchangeRates
                USD: { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 153.2, CAD: 1.35, AUD: 1.51, CHF: 0.90, CNY: 7.10 },
                EUR: { USD: 1.09, EUR: 1, GBP: 0.86, JPY: 166.5, CAD: 1.47, AUD: 1.64, CHF: 0.98, CNY: 7.72 },
                GBP: { USD: 1.27, EUR: 1.16, GBP: 1, JPY: 193.6, CAD: 1.71, AUD: 1.91, CHF: 1.14, CNY: 8.97 },
                JPY: { USD: 0.0065, EUR: 0.0060, GBP: 0.0052, JPY: 1, CAD: 0.0088, AUD: 0.0099, CHF: 0.0059, CNY: 0.046 },
                CAD: { USD: 0.74, EUR: 0.68, GBP: 0.58, JPY: 113.5, CAD: 1, AUD: 1.12, CHF: 0.67, CNY: 5.26 },
                AUD: { USD: 0.66, EUR: 0.61, GBP: 0.52, JPY: 101.3, CAD: 0.89, AUD: 1, CHF: 0.60, CNY: 4.70 },
                CHF: { USD: 1.11, EUR: 1.02, GBP: 0.88, JPY: 170.0, CAD: 1.50, AUD: 1.67, CHF: 1, CNY: 7.87 },
                CNY: { USD: 0.141, EUR: 0.130, GBP: 0.111, JPY: 21.6, CAD: 0.190, AUD: 0.213, CHF: 0.127, CNY: 1 }
            };

            this.elements = {
                fromAmount: document.getElementById('fromAmount'),
                toAmount: document.getElementById('toAmount'),
                fromCurrency: document.getElementById('fromCurrency'),
                toCurrency: document.getElementById('toCurrency'),
                swapBtn: document.getElementById('swapBtn'),
                convertBtn: document.getElementById('convertBtn'), // This is for the second converter
                resultAmount: document.getElementById('resultAmount'), // This seems to be for the *second* converter display
                resultText: document.getElementById('resultText'),
                form: document.getElementById('converterForm'),
                converterContainer: document.querySelector('.n_we_conv_currency-converter') // For loading state
            };

            // Check if critical elements for this converter exist
            if (!this.elements.fromAmount || !this.elements.fromCurrency || !this.elements.toCurrency || !this.elements.form) {
                console.error("Essential elements for the new CurrencyConverter (class-based) are missing. It may not function.");
                return; // Don't initialize if core elements are missing
            }
            
            this.initEventListeners();
            this.convert(); // Initial conversion
        }

        initEventListeners() {
            if(this.elements.fromAmount) this.elements.fromAmount.addEventListener('input', () => this.convert());
            if(this.elements.fromCurrency) this.elements.fromCurrency.addEventListener('change', () => this.convert());
            if(this.elements.toCurrency) this.elements.toCurrency.addEventListener('change', () => this.convert());
            if(this.elements.swapBtn) { // Note: ID 'swapBtn' might conflict if used by first converter's HTML
                this.elements.swapBtn.addEventListener('click', () => this.swapCurrencies());
                this.elements.swapBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.swapCurrencies();
                    }
                });
            }
            if(this.elements.convertBtn) this.elements.convertBtn.addEventListener('click', () => this.convert()); // Note: ID 'convertBtn' might conflict
            
            if(this.elements.form) {
                this.elements.form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.convert();
                });
            }
        }

        formatNumber(number, decimals = 2) {
            return number.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        convert() {
            if (!this.elements.fromAmount || !this.elements.fromCurrency || !this.elements.toCurrency) {
                 // console.warn("Cannot convert, missing core elements for new converter.");
                 return;
            }

            const amount = parseFloat(this.elements.fromAmount.value);
            const from = this.elements.fromCurrency.value;
            const to = this.elements.toCurrency.value;

            this.setLoadingState(true);

            setTimeout(() => { // Simulate API delay
                if (isNaN(amount)) {
                    if(this.elements.toAmount) this.elements.toAmount.value = '';
                    if(this.elements.resultAmount) this.elements.resultAmount.textContent = '0.00 ' + to; // Careful with shared ID 'resultAmount'
                    if(this.elements.resultText && this.exchangeRatesData[from] && this.exchangeRatesData[from][to] !== undefined) {
                         this.elements.resultText.textContent = '1 ' + from + ' = ' +
                            this.formatNumber(this.exchangeRatesData[from][to]) + ' ' + to;
                    } else if (this.elements.resultText) {
                        this.elements.resultText.textContent = `1 ${from} = Rate not found for ${to}`;
                    }

                } else {
                    if (this.exchangeRatesData[from] && this.exchangeRatesData[from][to] !== undefined) {
                        const rate = this.exchangeRatesData[from][to];
                        const converted = amount * rate;

                        if(this.elements.toAmount) this.elements.toAmount.value = this.formatNumber(converted);
                        if(this.elements.resultAmount) this.elements.resultAmount.textContent = this.formatNumber(converted) + ' ' + to;
                        if(this.elements.resultText) this.elements.resultText.textContent = '1 ' + from + ' = ' +
                            this.formatNumber(rate) + ' ' + to;
                    } else {
                        // console.warn(`Rate not found for ${from} to ${to} in new converter.`);
                        if(this.elements.toAmount) this.elements.toAmount.value = '';
                        if(this.elements.resultAmount) this.elements.resultAmount.textContent = 'N/A';
                        if(this.elements.resultText) this.elements.resultText.textContent = `Rate not found: 1 ${from} to ${to}`;
                    }
                }
                this.setLoadingState(false);
            }, 300);
        }

        swapCurrencies() {
            if (!this.elements.fromCurrency || !this.elements.toCurrency) return;
            const tempCurrency = this.elements.fromCurrency.value;
            this.elements.fromCurrency.value = this.elements.toCurrency.value;
            this.elements.toCurrency.value = tempCurrency;
            this.convert();
        }

        setLoadingState(isLoading) {
            const converter = this.elements.converterContainer; // Use specific class for this converter
            const convertButton = this.elements.convertBtn; // Use specific button for this converter

            if (!converter || !convertButton) return;

            if (isLoading) {
                converter.classList.add('n_we_conv_loading');
                convertButton.textContent = 'Converting...';
                convertButton.disabled = true;
            } else {
                converter.classList.remove('n_we_conv_loading');
                convertButton.textContent = 'Convert Currency';
                convertButton.disabled = false;
            }
        }
    }
    // Only instantiate if the main form for this specific converter exists
    if (document.getElementById('converterForm') && document.getElementById('fromAmount')) {
        new CurrencyConverter();
    } else {
        // console.info("New Currency Converter (class-based) not initialized as its core form element 'converterForm' or 'fromAmount' is missing.");
    }
});


// CODE FOR FAQ ON PRICING
document.addEventListener('DOMContentLoaded', function() {
    const mainTitle = document.querySelector('.yo_faq_main_title');
    const questionsContainer = document.querySelector('.yo_faq_questions_container');

    if (mainTitle && questionsContainer) {
        mainTitle.addEventListener('click', function() {
            this.classList.toggle('yo_faq_active');
            questionsContainer.classList.toggle('yo_faq_active');
        });
    } else {
        // console.warn("FAQ main title or questions container not found.");
    }

    const questions = document.querySelectorAll('.yo_faq_question');
    questions.forEach(question => {
        question.addEventListener('click', function() {
            this.classList.toggle('yo_faq_active');
            const answer = this.nextElementSibling;
            if (answer && answer.classList.contains('yo_faq_answer')) { // Check if nextSibling is indeed the answer
                answer.classList.toggle('yo_faq_active');
            } else {
                // console.warn("FAQ answer not found for question:", question.textContent);
            }
        });
    });
});