// Pharma-1000 - Clean URL Implementation
// Implements URL sync, deep linking, and slug logic for SEO

// ============================================
// SLUG HELPER FUNCTION
// ============================================

/**
 * Converts a product name to a URL-friendly slug
 * - Lowercase
 * - Trim spaces
 * - Replace spaces with dashes
 * - Remove special characters except hyphens
 */
function createSlug(productName) {
    if (!productName) return '';
    
    return productName
        .toLowerCase()
        .trim()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[é]/g, 'e')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Finds a product by its slug
 * @param {string} slug - The URL slug
 * @param {Array} products - Array of product objects
 * @returns {Object|null} - The matching product or null
 */
function findProductBySlug(slug, products) {
    if (!slug || !products) return null;
    
    return products.find(product => createSlug(product.nom || product.name) === slug) || null;
}

// ============================================
// GOOGLE SHEETS DATA LOADING
// ============================================

const GOOGLE_SHEET_URL = 'YOUR_GOOGLE_SHEET_URL_HERE';
const CORS_PROXY = 'https://corsproxy.io/?';
let productsData = [];

// Load data from Google Sheets
async function loadProductsFromSheet() {
    try {
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(GOOGLE_SHEET_URL)}`);
        const data = await response.json();
        productsData = data; // Store data globally for persistence checks
        return data;
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// ============================================
// PRODUCT DISPLAY FUNCTIONS
// ============================================

function displayProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-products">Aucun produit disponible.</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" onclick="openProductDetail('${createSlug(product.nom || product.name)}')">
            ${product.image ? `<img src="${product.image}" alt="${product.nom || product.name}" loading="lazy">` : ''}
            <h3>${product.nom || product.name}</h3>
            ${product.prix ? `<p class="price">${product.prix}€</p>` : ''}
        </div>
    `).join('');
}

function openProductDetail(slug) {
    const product = findProductBySlug(slug, productsData);
    
    if (!product) {
        console.warn('Product not found for slug:', slug);
        return;
    }

    // Update URL with pushState (Clean URL)
    const newUrl = `/${slug}`;
    window.history.pushState({ product: product }, '', newUrl);

    // Display the product detail
    showProductDetail(product);
}

function showProductDetail(product) {
    const listSection = document.getElementById('product-list');
    const detailSection = document.getElementById('product-detail');
    const contentDiv = document.getElementById('product-content');

    if (!listSection || !detailSection || !contentDiv) return;

    // Hide product list, show detail
    listSection.style.display = 'none';
    detailSection.style.display = 'block';

    // Update page title for SEO
    document.title = `${product.nom || product.name} | Pharma-1000`;

    // Build product detail HTML
    contentDiv.innerHTML = `
        <div class="product-detail-content">
            ${product.image ? `<img src="${product.image}" alt="${product.nom || product.name}" class="product-image">` : ''}
            <h2>${product.nom || product.name}</h2>
            ${product.prix ? `<p class="product-price">${product.prix}€</p>` : ''}
            ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
            ${product.composition ? `<div class="product-composition"><h4>Composition:</h4><p>${product.composition}</p></div>` : ''}
            ${product.usage ? `<div class="product-usage"><h4>Utilisation:</h4><p>${product.usage}</p></div>` : ''}
            ${product.lien ? `<a href="${product.lien}" target="_blank" class="product-link">Voir le produit</a>` : ''}
        </div>
    `;
}

function closeProductDetail() {
    // Update URL back to root
    window.history.pushState({}, '', '/');

    // Show product list, hide detail
    const listSection = document.getElementById('product-list');
    const detailSection = document.getElementById('product-detail');

    if (listSection) listSection.style.display = 'block';
    if (detailSection) detailSection.style.display = 'none';

    // Reset page title
    document.title = 'Pharma-1000 | Parapharmacie en Ligne';
}

// ============================================
// DEEP LINKING - ONLOAD URL CHECK
// ============================================

function handleInitialUrl() {
    const path = window.location.pathname;
    
    // Skip if we're at the root or index
    if (path === '/' || path === '/index.html' || path === '') {
        return false;
    }

    // Extract slug from URL (remove leading slash)
    const slug = path.replace(/^\//, '').replace(/\/$/, '');

    // Skip if slug is empty or looks like a file
    if (!slug || slug.includes('.')) {
        return false;
    }

    // Find the product and display it
    if (productsData.length > 0) {
        const product = findProductBySlug(slug, productsData);
        if (product) {
            showProductDetail(product);
            return true;
        }
    }

    return false;
}

// ============================================
// BROWSER HISTORY NAVIGATION
// ============================================

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.product) {
        showProductDetail(event.state.product);
    } else {
        closeProductDetail();
    }
});

// ============================================
// INITIALIZATION - DATA PERSISTENCE + DEEP LINKING
// ============================================

window.addEventListener('load', async () => {
    // Step 1: Always load fresh data from Google Sheet (Data Persistence)
    const products = await loadProductsFromSheet();
    
    if (products.length > 0) {
        displayProducts(products);
        
        // Step 2: Check if URL contains a product slug (Deep Linking)
        handleInitialUrl();
    } else {
        document.getElementById('products-container').innerHTML = 
            '<p class="error">Impossible de charger les produits. Veuillez réessayer plus tard.</p>';
    }
});

// ============================================
// EXPORT FOR GLOBAL ACCESS (for onclick handlers)
// ============================================

window.openProductDetail = openProductDetail;
window.closeProductDetail = closeProductDetail;
window.createSlug = createSlug;
window.findProductBySlug = findProductBySlug;