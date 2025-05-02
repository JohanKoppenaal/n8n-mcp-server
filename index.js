const express = require('express');
const { spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Auth token - kan elke waarde zijn
const AUTH_TOKEN = "h1mcp";

// Basic endpoints voor health checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/ping', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MCP Connector server is running. Use this URL as Connector URL in TypingMind.',
    auth_token: AUTH_TOKEN 
  });
});

// Start de server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Express server running on port ${port}`);
  
  // Start de MCP Connector als een child process
  console.log(`Starting MCP Connector with auth token: ${AUTH_TOKEN}`);
  
  const mcp = spawn('npx', ['@typingmind/mcp', AUTH_TOKEN], {
    stdio: 'inherit'
  });
  
  mcp.on('error', (err) => {
    console.error('Failed to start MCP Connector:', err);
  });
  
  process.on('SIGTERM', () => {
    mcp.kill();
    server.close(() => {
      process.exit(0);
    });
  });
});
