/**
 * Example: Basic Client Setup
 * 
 * This example shows how to set up a collaboration client
 */

const { CollaborationClient, RPPParser } = require('../src/index');

async function main() {
  // Configuration
  const SERVER_URL = 'ws://localhost:8080';
  const ROOM_ID = 'example-room';
  const PROJECT_NAME = 'Example Project';

  // Create client and parser
  const client = new CollaborationClient(SERVER_URL);
  const parser = new RPPParser();

  try {
    // Connect to server
    console.log('🔌 Connecting to server...');
    await client.connect();
    console.log(`✅ Connected as client ${client.getClientId()}`);

    // Join a room
    console.log(`🚪 Joining room: ${ROOM_ID}...`);
    const roomData = await client.joinRoom(ROOM_ID, PROJECT_NAME);
    console.log(`✅ Joined room with ${roomData.clients.length} client(s)`);

    // Listen for other clients joining
    client.on('client-joined', (message) => {
      console.log(`👋 Client ${message.clientId} joined the room`);
    });

    // Listen for other clients leaving
    client.on('client-left', (message) => {
      console.log(`👋 Client ${message.clientId} left the room`);
    });

    // Listen for MIDI changes
    client.on('midi-change', (message) => {
      console.log(`🎹 MIDI changes from ${message.clientId}:`);
      console.log(JSON.stringify(message.changes, null, 2));
    });

    // Listen for automation changes
    client.on('automation-change', (message) => {
      console.log(`🎚️  Automation changes from ${message.clientId}:`);
      console.log(JSON.stringify(message.changes, null, 2));
    });

    // Simulate sending some changes after 5 seconds
    setTimeout(() => {
      console.log('\n📤 Sending test MIDI change...');
      client.sendMidiChanges({
        added: [{
          index: 0,
          data: {
            position: 0,
            length: 4,
            events: [
              { position: 0, type: '90', data: '3c 60' }
            ]
          }
        }],
        modified: [],
        removed: []
      });
    }, 5000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Disconnecting...');
      client.leaveRoom();
      client.disconnect();
      process.exit(0);
    });

    console.log('\n✨ Client is running. Press Ctrl+C to stop\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
