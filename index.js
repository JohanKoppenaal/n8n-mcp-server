const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Hardcoded auth token
const AUTH_TOKEN = "h1mcp"; // Ik zie dat je "h1mcp" gebruikt als token

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MCP server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'MCP server is active' });
});

// Start de Express server en MCP server apart
console.log(`Attempting to start Express server on port ${port}`);

// Start MCP server zonder specifieke poort te binden
const startMCP = () => {
  console.log(`Starting MCP server with auth token: ${AUTH_TOKEN}`);
  
  const mcp = spawn('npx', [
    '@typingmind/mcp',
    AUTH_TOKEN
  ], {
    stdio: 'inherit'
  });
  
  mcp.on('error', (err) => {
    console.error('Failed to start MCP server:', err);
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
  
  return mcp;
};

// Start Express on a different port if the first one fails
const startExpress = (attemptPort) => {
  app.listen(attemptPort, '0.0.0.0')
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${attemptPort} is in use, trying another port...`);
        // Try a random port in a valid range
        const newPort = Math.floor(Math.random() * (65535 - 10001)) + 10001;
        startExpress(newPort);
      } else {
        console.error('Express server error:', err);
      }
    })
    .on('listening', () => {
      console.log(`Express server successfully running on port ${attemptPort}`);
      // Start MCP server after Express is running
      const mcpProcess = startMCP();
      
      process.on('SIGTERM', () => {
        mcpProcess.kill();
        process.exit(0);
      });
    });
};

// Start with the environment-provided port
startExpress(port);
