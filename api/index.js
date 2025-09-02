// api/index.js - Vercel Serverless Function Proxy

export default async function handler(req, res) {
  // Log invocation for debugging in Vercel logs
  console.log(`Proxy invoked for: ${req.method} ${req.url}`);

  const notionApiBase = 'https://api.notion.com/v1';
  // req.url contains the path, e.g., /api/databases/some-id/query
  // We need to remove the leading /api part to forward to Notion.
  const targetUrl = `${notionApiBase}${req.url.replace('/api', '')}`;
  
  // Securely get the API key from Vercel Environment Variables.
  const apiKey = process.env.NOTION_API_KEY;

  if (!apiKey) {
    console.error('CRITICAL: NOTION_API_KEY environment variable not found.');
    return res.status(500).json({ message: 'Server configuration error: Notion API key is missing. Please check Vercel environment variables.' });
  }

  // Log to confirm the key is loaded, without exposing the key itself.
  console.log(`API key loaded. Length: ${apiKey.length}`);

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  };

  try {
    // Determine the body. For POST/PATCH with no body from client, req.body might be null or {}.
    // Notion API expects a body for some requests (like query), even if it's just {}.
    const body = req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : (req.method === 'POST' ? '{}' : null);
    
    console.log(`Forwarding request to Notion: ${targetUrl}`);
    
    const notionRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });
    
    const data = await notionRes.json();
    
    // If Notion returned an error, log it for easier debugging on Vercel.
    if (!notionRes.ok) {
        console.error(`Error from Notion API (${notionRes.status}):`, JSON.stringify(data, null, 2));
    }
    
    // Send Notion's response and status code back to the client.
    res.status(notionRes.status).json(data);

  } catch (error) {
    console.error('Error in Notion proxy function:', error);
    return res.status(500).json({ message: 'An internal server error occurred in the proxy.' });
  }
}
