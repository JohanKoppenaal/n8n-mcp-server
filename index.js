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

// Verbeterde MCP proxy die alle parameters doorgeeft
app.all('/mcp-proxy*', (req, res) => {
  console.log(`Received MCP request: ${req.method} ${req.url}`);
  
  const n8nBaseUrl = 'https://h1webdevelopment.app.n8n.cloud/mcp/d2a6f99e-f9dc-4bfe-9678-0f06d6b89696/sse';
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Bereid de juiste URL voor, afhankelijk van de request
  const targetUrl = n8nBaseUrl;
  console.log(`Proxying to: ${targetUrl}`);
  
  // Convert body to string if it exists
  let bodyData = '';
  if (req.body) {
    bodyData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  
  // Setup options for the proxy request
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': req.headers['user-agent'] || 'MCP-Proxy',
      'Accept': req.headers['accept'] || '*/*'
    }
  };
  
  // Make the proxy request
  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    console.log(`Received response from n8n with status: ${proxyRes.statusCode}`);
    
    // Copy response headers
    Object.keys(proxyRes.headers).forEach(key => {
      res.setHeader(key, proxyRes.headers[key]);
    });
    
    // Pipe response from n8n to client
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (error) => {
    console.error('Error proxying to n8n:', error);
    res.status(500).end(`Error: ${error.message}`);
  });
  
  // Send body data if present
  if (bodyData && req.method !== 'GET' && req.method !== 'HEAD') {
    proxyReq.write(bodyData);
  }
  
  proxyReq.end();
  
  // Handle client disconnect
  req.on('close', () => {
    proxyReq.destroy();
  });
});

// Enable body parsing for JSON
app.use(express.json());

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Start server
console.log(`Starting Express server on port ${port}`);
app.listen(port, '0.0.0.0', () => {
  console.log(`Express server running on port ${port}`);
});
