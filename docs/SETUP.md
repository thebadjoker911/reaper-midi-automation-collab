# Setup and Installation Guide

## Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn package manager
- Reaper DAW (for ReaScript integration)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/thebadjoker911/reaper-midi-automation-collab.git
cd reaper-midi-automation-collab
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example environment file and adjust settings:

```bash
cp .env.example .env
```

Edit `.env` to configure:
- Server port
- Watch directory for Reaper projects
- WebSocket settings

### 4. Create Project Directory

Create a directory for your Reaper projects (if not already exists):

```bash
mkdir -p ./reaper-projects
```

## Running the System

### Option 1: Run Server and Client Separately

**Terminal 1 - Start the Server:**
```bash
npm run server
```

**Terminal 2 - Start the Client:**
```bash
npm run client
```

Or with custom parameters:
```bash
node src/index.js client ws://localhost:8080 my-room "My Project Name"
```

### Option 2: Run from Main Entry Point

**Start Server:**
```bash
node src/index.js server
```

**Start Client:**
```bash
node src/index.js client [serverUrl] [roomId] [projectName]
```

## ReaScript Integration

### Installing the ReaScript

1. Locate your Reaper Scripts folder:
   - Windows: `%APPDATA%\REAPER\Scripts`
   - macOS: `~/Library/Application Support/REAPER/Scripts`
   - Linux: `~/.config/REAPER/Scripts`

2. Copy the ReaScript file:
   ```bash
   cp src/reascript/collab-integration.lua [REAPER_SCRIPTS_FOLDER]/
   ```

3. Load the script in Reaper:
   - Open Reaper
   - Go to `Actions` → `Show action list`
   - Click `New action` → `Load ReaScript`
   - Select `collab-integration.lua`

4. (Optional) Assign a keyboard shortcut to the script for easy access

### Using the ReaScript

Once loaded, the script will:
- Automatically monitor MIDI and automation changes
- Write current state to bridge files
- Read incoming changes from collaborators
- Update your project in real-time

## Quick Start Example

### Scenario: Two Users Collaborating on a Project

**User 1 (Server Host):**

1. Start the server:
   ```bash
   npm run server
   ```

2. Start the client:
   ```bash
   node src/index.js client ws://localhost:8080 collab-session "Shared Project"
   ```

3. Load the ReaScript in Reaper
4. Open your Reaper project
5. Make changes to MIDI or automation

**User 2 (Remote Collaborator):**

1. Connect to User 1's server (replace with actual IP):
   ```bash
   node src/index.js client ws://192.168.1.100:8080 collab-session "Shared Project"
   ```

2. Load the ReaScript in Reaper
3. Open your Reaper project
4. You should see changes from User 1 appear in real-time

## Troubleshooting

### Server Won't Start

- Check if port 8080 is already in use
- Try a different port: `SERVER_PORT=3000 npm run server`
- Check firewall settings

### Client Can't Connect

- Verify server is running
- Check server URL and port
- Ensure firewall allows WebSocket connections
- For remote connections, check network configuration

### File Monitoring Not Working

- Verify `WATCH_DIRECTORY` points to correct folder
- Check folder permissions
- Ensure RPP files are in the watched directory

### ReaScript Issues

- Verify script is in correct Scripts folder
- Check Reaper console for error messages
- Ensure bridge file paths are accessible

## Development Mode

For development with auto-reload:

```bash
# Install nodemon globally
npm install -g nodemon

# Run server with auto-reload
nodemon src/index.js server

# Run client with auto-reload
nodemon src/index.js client
```

## Testing

Currently, tests are not implemented. To test manually:

1. Start server
2. Start two or more clients
3. Make changes in one client's Reaper project
4. Verify changes appear in other clients' consoles

## Next Steps

- Read the [API Documentation](./API.md) for detailed API reference
- Check [Architecture Documentation](./ARCHITECTURE.md) for system design
- Review example projects in the `examples/` folder (if available)

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review server/client logs for error messages
3. Open an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - System information (OS, Node version, Reaper version)
