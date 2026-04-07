// 1. PASTE YOUR NEW URL HERE
const API_URL = "https://script.google.com/macros/s/AKfycbzaNi6UY67DS7OXV4cCNhikTlM4iJkZ5Qfx1rhrJ8l3Zba92PSDnqElOlTFdg1XpylakA/exec"; 

let allProducts = [];
let designData = { status: 'open', categoryImages: {} };
let allLivraison = [];
let cart = JSON.parse(localStorage.getItem('pharmaCart')) || [];
let favorites = JSON.parse(localStorage.getItem('pharmaFavs')) || [];
const itemsPerPage = 30;
const categories = ["COSMETIQUE", "Hygiène Corporelle", "Huiles essentielles", "DIETETIQUE", "ARTICLE BEBE", "DISPOSITIFS MÉDICAUX", "ORTHOPÉDIQUE"];

window.onload = function() {
    // Attempt to load from cache for speed
    const cached = localStorage.getItem('pharma_cache');
    if (cached) {
        try {
            renderWithData(JSON.parse(cached));
            hideLoader();
        } catch(e) { console.log("Cache error"); }
    }

    // Connect to Google
    fetch(API_URL, { redirect: 'follow' })
        .then(res => {
            if (!res.ok) throw new Error("Google Script Error: " + res.status);
            return res.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            
            localStorage.setItem('pharma_cache', JSON.stringify(data));
            renderWithData(data);
            hideLoader();
        })
        .catch(err => {
            console.error(err);
            // If we have no cache and network fails, show error
            if (!localStorage.getItem('pharma_cache')) {
                document.getElementById('loader-shell').innerHTML = 
                `<div style="padding:20px; color:red; text-align:center; font-family:sans-serif;">
                    <b>Erreur de connexion</b><br>
                    <small>${err.message}</small><br><br>
                    <button onclick="location.reload()" style="padding:10px; background:#00a86b; color:white; border:none; border-radius:8px;">Réessayer</button>
                </div>`;
            }
        });
};

function renderWithData(data) {
    allProducts = data.products || [];
    designData = data.design || designData;
    allLivraison = data.livraisons || [];
    if(localStorage.getItem('theme') === 'dark') document.body.setAttribute('data-theme', 'dark');
    updateBadges();
    showPage('home');
}

function hideLoader() {
    const loader = document.getElementById('loader-shell');
    if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 400);
    }
}

// ... COPY ALL OTHER FUNCTIONS (showPage, renderHome, productCard, toggleFav, submitOrder, etc.)
// ... FROM THE PREVIOUS script.js I GAVE YOU AND PASTE THEM BELOW THIS LINE
