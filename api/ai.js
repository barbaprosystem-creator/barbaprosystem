import https from 'https';

function requestHttps(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error?.message || `HTTP ${res.statusCode}: ${data}`));
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function callGoogleGemini(messages, temperature, response_format, geminiApiKey) {
  const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.6-flash'];
  const isJson = response_format?.type === 'json_object';

  const contents = [];
  let systemText = '';

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemText += (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)) + '\n\n';
      continue;
    }

    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts = [];

    if (systemText && role === 'user') {
      parts.push({ text: `[System Instructions]\n${systemText}` });
      systemText = '';
    }

    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text });
        } else if (part.type === 'image_url') {
          const urlStr = part.image_url?.url || '';
          const match = urlStr.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inline_data: {
                mime_type: match[1],
                data: match[2]
              }
            });
          }
        }
      }
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  if (contents.length === 0 && systemText) {
    contents.push({ role: 'user', parts: [{ text: systemText }] });
  }

  const payload = {
    contents,
    generationConfig: {
      temperature: temperature ?? 0.2,
      ...(isJson && { responseMimeType: 'application/json' }),
      thinkingConfig: { thinkingBudget: 0 }
    }
  };

  const postData = JSON.stringify(payload);
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000
      };

      const data = await requestHttps(options, postData);
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        id: `gemini-${Date.now()}`,
        object: 'chat.completion',
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: rawText
            },
            finish_reason: 'stop'
          }
        ]
      };
    } catch (err) {
      console.warn(`[Gemini] Model ${model} failed, trying next:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini candidate models failed');
}

async function callOpenAI(messages, temperature, response_format, openAiApiKey) {
  const hasImages = messages.some(m =>
    Array.isArray(m.content) && m.content.some(c => c.type === 'image_url')
  );
  const model = hasImages ? 'gpt-4o' : 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAiApiKey}`,
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
    throw new Error(data.error?.message || `OpenAI error ${response.status}`);
  }
  return data;
}

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

  const { messages, temperature = 0.2, response_format } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages are required and must be an array' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

  if (!geminiApiKey && !openAiApiKey) {
    return res.status(500).json({ error: 'No AI API key configured (neither Gemini nor OpenAI)' });
  }

  // 1. Try Google Gemini first if key exists
  if (geminiApiKey) {
    try {
      const geminiResult = await callGoogleGemini(messages, temperature, response_format, geminiApiKey);
      return res.status(200).json(geminiResult);
    } catch (geminiError) {
      console.warn('[AI Handler] Gemini failed, attempting OpenAI fallback:', geminiError.message);
      if (!openAiApiKey) {
        return res.status(500).json({ error: `Gemini error: ${geminiError.message}` });
      }
    }
  }

  // 2. OpenAI Fallback
  if (openAiApiKey) {
    try {
      const openAiResult = await callOpenAI(messages, temperature, response_format, openAiApiKey);
      return res.status(200).json(openAiResult);
    } catch (openAiError) {
      console.error('[AI Handler] OpenAI error:', openAiError.message);
      return res.status(500).json({ error: `AI Error: ${openAiError.message}` });
    }
  }

  return res.status(500).json({ error: 'Failed to process AI request with available providers' });
}
