// Vercel Serverless Function: Ultra-Fast Pantry Vision Analysis via DeepSeek Vision

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
    const { image, mimeType = 'image/jpeg' } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const apiKey = (process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || '').trim();
    
    // Clean base64 data and form data URL
    const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
    const imageUrl = image.startsWith('data:') ? image : `data:${mimeType};base64,${base64Data}`;
    
    const model = process.env.DEEPSEEK_VISION_MODEL || 'deepseek-flash';

    let responseData = null;
    let lastError = null;

    const systemPrompt = `You are an expert grocery, pantry, and food detection AI.
Analyze the user's photo and list EVERY single edible food item, grocery, ingredient, produce, meat, dairy, beverage, condiment, snack, canned good, spice, or pantry item you can detect or infer from labels, packages, containers, or loose food.
Return ONLY a valid JSON object matching:
{
  "ingredients": ["Item 1", "Item 2", "Item 3"]
}
Guidelines:
1. Extract simplified common grocery/ingredient names (e.g. "Cheddar Cheese", "Eggs", "Milk", "Chicken", "Spinach", "Tomatoes", "Onions", "Bread", "Garlic", "Butter", "Pasta", "Rice").
2. Identify packaged foods, cans, jars, and bottles by what food is inside.
3. If the image truly contains zero food or grocery items, return: {"ingredients": []}.
Do NOT output markdown. Output raw JSON only.`;

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
            effort: 'medium',
            max_tokens: 4000,
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
    }

    if (responseData) {
      const rawText = responseData.choices?.[0]?.message?.content || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed.ingredients)) {
          return res.status(200).json({
            ingredients: parsed.ingredients,
            isFallback: false,
            raw: rawText
          });
        }
      } catch (parseErr) {
        const EXCLUDED_KEYS = ['ingredients', 'raw', 'status', 'error', 'item', 'food', 'type'];
        const matches = [...rawText.matchAll(/"([^"]+)"/g)]
          .map(m => m[1])
          .filter(s => s.length > 2 && !EXCLUDED_KEYS.includes(s.toLowerCase()));
        if (matches.length > 0) {
          return res.status(200).json({
            ingredients: matches,
            isFallback: false,
            raw: rawText
          });
        }
      }
    }

    const fallbackReason = !apiKey ? 'missing_key' : 'api_error';
    console.warn('Using Vision API fallback analysis due to:', lastError || fallbackReason);
    return res.status(200).json({
      ingredients: ['Fresh Milk', 'Eggs', 'Cheddar Cheese', 'Fresh Strawberries', 'Butter', 'Tomatoes', 'Mustard'],
      isFallback: true,
      reason: fallbackReason,
      errorDetails: lastError || null
    });

  } catch (err) {
    console.error('Vision API handler error:', err);
    return res.status(200).json({
      ingredients: ['Fresh Milk', 'Eggs', 'Cheddar Cheese', 'Fresh Strawberries', 'Butter', 'Tomatoes', 'Mustard'],
      isFallback: true,
      reason: 'handler_error',
      errorDetails: err.message
    });
  }
}

