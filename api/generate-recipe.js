import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
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

    const ai = new GoogleGenAI({ apiKey });

    // Diverse dish format options to ensure variety (NO repetitive Skillets!)
    const dishFormats = [
      'Bowl / Grain Bowl',
      'Fresh Salad with Homemade Dressing',
      'Sheet Pan Roasted Dish',
      'Stir-Fry / Sauté',
      'Comforting Soup or Chowder',
      'Hearty Stew or Curry',
      'Savory Omelette or Scramble',
      'Stuffed Wrap or Sandwich',
      'Baked Casserole',
      'Warm Pasta or Noodle Bowl',
      'Crispy Tacos or Quesadillas'
    ];

    const randomDishFormat = dishFormats[Math.floor(Math.random() * dishFormats.length)];
    const timestampSeed = Date.now();

    const prompt = `You are a creative executive chef. Create a UNIQUE and appetizing custom recipe built DIRECTLY around these detected pantry/fridge ingredients.

USER DETECTED INGREDIENTS: ${ingredients.join(', ')}

DIETARY PREFERENCES & RESTRICTIONS:
- Dietary Restrictions: ${preferences.dietary_restrictions?.join(', ') || 'None'}
- Favorite Cuisines: ${preferences.favorite_cuisines?.join(', ') || 'Any'}
- Avoid / Allergies: ${preferences.allergies?.join(', ') || 'None'}
- Cooking Skill Level: ${preferences.cooking_skill || 'Intermediate'}

VARIETY & REGENERATION REQUIREMENTS:
- PREFERRED DISH FORMAT FOR THIS VARIATION: ${randomDishFormat}
- AVOID REPEAT RECIPES: Do NOT generate any of the following titles: ${avoidTitles.length > 0 ? avoidTitles.join(', ') : 'None'}.
- NO REPETITIVE "SKILLET" DISHES: Be creative! Generate diverse recipes like salads, soups, bowls, bakes, wraps, stir-fries, stews, or pasta dishes.
- Seed value for freshness: ${timestampSeed}

STRICT INGREDIENT CONSTRAINTS:
1. BASE DISH ON DETECTED INGREDIENTS: Use the provided ingredients (${ingredients.join(', ')}) as the core components.
2. NO UNLISTED MAJOR INGREDIENTS: DO NOT add major unlisted meats (chicken, beef, pork, bacon), seafood (salmon, shrimp, tuna), breads, eggs, or large unique main vegetables if they are NOT in the detected list above.
3. ALLOWED KITCHEN STAPLES: You may freely use basic condiments, cooking oil, butter, salt, pepper, garlic, water, soy sauce, and common household spices.
4. INGREDIENT LIST: Only list the specific ingredients (with quantities) needed for this dish.

Return ONLY a raw valid JSON object without markdown code fences. Schema:
{
  "title": "Unique Recipe Title",
  "cuisine_type": "Cuisine Category (e.g. Mediterranean, Asian, Mexican, American)",
  "prep_time": "15-20 mins",
  "servings": "2",
  "difficulty": "Easy",
  "ingredients": ["1 cup ingredient 1", "2 tbsp ingredient 2"],
  "instructions": ["Step 1: ...", "Step 2: ..."],
  "nutrition": {
    "calories": 380,
    "protein": 22,
    "carbs": 35,
    "fat": 12,
    "fiber": 6
  },
  "youtube_search_query": "Recipe Title Cooking Tutorial"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text?.trim() || '';
    const cleanJsonText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

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
