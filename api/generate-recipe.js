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

    const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set.' });
    }

    // Model array with gemini-3.6-flash as primary
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const rawModels = [primaryModel, 'gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    const modelsToTry = [...new Set(rawModels.filter(Boolean))];

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
        console.warn('Failed to parse Gemini JSON output, falling back to authentic recipe:', jsonErr);
      }
    }

    // High-quality, authentic culinary fallback catalog matching user's ingredients
    const authenticRecipe = generateAuthenticCulinaryDish(ingredients, avoidTitles);
    return res.status(200).json(authenticRecipe);

  } catch (error) {
    console.error('Error generating recipe:', error);
    const fallbackRecipe = generateAuthenticCulinaryDish(req.body?.ingredients || ['Eggs', 'Cheese'], req.body?.avoidTitles || []);
    return res.status(200).json(fallbackRecipe);
  }
}

function generateAuthenticCulinaryDish(ingredients = [], avoidTitles = []) {
  const lowerIngs = ingredients.map(i => String(i).toLowerCase());

  const hasItem = (kw) => lowerIngs.some(i => i.includes(kw));

  const DISHES = [
    {
      match: () => hasItem('chicken'),
      title: 'Garlic Herb Butter Chicken Breast Sauté',
      cuisine_type: 'American',
      prep_time: '20 mins',
      servings: '2',
      difficulty: 'Easy',
      ingredients: [
        '400g chicken breast',
        '25g unsalted butter',
        '15ml extra virgin olive oil',
        '4 cloves garlic (minced)',
        '1 tsp dried oregano & thyme',
        '1/2 tsp sea salt & black pepper'
      ],
      instructions: [
        'Pat chicken breasts dry and season generously with herbs, sea salt, and black pepper.',
        'Heat olive oil and butter in a skillet over medium-high heat until sizzling.',
        'Add minced garlic and sear chicken for 6-8 minutes per side until golden brown and internal temperature reaches 165°F.',
        'Spoon hot garlic butter over the chicken breasts, rest for 3 minutes, and serve warm.'
      ],
      nutrition: { calories: 420, protein: 46, carbs: 4, fat: 22, fiber: 1 },
      youtube_search_query: 'Garlic Herb Butter Chicken Breast recipe'
    },
    {
      match: () => hasItem('salmon') || hasItem('fish') || hasItem('tuna'),
      title: 'Pan-Seared Lemon Garlic Salmon Fillets',
      cuisine_type: 'Mediterranean',
      prep_time: '15 mins',
      servings: '2',
      difficulty: 'Easy',
      ingredients: [
        '350g fresh salmon fillets',
        '20g butter',
        '15ml olive oil',
        '3 cloves garlic (minced)',
        '1 tbsp fresh lemon juice',
        '1/2 tsp salt & black pepper'
      ],
      instructions: [
        'Season salmon fillets with salt, black pepper, and minced garlic.',
        'Heat olive oil and butter in a heavy non-stick pan over high heat.',
        'Place salmon skin-side down and sear for 4 minutes until crispy; flip and sear for 3 minutes.',
        'Drizzle with fresh lemon juice and pan juices before serving.'
      ],
      nutrition: { calories: 480, protein: 38, carbs: 3, fat: 34, fiber: 0 },
      youtube_search_query: 'Pan Seared Lemon Garlic Salmon recipe'
    },
    {
      match: () => hasItem('steak') || hasItem('beef') || hasItem('meat'),
      title: 'Garlic Butter Seared Ribeye Steak Slices',
      cuisine_type: 'American',
      prep_time: '15 mins',
      servings: '2',
      difficulty: 'Intermediate',
      ingredients: [
        '450g ribeye or sirloin steak',
        '30g unsalted butter',
        '3 cloves garlic (crushed)',
        '1 tsp fresh rosemary or thyme',
        '1/2 tsp sea salt & cracked black pepper'
      ],
      instructions: [
        'Bring steak to room temperature and season generously with sea salt and cracked black pepper.',
        'Sear in a smoking-hot skillet with a touch of oil for 3 minutes per side.',
        'Add butter, crushed garlic, and fresh rosemary; baste continuously for 2 minutes.',
        'Rest steak for 5 minutes before slicing against the grain.'
      ],
      nutrition: { calories: 540, protein: 48, carbs: 2, fat: 38, fiber: 0 },
      youtube_search_query: 'Garlic Butter Seared Steak recipe'
    },
    {
      match: () => hasItem('pasta') || hasItem('noodle') || hasItem('spaghetti'),
      title: 'Classic Creamy Garlic Parmesan Pasta',
      cuisine_type: 'Italian',
      prep_time: '20 mins',
      servings: '2',
      difficulty: 'Easy',
      ingredients: [
        '200g spaghetti or fettuccine',
        '30g butter',
        '100ml heavy cream or milk',
        '40g grated parmesan cheese',
        '3 cloves garlic (minced)',
        '1/2 tsp salt & black pepper'
      ],
      instructions: [
        'Boil pasta in a large pot of salted water until al dente; reserve 1/2 cup pasta water.',
        'Melt butter in a skillet over low heat and sauté minced garlic for 1 minute until fragrant.',
        'Whisk in cream and parmesan cheese until a smooth sauce forms.',
        'Toss hot pasta in the sauce with a splash of pasta water until coated.'
      ],
      nutrition: { calories: 510, protein: 18, carbs: 64, fat: 22, fiber: 3 },
      youtube_search_query: 'Classic Creamy Garlic Parmesan Pasta recipe'
    },
    {
      match: () => hasItem('egg') || hasItem('eggs') || hasItem('milk'),
      title: 'Classic French Fluffy Cheese Omelette',
      cuisine_type: 'French',
      prep_time: '10 mins',
      servings: '2',
      difficulty: 'Easy',
      ingredients: [
        '4 large eggs',
        '30ml fresh milk or cream',
        '20g unsalted butter',
        '50g shredded cheese',
        '1/2 tsp salt & black pepper'
      ],
      instructions: [
        'Whisk eggs, milk, salt, and black pepper together in a bowl until smooth.',
        'Melt butter in a non-stick skillet over low heat until foamy.',
        'Pour in egg mixture, gently lifting edges with a spatula until soft curds form.',
        'Sprinkle cheese in the center, fold into a cylinder, and serve immediately.'
      ],
      nutrition: { calories: 340, protein: 22, carbs: 3, fat: 26, fiber: 0 },
      youtube_search_query: 'Classic French Fluffy Omelette recipe'
    },
    {
      match: () => hasItem('avocado') || hasItem('tomato'),
      title: 'Fresh Mediterranean Caprese Avocado Salad',
      cuisine_type: 'Mediterranean',
      prep_time: '10 mins',
      servings: '2',
      difficulty: 'Easy',
      ingredients: [
        '1 ripe avocado (sliced)',
        '2 ripe tomatoes (sliced)',
        '100g fresh mozzarella or feta',
        '15ml extra virgin olive oil',
        '1 tbsp balsamic glaze',
        'Pinch of sea salt & black pepper'
      ],
      instructions: [
        'Alternate avocado slices, tomato slices, and mozzarella cheese on a platter.',
        'Drizzle evenly with extra virgin olive oil and thick balsamic glaze.',
        'Season with fresh sea salt and cracked black pepper before serving chilled.'
      ],
      nutrition: { calories: 380, protein: 14, carbs: 12, fat: 32, fiber: 7 },
      youtube_search_query: 'Caprese Avocado Salad recipe'
    }
  ];

  // Pick matching dish or first dish not in avoidTitles
  let chosen = DISHES.find(d => d.match() && !avoidTitles.includes(d.title));
  if (!chosen) {
    chosen = DISHES.find(d => !avoidTitles.includes(d.title)) || DISHES[0];
  }

  return {
    title: chosen.title,
    cuisine_type: chosen.cuisine_type,
    prep_time: chosen.prep_time,
    servings: chosen.servings,
    difficulty: chosen.difficulty,
    ingredients: chosen.ingredients,
    instructions: chosen.instructions,
    nutrition: chosen.nutrition,
    youtube_search_query: chosen.youtube_search_query
  };
}

