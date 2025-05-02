const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

// Basic middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Required MCP health endpoint
app.get('/ping', (req, res) => {
  console.log('Received ping request');
  res.json({ status: 'ok' });
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'MCP server is active',
    documentation: 'Configure in TypingMind with this URL and auth token: h1mcp'
  });
});

// MCP server manifest - essential for proper MCP operation
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
  const authHeader = req.headers.authorization;
  
  console.log(`Tool execution request for: ${tool_name}`);
  console.log(`Auth header: ${authHeader}`);
  console.log(`Request body: ${JSON.stringify(req.body)}`);
  
  // Validate auth token
  const token = authHeader?.replace('Bearer ', '');
  if (token !== 'h1mcp') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (tool_name === 'n8n_action') {
    try {
      // Forward the request to n8n
      const n8nUrl = 'https://h1webdevelopment.app.n8n.cloud/mcp/d2a6f99e-f9dc-4bfe-9678-0f06d6b89696/sse';
      
      // For a tool execution, we would normally make a POST request
      // However, in this case we're routing to an SSE endpoint which expects GET
      // This is just a simple example and would need to be modified for actual functionality
      
      // Return a simple success response for now
      return res.json({
        result: {
          message: `Action "${req.body.action || 'unknown'}" queued for execution`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error forwarding to n8n:', error);
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(404).json({ error: `Tool ${tool_name} not found` });
  }
});

// MCP Server discovery endpoint - critical for proper operation
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
  console.log(`Auth token: h1mcp`);
});
