export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { messages, temperature = 0.7, response_format } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages are required and must be an array' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  // Detect if any message contains image_url content (vision request)
  const hasImages = messages.some(m =>
    Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
  );

  // gpt-4o supports vision; gpt-4o-mini does NOT
  const model = hasImages ? 'gpt-4o' : 'gpt-4o-mini';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: hasImages ? 1000 : 2000,
        ...(response_format && { response_format }),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || `OpenAI error ${response.status}`,
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in AI endpoint:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
