# Examples

This directory contains example scripts demonstrating how to use the Reaper MIDI & Automation Collaboration System.

## Available Examples

### 1. Parser Demo (`parser-demo.js`)

Demonstrates how to use the RPP parser to extract MIDI and automation data.

**Run:**
```bash
node examples/parser-demo.js
```

**What it does:**
- Parses a sample RPP file
- Extracts MIDI items and automation envelopes
- Demonstrates change detection

### 2. Basic Server (`basic-server.js`)

Shows how to set up a collaboration server with statistics monitoring.

**Run:**
```bash
node examples/basic-server.js
```

**What it does:**
- Starts a WebSocket server on port 8080
- Logs server statistics every 10 seconds
- Displays connected clients and active rooms

### 3. Basic Client (`basic-client.js`)

Demonstrates how to create a collaboration client.

**Run:**
```bash
node examples/basic-client.js
```

**What it does:**
- Connects to the collaboration server
- Joins a room
- Listens for changes from other clients
- Sends test MIDI changes

## Running Multiple Clients

To test collaboration between multiple clients:

**Terminal 1 - Server:**
```bash
node examples/basic-server.js
```

**Terminal 2 - Client 1:**
```bash
node examples/basic-client.js
```

**Terminal 3 - Client 2:**
```bash
node examples/basic-client.js
```

You should see clients joining and receiving changes from each other.

## Sample Project

`sample-project.RPP` is a minimal Reaper project file containing:
- 2 MIDI tracks
- MIDI items with note data
- Volume and pan automation envelopes

This file is used by the parser demo to demonstrate parsing capabilities.

## Customizing Examples

All examples can be modified to suit your needs:

- Change server URL in client examples
- Adjust room IDs for different collaboration sessions
- Modify the sample RPP file to test different scenarios
- Add your own event handlers for custom functionality

## Next Steps

After exploring these examples:

1. Review the [API Documentation](../docs/API.md)
2. Read the [Setup Guide](../docs/SETUP.md)
3. Check the [Architecture Documentation](../docs/ARCHITECTURE.md)
4. Start building your own integration!
