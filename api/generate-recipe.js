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

    const prompt = `You are a world-class executive chef. Create a delicious, custom recipe tailored specifically to these available ingredients and dietary preferences.

Available Ingredients: ${ingredients.join(', ')}
Dietary Restrictions: ${preferences.dietary_restrictions?.join(', ') || 'None'}
Favorite Cuisines: ${preferences.favorite_cuisines?.join(', ') || 'Any'}
Allergies / Avoid: ${preferences.allergies?.join(', ') || 'None'}
Skill Level: ${preferences.cooking_skill || 'Intermediate'}

Return ONLY a raw valid JSON object without any markdown code fences or backticks. Follow this exact JSON schema:
{
  "title": "Recipe Title",
  "cuisine_type": "Cuisine Category",
  "prep_time": "Prep & Cooking Time e.g. 25 mins",
  "servings": "2",
  "difficulty": "Easy",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["Step 1...", "Step 2..."],
  "nutrition": {
    "calories": 450,
    "protein": 35,
    "carbs": 40,
    "fat": 15,
    "fiber": 6
  },
  "youtube_search_query": "Exact Recipe Name Cooking Tutorial"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
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
