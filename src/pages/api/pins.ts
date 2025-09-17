import { NextApiRequest, NextApiResponse } from 'next';

// Simple in-memory storage for development/testing
// In production, this should use a database
let pins: any[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Handle GET requests to fetch pins
    const { testGroupId, domain, pageUrl } = req.query;
    
    // Filter pins based on query parameters
    let filteredPins = pins;
    
    if (testGroupId) {
      filteredPins = filteredPins.filter(pin => pin.testGroupId === testGroupId);
    }
    if (domain) {
      filteredPins = filteredPins.filter(pin => pin.domain === domain);
    }
    if (pageUrl) {
      filteredPins = filteredPins.filter(pin => pin.pageUrl === pageUrl);
    }
    
    console.log(`API: Returning ${filteredPins.length} pins for testGroupId: ${testGroupId}, domain: ${domain}, pageUrl: ${pageUrl}`);
    return res.status(200).json(filteredPins);
  }
  
  if (req.method === 'POST') {
    // Handle POST requests to save pins
    const pinData = req.body;
    
    // Generate ID if not provided
    if (!pinData.id) {
      pinData.id = 'pin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Add timestamp if not provided
    if (!pinData.timestamp) {
      pinData.timestamp = new Date().toISOString();
    }
    
    pins.push(pinData);
    console.log(`API: Saved pin ${pinData.id} for testGroupId: ${pinData.testGroupId}, domain: ${pinData.domain}`);
    
    return res.status(201).json({ success: true, pin: pinData });
  }
  
  if (req.method === 'DELETE') {
    // Handle DELETE requests to remove pins
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Pin ID is required' });
    }
    
    const initialLength = pins.length;
    pins = pins.filter(pin => pin.id !== id);
    
    if (pins.length < initialLength) {
      console.log(`API: Deleted pin ${id}`);
      return res.status(200).json({ success: true, message: 'Pin deleted' });
    } else {
      return res.status(404).json({ error: 'Pin not found' });
    }
  }
  
  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
