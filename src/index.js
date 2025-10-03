/**
 * Main Entry Point
 * Reaper MIDI & Automation Collaboration System
 */

const CollaborationServer = require('./server/websocket-server');
const CollaborationClient = require('./client/websocket-client');
const RPPParser = require('./parser/rpp-parser');
const FileMonitor = require('./utils/file-monitor');
const OperationalTransform = require('./utils/operational-transform');

// Configuration
const PORT = process.env.SERVER_PORT || 8080;
const WATCH_DIR = process.env.WATCH_DIRECTORY || './reaper-projects';

/**
 * Start the collaboration server
 */
function startServer() {
  const server = new CollaborationServer(PORT);
  server.start();

  // Log server stats periodically
  setInterval(() => {
    const stats = server.getStats();
    console.log('\n--- Server Stats ---');
    console.log(`Connected clients: ${stats.connectedClients}`);
    console.log(`Active rooms: ${stats.activeRooms}`);
    if (stats.rooms.length > 0) {
      console.log('Rooms:');
      stats.rooms.forEach(room => {
        console.log(`  - ${room.projectName} (${room.clientCount} clients)`);
      });
    }
    console.log('-------------------\n');
  }, 60000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.stop();
    process.exit(0);
  });

  return server;
}

/**
 * Start a client with file monitoring
 * @param {string} serverUrl - Server URL
 * @param {string} roomId - Room ID to join
 * @param {string} projectName - Project name
 */
async function startClient(serverUrl, roomId, projectName) {
  const client = new CollaborationClient(serverUrl);
  const parser = new RPPParser();
  const fileMonitor = new FileMonitor(WATCH_DIR, parser);
  // const ot = new OperationalTransform(); // Reserved for future use

  try {
    // Connect to server
    await client.connect();
    console.log(`Connected as client ${client.getClientId()}`);

    // Join room
    await client.joinRoom(roomId, projectName);
    console.log(`Joined room: ${roomId}`);

    // Set up file monitoring
    fileMonitor.on('change', (data) => {
      console.log(`File changed: ${data.filepath}`);
      
      if (data.changes) {
        // Send MIDI changes
        if (data.changes.midi && 
            (data.changes.midi.added.length > 0 || 
             data.changes.midi.modified.length > 0 || 
             data.changes.midi.removed.length > 0)) {
          client.sendMidiChanges(data.changes.midi);
        }

        // Send automation changes
        if (data.changes.automation && 
            (data.changes.automation.added.length > 0 || 
             data.changes.automation.modified.length > 0 || 
             data.changes.automation.removed.length > 0)) {
          client.sendAutomationChanges(data.changes.automation);
        }
      }
    });

    // Handle incoming MIDI changes
    client.on('midi-change', (message) => {
      console.log(`Received MIDI changes from client ${message.clientId}`);
      // Apply changes locally (would integrate with ReaScript)
    });

    // Handle incoming automation changes
    client.on('automation-change', (message) => {
      console.log(`Received automation changes from client ${message.clientId}`);
      // Apply changes locally (would integrate with ReaScript)
    });

    // Start file monitoring
    fileMonitor.start();
    console.log(`Monitoring directory: ${WATCH_DIR}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down client...');
      await fileMonitor.stop();
      client.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('Error starting client:', error);
    process.exit(1);
  }
}

// Command line interface
const args = process.argv.slice(2);
const mode = args[0];

if (mode === 'server') {
  console.log('Starting collaboration server...');
  startServer();
} else if (mode === 'client') {
  const serverUrl = args[1] || 'ws://localhost:8080';
  const roomId = args[2] || 'default-room';
  const projectName = args[3] || 'My Project';
  
  console.log('Starting collaboration client...');
  startClient(serverUrl, roomId, projectName);
} else {
  console.log('Usage:');
  console.log('  node src/index.js server');
  console.log('  node src/index.js client [serverUrl] [roomId] [projectName]');
  console.log('\nExamples:');
  console.log('  node src/index.js server');
  console.log('  node src/index.js client ws://localhost:8080 my-room "My Project"');
}

module.exports = {
  startServer,
  startClient,
  CollaborationServer,
  CollaborationClient,
  RPPParser,
  FileMonitor,
  OperationalTransform
};
