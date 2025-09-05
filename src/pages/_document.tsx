// pages/_document.tsx - Updated document with proper SW registration
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* PWA meta tags */}
          <meta name="application-name" content="Nocena" />
          <meta name="mobile-web-app-capable" content="yes" />
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

          {/* Enhanced service worker registration with update handling */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
              // Service Worker Registration and Update Handling
              if ('serviceWorker' in navigator) {
                let swVersion = null;
                
                // Register service worker on page load
                window.addEventListener('load', async function() {
                  try {
                    console.log('🔧 Registering service worker...');
                    
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                      scope: '/'
                    });
                    
                    console.log('✅ ServiceWorker registered:', registration.scope);
                    
                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                      console.log('🔄 Service worker update found');
                      
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🆕 New service worker installed, prompting user...');
                            
                            // Show update notification
                            if (window.confirm('App update available! Refresh to get the latest version?')) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                              window.location.reload();
                            }
                          }
                        });
                      }
                    });
                    
                    // Listen for service worker messages
                    navigator.serviceWorker.addEventListener('message', (event) => {
                      console.log('💬 SW Message:', event.data);
                      
                      if (event.data && event.data.type === 'SW_UPDATED') {
                        console.log('🚀 Service worker updated to:', event.data.version);
                        swVersion = event.data.version;
                      }
                    });
                    
                    // Handle controlling service worker change
                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                      console.log('🔄 Service worker controller changed');
                      // Page will reload automatically
                    });
                    
                  } catch (error) {
                    console.error('❌ ServiceWorker registration failed:', error);
                  }
                });
                
                // Check for updates periodically (every 10 minutes)
                setInterval(async () => {
                  try {
                    const registration = await navigator.serviceWorker.getRegistration('/');
                    if (registration) {
                      console.log('🔍 Checking for service worker updates...');
                      await registration.update();
                    }
                  } catch (error) {
                    console.error('❌ Update check failed:', error);
                  }
                }, 600000); // 10 minutes
                
                // Expose version check function globally for debugging
                window.checkSWVersion = async function() {
                  try {
                    const registration = await navigator.serviceWorker.getRegistration('/');
                    if (registration && registration.active) {
                      return new Promise((resolve) => {
                        const messageChannel = new MessageChannel();
                        messageChannel.port1.onmessage = (event) => {
                          console.log('📱 SW Version:', event.data.version);
                          resolve(event.data.version);
                        };
                        registration.active.postMessage(
                          { type: 'GET_VERSION' }, 
                          [messageChannel.port2]
                        );
                      });
                    }
                  } catch (error) {
                    console.error('❌ Version check failed:', error);
                  }
                };
                
                // Expose force update function globally for debugging
                window.forceSWUpdate = async function() {
                  try {
                    const registration = await navigator.serviceWorker.getRegistration('/');
                    if (registration) {
                      await registration.update();
                      if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                      } else {
                        console.log('ℹ️ No update available');
                      }
                    }
                  } catch (error) {
                    console.error('❌ Force update failed:', error);
                  }
                };
              } else {
                console.warn('⚠️ Service workers not supported');
              }
            `,
            }}
          />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
