const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const dotenv = require('dotenv');
const kill = require('kill-port');
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
// hostname is optional for local dev; avoid passing it to next() to prevent watchpack errors
// set to undefined intentionally
const hostname = undefined;
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

async function killPortIfInUse(port) {
  try {
    await kill(port);
    console.log(`✓ Killed process using port ${port}`);
  } catch (error) {
    // Port was not in use, which is fine
    console.log(`Port ${port} is free to use`);
  }
}

async function startServer(port) {
  // Kill any process using the target port first
  await killPortIfInUse(port);
  
  // Create Next.js app without passing hostname (passing hostname caused watchpack path errors)
  const app = next({ dev });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    }).listen(port, async (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use, trying port ${port + 1}...`);
        await startServer(port + 1);
      } else if (err) {
        throw err;
      } else {
        console.log(`> Ready on http://${hostname}:${port}`);
      }
    });
  }).catch(err => {
    console.error('Error preparing Next.js app:', err);
    process.exit(1);
  });
}

// Start the server with async support
(async () => {
  try {
    await startServer(DEFAULT_PORT);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();