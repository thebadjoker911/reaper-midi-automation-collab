# Real-Time Reaper MIDI & Automation Collaboration System

A real-time collaborative editing system for Reaper DAW projects, enabling multiple users to work on MIDI data and automation envelopes simultaneously - similar to how Google Docs handles collaborative text editing.

## Features

✅ **Real-Time Synchronization**: Changes appear instantly across all connected clients
✅ **MIDI Collaboration**: Share MIDI note edits, velocities, and timing
✅ **Automation Sharing**: Collaborate on volume, pan, and parameter automation
✅ **Conflict Resolution**: Operational Transform algorithms prevent editing conflicts
✅ **Cross-Platform**: Works on Windows, macOS, and Linux
✅ **ReaScript Integration**: Direct integration with Reaper DAW via Lua scripts
✅ **Low Latency**: Optimized for fast local network performance

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/thebadjoker911/reaper-midi-automation-collab.git
cd reaper-midi-automation-collab

# Install dependencies
npm install
```

### Basic Usage

**Start the server:**
```bash
npm run server
```

**Connect a client:**
```bash
npm run client
```

Or with custom parameters:
```bash
node src/index.js client ws://localhost:8080 my-room "My Project"
```

## Documentation

- 📘 [Setup Guide](docs/SETUP.md) - Installation and configuration
- 📗 [API Reference](docs/API.md) - Detailed API documentation
- 📕 [Architecture](docs/ARCHITECTURE.md) - System design and data flow

## Architecture Overview

The system consists of several key components:

- **RPP Parser**: Extracts MIDI and automation data from Reaper project files
- **File Monitor**: Watches for changes in project files
- **WebSocket Server**: Central hub for real-time communication
- **WebSocket Client**: Connects to server and handles updates
- **Operational Transform**: Resolves concurrent editing conflicts
- **ReaScript Integration**: Bridges Node.js with Reaper API

## Project Structure

```
reaper-midi-automation-collab/
├── src/
│   ├── parser/           # RPP file parsing
│   ├── server/           # WebSocket server
│   ├── client/           # WebSocket client
│   ├── utils/            # File monitoring, OT algorithms
│   ├── reascript/        # Lua scripts for Reaper
│   └── index.js          # Main entry point
├── docs/                 # Documentation
├── examples/             # Example projects
└── package.json          # Project configuration
```

## How It Works

1. **Local Changes**: User edits MIDI or automation in Reaper
2. **Detection**: File monitor detects the change
3. **Parsing**: RPP parser extracts the modifications
4. **Broadcasting**: Client sends changes to WebSocket server
5. **Distribution**: Server broadcasts to all clients in the room
6. **Application**: Other clients apply changes via ReaScript
7. **Conflict Resolution**: Operational Transform ensures consistency

## Technical Requirements

- **Selective RPP parser** for MIDI and automation
- **Real-time change detection** and serialization
- **WebSocket communication** for data exchange
- **Operational Transform** conflict resolution algorithms
- **ReaScript integration** with Reaper API

## Development Status

### ✅ Completed
- [x] Project structure and configuration
- [x] RPP parser with MIDI and automation extraction
- [x] File monitoring system
- [x] WebSocket server with room management
- [x] WebSocket client with auto-reconnection
- [x] Operational Transform implementation
- [x] ReaScript integration script
- [x] Comprehensive documentation

### 🚧 Future Enhancements
- [ ] User authentication and authorization
- [ ] Persistent state with database
- [ ] WebSocket Secure (WSS) for encryption
- [ ] Compression for large projects
- [ ] Visual collaboration UI
- [ ] Project history and version control
- [ ] Unit and integration tests

## Configuration

Configure the system via `.env` file:

```bash
# Server Configuration
SERVER_PORT=8080
SERVER_HOST=localhost

# File Monitoring
WATCH_DIRECTORY=./reaper-projects

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
```

See `.env.example` for all available options.

## Examples

### Starting a Collaboration Session

**Server (Host):**
```bash
npm run server
```

**Client 1:**
```bash
node src/index.js client ws://localhost:8080 session-1 "My Song"
```

**Client 2:**
```bash
node src/index.js client ws://localhost:8080 session-1 "My Song"
```

Now both clients can edit the same project in real-time!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Reaper DAW for providing a scriptable API
- WebSocket protocol for real-time communication
- Operational Transform research for conflict resolution algorithms
