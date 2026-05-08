import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const filePath = path.join(process.cwd(), 'public', 'widget', 'index.js');
    const fileContent = await fs.promises.readFile(filePath, 'utf8');

    // Set caching headers
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'application/javascript');

    return res.status(200).send(fileContent);
  } catch (error) {
    console.error('Error serving widget script:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
