// api/index.js - Vercel Serverless Function Proxy

export default async function handler(req, res) {
  const notionApiBase = 'https://api.notion.com/v1';
  // req.url contains the path, e.g., /api/databases/some-id/query
  // We need to remove the leading /api part to forward to Notion.
  const targetUrl = `${notionApiBase}${req.url.replace('/api', '')}`;
  
  // Securely get the API key from Vercel Environment Variables.
  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'Server configuration error: Notion API key is missing.' });
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  };

  try {
    const notionRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      // Pass the body along if it exists for POST or PATCH requests.
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : null,
    });
    
    // Get the response from Notion as JSON.
    const data = await notionRes.json();
    
    // Send Notion's response and status code back to the client.
    return res.status(notionRes.status).json(data);

  } catch (error) {
    console.error('Error in Notion proxy:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}
