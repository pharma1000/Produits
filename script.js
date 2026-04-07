const API_URL = "https://script.google.com/macros/s/AKfycbyFAPbWn01aad0bn12HMjoBt9B_8ov6LW0SNEOWPGScJHhzkZJAKjs7pmXs4mLJHuhz5g/exec"; 

let allProducts = [];
let designData = {};
let allLivraison = [];
let cart = JSON.parse(localStorage.getItem('pharmaCart')) || [];
let favorites = JSON.parse(localStorage.getItem('pharmaFavs')) || [];
const itemsPerPage = 30;
const categories = ["COSMETIQUE", "Hygiène Corporelle", "Huiles essentielles", "DIETETIQUE", "ARTICLE BEBE", "DISPOSITIFS MÉDICAUX", "ORTHOPÉDIQUE"];

window.onload = function() {
    fetch(API_URL)
        .then(res => res.json())
        .then(data => {
            allProducts = data.products;
            designData = data.design;
            allLivraison = data.livraisons;
            init();
        });
};

function init() {
    if(localStorage.getItem('theme') === 'dark') document.body.setAttribute('data-theme', 'dark');
    updateBadges();
    showPage('home');
    document.getElementById('loader-shell').style.display = 'none';
}

function formatDriveUrl(url) {
    if (!url) return 'https://via.placeholder.com/150';
    const id = url.toString().match(/[-\w]{25,}/);
    return id ? `https://lh3.googleusercontent.com/d/${id[0]}` : url;
}

function isMatch(s1, s2) {
    if(!s1 || !s2) return false;
    const clean = (s) => s.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return clean(s1) === clean(s2);
}

function updateBadges() {
    document.getElementById('cart-count').innerText = cart.reduce((a, b) => a + b.qty, 0);
    document.getElementById('fav-count').innerText = favorites.length;
}

function showPage(page, param) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    if (page === 'home') renderHome();
    else if (page === 'category') renderCategory(param);
    else if (page === 'product') renderProductDetail(param);
    else if (page === 'checkout') renderCheckout();
    else if (page === 'favorites') renderFavorites();
    else if (page === 'search') renderSearch();
    document.getElementById(page + '-page').style.display = 'block';
    window.scrollTo(0,0);
}

function renderHome() {
    let h = designData.status === 'closed' ? '<div class="status-stripe">FERMÉ TEMPORAIREMENT</div>' : '';
    h += `<div class="banner" style="background-image: url('${formatDriveUrl(designData.banner)}')"></div>`;
    h += `<div class="category-scroll">`;
    categories.forEach(cat => {
        h += `<div class="cat-item" onclick="showPage('category', '${cat}')">
            <div class="cat-img"><img src="${formatDriveUrl(designData.categoryImages[cat.trim()])}" onerror="this.src='https://via.placeholder.com/80?text=PH'"></div>
            <span>${cat}</span></div>`;
    });
    h += `</div><div class="container">`;
    categories.forEach(cat => {
        const prods = allProducts.filter(p => isMatch(p.category, cat)).slice(0, 4);
        if(prods.length > 0) {
            h += `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;"><b>${cat}</b><span style="color:var(--primary); font-size:0.7rem; font-weight:bold" onclick="showPage('category', '${cat}')">VOIR TOUT</span></div>
                 <div class="product-grid" style="margin-top:10px">${prods.map(p => productCard(p)).join('')}</div>`;
        }
    });
    h += `<div style="margin-top:30px"><b>Tous les produits</b></div><div class="product-grid" id="main-grid" style="margin-top:10px"></div></div>`;
    document.getElementById('home-page').innerHTML = h;
    document.getElementById('main-grid').innerHTML = allProducts.slice(0, 30).map(i => productCard(i)).join('');
}

function productCard(p) {
    const isF = favorites.includes(p.name);
    const avail = !p.availability || p.availability.toLowerCase().trim() === 'disponible';
    const closed = designData.status === 'closed';
    return `<div class="product-card" onclick="showPage('product', '${p.name}')">
        <div class="fav-heart ${isF?'active':''}" onclick="event.stopPropagation(); toggleFav('${p.name}', this)">
          <i class="${isF?'fas':'far'} fa-heart"></i></div>
        <img src="${formatDriveUrl(p.image)}" class="product-img">
        <div class="product-info"><div class="product-name">${p.name}</div><div class="product-price">${p.price.toFixed(2)} DA</div>
          <button class="btn" onclick="event.stopPropagation(); addToCart('${p.name}')" ${!avail || closed ? 'disabled' : ''}>Ajouter</button></div></div>`;
}

function submitOrder(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const method = document.getElementById('method-select').value;
    data.wilaya = document.getElementById('wilaya-select').value;
    data.products = cart.map(i => i.name + " (x" + i.qty + ")").join(', ');
    data.orderTotal = document.getElementById('total-val').innerText;
    data.shippingMethod = method;

    // Show Success Instantly
    document.getElementById('success-page').innerHTML = `<div class="container" style="text-align:center; padding-top:50px;"><div class="success-card" style="padding:30px; border-radius:20px; border:1px solid var(--border)"><i class="fas fa-check-circle" style="font-size:4rem; color:var(--primary)"></i><h1>Merci !</h1><p>Commande réussie.</p><button class="btn" onclick="location.reload()">RETOUR</button></div></div>`;
    showPage('success');
    
    // Send to Google Sheets API
    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(data)
    });

    cart = [];
    localStorage.removeItem('pharmaCart');
    updateBadges();
}

// ... include your remaining functions (updateTotal, toggleFav, addToCart, renderCategory, etc.)
