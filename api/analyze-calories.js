// Vercel Serverless Function: Ultra-Fast Calorie Scanner via Gemini 2.5 Flash

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
    const { image, mimeType = 'image/jpeg' } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY environment variable is not configured on the server.'
      });
    }

    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    const prompt = `Analyze this image of a prepared meal, dish, or food item. Identify the dish name, estimate the total calories, provide macronutrient breakdowns, breakdown individual food items on the plate, and provide a health score out of 10.
Return ONLY a valid JSON object matching this structure:
{
  "dish_name": "Grilled Salmon Bowl with Quinoa & Avocado",
  "total_calories": 540,
  "protein_g": 42,
  "carbs_g": 38,
  "fat_g": 22,
  "fiber_g": 8,
  "health_score": 9,
  "summary": "Nutrient-dense bowl high in lean protein, healthy fats, and fiber.",
  "components": [
    { "item": "Grilled Salmon Filet (6 oz)", "calories": 290, "protein_g": 34 },
    { "item": "Cooked Quinoa (1/2 cup)", "calories": 110, "protein_g": 4 },
    { "item": "Sliced Avocado (1/4)", "calories": 80, "protein_g": 1 },
    { "item": "Steamed Broccoli & Dressing", "calories": 60, "protein_g": 3 }
  ]
}
Do not include markdown wrappers (like \`\`\`json). Return plain JSON only.`;

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
          if (response.status === 429) {
            await new Promise(r => setTimeout(r, 200));
          }
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

    const nutritionData = JSON.parse(cleanJson);
    return res.status(200).json(nutritionData);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
