// Vercel Serverless Function: AI Recipe Generation via Gemini 3.6 Flash

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ingredients = [], preferences = {} } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured on the server.'
      });
    }

    const {
      dietary_restrictions = [],
      favorite_cuisines = [],
      allergies = [],
      cooking_skill = 'Intermediate'
    } = preferences;

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const modelsToTry = [primaryModel, 'gemini-2.5-flash', 'gemini-1.5-flash'];

    const prompt = `You are a world-class culinary chef AI. Create a creative, delicious, and easy-to-follow recipe.
Available Ingredients: ${ingredients.length > 0 ? ingredients.join(', ') : 'Pantry staples, eggs, garlic, olive oil, vegetables'}
User Dietary Restrictions: ${dietary_restrictions.join(', ') || 'None'}
User Allergies to Avoid: ${allergies.join(', ') || 'None'}
Favorite Cuisines: ${favorite_cuisines.join(', ') || 'Any'}
Cooking Skill Level: ${cooking_skill}

Return ONLY a valid JSON object matching this structure:
{
  "title": "Delicious Recipe Name",
  "cuisine_type": "Cuisine Name",
  "prep_time": "20 mins",
  "servings": "2-4",
  "difficulty": "Easy",
  "ingredients": [
    "1 cup specified ingredient with measurement",
    "2 tbsp another ingredient"
  ],
  "instructions": [
    "Step 1: Prep ingredients...",
    "Step 2: Heat oil in pan...",
    "Step 3: Serve warm."
  ],
  "nutrition": {
    "calories": 420,
    "protein": 28,
    "carbs": 35,
    "fat": 14,
    "fiber": 6
  }
}
Do not include markdown wrappers. Return plain JSON.`;

    let responseData = null;
    let lastError = null;

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
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!responseData) {
      return res.status(500).json({ error: `Gemini API request failed: ${lastError}` });
    }

    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const recipeObj = JSON.parse(cleanJson);
    return res.status(200).json(recipeObj);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
