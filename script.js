// Globale Variablen
let allRecipes = [];
let filteredRecipes = [];
let currentFilter = 'all';
let currentView = 'all'; // 'all' oder 'single'
let currentRecipeId = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    loadRecipes();
    setupEventListeners();
    
    // Check if this is a single recipe page
    const isStaticSinglePage = document.body.dataset.view === 'single';
    if (!isStaticSinglePage) {
        handleRouting(); // Only for SPA routing on index page
    }
});

// URL-Routing - prüft aktuelle URL
function handleRouting() {
    const path = window.location.pathname;
    
    if (path === '/' || path === '/index.html') {
        // Hauptseite - alle Rezepte
        showAllRecipes();
    } else {
        // Einzelnes Rezept - extrahiere ID aus URL
        const recipeId = path.substring(1); // Entferne führenden "/"
        showSingleRecipe(recipeId);
    }
}

// Einzelnes Rezept anzeigen
function showSingleRecipe(recipeId) {
    const recipe = allRecipes.find(r => r.id === recipeId);
    
    if (!recipe) {
        // Rezept nicht gefunden - zurück zur Hauptseite
        window.history.pushState({}, '', '/');
        showAllRecipes();
        return;
    }
    
    currentView = 'single';
    currentRecipeId = recipeId;
    
    // UI für einzelnes Rezept
    document.querySelector('.search-filters').style.display = 'none';
    document.querySelector('.recipe-grid').style.display = 'none';
    document.querySelector('.no-results').style.display = 'none';
    
    renderSingleRecipe(recipe);
}

// Alle Rezepte anzeigen
function showAllRecipes() {
    currentView = 'all';
    currentRecipeId = null;
    
    // UI für alle Rezepte
    document.querySelector('.search-filters').style.display = 'block';
    document.querySelector('.recipe-grid').style.display = 'grid';
    
    // Einzelansicht verstecken (falls vorhanden)
    const singleView = document.getElementById('singleRecipeView');
    if (singleView) {
        singleView.style.display = 'none';
    }
    
    // Schema-Daten entfernen
    const oldSchema = document.getElementById('recipe-schema');
    if (oldSchema) {
        oldSchema.remove();
    }
    
    renderRecipes();
}

// Einzelnes Rezept rendern
function renderSingleRecipe(recipe) {
    let singleView = document.getElementById('singleRecipeView');
    
    if (!singleView) {
        // Container für einzelnes Rezept erstellen
        singleView = document.createElement('div');
        singleView.id = 'singleRecipeView';
        singleView.className = 'single-recipe-view';
        document.querySelector('.container').appendChild(singleView);
    }
    
    // Schema.org JSON-LD für Nextcloud hinzufügen
    addSchemaData(recipe);
    
    singleView.style.display = 'block';
    singleView.innerHTML = `
        <div class="single-recipe-header">
            <button class="back-button" onclick="goBack()">← Zurück zu allen Rezepten</button>
            <h1>${recipe.name}</h1>
            <div class="recipe-meta">
                <span class="recipe-time">${recipe.time}</span>
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="tag tag-${tag}">${getTagEmoji(tag)} ${tag}</span>`).join('')}
                </div>
            </div>
        </div>
        
        <div class="single-recipe-content">
            <div class="recipe-description">
                <p>${recipe.description}</p>
            </div>
            
            <div class="recipe-nutrition">
                <h3>Nährwerte</h3>
                <div class="nutrition-grid">
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.kcal}</div>
                        <div class="nutrition-label">Kalorien</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.protein}</div>
                        <div class="nutrition-label">Protein</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.carbs}</div>
                        <div class="nutrition-label">Kohlenhydrate</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.fat}</div>
                        <div class="nutrition-label">Fett</div>
                    </div>
                </div>
            </div>
            
            <div class="recipe-section">
                <h3>🛒 Zutaten</h3>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map(ing => `
                        <li>
                            <span class="ingredient-name">${ing.name}</span>
                            <span class="ingredient-amount">${ing.amount}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="recipe-section">
                <h3>👩‍🍳 Zubereitung</h3>
                <ol class="instructions-list">
                    ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
            
            ${recipe.familyNotes ? `
                <div class="family-notes">
                    <div class="family-notes-title">👨‍👩‍👧‍👦 Familie-Hinweise</div>
                    <div>${recipe.familyNotes}</div>
                </div>
            ` : ''}
        </div>
    `;
}

// Schema.org JSON-LD für Nextcloud hinzufügen
function addSchemaData(recipe) {
    // Schema.org Daten erstellen
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": recipe.name,
        "description": recipe.description,
        "prepTime": `PT${recipe.time}`,
        "recipeCategory": recipe.tags.includes('frühstück') ? 'Frühstück' : 
                        recipe.tags.includes('familie') ? 'Hauptgericht' : 'Beilage',
        "recipeCuisine": "Deutsch",
        "recipeYield": "2-4 Portionen",
        "keywords": recipe.tags.join(', '),
        "nutrition": {
            "@type": "NutritionInformation",
            "calories": `${recipe.nutrition.kcal} kcal`,
            "proteinContent": recipe.nutrition.protein,
            "carbohydrateContent": recipe.nutrition.carbs,
            "fatContent": recipe.nutrition.fat
        },
        "recipeIngredient": recipe.ingredients.map(ing => `${ing.amount} ${ing.name}`),
        "recipeInstructions": recipe.instructions.map((step, index) => ({
            "@type": "HowToStep",
            "text": step,
            "position": index + 1
        })),
        "author": {
            "@type": "Person",
            "name": "Kochbuch Kunz"
        },
        "datePublished": new Date().toISOString().split('T')[0],
        "url": window.location.href
    };
    
    // Füge Familie-Hinweise als Notizen hinzu
    if (recipe.familyNotes) {
        schemaData.recipeInstructions.push({
            "@type": "HowToStep",
            "text": `Familie-Hinweise: ${recipe.familyNotes}`,
            "position": recipe.instructions.length + 1
        });
    }
    
    // Bestehende Schema-Daten ersetzen
    const schemaScript = document.getElementById('recipe-schema');
    if (schemaScript) {
        schemaScript.textContent = JSON.stringify(schemaData, null, 2);
    }
    
    // Titel der Seite anpassen
    document.title = `${recipe.name} - Kochbuch Kunz`;
}

// Zurück zur Hauptseite
function goBack() {
    window.history.pushState({}, '', '/');
    showAllRecipes();
}

// Browser Zurück/Vor Buttons
window.addEventListener('popstate', function(event) {
    handleRouting();
});

// Event Listeners
function setupEventListeners() {
    // Such-Input
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Filter-Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', handleFilter);
    });
    
    // Modal schließen bei Klick außerhalb
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('recipeModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Rezepte laden
async function loadRecipes() {
    try {
        const response = await fetch('recipes.json');
        const data = await response.json();
        allRecipes = data.recipes || [];
        filteredRecipes = [...allRecipes];
        renderRecipes();
        updateStats();
    } catch (error) {
        console.error('Fehler beim Laden der Rezepte:', error);
        document.getElementById('recipeGrid').innerHTML = `
            <div style="text-align: center; color: rgba(255,255,255,0.8); padding: 2rem;">
                Fehler beim Laden der Rezepte. Bitte später versuchen.
            </div>
        `;
    }
}

// Suche
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filterRecipes();
}

// Filter
function handleFilter(e) {
    // Aktive Klasse umschalten
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    e.target.classList.add('active');
    
    currentFilter = e.target.dataset.filter;
    filterRecipes();
}

// Erweiterte Suche - durchsucht alle Bereiche eines Rezepts
function searchInRecipe(recipe, searchTerm) {
    if (!searchTerm) return true;
    
    // Alle Suchbereiche sammeln
    const searchFields = [
        recipe.name,
        recipe.description,
        ...recipe.tags,
        ...recipe.ingredients.map(ing => ing.name),
        ...recipe.instructions,
        recipe.familyNotes || ''
    ];
    
    // Fuzzy-Suche: auch ähnliche Begriffe finden
    return searchFields.some(field => {
        const fieldLower = field.toLowerCase();
        
        // Exakte Suche
        if (fieldLower.includes(searchTerm)) return true;
        
        // Fuzzy-Suche für Tippfehler (einfache Variante)
        if (searchTerm.length > 3) {
            // Entferne einen Buchstaben und versuche nochmal
            for (let i = 0; i < searchTerm.length; i++) {
                const fuzzyTerm = searchTerm.substring(0, i) + searchTerm.substring(i + 1);
                if (fieldLower.includes(fuzzyTerm)) return true;
            }
        }
        
        return false;
    });
}

// Filter & Sort kombiniert
function filterRecipes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // Filtern
    filteredRecipes = allRecipes.filter(recipe => {
        // Erweiterte Text-Suche
        const matchesSearch = searchInRecipe(recipe, searchTerm);
        
        // Tag-Filter
        const matchesFilter = currentFilter === 'all' || 
            recipe.tags.includes(currentFilter);
        
        return matchesSearch && matchesFilter;
    });
    
    // Sortieren: Joker zuerst, dann alphabetisch
    filteredRecipes.sort((a, b) => {
        const aIsJoker = a.tags.includes('joker');
        const bIsJoker = b.tags.includes('joker');
        if (aIsJoker && !bIsJoker) return -1;
        if (!aIsJoker && bIsJoker) return 1;
        return a.name.localeCompare(b.name);
    });
    
    renderRecipes();
    updateStats();
}

// Rezepte rendern
function renderRecipes() {
    const grid = document.getElementById('recipeGrid');
    const noResults = document.getElementById('noResults');
    
    if (filteredRecipes.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noResults.style.display = 'none';
    
    grid.innerHTML = filteredRecipes.map(recipe => `
        <div class="recipe-card" onclick="goToRecipe('${recipe.id}')">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <h3 class="recipe-title">${recipe.name}</h3>
                <span class="recipe-time">${recipe.time}</span>
            </div>
            <div class="recipe-tags">
                ${recipe.tags.map(tag => `<span class="tag tag-${tag}">${getTagEmoji(tag)} ${tag}</span>`).join('')}
            </div>
            <p class="recipe-description">${recipe.description}</p>
            <div class="recipe-nutrition">
                <div class="nutrition-item">
                    <div class="nutrition-value">${recipe.nutrition.kcal}</div>
                    <div class="nutrition-label">Kalorien</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${recipe.nutrition.protein}</div>
                    <div class="nutrition-label">Protein</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${recipe.nutrition.carbs}</div>
                    <div class="nutrition-label">Kohlenhydrate</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${recipe.nutrition.fat}</div>
                    <div class="nutrition-label">Fett</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Zu einzelnem Rezept navigieren
function goToRecipe(recipeId) {
    // Navigate to static HTML page
    window.location.href = `/${recipeId}.html`;
}

// Zurück zur Hauptseite
function goBack() {
    window.location.href = '/';
}

// Tag Emojis
function getTagEmoji(tag) {
    const emojis = {
        // === 📦 BASIS-TAGS ===
        // Core-Filter
        'joker': '🃏',
        'vorratskammer': '🏠', 
        'schnell': '⚡',
        'familie': '👨‍👩‍👧‍👦',
        'comfort-food': '🫂',
    
        // Browse-Kategorien  
        'hauptgericht': '🍽️',
        'frühstück': '🥞',
        'snacks': '🍪',
        'beilagen': '🥗',
        'dips': '🥄',
        'saucen': '🍯',
        'aufstriche': '🍞',
        'backen': '🧁',
        'suppen': '🍲',
        'salate': '🥬',
        'getränke': '🥤',
        'desserts': '🍰',
        'baukasten': '🔧',
    
        // === 🥗 ERNÄHRUNGS-STIL ===
        'vegan': '🌱',
        'vegetarisch': '🥛',
        'low-carb': '⬇️',
        'high-protein': '💪',
        'ketogen': '🥥',
    
        // === 🧬 NÄHRSTOFFE ===
        'beta-carotin': '🥕',
        'eisen': '🩸',
        'folsäure': '🍃',
        'vitamin-k': '🥬',
        'omega-3': '🐟',
        'calcium': '🦴',
        'vitamin-c': '🍊',
        'magnesium': '⚡',
        'zink': '💪',
        'antioxidantien': '🛡️',
        'gute-fette': '🥑',
        'pflanzliche-eiweisse': '🌱',
        'ballaststoffe': '🌾',
        'rohkost-anteil': '🥗',
    
        // === 🍱 MEAL-PREP & ORGANISATION ===
        'meal-prep': '🍱',
        'tk-geeignet': '❄️',
        'batch-cooking': '🥘',
        'resteverwertung': '♻️',
        'saisonal': '🌱',
    
        // === 🚫 OHNE-FILTER ===
        'ohne-fisch': '🚫🐟',
        'ohne-fleisch': '🚫🥩',
        'ohne-milchprodukte': '🚫🥛',
        'ohne-nüsse': '🚫🥜',
        'ohne-gluten': '🚫🌾',
        'ohne-soja': '🚫🫘',
        'zuckerfrei': '🚫🍯',
        'ohne-mehl': '🚫🌾',
        
        // === 🌍 KÜCHEN-STIL ===
        'asiatisch': '🥢',
        'italienisch': '🍝',
        'mediterran': '🫒',
        'orientalisch': '🕌',
        'indisch': '🌶️',
        'französisch': '🥐',
        
        // === ✅ TEST-STATUS ===
        'ungetestet': '❓',
        'im-test': '🧪',
        'getestet': '✅',
        'bewährt': '⭐',
        'familie-hit': '👨‍👩‍👧‍👦',
        'experiment': '🔬'
    };
    
    return emojis[tag] || '🏷️';
}

// Statistiken aktualisieren
function updateStats() {
    const stats = document.getElementById('recipeStats');
    const total = allRecipes.length;
    const filtered = filteredRecipes.length;
    
    if (currentFilter === 'all') {
        stats.textContent = `${total} Rezepte verfügbar`;
    } else {
        stats.textContent = `${filtered} von ${total} Rezepten gefunden`;
    }
}

// Modal öffnen
function openModal(recipeId) {
    const recipe = allRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    document.getElementById('modalTitle').textContent = recipe.name;
    document.getElementById('modalBody').innerHTML = `
        <div class="recipe-section">
            <h3 class="section-title">🛒 Zutaten</h3>
            <ul class="ingredients-list">
                ${recipe.ingredients.map(ing => `
                    <li>
                        <span class="ingredient-name">${ing.name}</span>
                        <span class="ingredient-amount">${ing.amount}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
        <div class="recipe-section">
            <h3 class="section-title">👩‍🍳 Zubereitung</h3>
            <ol class="instructions-list">
                ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
        ${recipe.familyNotes ? `
            <div class="family-notes">
                <div class="family-notes-title">👨‍👩‍👧‍👦 Familie-Hinweise</div>
                <div>${recipe.familyNotes}</div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('recipeModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Scrollen verhindern
}

// Modal schließen
function closeModal() {
    document.getElementById('recipeModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Scrollen wieder erlauben
}
