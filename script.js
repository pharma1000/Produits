/** 
 * CONFIGURATION: Paste your Apps Script Web App URL below 
 */
const API_URL = "https://script.google.com/macros/s/AKfycbzaNi6UY67DS7OXV4cCNhikTlM4iJkZ5Qfx1rhrJ8l3Zba92PSDnqElOlTFdg1XpylakA/exec"; 

// 1. GLOBAL STATE
let allProducts = [];
let designData = { status: 'open', categoryImages: {} };
let allLivraison = [];
let cart = JSON.parse(localStorage.getItem('pharmaCart')) || [];
let favorites = JSON.parse(localStorage.getItem('pharmaFavs')) || [];
let currentPage = 1;
const itemsPerPage = 30;
const categories = ["COSMETIQUE", "Hygiène Corporelle", "Huiles essentielles", "DIETETIQUE", "ARTICLE BEBE", "DISPOSITIFS MÉDICAUX", "ORTHOPÉDIQUE"];

// 2. HELPER FUNCTIONS (Defined first to prevent ReferenceErrors)

function formatDriveUrl(url) {
    if (!url) return '';
    const idMatch = url.toString().match(/[-\w]{25,}/);
    return idMatch ? `https://lh3.googleusercontent.com/d/${idMatch[0]}` : url;
}

function normalizeStr(s) {
    if(!s) return "";
    return s.toString().toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isMatch(s1, s2) {
    return normalizeStr(s1) === normalizeStr(s2);
}

function updateBadges() {
    const cartBadge = document.getElementById('cart-count');
    const favBadge = document.getElementById('fav-count');
    if(cartBadge) cartBadge.innerText = cart.reduce((a, b) => a + b.qty, 0);
    if(favBadge) favBadge.innerText = favorites.length;
}

function hideLoader() {
    const loader = document.getElementById('loader-shell');
    if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 400);
    }
}

function toggleTheme() {
    const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const themeIcon = document.querySelector('.theme-toggle');
    if(themeIcon) themeIcon.className = next === 'dark' ? 'fas fa-sun theme-toggle' : 'fas fa-moon theme-toggle';
}

// 3. RENDER FUNCTIONS

function productCard(p) {
    const isF = favorites.includes(p.name);
    const avail = !p.availability || isMatch(p.availability, 'disponible');
    const closed = designData.status === 'closed';
    const safeName = (p.name || "").replace(/'/g, "\\'");

    return `
      <div class="product-card" onclick="showPage('product', '${safeName}')">
        <div class="fav-heart ${isF ? 'active' : ''}" onclick="event.stopPropagation(); toggleFav('${safeName}', this)">
          <i class="${isF ? 'fas' : 'far'} fa-heart"></i>
        </div>
        <img src="${formatDriveUrl(p.image)}" class="product-img" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=PH'">
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${p.price.toFixed(2)} DA</div>
          <button class="btn" onclick="event.stopPropagation(); addToCart('${safeName}')" ${!avail || closed ? 'disabled' : ''}>
            ${closed ? 'Fermé' : (avail ? 'Ajouter' : 'Rupture')}
          </button>
        </div>
      </div>`;
}

function renderHome() {
    const bannerUrl = formatDriveUrl(designData.banner);
    let h = designData.status === 'closed' ? '<div class="status-stripe">BOUTIQUE FERMÉE TEMPORAIREMENT</div>' : '';
    
    h += `<div class="banner" style="background-image: url('${bannerUrl}')"></div>`;
    h += `<div class="category-scroll">`;
    categories.forEach(cat => {
        const img = formatDriveUrl(designData.categoryImages[cat.trim()] || "");
        h += `<div class="cat-item" onclick="showPage('category', '${cat.replace(/'/g, "\\'")}')">
            <div class="cat-img"><img src="${img}" onerror="this.src='https://via.placeholder.com/80?text=PH'"></div>
            <span>${cat}</span></div>`;
    });
    h += `</div><div class="container">`;

    // Category Preview Sections
    categories.forEach(cat => {
        const prods = allProducts.filter(p => isMatch(p.category, cat)).slice(0, 4);
        if(prods.length > 0) {
            h += `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
                    <b style="text-transform:uppercase; font-size:0.8rem;">${cat}</b>
                    <span style="color:var(--primary); font-size:0.7rem; font-weight:bold; cursor:pointer;" onclick="showPage('category', '${cat.replace(/'/g, "\\'")}')">VOIR TOUT</span>
                  </div>
                  <div class="product-grid" style="margin-top:10px">${prods.map(p => productCard(p)).join('')}</div>`;
        }
    });

    h += `<div style="margin-top:40px; border-top:1px solid var(--border); padding-top:20px;"><b>Catalogue complet</b></div>
          <div class="product-grid" id="main-grid" style="margin-top:15px"></div>
          <div id="pagination-ctrl" class="pagination"></div></div>`;
    
    document.getElementById('home-page').innerHTML = h;
    changePage(1);
}

function changePage(p) {
    currentPage = p;
    const total = Math.ceil(allProducts.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const items = allProducts.slice(start, start + itemsPerPage);
    
    const grid = document.getElementById('main-grid');
    if(grid) grid.innerHTML = items.map(i => productCard(i)).join('');
    
    const ctrl = document.getElementById('pagination-ctrl');
    if (ctrl && total > 1) {
        ctrl.innerHTML = `
            <button class="pg-nav-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Préc.</button>
            <span style="font-weight:bold; font-size:0.8rem">Page ${currentPage}/${total}</span>
            <button class="pg-nav-btn" onclick="changePage(${currentPage + 1})" ${currentPage === total ? 'disabled' : ''}>Suiv.</button>`;
    }
}

function showPage(page, param = null) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    
    if (page === 'home') renderHome();
    else if (page === 'category') renderCategory(param);
    else if (page === 'product') renderProductDetail(param);
    else if (page === 'checkout') renderCheckout();
    else if (page === 'favorites') renderFavorites();
    else if (page === 'search') renderSearch();
    
    const target = document.getElementById(page + '-page');
    if(target) target.style.display = 'block';
    window.scrollTo(0,0);
}

// 4. MAIN DATA LOADING LOGIC

function renderWithData(data) {
    allProducts = data.products || [];
    designData = data.design || designData;
    allLivraison = data.livraisons || [];
    
    // Set Theme
    if(localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
    
    updateBadges();
    showPage('home');
}

window.onload = function() {
    // Attempt cache load
    const cachedStore = localStorage.getItem('pharma_cache');
    if (cachedStore) {
        try {
            renderWithData(JSON.parse(cachedStore));
            hideLoader();
        } catch(e) { console.log("Cache error"); }
    }

    // Fetch from API
    fetch(API_URL, { redirect: 'follow' })
    .then(response => {
        if (!response.ok) throw new Error("Network error");
        return response.json();
    })
    .then(data => {
        localStorage.setItem('pharma_cache', JSON.stringify(data));
        renderWithData(data);
        hideLoader();
    })
    .catch(err => {
        console.error("Fetch failed:", err);
        if (!localStorage.getItem('pharma_cache')) {
            document.getElementById('loader-shell').innerHTML = 
            `<div style="padding:40px; text-align:center; color:red; font-family:sans-serif;">
                <b>Erreur de connexion</b><br><small>${err.message}</small><br><br>
                <button onclick="location.reload()" style="padding:10px; background:#00a86b; color:white; border:none; border-radius:8px;">Réessayer</button>
            </div>`;
        }
    });
};

// 5. CART & ORDERING

function updateTotal() {
    const wilName = document.getElementById('wilaya-select').value;
    const met = document.getElementById('method-select').value;
    const sub = cart.reduce((acc, i) => acc + ((allProducts.find(p=>p.name===i.name)||{price:0}).price*i.qty), 0);
    let ship = 0;
    const addr = document.getElementById('addr-field');

    if(met === 'magasin') {
        addr.value = "RETRAIT MAGASIN";
        addr.readOnly = true;
    } else {
        addr.readOnly = false;
        if(addr.value === "RETRAIT MAGASIN") addr.value = "";
        const data = allLivraison.find(l => l.wilaya === wilName);
        if(data) ship = (met === 'domicile') ? data.dPrice : data.rPrice;
    }
    document.getElementById('shipping-val').innerText = ship.toFixed(2) + " DA";
    document.getElementById('total-val').innerText = (sub + ship).toFixed(2) + " DA";
}

function submitOrder(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const method = document.getElementById('method-select').value;
    
    data.wilaya = document.getElementById('wilaya-select').value || "Magasin";
    data.products = cart.map(i => `${i.name} (x${i.qty})`).join(', ');
    data.orderTotal = document.getElementById('total-val').innerText;
    data.shippingMethod = method;

    // Show Success instantly
    const msg = (method === 'magasin') ? "Nous vous attendons en pharmacie !" : "Commande enregistrée ! On vous appelle bientôt.";
    document.getElementById('success-page').innerHTML = `<div class="container" style="text-align:center; padding-top:50px;"><div class="success-card" style="background:var(--card); padding:30px; border-radius:20px; border:1px solid var(--border)"><i class="fas fa-check-circle" style="font-size:4rem; color:var(--primary); margin-bottom:20px;"></i><h1>Merci !</h1><p>${msg}</p><button class="btn" onclick="location.reload()">RETOUR</button></div></div>`;
    showPage('success');
    
    // Upload in background
    fetch(API_URL, { method: "POST", mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(data) });

    cart = [];
    localStorage.removeItem('pharmaCart');
    updateBadges();
}

function addToCart(n) {
    const entry = cart.find(i => i.name === n);
    if(entry) entry.qty++; else cart.push({name: n, qty: 1});
    localStorage.setItem('pharmaCart', JSON.stringify(cart));
    updateBadges();
    const cbtn = document.getElementById('cart-btn-nav');
    if(cbtn) {
        cbtn.classList.add('animate-bounce'); 
        setTimeout(()=>cbtn.classList.remove('animate-bounce'), 400);
    }
}

function toggleFav(n, el) {
    const idx = favorites.indexOf(n);
    if(idx > -1) { 
        favorites.splice(idx,1); 
        el.classList.remove('active'); 
        el.querySelector('i').className='far fa-heart'; 
    } else { 
        favorites.push(n); 
        el.classList.add('active'); 
        el.querySelector('i').className='fas fa-heart'; 
    }
    localStorage.setItem('pharmaFavs', JSON.stringify(favorites));
    updateBadges();
    const navH = document.getElementById('fav-btn-nav');
    if(navH) {
        navH.classList.add('animate-bounce'); 
        setTimeout(()=>navH.classList.remove('animate-bounce'), 400);
    }
}

function removeItem(idx) {
    cart.splice(idx,1);
    localStorage.setItem('pharmaCart', JSON.stringify(cart));
    updateBadges();
    renderCheckout();
}

// 6. SUB-PAGE RENDERERS

function renderCheckout() {
    let sub = cart.reduce((acc, i) => acc + ((allProducts.find(p=>p.name===i.name)||{price:0}).price*i.qty), 0);
    const itemsH = cart.map((item, idx) => {
        const p = allProducts.find(x => x.name === item.name);
        return `<div style="display:flex; justify-content:space-between; background:var(--card); padding:10px; margin-bottom:5px; border-radius:10px; border:1px solid var(--border)">
                <div style="font-size:0.8rem"><b>${p.name}</b><br>${p.price.toFixed(2)} DA x ${item.qty}</div>
                <i class="fas fa-trash" onclick="removeItem(${idx})" style="color:red; cursor:pointer"></i></div>`;
    }).join('');
    const wilayas = allLivraison.map(l => `<option value="${l.wilaya}">${l.wilaya}</option>`).join('');
    document.getElementById('checkout-page').innerHTML = `<div class="container"><div class="return-bar" onclick="showPage('home')">← RETOUR</div><h2>Panier</h2>${itemsH || '<p>Vide</p>'}
      <div style="background:var(--card); padding:15px; border-radius:15px; margin-top:15px; border:1px solid var(--border)">
        <select id="wilaya-select" onchange="updateTotal()"><option value="">Wilaya...</option>${wilayas}</select>
        <select id="method-select" onchange="updateTotal()"><option value="domicile">Domicile</option><option value="relais">Relais</option><option value="magasin">Magasin</option></select>
        <div style="display:flex; justify-content:space-between; margin-top:10px;"><span>Produits</span><span>${sub.toFixed(2)} DA</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Livraison</span><span id="shipping-val">0.00 DA</span></div>
        <div style="display:flex; justify-content:space-between; font-weight:bold; color:var(--primary); font-size:1.1rem; margin-top:10px;"><span>TOTAL</span><span id="total-val">${sub.toFixed(2)} DA</span></div>
      </div>
      <form onsubmit="submitOrder(event)" ${!cart.length || designData.status === 'closed' ?'style="display:none"':''} style="margin-top:20px">
        <input type="text" name="name" placeholder="Nom Complet" required><input type="email" name="email" placeholder="Email" required><input type="tel" name="phone" placeholder="Téléphone" required><textarea name="address" id="addr-field" placeholder="Adresse" required rows="2"></textarea>
        <button type="submit" class="btn" style="background:#ff4757">COMMANDER</button></form></div>`;
}

function renderCategory(cat) {
    const filtered = allProducts.filter(p => isMatch(p.category, cat));
    document.getElementById('category-page').innerHTML = `<div class="container"><div class="return-bar" onclick="showPage('home')">← RETOUR</div><div style="margin-bottom:15px"><b>${cat}</b></div><div class="product-grid">${filtered.map(p => productCard(p)).join('')}</div></div>`;
}

function renderProductDetail(name) {
    const p = allProducts.find(x => x.name === name);
    if(!p) return showPage('home');
    const related = allProducts.filter(x => isMatch(x.category, p.category) && x.name !== p.name).slice(0, 4);
    document.getElementById('product-page').innerHTML = `<div class="container"><div class="return-bar" onclick="showPage('home')">← RETOUR</div><div style="background:var(--card); padding:20px; border-radius:20px; text-align:center; border:1px solid var(--border); margin-top:10px;"><img src="${formatDriveUrl(p.image)}" style="height:220px; object-fit:contain; background:#fff; border-radius:10px;"><h1>${p.name}</h1><h2 style="color:var(--primary)">${p.price.toFixed(2)} DA</h2><p style="text-align:left; color:var(--text-light); font-size:0.9rem">${p.description}</p><button class="btn" onclick="addToCart('${p.name.replace(/'/g, "\\'")}')">AJOUTER AU PANIER</button></div><div style="margin-top:20px"><b>Similaires</b></div><div class="product-grid" style="margin-top:10px">${related.map(r => productCard(r)).join('')}</div></div>`;
}

function renderFavorites() {
    const favs = allProducts.filter(p => favorites.includes(p.name));
    document.getElementById('favorites-page').innerHTML = `<div class="container"><div class="return-bar" onclick="showPage('home')">← RETOUR</div><b>Mes Favoris</b><div class="product-grid" style="margin-top:15px">${favs.length ? favs.map(p => productCard(p)).join('') : '<p>Vide</p>'}</div></div>`;
}

function renderSearch() {
    document.getElementById('search-page').innerHTML = `<div class="container"><div class="return-bar" onclick="showPage('home')">← RETOUR</div><input type="text" id="search-input" placeholder="Rechercher..." oninput="performSearch(this.value)"><div id="search-results" class="product-grid" style="margin-top:20px"></div></div>`;
    setTimeout(()=>document.getElementById('search-input').focus(), 100);
}

function performSearch(q) {
    if (q.length < 2) { document.getElementById('search-results').innerHTML = ''; return; }
    const filtered = allProducts.filter(p => normalizeStr(p.name).includes(normalizeStr(q)));
    document.getElementById('search-results').innerHTML = filtered.map(p => productCard(p)).join('');
}
