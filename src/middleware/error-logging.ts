import { NextApiRequest, NextApiResponse } from 'next';
import { NextApiHandler } from 'next';

export function withErrorLogging(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      console.log('=== API Request ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Body:', req.body);
      console.log('Headers:', req.headers);

      // Call the original handler
      return await handler(req, res);
    } catch (error) {
      console.error('=== API Error ===');
      console.error('Error details:', error);
      console.error('Stack trace:', (error as Error).stack);
      
      // Re-throw the error for NextAuth to handle
      throw error;
    }
  };
}
