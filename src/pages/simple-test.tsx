import React from 'react';

export default function SimpleTestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Test Page</h1>
      <p>If you can see this, the basic page routing works.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}
