const fs = require('fs');
const path = require('path');

// Verzeichnisse erstellen
const distDir = './dist';
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

console.log('🚀 Building static site...');

// Rezepte laden
const recipesData = JSON.parse(fs.readFileSync('./recipes.json', 'utf8'));
const recipes = recipesData.recipes;

// HTML-Template laden
const templateHtml = fs.readFileSync('./template.html', 'utf8');

// Statische Dateien kopieren
const staticFiles = ['style.css', 'script.js', 'admin.html', 'recipes.json', '_redirects'];
staticFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`✅ Copied ${file}`);
    }
});

// Schema.org JSON-LD generieren
function generateSchemaLD(recipe) {
    return {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": recipe.name,
        "description": recipe.description,
        "prepTime": `PT${recipe.time}`,
        "recipeCategory": recipe.tags.includes('frühstück') ? 'Frühstück' : 
                        recipe.tags.includes('familie') ? 'Hauptgericht' : 'Beilage',
        "recipeCuisine": "Deutsch",
        "recipeYield": recipe.recipeYield,
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
        "url": `https://kochbuch-kunz.netlify.app/${recipe.id}`
    };
}

// Tag-Emojis
function getTagEmoji(tag) {
    const emojis = {
        vegan: '🌱',
        vegetarisch: '🥛',
        joker: '🃏',
        vorratskammer: '🏠',
        protein: '💪',
        schnell: '⚡',
        familie: '👨‍👩‍👧‍👦',
        'meal-prep': '🍱',
        frühstück: '🥞'
    };
    return emojis[tag] || '';
}

// Für jedes Rezept eine HTML-Datei generieren
recipes.forEach(recipe => {
    const schemaLD = generateSchemaLD(recipe);
    
    // HTML-Inhalt für einzelnes Rezept
    const recipeHtml = `
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
                ${recipe.recipeYield ? `<p><strong>Portionen:</strong> ${recipe.recipeYield}</p>` : ''}
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

            ${recipe.variations ? `
                <div class="variations">
                    <div class="variations-title">🔄 Variationen & Alternativen</div>
                    <div>${recipe.variations}</div>
                </div>
            ` : ''}
            
            ${recipe.hacksAndTips ? `
                <div class="hacks-tips">
                    <div class="hacks-tips-title">💡 Hacks & Tipps</div>
                    <div>${recipe.hacksAndTips}</div>
                </div>
            ` : ''}
            
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
                        <div class="nutrition-label">KH</div>
                    </div>
                    <div class="nutrition-item">
                        <div class="nutrition-value">${recipe.nutrition.fat}</div>
                        <div class="nutrition-label">Fett</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // HTML-Template mit Rezept-Daten füllen
    const finalHtml = templateHtml
        .replace('{{RECIPE_SCHEMA}}', JSON.stringify(schemaLD, null, 2))
        .replace('{{RECIPE_TITLE}}', recipe.name)
        .replace('{{RECIPE_CONTENT}}', recipeHtml)
        .replace('{{RECIPE_VIEW}}', 'single');
    
    // HTML-Datei schreiben
    const filename = `${recipe.id}.html`;
    fs.writeFileSync(path.join(distDir, filename), finalHtml);
    console.log(`✅ Generated ${filename}`);
});

// Hauptseite (index.html) generieren
const indexHtml = templateHtml
    .replace('{{RECIPE_SCHEMA}}', '{}')
    .replace('{{RECIPE_TITLE}}', 'Kochbuch Kunz')
    .replace('{{RECIPE_CONTENT}}', '')
    .replace('{{RECIPE_VIEW}}', 'all');

fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);
console.log('✅ Generated index.html');

console.log(`🎉 Build complete! Generated ${recipes.length + 1} HTML files.`);
console.log('📁 Files in dist/:');
fs.readdirSync(distDir).forEach(file => {
    console.log(`   - ${file}`);
});

// Netlify _redirects für SPA-Fallback
const redirectsContent = `
# Recipe pages (static files)
${recipes.map(recipe => `/${recipe.id} /${recipe.id}.html 200`).join('\n')}

# Fallback for SPA
/* /index.html 200
`;

fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent);
console.log('✅ Generated _redirects');
