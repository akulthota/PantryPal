// Vercel Serverless Function: AI Protein Boost Recommendations via DeepSeek

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
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { goal = 80, currentIntake = 0, preferences = {} } = req.body || {};

    const apiKey = (process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(500).json({
        error: 'DEEPSEEK_API_KEY environment variable is not configured on the server.'
      });
    }

    const model = process.env.DEEPSEEK_MODEL || 'deepseek-flash';

    const prompt = `You are a nutrition specialist AI. The user has a daily protein goal of ${goal}g and has logged ${currentIntake}g today.
User Dietary Restrictions: ${preferences.dietary_restrictions?.join(', ') || 'None'}
User Allergies: ${preferences.allergies?.join(', ') || 'None'}

Provide 3-4 specific high-protein snack or quick meal suggestions to help them bridge the remaining gap.
Return ONLY a valid JSON object matching:
{
  "suggestions": [
    {
      "title": "Greek Yogurt Parfait with Hemp Seeds",
      "protein_g": 24,
      "calories": 250,
      "category": "Dairy",
      "description": "High-protein Greek yogurt layered with hemp seeds and fresh berries."
    }
  ]
}
Do not include markdown wrappers. Return plain JSON only.`;

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
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' },
          effort: 'low',
          max_tokens: 800,
          temperature: 0.25
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

    try {
      const result = JSON.parse(cleanJson);
      return res.status(200).json(result);
    } catch (parseErr) {
      return res.status(200).json({
        suggestions: [
          { title: 'Greek Yogurt Parfait', protein_g: 22, category: 'Dairy', description: 'Plain Greek yogurt topped with chia seeds and sliced almonds.' },
          { title: 'Edamame Snack Bowl', protein_g: 17, category: 'Plant', description: 'Steamed edamame pods dusted with sea salt and garlic.' },
          { title: 'Hard-Boiled Eggs (x2)', protein_g: 13, category: 'Animal', description: 'Simple, quick protein boost on the go.' }
        ]
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

