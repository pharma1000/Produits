const API_URL = "https://script.google.com/macros/s/AKfycbyGfgQ7LMjM4UbFodjvBVrX-gpw4E8cp_SOHNf3nvFRWruZTU2yp3FdquxIO9LtQY1Xrg/exec"; 

let allProducts = [];
let designData = { status: 'open', categoryImages: {} };
let allLivraison = [];
let cart = JSON.parse(localStorage.getItem('pharmaCart')) || [];
let favorites = JSON.parse(localStorage.getItem('pharmaFavs')) || [];

window.onload = function() {
    // STRATEGY: Try to load from phone memory first for instant display
    const cachedStore = localStorage.getItem('pharma_data_cache');
    if (cachedStore) {
        const data = JSON.parse(cachedStore);
        applyDataToUI(data);
        initApp(false); // Init without hiding loader immediately
    }

    // Always fetch fresh data from Google in the background
    fetch(API_URL, { redirect: 'follow' })
        .then(res => res.json())
        .then(data => {
            // Save to phone memory for next visit
            localStorage.setItem('pharma_data_cache', JSON.stringify(data));
            
            allProducts = data.products;
            designData = data.design;
            allLivraison = data.livraisons;
            
            applyDataToUI(data);
            initApp(true); // Now hide the loader
        })
        .catch(err => {
            if (!cachedStore) {
                document.getElementById('loader-shell').innerHTML = "Erreur de connexion. Veuillez rafraîchir.";
            }
        });
};

function applyDataToUI(data) {
    allProducts = data.products || [];
    designData = data.design || designData;
    allLivraison = data.livraisons || [];
}

function initApp(hideLoader) {
    if(localStorage.getItem('theme') === 'dark') document.body.setAttribute('data-theme', 'dark');
    updateBadges();
    showPage('home');
    if (hideLoader) {
        const loader = document.getElementById('loader-shell');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 400);
    }
}

// ... (Keep the rest of your script.js functions: showPage, renderHome, productCard, etc.)
