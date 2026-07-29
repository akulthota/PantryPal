import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients = [], preferences = {} } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'No ingredients provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Strict prompt enforcing listed ingredients and prohibiting unlisted major items
    const prompt = `You are a creative executive chef. Create a delicious custom recipe built DIRECTLY around these detected pantry/fridge ingredients.

USER DETECTED INGREDIENTS: ${ingredients.join(', ')}

DIETARY PREFERENCES & RESTRICTIONS:
- Dietary Restrictions: ${preferences.dietary_restrictions?.join(', ') || 'None'}
- Favorite Cuisines: ${preferences.favorite_cuisines?.join(', ') || 'Any'}
- Allergies / Avoid: ${preferences.allergies?.join(', ') || 'None'}
- Cooking Skill Level: ${preferences.cooking_skill || 'Intermediate'}

STRICT RECIPE GENERATION RULES:
1. BASE DISH ON DETECTED INGREDIENTS: You MUST construct the recipe primarily using the provided ingredients (${ingredients.join(', ')}).
2. NO UNLISTED MAJOR INGREDIENTS: DO NOT add major ingredients like meats (chicken, beef, pork, bacon), seafood (salmon, shrimp, tuna), breads, pasta, eggs, or large main vegetables if they are NOT in the detected list above.
3. ALLOWED KITCHEN STAPLES: You may freely use basic condiments, cooking oil, butter, salt, pepper, garlic powder, water, soy sauce, and common household spices.
4. INGREDIENT LIST FOR THE RECIPE: Do NOT just dump all fridge items into a flat list. Only list the specific ingredients (and amounts) actually required to cook this dish.

Return ONLY a raw valid JSON object without any markdown code fences. Schema:
{
  "title": "Recipe Title",
  "cuisine_type": "Cuisine Category e.g. Italian, Asian, Mediterranean",
  "prep_time": "20 mins",
  "servings": "2",
  "difficulty": "Easy",
  "ingredients": ["1 cup ingredient 1", "2 tbsp ingredient 2"],
  "instructions": ["Step 1: ...", "Step 2: ..."],
  "nutrition": {
    "calories": 380,
    "protein": 24,
    "carbs": 35,
    "fat": 12,
    "fiber": 5
  },
  "youtube_search_query": "Recipe Name Cooking Tutorial"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
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
