export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  if (origin !== '*') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
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
    const { ingredients = [], preferences = {}, avoidTitles = [] } = req.body || {};

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'No ingredients provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set.' });
    }

    // Fast, responsive model array
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const rawModels = [primaryModel, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    const modelsToTry = [...new Set(rawModels.filter(m => m && !m.includes('2.5') && !m.includes('3.6')))];
    if (modelsToTry.length === 0) modelsToTry.push('gemini-2.0-flash', 'gemini-1.5-flash');

    const seed = Date.now();

    const prompt = `You are a professional chef. Create a simple, realistic, delicious recipe.

USER'S EXACT AVAILABLE INGREDIENTS:
${ingredients.join(', ')}

STRICT INGREDIENT CONSTRAINTS:
1. STRICT INGREDIENT MATCHING: You MUST ONLY use the ingredients listed in the user's available list above (${ingredients.join(', ')}).
2. DO NOT ADD UNLISTED FOODS: Do NOT add unlisted meats, vegetables, cheeses, broths, creams, pie crusts, or extra groceries that the user does NOT have!
3. BASIC STAPLES ONLY: You may only assume standard kitchen basics: salt, black pepper, water, cooking oil/butter, and basic garlic/onion powder.
4. REAL RECIPES ONLY: The dish MUST be an authentic, recognized dish (e.g., 'Philly Cheesesteak Skillet', 'Steak & Cheese Melt', 'Classic Omelette', 'Garlic Herb Chicken Sauté'). No fictional dishes like 'Pan Seared Milk'.
5. INSTRUCTIONS FORMAT: Each instruction step MUST be a clean sentence. Do NOT include prefixes like 'Step 1:' or numbers inside the instruction strings.
6. AVOID REPEATING TITLES: Do NOT use any of these previous titles: ${avoidTitles.length > 0 ? avoidTitles.join(', ') : 'None'}. (Seed: ${seed}).

Return ONLY a raw valid JSON object:
{
  "title": "Authentic Recipe Title",
  "cuisine_type": "American / Italian / Mediterranean / Asian / Home Style",
  "prep_time": "15 mins",
  "servings": "2",
  "difficulty": "Easy",
  "ingredients": ["450g sirloin steak", "200g cheese", "1 pie crust", "15ml olive oil", "1/2 tsp salt & black pepper"],
  "instructions": [
    "Slice the steak thinly across the grain and season with salt and black pepper.",
    "Heat olive oil in a skillet over high heat and sear the steak for 3-4 minutes until browned.",
    "Top with cheese and pie crust crisps, melt until bubbly, and serve hot."
  ],
  "nutrition": {
    "calories": 450,
    "protein": 32,
    "carbs": 18,
    "fat": 22,
    "fiber": 2
  },
  "youtube_search_query": "Authentic Recipe Title recipe"
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
                  temperature: 0.7,
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
              await new Promise(r => setTimeout(r, 300));
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
      try {
        const recipe = JSON.parse(cleanJsonText);

        // Clean instructions of any unwanted "Step 1:" prefixes
        if (Array.isArray(recipe.instructions)) {
          recipe.instructions = recipe.instructions.map(step =>
            typeof step === 'string' ? step.replace(/^(Step\s*\d+:?\s*|\d+[\.\)]\s*)/i, '').trim() : step
          );
        }

        if (!recipe.youtube_search_query || recipe.youtube_search_query.length < 5) {
          recipe.youtube_search_query = `${recipe.title} recipe`;
        }
        return res.status(200).json(recipe);
      } catch (jsonErr) {
        console.warn('Failed to parse Gemini JSON output, falling back:', jsonErr);
      }
    }

    // Fast fallback recipe generated strictly from ingredients
    const mainIng = ingredients[0] || 'Steak';
    const secIng = ingredients[1] || 'Cheese';
    
    const fallbackRecipe = {
      title: `${mainIng} & ${secIng} Skillet Melt`,
      cuisine_type: 'Home Style',
      prep_time: '15 mins',
      servings: '2',
      difficulty: 'Easy',
      ingredients: [
        `300g ${mainIng}`,
        `150g ${secIng}`,
        '15ml olive oil or butter',
        '1/2 tsp salt & black pepper'
      ],
      instructions: [
        `Slice ${mainIng} into uniform pieces and season with salt and pepper.`,
        'Heat oil in a heavy skillet over medium-high heat until hot.',
        `Sear ${mainIng} for 4-5 minutes until cooked through.`,
        `Top with ${secIng}, cover skillet until melted, and serve hot.`
      ],
      nutrition: {
        calories: 420,
        protein: 30,
        carbs: 10,
        fat: 22,
        fiber: 1
      },
      youtube_search_query: `${mainIng} ${secIng} recipe`
    };

    return res.status(200).json(fallbackRecipe);

  } catch (error) {
    console.error('Error generating recipe:', error);
    return res.status(500).json({
      error: 'Failed to generate recipe.',
      details: error.message
    });
  }
}

