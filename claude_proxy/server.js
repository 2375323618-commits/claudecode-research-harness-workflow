const http = require('http');
const https = require('https');

// ====== DeepSeek API 配置 ======
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'your-api-key-here';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const MODEL_NAME = 'deepseek-chat';
// ===============================

const PORT = 15721;

// List models (Claude Desktop checks this on startup)
function handleModels(res) {
  const data = {
    object: 'list',
    data: [
      {
        id: MODEL_NAME,
        object: 'model',
        created: 1710000000,
        owned_by: 'deepseek'
      }
    ]
  };
  res.writeHead(200, { 
    'Content-Type': 'application/json', 
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Proxy chat completions to DeepSeek
function handleChatCompletions(body, res) {
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    payload = {};
  }
  
  // Use the model Claude requests, or fallback
  payload.model = MODEL_NAME;

  const postData = JSON.stringify(payload);

  const options = {
    hostname: 'api.deepseek.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    headers['Access-Control-Allow-Origin'] = '*';
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `Upstream error: ${err.message}` } }));
  });

  proxyReq.end(postData);
}

// Handle CORS preflight
function handleOptions(res) {
  res.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end();
}

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method === 'GET' && (req.url === '/v1/models' || req.url === '/models')) {
    return handleModels(res);
  }

  if (req.method === 'POST' && (req.url.includes('/chat/completions') || req.url.includes('/v1/chat/completions'))) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => handleChatCompletions(body, res));
    return;
  }

  // Health check
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ status: 'ok', provider: 'DeepSeek Proxy for Claude' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✓ DeepSeek proxy running on http://127.0.0.1:${PORT}`);
  console.log(`✓ Model: ${MODEL_NAME}`);
  console.log(`✓ Listening for Claude Desktop connections...`);
});
