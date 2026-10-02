// Vercel Serverless Function: Ultra-Fast Calorie Scanner via DeepSeek Vision

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

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'DEEPSEEK_API_KEY environment variable is not configured on the server.'
      });
    }

    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
    const imageUrl = image.startsWith('data:') ? image : `data:${mimeType};base64,${base64Data}`;
    const model = process.env.DEEPSEEK_VISION_MODEL || 'deepseek-flash';

    const systemPrompt = `You are an expert nutrition and meal analysis AI. Analyze this image of a prepared meal, dish, or food item. Identify the dish name, estimate the total calories, provide macronutrient breakdowns, breakdown individual food items on the plate, and provide a health score out of 10.
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
}`;

    let responseData = null;
    let lastError = null;

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
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageUrl
                  }
                }
              ]
            }
          ],
          response_format: { type: 'json_object' },
          thinking: { type: 'disabled' },
          max_tokens: 450,
          temperature: 0.1
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

    if (!responseData) {
      return res.status(500).json({ error: `DeepSeek API request failed: ${lastError}` });
    }

    const rawText = responseData.choices?.[0]?.message?.content || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const nutritionData = JSON.parse(cleanJson);
    return res.status(200).json(nutritionData);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
