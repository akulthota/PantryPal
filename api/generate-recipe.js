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

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const modelsToTry = [primaryModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    // Deduplicate models
    const uniqueModels = [...new Set(modelsToTry)];

    const cookbookCategories = [
      'Gourmet Pasta / Noodle Dish',
      'Artisanal Grain & Warm Protein Bowl',
      'Classic Hearty Stew / Curry',
      'Rustic Sheet-Pan Roast',
      'Zesty Tacos / Wraps / Flatbread',
      'Fresh Vibrant Salad with Homemade Vinaigrette',
      'Rich Comfort Soup / Bisque / Chowder',
      'Crispy Sauté / Sizzling Stir-Fry',
      'Stuffed Baked Dish or Casserole',
      'Savory Omelette / Frittata / Breakfast Skillet'
    ];

    const chosenCategory = cookbookCategories[Math.floor(Math.random() * cookbookCategories.length)];
    const seed = Date.now();

    const prompt = `You are a master executive chef with access to the world's largest culinary recipe database (inspired by Allrecipes, Serious Eats, NYT Cooking, Epicurious, and Food Network).

USER DETECTED PANTRY/FRIDGE INGREDIENTS:
${ingredients.join(', ')}

DIETARY PREFERENCES & USER PROFILE:
- Dietary Restrictions: ${preferences.dietary_restrictions?.join(', ') || 'None'}
- Favorite Cuisines: ${preferences.favorite_cuisines?.join(', ') || 'Any'}
- Avoid / Allergies: ${preferences.allergies?.join(', ') || 'None'}
- Cooking Skill Level: ${preferences.cooking_skill || 'Intermediate'}

RECIPE CREATION DIRECTIVES:
1. STAR INGREDIENTS: Make the user's detected ingredients (${ingredients.join(', ')}) the central star elements of the recipe.
2. AUTHENTIC COOKBOOK QUALITY: Draw inspiration from real, top-rated recipes in global cookbooks. Feel free to incorporate complementary food ingredients (grains, produce, proteins, dairy, broths, herbs, sauces, and seasonings) needed to create a complete, well-balanced, and delicious dish.
3. DISH CATEGORY FOR THIS VARIATION: ${chosenCategory}
4. REGENERATION FRESHNESS: Do NOT use any of these previous titles: ${avoidTitles.length > 0 ? avoidTitles.join(', ') : 'None'}. (Seed: ${seed}).
5. DIVERSITY: Create a unique title and clear step-by-step instructions.
6. REAL RECIPES ONLY: You MUST only suggest real recipes that exist in established cookbooks or well-known food cultures. Do NOT invent fictional recipes. Every ingredient MUST include a precise measurement (e.g., '200g chicken breast', '15ml olive oil', '2 tsp cumin'). Never list bare ingredient names without quantities.
7. YOUTUBE QUERY: The youtube_search_query must be the exact, commonly-known name of the dish followed by 'recipe'. Example: 'Chicken Tikka Masala recipe'. Do NOT use generic queries like 'chicken and rice dish'.

Return ONLY a raw valid JSON object without markdown code fences. Schema:
{
  "title": "Creative Cookbook Recipe Title",
  "cuisine_type": "Cuisine Category (e.g. Italian, Asian, Mediterranean, Mexican, American)",
  "prep_time": "20 mins",
  "servings": "2-4",
  "difficulty": "Easy",
  "ingredients": ["1 cup ingredient 1", "2 tbsp ingredient 2", "1 tsp spice"],
  "instructions": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "nutrition": {
    "calories": 420,
    "protein": 24,
    "carbs": 38,
    "fat": 14,
    "fiber": 6
  },
  "youtube_search_query": "Recipe Title recipe"
}`;

    let responseData = null;
    let lastError = null;

    for (const model of uniqueModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.9,
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
            // Wait 500ms before trying fallback model if rate limited
            await new Promise(r => setTimeout(r, 500));
          }
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!responseData) {
      return res.status(500).json({ error: `Gemini API fallback exhausted: ${lastError}` });
    }

    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const recipe = JSON.parse(cleanJsonText);
    return res.status(200).json(recipe);

  } catch (error) {
    console.error('Error generating recipe:', error);
    return res.status(500).json({
      error: 'Failed to generate recipe using AI model.',
      details: error.message
    });
  }
}
