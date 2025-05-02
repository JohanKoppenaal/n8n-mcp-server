const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Hardcoded auth token
const AUTH_TOKEN = "h1mcp"; // Vervang dit met je gewenste auth token

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MCP server is running' });
});

// Start de server
app.listen(port, '0.0.0.0', () => {
  console.log(`Express server running on port ${port}`);
  console.log(`Using AUTH_TOKEN: ${AUTH_TOKEN}`);
  
  // Start MCP server in de achtergrond
  const mcp = spawn('npx', [
    '@typingmind/mcp',
    AUTH_TOKEN // Gebruik de hardcoded auth token
  ], {
    stdio: 'inherit'
  });
  
  mcp.on('error', (err) => {
    console.error('Failed to start MCP server:', err);
    
    // Als MCP server faalt, proberen we supergateway als fallback
    console.log('Falling back to supergateway...');
    const supergateway = spawn('npx', [
      'supergateway',
      '--sse',
      'https://h1webdevelopment.app.n8n.cloud/mcp/d2a6f99e-f9dc-4bfe-9678-0f06d6b89696/sse'
    ], {
      stdio: 'inherit'
    });
    
    supergateway.on('error', (gwErr) => {
      console.error('Failed to start supergateway:', gwErr);
    });
  });
  
  process.on('SIGTERM', () => {
    mcp.kill();
    process.exit(0);
  });
});
