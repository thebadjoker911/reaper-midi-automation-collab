# Quick Reference Guide

## Installation

```bash
npm install
```

## Basic Commands

### Start Server
```bash
npm run server
```

### Start Client
```bash
npm run client
# or with parameters
node src/index.js client ws://localhost:8080 room-name "Project Name"
```

### Run Examples
```bash
node examples/parser-demo.js
node examples/basic-server.js
node examples/basic-client.js
```

### Lint Code
```bash
npm run lint
```

## Quick API Reference

### RPPParser
```javascript
const parser = new RPPParser();
const project = parser.parse(rppContent);
const midi = parser.extractMidiData(project);
const automation = parser.extractAutomationData(project);
const changes = parser.detectChanges(oldProject, newProject);
```

### CollaborationServer
```javascript
const server = new CollaborationServer(8080);
server.start();
server.getStats();
server.stop();
```

### CollaborationClient
```javascript
const client = new CollaborationClient('ws://localhost:8080');
await client.connect();
await client.joinRoom('room-id', 'Project Name');
client.sendMidiChanges(changes);
client.sendAutomationChanges(changes);
client.on('midi-change', (msg) => { /* handle */ });
client.disconnect();
```

### FileMonitor
```javascript
const monitor = new FileMonitor('./watch-dir', parser);
monitor.start();
monitor.on('change', (data) => { /* handle */ });
monitor.stop();
```

## Message Protocol

### Join Room
```javascript
{ type: 'join-room', roomId: 'id', projectName: 'name' }
```

### MIDI Change
```javascript
{ 
  type: 'midi-change',
  roomId: 'id',
  changes: { added: [], modified: [], removed: [] }
}
```

### Automation Change
```javascript
{
  type: 'automation-change',
  roomId: 'id',
  changes: { added: [], modified: [], removed: [] }
}
```

## Environment Variables

```bash
SERVER_PORT=8080
SERVER_HOST=localhost
WATCH_DIRECTORY=./reaper-projects
WS_HEARTBEAT_INTERVAL=30000
LOG_LEVEL=info
```

## File Structure

```
src/
├── parser/rpp-parser.js          # Parse RPP files
├── server/websocket-server.js    # WebSocket server
├── client/websocket-client.js    # WebSocket client
├── utils/
│   ├── file-monitor.js           # File watching
│   └── operational-transform.js  # Conflict resolution
├── reascript/collab-integration.lua  # Reaper integration
└── index.js                      # Main entry
```

## Common Tasks

### Add New Message Type
1. Add handler in `websocket-server.js`
2. Add sender method in `websocket-client.js`
3. Update protocol documentation

### Extend Parser
1. Modify `rpp-parser.js` parse method
2. Add extraction method if needed
3. Test with sample RPP files

### Create Custom Client
```javascript
const { CollaborationClient } = require('./src/index');
const client = new CollaborationClient('ws://server:8080');

client.on('midi-change', (msg) => {
  // Custom MIDI change handling
});

await client.connect();
await client.joinRoom('my-room', 'My Project');
```

## Troubleshooting

### Port Already in Use
```bash
SERVER_PORT=3000 npm run server
```

### Connection Issues
- Check firewall settings
- Verify server is running
- Ensure correct server URL

### File Monitoring Not Working
- Check WATCH_DIRECTORY path
- Verify file permissions
- Ensure RPP files exist

## Links

- [Full API Documentation](docs/API.md)
- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Examples](examples/README.md)
- [Contributing](CONTRIBUTING.md)
