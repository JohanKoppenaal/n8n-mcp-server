const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Auth token
const AUTH_TOKEN = "h1mcp";

// Debug mode to log all details
const DEBUG = true;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: true }));

// Detailed logging for all requests
app.use((req, res, next) => {
  if (DEBUG) {
    console.log(`\n=== ${new Date().toISOString()} ===`);
    console.log(`${req.method} ${req.url}`);
    console.log(`Headers: ${JSON.stringify(req.headers)}`);
    console.log(`Body: ${JSON.stringify(req.body)}`);
  } else {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
  next();
});

// Basic endpoints
app.get('/ping', (req, res) => {
  console.log('Ping request received');
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TypingMind MCP Server is running',
    authToken: AUTH_TOKEN
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MCP-specific endpoints for TypingMind
// Server manifest endpoint
app.get('/manifest', (req, res) => {
  res.json({
    schema_version: "v1",
    auth: {
      type: "bearer"
    },
    servers: {
      "n8n": {
        display_name: "n8n Workflows",
        description: "Execute n8n workflows and automations",
        tools: [
          {
            name: "get_weather",
            description: "Get current weather information for a location",
            input_schema: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The location to get weather for (city name)"
                }
              },
              required: ["location"]
            }
          }
        ]
      }
    }
  });
});

// Status check endpoint
app.get('/status', (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    servers: {
      "n8n": {
        status: "operational"
      }
    }
  });
});

// Tool execution endpoint
app.post('/tools/:tool_name', (req, res) => {
  const { tool_name } = req.params;
  const authHeader = req.headers.authorization;
  
  console.log(`Tool execution request: ${tool_name}`);
  console.log(`Auth header: ${authHeader}`);
  
  // Simple authentication
  const token = authHeader?.replace('Bearer ', '');
  if (token !== AUTH_TOKEN) {
    console.log(`Authentication failed. Expected: ${AUTH_TOKEN}, Got: ${token}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Example tool execution
  if (tool_name === 'get_weather') {
    const { location } = req.body;
    console.log(`Getting weather for: ${location}`);
    
    // Simulate a weather response
    return res.json({
      result: {
        location: location,
        temperature: "22°C",
        condition: "Sunny",
        humidity: "45%",
        timestamp: new Date().toISOString()
      }
    });
  } else {
    return res.status(404).json({ error: `Tool ${tool_name} not found` });
  }
});

// Mock SSE endpoint that TypingMind might expect
app.get('/sse', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
  
  // Keep connection open
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
  }, 30000);
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Any other MCP endpoint that might be needed
app.all('*', (req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`TypingMind MCP Server running on port ${port}`);
  console.log(`URL: http://localhost:${port}`);
  console.log(`Auth Token: ${AUTH_TOKEN}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
