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

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'DEEPSEEK_API_KEY environment variable is not set.' });
    }

    const model = process.env.DEEPSEEK_MODEL || 'deepseek-flash';

    const systemPrompt = `You are a professional chef. Create a simple, realistic, delicious recipe.
STRICT CONSTRAINTS:
1. STRICT INGREDIENT MATCHING: You MUST ONLY use the ingredients provided by the user.
2. DO NOT ADD UNLISTED FOODS: Do NOT add unlisted meats, vegetables, cheeses, broths, creams, or extra groceries.
3. BASIC STAPLES ONLY: You may only assume: salt, black pepper, water, cooking oil/butter, and basic garlic/onion powder.
4. REAL RECIPES ONLY: The dish MUST be an authentic, recognized dish.
5. INSTRUCTIONS FORMAT: Each instruction step MUST be a clean sentence without step numbering.

Return ONLY a valid JSON object matching:
{
  "title": "Authentic Recipe Title",
  "cuisine_type": "American / Italian / Mediterranean / Asian / Home Style",
  "prep_time": "15 mins",
  "servings": "2",
  "difficulty": "Easy",
  "ingredients": ["item with quantity"],
  "instructions": [
    "Step 1 sentence",
    "Step 2 sentence"
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

    const userPrompt = `Available ingredients: ${ingredients.join(', ')}.${avoidTitles && avoidTitles.length > 0 ? ` Do not use these titles: ${avoidTitles.join(', ')}.` : ''}`;

    let responseData = null;
    let lastError = null;

    if (apiKey && apiKey !== 'your_deepseek_api_key_here') {
      try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            response_format: { type: 'json_object' },
            thinking: { type: 'disabled' },
            max_tokens: 1000,
            temperature: 0.35
          })
        });

        if (response.ok) {
          responseData = await response.json();
        } else {
          const errText = await response.text();
          lastError = `DeepSeek API returned ${response.status}: ${errText}`;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (responseData) {
      const rawText = responseData.choices?.[0]?.message?.content || '';
      const cleanJsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
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
