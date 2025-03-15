import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* PWA meta tags */}
          <meta name="application-name" content="Nocena" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Nocena" />
          <meta name="theme-color" content="#000000" />
          
          {/* Manifest */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Icons */}
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
          
          {/* Direct service worker registration script */}
          <script dangerouslySetInnerHTML={{
            __html: `
              // Check if service workers are supported
              if ('serviceWorker' in navigator) {
                // Wait for window load
                window.addEventListener('load', function() {
                  // Register the service worker
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      // Registration was successful
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(function(err) {
                      // Registration failed
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
            `
          }} />
        </body>
      </Html>
    );
  }
}

export default MyDocument;