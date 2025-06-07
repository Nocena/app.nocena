const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Starting Next.js app in dev mode...');

const dev = true; // Set to true for development mode
const app = next({ dev });
const handle = app.getRequestHandler();

console.log('Reading certificate files...');
const certPath = path.join(__dirname, 'certificates', 'dev.cert');
const keyPath = path.join(__dirname, 'certificates', 'dev.key');

console.log('Certificate path:', certPath);
console.log('Key path:', keyPath);

// Function to get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const networkInterface = interfaces[interfaceName];
    for (const network of networkInterface) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (network.family === 'IPv4' && !network.internal) {
        return network.address;
      }
    }
  }
  return 'localhost';
}

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
      
      const localIP = getLocalIP();

      createServer(httpsOptions, (req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      }).listen(3001, '0.0.0.0', (err) => {  // Changed: bind to all interfaces with '0.0.0.0'
        if (err) {
          console.error('Error starting server:', err);
          throw err;
        }
        console.log('> Ready on https://localhost:3001');
        console.log(`> Also available on your network at https://${localIP}:3001`);
        console.log('> For mobile testing, use the network URL');
      });
    })
    .catch((err) => {
      console.error('Error preparing Next.js app:', err);
    });
} catch (error) {
  console.error('Error setting up HTTPS server:', error);
}
