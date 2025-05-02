const express = require('express');
const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const app = express();
const port = process.env.PORT || 3000;

// Hardcoded auth token
const AUTH_TOKEN = "h1mcp";

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MCP proxy server is active',
    usage: 'Configure TypingMind with this URL and auth token: h1mcp'
  });
});

// Ping endpoint - dit is wat TypingMind probeert aan te roepen
app.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString() 
  });
});

// Create simple proxy for the n8n MCP endpoint
app.get('/mcp-proxy', (req, res) => {
  const n8nUrl = 'https://h1webdevelopment.app.n8n.cloud/mcp/d2a6f99e-f9dc-4bfe-9678-0f06d6b89696/sse';
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Proxy the request to n8n
  const request = https.get(n8nUrl, (response) => {
    // Pipe the response from n8n to our client
    response.pipe(res);
  });
  
  request.on('error', (error) => {
    console.error('Error proxying to n8n:', error);
    res.status(500).end(`Error: ${error.message}`);
  });
  
  // Handle client disconnect
  req.on('close', () => {
    request.destroy();
  });
});

// Start server
console.log(`Starting Express server on port ${port}`);
app.listen(port, '0.0.0.0', () => {
  console.log(`Express server running on port ${port}`);
});
