const { spawn } = require('child_process');
const port = process.env.PORT || 3000;
const authToken = "h1mcp" || 'jouw-auth-token';

console.log(`Starting MCP runner on port ${port}`);
const mcp = spawn('npx', [
  '@typingmind/mcp',
  authToken,
  '--port',
  port.toString(),
  '--host',
  '0.0.0.0'
], {
  stdio: 'inherit'
});

mcp.on('error', (err) => {
  console.error('Failed to start MCP runner:', err);
});

process.on('SIGTERM', () => {
  mcp.kill();
  process.exit(0);
});
