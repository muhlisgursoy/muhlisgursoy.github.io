// Trendyol Profit Calculator JavaScript

// Global variables
let useBarVisualization = true; // Fallback to bar chart if Chart.js not available
const STOPAJ_RATE = 0.01; // 1% fixed e-commerce withholding tax

// Commission rates based on price ranges
const COMMISSION_RATES = [
    { min: 476.28, max: Infinity, rate: 0.23, label: "476.28₺ ve üstü" },
    { min: 444.47, max: 476.27, rate: 0.197, label: "444.47₺ - 476.27₺" },
    { min: 374.51, max: 444.46, rate: 0.184, label: "374.51₺ - 444.46₺" },
    { min: 0, max: 374.50, rate: 0.135, label: "374.50₺ ve altı" }
];

// DOM elements
const elements = {
    productCost: document.getElementById('product-cost'),
    vatRate: document.getElementById('vat-rate'),
    shipping0150: document.getElementById('shipping-0-150'),
    shipping150300: document.getElementById('shipping-150-300'),
    shipping300plus: document.getElementById('shipping-300-plus'),
    salesPrice: document.getElementById('sales-price'),
    salesPriceValue: document.getElementById('sales-price-value'),
    commissionRate: document.getElementById('commission-rate'),
    commissionRangeInfo: document.getElementById('commission-range-info'),
    netProfit: document.getElementById('net-profit'),
    profitMargin: document.getElementById('profit-margin'),
    // Breakdown elements
    breakdownSalesPrice: document.getElementById('breakdown-sales-price'),
    breakdownProductCost: document.getElementById('breakdown-product-cost'),
    breakdownCommission: document.getElementById('breakdown-commission'),
    breakdownVat: document.getElementById('breakdown-vat'),
    breakdownShipping: document.getElementById('breakdown-shipping'),
    breakdownStopaj: document.getElementById('breakdown-stopaj'),
    breakdownNetProfit: document.getElementById('breakdown-net-profit'),
    // Bar visualization elements
    expenseBars: document.querySelectorAll('.expense-bar')
};

// Initialize the calculator
function init() {
    // Add event listeners
    Object.values(elements).forEach(element => {
        if (element && element.addEventListener) {
            element.addEventListener('input', calculateProfit);
            element.addEventListener('change', calculateProfit);
        }
    });

    // Special handler for sales price slider
    elements.salesPrice.addEventListener('input', function() {
        elements.salesPriceValue.textContent = parseFloat(this.value).toFixed(2);
        calculateProfit();
    });

    // Check if Chart.js is available
    if (typeof Chart !== 'undefined') {
        useBarVisualization = false;
        initChart();
    }
    
    // Initial calculation
    calculateProfit();
}

// Get commission rate based on sales price
function getCommissionRate(salesPrice) {
    for (let range of COMMISSION_RATES) {
        if (salesPrice >= range.min && salesPrice <= range.max) {
            return range;
        }
    }
    return COMMISSION_RATES[COMMISSION_RATES.length - 1]; // Default to lowest rate
}

// Get shipping cost based on sales price
function getShippingCost(salesPrice) {
    if (salesPrice >= 300) {
        return parseFloat(elements.shipping300plus.value) || 0;
    } else if (salesPrice >= 150) {
        return parseFloat(elements.shipping150300.value) || 0;
    } else {
        return parseFloat(elements.shipping0150.value) || 0;
    }
}

// Calculate VAT
function calculateVAT(salesPrice, vatRate, otherExpensesVAT = 0) {
    // VAT calculation formula: (Sales Price / (100+VAT)) × VAT - VAT deduction from other expenses
    const vatAmount = (salesPrice / (100 + vatRate)) * vatRate;
    return Math.max(0, vatAmount - otherExpensesVAT);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2
    }).format(amount).replace('₺', '') + '₺';
}

// Format percentage
function formatPercentage(rate) {
    return (rate * 100).toFixed(2) + '%';
}

// Main calculation function
function calculateProfit() {
    try {
        // Get input values
        const productCost = parseFloat(elements.productCost.value) || 0;
        const vatRate = parseFloat(elements.vatRate.value) || 20;
        const salesPrice = parseFloat(elements.salesPrice.value) || 0;

        // Get commission info
        const commissionInfo = getCommissionRate(salesPrice);
        const commissionRate = commissionInfo.rate;
        const commissionAmount = salesPrice * commissionRate;

        // Update commission display
        elements.commissionRate.textContent = formatPercentage(commissionRate);
        elements.commissionRangeInfo.textContent = commissionInfo.label;

        // Get shipping cost
        const shippingCost = getShippingCost(salesPrice);

        // Calculate VAT (assuming product cost includes VAT for simplification)
        const vatAmount = calculateVAT(salesPrice, vatRate);

        // Calculate e-commerce withholding tax (1% of sales price excluding VAT)
        const priceWithoutVAT = salesPrice / (1 + vatRate / 100);
        const stopajAmount = priceWithoutVAT * STOPAJ_RATE;

        // Calculate total expenses
        const totalExpenses = productCost + commissionAmount + vatAmount + shippingCost + stopajAmount;

        // Calculate net profit
        const netProfit = salesPrice - totalExpenses;

        // Calculate profit margin
        const profitMargin = salesPrice > 0 ? (netProfit / salesPrice) * 100 : 0;

        // Update main results
        elements.netProfit.textContent = formatCurrency(netProfit);
        elements.profitMargin.textContent = profitMargin.toFixed(2) + '%';

        // Apply styling based on profit
        elements.netProfit.className = netProfit >= 0 ? 'amount positive' : 'amount negative';
        elements.profitMargin.className = profitMargin >= 0 ? 'percentage positive' : 'percentage negative';

        // Update breakdown table
        elements.breakdownSalesPrice.textContent = formatCurrency(salesPrice);
        elements.breakdownProductCost.textContent = '-' + formatCurrency(productCost);
        elements.breakdownCommission.textContent = '-' + formatCurrency(commissionAmount);
        elements.breakdownVat.textContent = '-' + formatCurrency(vatAmount);
        elements.breakdownShipping.textContent = '-' + formatCurrency(shippingCost);
        elements.breakdownStopaj.textContent = '-' + formatCurrency(stopajAmount);
        elements.breakdownNetProfit.textContent = formatCurrency(netProfit);

        // Update visualization
        if (useBarVisualization) {
            updateBarVisualization({
                productCost,
                commission: commissionAmount,
                vat: vatAmount,
                shipping: shippingCost,
                stopaj: stopajAmount,
                profit: Math.max(0, netProfit) // Don't show negative profit in chart
            });
        } else {
            updateChart({
                productCost,
                commission: commissionAmount,
                vat: vatAmount,
                shipping: shippingCost,
                stopaj: stopajAmount,
                profit: Math.max(0, netProfit) // Don't show negative profit in chart
            });
        }

    } catch (error) {
        console.error('Calculation error:', error);
        // Set default values on error
        elements.netProfit.textContent = '0.00₺';
        elements.profitMargin.textContent = '0.00%';
    }
}

// Update bar visualization
function updateBarVisualization(data) {
    const totalAmount = data.productCost + data.commission + data.vat + data.shipping + data.stopaj + data.profit;
    
    const categories = [
        { key: 'product-cost', value: data.productCost, label: 'Ürün Maliyeti' },
        { key: 'commission', value: data.commission, label: 'Komisyon' },
        { key: 'vat', value: data.vat, label: 'KDV' },
        { key: 'shipping', value: data.shipping, label: 'Kargo' },
        { key: 'stopaj', value: data.stopaj, label: 'E-ticaret Stopaj' },
        { key: 'profit', value: data.profit, label: 'Net Kar' }
    ];

    categories.forEach(category => {
        const barElement = document.querySelector(`[data-category="${category.key}"]`);
        if (barElement) {
            const fillElement = barElement.querySelector('.bar-fill');
            const valueElement = barElement.querySelector('.bar-value');
            
            if (fillElement && valueElement) {
                const percentage = totalAmount > 0 ? (category.value / totalAmount) * 100 : 0;
                
                // Update the fill width
                setTimeout(() => {
                    fillElement.style.background = fillElement.style.backgroundColor;
                    fillElement.style.setProperty('--fill-width', `${percentage}%`);
                    
                    // Add CSS rule for the after pseudo-element
                    const style = fillElement.style;
                    const afterWidth = `${percentage}%`;
                    
                    // Create or update dynamic style for this element
                    let styleEl = document.getElementById(`bar-style-${category.key}`);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = `bar-style-${category.key}`;
                        document.head.appendChild(styleEl);
                    }
                    
                    styleEl.textContent = `
                        [data-category="${category.key}"] .bar-fill::after {
                            width: ${afterWidth} !important;
                        }
                    `;
                }, 100);
                
                // Update the value text
                valueElement.textContent = `${formatCurrency(category.value)} (${percentage.toFixed(1)}%)`;
            }
        }
    });
}

// Chart.js functions (kept for compatibility if Chart.js becomes available)
function initChart() {
    // Chart.js implementation would go here
    console.log('Chart.js initialization - not implemented in fallback mode');
}

function updateChart(data) {
    // Chart.js update would go here
    console.log('Chart.js update - using bar visualization instead');
}

// Utility functions for form validation
function validateInputs() {
    const productCost = parseFloat(elements.productCost.value) || 0;
    const salesPrice = parseFloat(elements.salesPrice.value) || 0;

    if (productCost < 0) {
        elements.productCost.value = 0;
    }

    if (salesPrice < productCost) {
        // Optionally show a warning that sales price is below cost
        console.warn('Sales price is below product cost');
    }
}

// Export functions for testing (if needed)
window.TrendyolCalculator = {
    getCommissionRate,
    getShippingCost,
    calculateVAT,
    calculateProfit,
    formatCurrency,
    formatPercentage
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Handle page visibility change to recalculate when page becomes visible
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        calculateProfit();
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+R or F5 to recalculate
    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        calculateProfit();
    }
});

// Handle mobile device orientation change
window.addEventListener('orientationchange', function() {
    setTimeout(function() {
        calculateProfit();
    }, 100);
});

// Performance optimization: debounce rapid input changes
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to calculation for better performance
const debouncedCalculate = debounce(calculateProfit, 100);