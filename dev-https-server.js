const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

console.log('Starting Next.js app in dev mode...');

const dev = true; // Set to true for development mode
const app = next({ dev });
const handle = app.getRequestHandler();

console.log('Reading certificate files...');
const certPath = path.join(__dirname, 'certificates', 'dev.cert');
const keyPath = path.join(__dirname, 'certificates', 'dev.key');

console.log('Certificate path:', certPath);
console.log('Key path:', keyPath);

try {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  console.log('Certificates loaded successfully');

  app
    .prepare()
    .then(() => {
      console.log('Next.js app prepared, creating HTTPS server...');

      createServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      }).listen(3001, (err) => {
        if (err) {
          console.error('Error starting server:', err);
          throw err;
        }
        console.log('> Ready on https://localhost:3001');
      });
    })
    .catch((err) => {
      console.error('Error preparing Next.js app:', err);
    });
} catch (error) {
  console.error('Error setting up HTTPS server:', error);
}
