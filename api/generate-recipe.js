export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients = [], preferences = {}, avoidTitles = [] } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'No ingredients provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set.' });
    }

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const modelsToTry = [...new Set([primaryModel, 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'])];

    const cookbookCategories = [
      'Authentic Omelette / Shakshuka / Frittata',
      'Gourmet Pasta / Noodle Dish',
      'Artisanal Grain & Warm Protein Bowl',
      'Classic Hearty Stew / Curry',
      'Rustic Sheet-Pan Roast',
      'Zesty Tacos / Wraps / Flatbread',
      'Fresh Vibrant Salad with Homemade Vinaigrette',
      'Rich Comfort Soup / Chowder',
      'Crispy Sauté / Sizzling Stir-Fry'
    ];

    const chosenCategory = cookbookCategories[Math.floor(Math.random() * cookbookCategories.length)];
    const seed = Date.now();

    const prompt = `You are a world-class executive chef specializing in authentic, real-world recipes found in top cookbooks (NYT Cooking, Allrecipes, Serious Eats, Food Network).

USER DETECTED INGREDIENTS:
${ingredients.join(', ')}

USER DIETARY PREFERENCES:
- Restrictions: ${preferences.dietary_restrictions?.join(', ') || 'None'}
- Favorite Cuisines: ${preferences.favorite_cuisines?.join(', ') || 'Any'}
- Allergies: ${preferences.allergies?.join(', ') || 'None'}
- Skill Level: ${preferences.cooking_skill || 'Intermediate'}

STRICT RECIPE RULES:
1. REAL COOKBOOK DISHES ONLY: The dish title MUST be a recognized real recipe that actual people cook (e.g. 'Classic French Omelette', 'Shakshuka with Poached Eggs', 'Creamy Mushroom Pasta', 'Garlic Herb Chicken Breast').
2. NO FICTIONAL / WEIRD COMBINATIONS: NEVER make titles like 'Pan Seared Milk' or 'Sautéed Water'. Liquids, dairy (milk, cream), and oils must be used as cooking bases, batters, sauces, or glazes — NEVER as the main pan-seared protein item!
3. PRECISE METRIC MEASUREMENTS: Every ingredient MUST have an exact quantity and unit (e.g. '200g chicken breast', '150ml fresh milk', '2 large eggs', '15ml olive oil').
4. YOUTUBE SEARCH QUERY: Set youtube_search_query to the exact real dish name followed by 'recipe'. Example: 'Classic French Omelette recipe'.
5. VARIATION CATEGORY: ${chosenCategory}. Avoid these previous titles: ${avoidTitles.length > 0 ? avoidTitles.join(', ') : 'None'}. (Seed: ${seed}).

Return ONLY a raw valid JSON object:
{
  "title": "Real Cookbook Recipe Title",
  "cuisine_type": "French / Italian / Mediterranean / Asian / American",
  "prep_time": "25 mins",
  "servings": "2",
  "difficulty": "Easy",
  "ingredients": ["200g pasta", "150ml milk", "2 large eggs", "15ml olive oil"],
  "instructions": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "nutrition": {
    "calories": 450,
    "protein": 24,
    "carbs": 42,
    "fat": 16,
    "fiber": 5
  },
  "youtube_search_query": "Real Cookbook Recipe Title recipe"
}`;

    let responseData = null;
    let lastError = null;

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      for (const model of modelsToTry) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.85,
                  response_mime_type: 'application/json'
                }
              })
            }
          );

          if (response.ok) {
            responseData = await response.json();
            break;
          } else {
            const errText = await response.text();
            lastError = `Model ${model} returned ${response.status}: ${errText}`;
            if (response.status === 429) {
              await new Promise(r => setTimeout(r, 500));
            }
          }
        } catch (err) {
          lastError = err.message;
        }
      }
    }

    if (responseData) {
      const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const recipe = JSON.parse(cleanJsonText);

      // Ensure YouTube search query is valid
      if (!recipe.youtube_search_query || recipe.youtube_search_query.length < 5) {
        recipe.youtube_search_query = `${recipe.title} recipe`;
      }
      return res.status(200).json(recipe);
    }

    // Smart Fallback for real recipes when Gemini key is missing/rate-limited
    console.warn('Using Real Recipe Fallback due to:', lastError || 'Missing API Key');
    const hasEggs = ingredients.some(i => i.toLowerCase().includes('egg'));
    const hasMilk = ingredients.some(i => i.toLowerCase().includes('milk'));

    let fallbackRecipe;
    if (hasEggs || hasMilk) {
      fallbackRecipe = {
        title: 'Classic French Omelette with Herb Butter',
        cuisine_type: 'French',
        prep_time: '15 mins',
        servings: '2',
        difficulty: 'Easy',
        ingredients: [
          '4 large eggs',
          '50ml fresh milk',
          '20g unsalted butter',
          '1 tbsp fresh chives (chopped)',
          '1/2 tsp sea salt & black pepper'
        ],
        instructions: [
          'In a bowl, whisk eggs and fresh milk until light and smooth.',
          'Melt butter in a non-stick skillet over medium-low heat until frothy.',
          'Pour in egg mixture, gently stirring with a spatula until soft curds form.',
          'Fold omelette into a cylinder, sprinkle with fresh chives, and serve warm.'
        ],
        nutrition: {
          calories: 320,
          protein: 22,
          carbs: 4,
          fat: 24,
          fiber: 1
        },
        youtube_search_query: 'Classic French Omelette recipe'
      };
    } else {
      fallbackRecipe = {
        title: 'Rustic Farmer\'s Garden Skillet',
        cuisine_type: 'Home Style',
        prep_time: '20 mins',
        servings: '2',
        difficulty: 'Easy',
        ingredients: [
          `200g ${ingredients[0] || 'Fresh Vegetables'}`,
          `150g ${ingredients[1] || 'Produce'}`,
          '15ml extra virgin olive oil',
          '2 cloves garlic (minced)',
          '1/2 tsp salt & black pepper'
        ],
        instructions: [
          'Wash and slice ingredients into uniform bites.',
          'Heat olive oil and minced garlic in a skillet over medium heat.',
          'Sauté ingredients for 6-8 minutes until tender and caramelized.',
          'Season with salt and pepper, and serve hot.'
        ],
        nutrition: {
          calories: 340,
          protein: 18,
          carbs: 28,
          fat: 14,
          fiber: 6
        },
        youtube_search_query: 'Rustic Vegetable Skillet recipe'
      };
    }

    return res.status(200).json(fallbackRecipe);

  } catch (error) {
    console.error('Error generating recipe:', error);
    return res.status(500).json({
      error: 'Failed to generate recipe using AI model.',
      details: error.message
    });
  }
}
