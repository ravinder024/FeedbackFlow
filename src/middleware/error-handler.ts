import { NextApiRequest, NextApiResponse } from 'next';

export function withErrorHandler(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      console.log('📝 API Request:', {
        method: req.method,
        url: req.url,
        body: req.body ? JSON.stringify(req.body).substring(0, 100) : null,
        timestamp: new Date().toISOString()
      });

      const result = await handler(req, res);
      
      console.log('✅ API Response:', {
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error: any) {
      console.error('❌ API Error:', {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Don't override if response has already been sent
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error',
          message: error.message 
        });
      }
    }
  };
}
