# API Documentation

## Overview

The Reaper MIDI & Automation Collaboration System provides real-time collaborative editing for Reaper DAW projects, focusing on MIDI data and automation envelopes.

## Architecture

### Components

1. **RPP Parser** (`src/parser/rpp-parser.js`)
   - Parses Reaper Project files
   - Extracts MIDI and automation data
   - Detects changes between project states

2. **File Monitor** (`src/utils/file-monitor.js`)
   - Watches for file changes using chokidar
   - Triggers parsing on file updates
   - Manages file state cache

3. **WebSocket Server** (`src/server/websocket-server.js`)
   - Handles client connections
   - Manages collaboration rooms
   - Broadcasts changes to clients

4. **WebSocket Client** (`src/client/websocket-client.js`)
   - Connects to collaboration server
   - Sends/receives real-time updates
   - Auto-reconnection support

5. **Operational Transform** (`src/utils/operational-transform.js`)
   - Resolves concurrent edit conflicts
   - Transforms operations for consistency
   - Applies operations to state

6. **ReaScript Integration** (`src/reascript/collab-integration.lua`)
   - Integrates with Reaper API
   - Extracts MIDI/automation data
   - Applies changes from collaborators

## Usage

### Starting the Server

```bash
# Start the collaboration server
npm run server

# Or with custom port
SERVER_PORT=3000 npm run server
```

### Starting a Client

```bash
# Start a client and join a room
node src/index.js client ws://localhost:8080 my-room "My Project"

# Or use the npm script
npm run client
```

### ReaScript Setup

1. Copy `src/reascript/collab-integration.lua` to your Reaper Scripts folder
2. Load the script in Reaper: Actions > Show action list > Load ReaScript
3. The script will automatically sync MIDI and automation data

## API Reference

### RPPParser

#### `parse(content)`
Parses RPP file content and extracts project data.

**Parameters:**
- `content` (string): Raw RPP file content

**Returns:** Object with tracks, MIDI items, and automation envelopes

#### `extractMidiData(project)`
Extracts only MIDI data from parsed project.

**Parameters:**
- `project` (Object): Parsed project data

**Returns:** Array of MIDI items

#### `extractAutomationData(project)`
Extracts only automation data from parsed project.

**Parameters:**
- `project` (Object): Parsed project data

**Returns:** Array of automation envelopes

#### `detectChanges(oldProject, newProject)`
Detects changes between two project states.

**Parameters:**
- `oldProject` (Object): Previous project state
- `newProject` (Object): Current project state

**Returns:** Object with detected changes

### CollaborationServer

#### `start()`
Starts the WebSocket server.

#### `stop()`
Stops the WebSocket server.

#### `getStats()`
Returns server statistics including connected clients and active rooms.

**Returns:** Object with server stats

### CollaborationClient

#### `connect()`
Connects to the WebSocket server.

**Returns:** Promise that resolves with connection data

#### `disconnect()`
Disconnects from the WebSocket server.

#### `joinRoom(roomId, projectName)`
Joins a collaboration room.

**Parameters:**
- `roomId` (string): Room identifier
- `projectName` (string): Project name

**Returns:** Promise that resolves when joined

#### `leaveRoom()`
Leaves the current room.

#### `sendMidiChanges(changes)`
Sends MIDI changes to other clients.

**Parameters:**
- `changes` (Object): MIDI changes to broadcast

#### `sendAutomationChanges(changes)`
Sends automation changes to other clients.

**Parameters:**
- `changes` (Object): Automation changes to broadcast

#### `requestSync()`
Requests full sync with current room state.

### Events

#### Client Events

- `connected`: Fired when connected to server
- `disconnected`: Fired when disconnected from server
- `room-joined`: Fired when joined a room
- `client-joined`: Fired when another client joins the room
- `client-left`: Fired when another client leaves the room
- `midi-change`: Fired when MIDI changes are received
- `automation-change`: Fired when automation changes are received
- `error`: Fired on errors

**Example:**
```javascript
client.on('midi-change', (message) => {
  console.log('MIDI changes:', message.changes);
});
```

### FileMonitor

#### `start(options)`
Starts monitoring files.

**Parameters:**
- `options` (Object): Chokidar watcher options

#### `stop()`
Stops monitoring files.

#### `on(event, callback)`
Registers event listener.

**Parameters:**
- `event` (string): Event type ('add', 'change', 'remove', 'error')
- `callback` (Function): Event handler

#### Events

- `add`: File added
- `change`: File changed
- `remove`: File removed
- `error`: Error occurred

### OperationalTransform

#### `transform(op1, op2)`
Transforms two concurrent operations.

**Parameters:**
- `op1` (Object): First operation
- `op2` (Object): Second operation

**Returns:** Array of transformed operations [op1', op2']

#### `apply(state, operation)`
Applies an operation to a state.

**Parameters:**
- `state` (Object): Current state
- `operation` (Object): Operation to apply

**Returns:** New state after applying operation

## Message Protocol

### Client to Server

#### Join Room
```json
{
  "type": "join-room",
  "roomId": "room-id",
  "projectName": "Project Name"
}
```

#### Leave Room
```json
{
  "type": "leave-room",
  "roomId": "room-id"
}
```

#### MIDI Change
```json
{
  "type": "midi-change",
  "roomId": "room-id",
  "changes": {
    "added": [...],
    "modified": [...],
    "removed": [...]
  }
}
```

#### Automation Change
```json
{
  "type": "automation-change",
  "roomId": "room-id",
  "changes": {
    "added": [...],
    "modified": [...],
    "removed": [...]
  }
}
```

### Server to Client

#### Connected
```json
{
  "type": "connected",
  "clientId": "client-id",
  "timestamp": 1234567890
}
```

#### Room Joined
```json
{
  "type": "room-joined",
  "roomId": "room-id",
  "clients": ["client1", "client2"],
  "state": {...},
  "timestamp": 1234567890
}
```

#### Client Joined
```json
{
  "type": "client-joined",
  "clientId": "client-id",
  "timestamp": 1234567890
}
```

#### Client Left
```json
{
  "type": "client-left",
  "clientId": "client-id",
  "timestamp": 1234567890
}
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
SERVER_PORT=8080
SERVER_HOST=localhost

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_PAYLOAD=10485760

# File Monitoring
WATCH_DIRECTORY=./reaper-projects
WATCH_POLL_INTERVAL=1000

# Logging
LOG_LEVEL=info
```

## Error Handling

All modules implement proper error handling:

- WebSocket disconnections trigger auto-reconnection
- File monitoring errors are logged and emitted as events
- Invalid messages are caught and logged
- Operational transform handles edge cases

## Performance Considerations

- File monitoring uses debouncing to avoid excessive parsing
- WebSocket heartbeat keeps connections alive
- Operations are transformed efficiently using OT algorithms
- State is cached to enable fast change detection
