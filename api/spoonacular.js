export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.SPOONACULAR_API_KEY || process.env.VITE_SPOONACULAR_API_KEY || '';
    const { action, query = '', cuisine = '', number = '12', offset = '0', id, tags = '', ingredients = '' } = req.query;

    if (!apiKey || apiKey === 'your_spoonacular_api_key_here') {
      // Fallback mock responses when API key is unconfigured
      return handleMockFallback(action, { query, cuisine, number, offset, id, tags, ingredients }, res);
    }

    let url = '';

    switch (action) {
      case 'search': {
        const params = new URLSearchParams({
          apiKey,
          number: String(number),
          offset: String(offset),
          addRecipeNutrition: 'true',
          addRecipeInformation: 'true'
        });
        if (query) params.append('query', query);
        if (cuisine && cuisine !== 'All') params.append('cuisine', cuisine);
        url = `https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`;
        break;
      }
      case 'details': {
        if (!id) return res.status(400).json({ error: 'Recipe ID required' });
        url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${apiKey}`;
        break;
      }
      case 'random': {
        const params = new URLSearchParams({
          apiKey,
          number: String(number)
        });
        if (tags) params.append('tags', tags);
        url = `https://api.spoonacular.com/recipes/random?${params.toString()}`;
        break;
      }
      case 'autocomplete': {
        if (!query) return res.status(200).json([]);
        const params = new URLSearchParams({
          apiKey,
          query,
          number: String(number)
        });
        url = `https://api.spoonacular.com/food/ingredients/autocomplete?${params.toString()}`;
        break;
      }
      case 'byIngredients': {
        if (!ingredients) return res.status(200).json([]);
        const params = new URLSearchParams({
          apiKey,
          ingredients,
          number: String(number)
        });
        url = `https://api.spoonacular.com/recipes/findByIngredients?${params.toString()}`;
        break;
      }
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }

    const spoonRes = await fetch(url);
    if (!spoonRes.ok) {
      const errText = await spoonRes.text();
      console.warn('Spoonacular API response error:', spoonRes.status, errText);
      // Fallback to mock data if rate-limited or error
      return handleMockFallback(action, { query, cuisine, number, offset, id, tags, ingredients }, res);
    }

    const data = await spoonRes.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Spoonacular proxy server error:', error);
    return res.status(500).json({ error: 'Failed to communicate with Spoonacular API', details: error.message });
  }
}

function handleMockFallback(action, params, res) {
  const MOCK_RECIPES = [
    {
      id: 716429,
      title: 'Pasta with Garlic, Tomatoes and Whole Wheat Spaghettini',
      image: 'https://spoonacular.com/recipeImages/716429-556x370.jpg',
      readyInMinutes: 45,
      servings: 2,
      cuisines: ['Italian'],
      dishTypes: ['main course', 'pasta'],
      extendedIngredients: [
        { name: 'spaghettini', measures: { metric: { amount: 200, unitShort: 'g' } } },
        { name: 'cherry tomatoes', measures: { metric: { amount: 150, unitShort: 'g' } } },
        { name: 'garlic cloves', measures: { metric: { amount: 3, unitShort: 'cloves' } } },
        { name: 'extra virgin olive oil', measures: { metric: { amount: 15, unitShort: 'ml' } } }
      ],
      analyzedInstructions: [
        {
          steps: [
            { number: 1, step: 'Bring a large pot of salted water to a boil and cook pasta according to package instructions.' },
            { number: 2, step: 'Heat olive oil in a skillet over medium heat and sauté minced garlic for 1 minute.' },
            { number: 3, step: 'Add cherry tomatoes, sea salt, and black pepper. Cook until tomatoes burst and form a rich sauce.' },
            { number: 4, step: 'Toss pasta into sauce and garnish with fresh basil leaves before serving.' }
          ]
        }
      ],
      nutrition: {
        nutrients: [
          { name: 'Calories', amount: 520, unit: 'kcal' },
          { name: 'Protein', amount: 18, unit: 'g' },
          { name: 'Carbohydrates', amount: 72, unit: 'g' },
          { name: 'Fat', amount: 14, unit: 'g' },
          { name: 'Fiber', amount: 8, unit: 'g' }
        ]
      }
    },
    {
      id: 715538,
      title: 'What to make for dinner tonight? Bruschetta Style Chicken Bowl',
      image: 'https://spoonacular.com/recipeImages/715538-556x370.jpg',
      readyInMinutes: 35,
      servings: 4,
      cuisines: ['Italian', 'Mediterranean'],
      dishTypes: ['main course', 'chicken'],
      extendedIngredients: [
        { name: 'chicken breast', measures: { metric: { amount: 500, unitShort: 'g' } } },
        { name: 'diced tomatoes', measures: { metric: { amount: 250, unitShort: 'g' } } },
        { name: 'balsamic glaze', measures: { metric: { amount: 30, unitShort: 'ml' } } },
        { name: 'mozzarella cheese', measures: { metric: { amount: 100, unitShort: 'g' } } }
      ],
      analyzedInstructions: [
        {
          steps: [
            { number: 1, step: 'Season chicken breast with Italian herbs, salt, and pepper.' },
            { number: 2, step: 'Grill or sauté chicken for 6-8 minutes per side until internal temperature reaches 165°F.' },
            { number: 3, step: 'Top with diced tomatoes, fresh mozzarella, and drizzle with balsamic glaze.' }
          ]
        }
      ],
      nutrition: {
        nutrients: [
          { name: 'Calories', amount: 430, unit: 'kcal' },
          { name: 'Protein', amount: 42, unit: 'g' },
          { name: 'Carbohydrates', amount: 18, unit: 'g' },
          { name: 'Fat', amount: 16, unit: 'g' },
          { name: 'Fiber', amount: 3, unit: 'g' }
        ]
      }
    },
    {
      id: 644387,
      title: 'Garlic Butter Herb Salmon with Steamed Asparagus',
      image: 'https://spoonacular.com/recipeImages/644387-556x370.jpg',
      readyInMinutes: 20,
      servings: 2,
      cuisines: ['American'],
      dishTypes: ['main course', 'seafood'],
      extendedIngredients: [
        { name: 'salmon fillet', measures: { metric: { amount: 350, unitShort: 'g' } } },
        { name: 'fresh asparagus', measures: { metric: { amount: 200, unitShort: 'g' } } },
        { name: 'unsalted butter', measures: { metric: { amount: 25, unitShort: 'g' } } },
        { name: 'lemon juice', measures: { metric: { amount: 15, unitShort: 'ml' } } }
      ],
      analyzedInstructions: [
        {
          steps: [
            { number: 1, step: 'Melt butter in a skillet over medium-high heat with garlic and fresh herbs.' },
            { number: 2, step: 'Sear salmon skin-side down for 4 minutes, flip and sear for 3 more minutes.' },
            { number: 3, step: 'Serve with steamed asparagus and fresh lemon wedges.' }
          ]
        }
      ],
      nutrition: {
        nutrients: [
          { name: 'Calories', amount: 480, unit: 'kcal' },
          { name: 'Protein', amount: 38, unit: 'g' },
          { name: 'Carbohydrates', amount: 6, unit: 'g' },
          { name: 'Fat', amount: 28, unit: 'g' },
          { name: 'Fiber', amount: 3, unit: 'g' }
        ]
      }
    },
    {
      id: 716268,
      title: 'African Chicken Peanut Stew',
      image: 'https://spoonacular.com/recipeImages/716268-556x370.jpg',
      readyInMinutes: 45,
      servings: 4,
      cuisines: ['African'],
      dishTypes: ['stew', 'main course'],
      extendedIngredients: [
        { name: 'chicken thighs', measures: { metric: { amount: 600, unitShort: 'g' } } },
        { name: 'peanut butter', measures: { metric: { amount: 100, unitShort: 'g' } } },
        { name: 'crushed tomatoes', measures: { metric: { amount: 400, unitShort: 'g' } } },
        { name: 'sweet potato', measures: { metric: { amount: 200, unitShort: 'g' } } }
      ],
      analyzedInstructions: [
        {
          steps: [
            { number: 1, step: 'Brown chicken thighs in a heavy Dutch oven.' },
            { number: 2, step: 'Add onions, garlic, ginger, and sweet potatoes.' },
            { number: 3, step: 'Whisk peanut butter with warm broth and tomatoes, pour into pot, and simmer for 30 minutes.' }
          ]
        }
      ],
      nutrition: {
        nutrients: [
          { name: 'Calories', amount: 560, unit: 'kcal' },
          { name: 'Protein', amount: 36, unit: 'g' },
          { name: 'Carbohydrates', amount: 32, unit: 'g' },
          { name: 'Fat', amount: 26, unit: 'g' },
          { name: 'Fiber', amount: 5, unit: 'g' }
        ]
      }
    }
  ];

  switch (action) {
    case 'search': {
      let filtered = [...MOCK_RECIPES];
      if (params.query) {
        const q = params.query.toLowerCase();
        filtered = filtered.filter(r => r.title.toLowerCase().includes(q));
      }
      if (params.cuisine && params.cuisine !== 'All') {
        filtered = filtered.filter(r => r.cuisines?.includes(params.cuisine));
      }
      return res.status(200).json({ results: filtered, totalResults: filtered.length });
    }
    case 'details': {
      const found = MOCK_RECIPES.find(r => String(r.id) === String(params.id)) || MOCK_RECIPES[0];
      return res.status(200).json(found);
    }
    case 'random': {
      return res.status(200).json({ recipes: MOCK_RECIPES });
    }
    case 'autocomplete': {
      const INGREDIENT_LIST = [
        'apple', 'apricot', 'avocado', 'asparagus', 'almonds',
        'banana', 'basil', 'beef', 'bell pepper', 'black beans', 'broccoli', 'butter',
        'chicken breast', 'carrot', 'cheddar cheese', 'coriander', 'cucumber',
        'eggs', 'eggplant', 'extra virgin olive oil',
        'garlic', 'ginger', 'green beans',
        'lemon', 'lime', 'lamb', 'lettuce',
        'milk', 'mozzarella', 'mushrooms',
        'onion', 'olive oil', 'oregano',
        'pasta', 'parmesan', 'peanut butter', 'pork', 'potato',
        'rice', 'rosemary',
        'salmon', 'spinach', 'strawberry', 'sweet potato',
        'tomato', 'tofu', 'turkey', 'tuna',
        'walnuts', 'watermelon', 'yogurt', 'zucchini'
      ];
      const q = (params.query || '').toLowerCase();
      const matches = INGREDIENT_LIST.filter(item => item.includes(q)).slice(0, 10).map(name => ({ name }));
      return res.status(200).json(matches);
    }
    case 'byIngredients': {
      return res.status(200).json(MOCK_RECIPES.map(r => ({ ...r, missedIngredientCount: 1, usedIngredientCount: 2 })));
    }
    default:
      return res.status(200).json({ results: MOCK_RECIPES, totalResults: MOCK_RECIPES.length });
  }
}
