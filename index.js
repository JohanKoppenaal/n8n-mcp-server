const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Hardcoded auth token
const AUTH_TOKEN = "h1mcp";

// Basic middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Authentication middleware for all routes except ping
const authenticate = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  
  console.log(`Received auth token: ${token}`);
  
  // Check if token matches
  if (token !== AUTH_TOKEN) {
    console.log(`Authentication failed. Expected: ${AUTH_TOKEN}, Received: ${token}`);
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing token.' });
  }
  
  console.log('Authentication successful');
  next();
};

// Ping endpoint without auth
app.get('/ping', (req, res) => {
  console.log('Received ping request');
  // Ping requests can succeed without auth
  res.json({ status: 'ok' });
});

// All other endpoints require authentication
app.use((req, res, next) => {
  // Skip auth for ping and OPTIONS
  if (req.path === '/ping' || req.method === 'OPTIONS') {
    return next();
  }
  
  // Apply authentication for everything else
  authenticate(req, res, next);
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MCP server is active',
    documentation: 'Configure in TypingMind with this URL and auth token: h1mcp'
  });
});

// MCP server manifest
app.get('/manifest', (req, res) => {
  res.json({
    schema_version: "v1",
    auth: {
      type: "bearer"
    },
    servers: {
      n8n: {
        display_name: "n8n Integration",
        description: "Execute n8n workflows",
        tools: [
          {
            name: "n8n_action",
            description: "Execute an n8n workflow",
            input_schema: {
              type: "object",
              properties: {
                action: {
                  type: "string",
                  description: "The action to perform"
                },
                parameters: {
                  type: "object",
                  description: "Additional parameters for the action"
                }
              },
              required: ["action"]
            }
          }
        ]
      }
    }
  });
});

// MCP tool execution endpoint
app.post('/tools/:tool_name', async (req, res) => {
  const { tool_name } = req.params;
  
  console.log(`Tool execution request for: ${tool_name}`);
  console.log(`Request body: ${JSON.stringify(req.body)}`);
  
  if (tool_name === 'n8n_action') {
    try {
      // Here you would normally forward the request to n8n
      // For now, just return a success response
      return res.json({
        result: {
          message: `Action "${req.body.action || 'unknown'}" executed successfully`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error executing tool:', error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(404).json({ error: `Tool ${tool_name} not found` });
  }
});

// MCP Server discovery endpoint
app.get('/v1/discovery', (req, res) => {
  res.json({
    schema_version: "v1",
    servers: {
      n8n: {
        display_name: "n8n Integration",
        description: "Execute n8n workflows via MCP",
        status: "available"
      }
    }
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`MCP server running on port ${port}`);
  console.log(`Server URL: http://0.0.0.0:${port}`);
  console.log(`Auth token: ${AUTH_TOKEN}`);
});
