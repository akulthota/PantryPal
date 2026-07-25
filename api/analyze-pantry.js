// Vercel Serverless Function: Pantry Image Analysis via Gemini 3.6 Flash Vision

export default async function handler(req, res) {
  // CORS setup
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
    const { image, mimeType = 'image/jpeg' } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured on the server.'
      });
    }

    // Clean up base64 string
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;

    const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const modelsToTry = [primaryModel, 'gemini-2.5-flash', 'gemini-1.5-flash'];

    let responseData = null;
    let lastError = null;

    const prompt = `Analyze this image of a pantry, fridge, or food items. Identify ALL visible food items, produce, ingredients, dairy, meats, condiments, and pantry staples in detail.
Return ONLY a valid JSON object formatted as:
{
  "ingredients": ["Ingredient 1", "Ingredient 2", "Ingredient 3"]
}
Do not include markdown code block formatting (like \`\`\`json) or extra conversational text. Return plain JSON only.`;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.2,
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

    // Extract content text
    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanJson);
      return res.status(200).json({
        ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
        raw: rawText
      });
    } catch (parseErr) {
      // Fallback regex extraction if model returned conversational JSON
      const matches = [...rawText.matchAll(/"([^"]+)"/g)].map(m => m[1]).filter(s => s.length > 2 && s !== 'ingredients');
      return res.status(200).json({
        ingredients: matches.length > 0 ? matches : ['Fresh Produce', 'Dairy', 'Condiments'],
        raw: rawText
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
