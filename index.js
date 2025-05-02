const express = require('express');
const http = require('http');
const https = require('https');
const EventSource = require('eventsource');
const app = express();
const port = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'MCP proxy is active' });
});

app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dedicated SSE proxy for n8n
app.get('/mcp-proxy', (req, res) => {
  const n8nUrl = 'https://h1webdevelopment.app.n8n.cloud/mcp/d2a6f99e-f9dc-4bfe-9678-0f06d6b89696/sse';
  
  console.log(`Establishing SSE connection to: ${n8nUrl}`);
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Create an EventSource to connect to n8n
  const eventSource = new EventSource(n8nUrl);
  
  // Forward all events from n8n to client
  eventSource.onmessage = (event) => {
    console.log(`Received event from n8n: ${event.data.substring(0, 100)}...`);
    res.write(`data: ${event.data}\n\n`);
  };
  
  eventSource.onerror = (err) => {
    console.error('EventSource error:', err);
    // Keep the connection open, don't close on error
  };
  
  // Handle specific events if needed
  eventSource.addEventListener('open', () => {
    console.log('Connection to n8n established');
    res.write(`data: {"type":"connected"}\n\n`);
  });
  
  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected, closing EventSource');
    eventSource.close();
  });
});

// Handle POST requests to mcp-proxy with JSON body forwarding
app.post('/mcp-proxy', (req, res) => {
  const n8nUrl = 'https://h1webdevelopment.app.n8n.cloud/mcp/d2a6f99e-f9dc-4bfe-9678-0f06d6b89696';
  
  console.log(`Forwarding POST request to: ${n8nUrl}`);
  console.log(`Request body: ${JSON.stringify(req.body)}`);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': req.headers['user-agent'] || 'MCP-Proxy'
    }
  };
  
  const proxyReq = https.request(n8nUrl, options, (proxyRes) => {
    let responseData = '';
    
    proxyRes.on('data', (chunk) => {
      responseData += chunk;
    });
    
    proxyRes.on('end', () => {
      console.log(`Response from n8n: ${responseData.substring(0, 100)}...`);
      res.status(proxyRes.statusCode).send(responseData);
    });
  });
  
  proxyReq.on('error', (error) => {
    console.error('Error forwarding to n8n:', error);
    res.status(500).json({ error: error.message });
  });
  
  proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
