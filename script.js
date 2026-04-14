let facts = (typeof factsData !== 'undefined') ? factsData : []; 

facts.forEach((item, index) => {
    item.id = index + 1; 
});

let selectedCategories = [];
let currentPool = [];
let viewedFacts = JSON.parse(localStorage.getItem('viewedFacts')) || [];

const actionBtn = document.getElementById('action-btn');
const speakBtn = document.getElementById('speak-btn');
const shareBtn = document.getElementById('share-btn');
const copyBtn = document.getElementById('copy-btn');
const searchInput = document.getElementById('category-search');
const badgesContainer = document.getElementById('active-badges');
const selectionStatus = document.getElementById('selection-status');
const contentContainer = document.getElementById('content-container');
const factCategoryLabel = document.getElementById('fact-category');

// --- TEMA KONTROLÜ (SAYFA YENİLENSE DE HATIRLAR) ---
const themeSwitch = document.getElementById('checkbox');
const currentTheme = localStorage.getItem('theme');

if (currentTheme) {
    document.body.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        themeSwitch.checked = true;
    }
}

themeSwitch.addEventListener('change', (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme); // Hafızaya kaydet
});

// LOGO / ANA SAYFA FONKSİYONU
document.getElementById('site-logo').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const detailView = document.getElementById('category-detail-view');
    if (detailView && detailView.style.display === "block") {
        detailView.style.display = "none";
        document.body.style.overflow = "auto";
    }

    // ANA EKRANA SIFIRLAMA (İstediğin yeni metinler ve roketiz hali)
    document.getElementById('fact-title').innerText = "Welcome!";
    document.getElementById('fact-text').innerText = "Click the button below to discover fascinating facts about more than 200+ categories!";
    document.getElementById('image-area').style.display = "none";
    factCategoryLabel.style.display = "none";
    
    // Sesleri durdur
    window.speechSynthesis.cancel();
    speakBtn.classList.remove('speaking');
    
    // Butonları gizle (Başlangıç hali)
    speakBtn.style.display = "none";
    shareBtn.style.display = "none";
    copyBtn.style.display = "none";
});

function updateStatusText() {
    selectionStatus.innerText = selectedCategories.length === 0 ? "Selected: ALL" : "Selected: " + selectedCategories.join(", ");
}

function preparePool() {
    let baseFacts = selectedCategories.length > 0 
        ? facts.filter(f => selectedCategories.some(cat => cat.toLowerCase() === f.category.toLowerCase())) 
        : [...facts];
    
    currentPool = baseFacts.filter(f => !viewedFacts.includes(f.id));

    if (currentPool.length === 0 && baseFacts.length > 0) {
        viewedFacts = viewedFacts.filter(id => !baseFacts.some(f => f.id === id));
        localStorage.setItem('viewedFacts', JSON.stringify(viewedFacts));
        currentPool = [...baseFacts];
    }

    for (let i = currentPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentPool[i], currentPool[j]] = [currentPool[j], currentPool[i]];
    }
}

actionBtn.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    speakBtn.classList.remove('speaking');

    if (currentPool.length === 0) preparePool();

    actionBtn.innerText = "Searching...";
    actionBtn.disabled = true;
    contentContainer.classList.remove('fade-in');

    setTimeout(() => {
        const next = currentPool.shift();
        if (next) {
            if (!viewedFacts.includes(next.id)) {
                viewedFacts.push(next.id);
                localStorage.setItem('viewedFacts', JSON.stringify(viewedFacts));
            }
            
            factCategoryLabel.innerText = next.category;
            factCategoryLabel.style.display = "inline-block";
            
            document.getElementById('fact-title').innerText = next.title;
            document.getElementById('fact-text').innerText = next.text;
            
            const imgArea = document.getElementById('image-area');
            const factImg = document.getElementById('fact-image');
            
            if (next.img || next.image) {
                imgArea.style.display = "flex";
                factImg.src = next.img || next.image;
            } else {
                imgArea.style.display = "none";
            }
            
            contentContainer.classList.add('fade-in');
            speakBtn.style.display = "flex";
            shareBtn.style.display = "flex";
            copyBtn.style.display = "flex";
            
            speakBtn.onclick = () => speakFact(`${next.title}. ${next.text}`);
            shareBtn.onclick = () => shareCurrentFact(next.title, next.text, next.category);
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(`${next.title}: ${next.text}`);
                copyBtn.innerText = "Copied!";
                setTimeout(() => copyBtn.innerText = "Copy Text", 2000);
            };
        }
        actionBtn.innerText = "ENLIGHTEN ME";
        actionBtn.disabled = false;
    }, 400);
});

function speakFact(text) {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speakBtn.classList.remove('speaking');
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onstart = () => speakBtn.classList.add('speaking');
    utterance.onend = () => speakBtn.classList.remove('speaking');
    utterance.onerror = () => speakBtn.classList.remove('speaking');
    window.speechSynthesis.speak(utterance);
}

function shareCurrentFact(title, text, category) {
    const shareMessage = `Did you know this about ${category}?\n\n"${title}: ${text}"`;
    if (navigator.share) {
        navigator.share({ title: title, text: shareMessage, url: window.location.href });
    } else {
        navigator.clipboard.writeText(shareMessage).then(() => alert("Copied to clipboard!"));
    }
}

searchInput.addEventListener('change', (e) => {
    const val = e.target.value.trim();
    if (!val) return;
    const foundFact = facts.find(f => f.category.toLowerCase() === val.toLowerCase());
    if (foundFact) {
        if (!selectedCategories.includes(foundFact.category)) {
            selectedCategories.push(foundFact.category);
            currentPool = [];
            renderBadges();
            updateStatusText();
        }
        searchInput.value = "";
    }
});

function renderBadges() {
    badgesContainer.innerHTML = "";
    selectedCategories.forEach(cat => {
        const badge = document.createElement('div');
        badge.className = "badge";
        badge.innerHTML = `${cat.toUpperCase()} &times;`;
        badge.onclick = () => {
            selectedCategories = selectedCategories.filter(c => c !== cat);
            currentPool = [];
            renderBadges();
            updateStatusText();
        };
        badgesContainer.appendChild(badge);
    });
}

function renderArchive() {
    const listContainer = document.getElementById('category-list');
    if (!listContainer) return;
    const uniqueCategories = [...new Set(facts.map(f => f.category))].sort();
    listContainer.innerHTML = "";
    uniqueCategories.forEach(cat => {
        const item = document.createElement('div');
        item.className = "archive-item";
        item.innerHTML = `<span>${cat}</span>`; 
        item.onclick = () => showCategoryDetail(cat);
        listContainer.appendChild(item);
    });
}

function showCategoryDetail(categoryName) {
    const detailView = document.getElementById('category-detail-view');
    const factsContainer = document.getElementById('cat-facts-container');
    const title = document.getElementById('selected-cat-title');
    title.innerText = categoryName;
    factsContainer.innerHTML = "";
    const categoryFacts = facts.filter(f => f.category.toLowerCase() === categoryName.toLowerCase());
    categoryFacts.forEach(f => {
        const card = document.createElement('div');
        card.className = "archive-fact-card";
        card.innerHTML = `
            ${(f.img || f.image) ? `<img src="${f.img || f.image}" alt="${f.title}">` : ''}
            <h2>${f.title}</h2>
            <p>${f.text}</p>
        `;
        factsContainer.appendChild(card);
    });
    detailView.style.display = "block";
    document.body.style.overflow = "hidden";
}

document.getElementById('back-to-main').onclick = () => {
    document.getElementById('category-detail-view').style.display = "none";
    document.body.style.overflow = "auto";
};

updateStatusText();
renderArchive();
