/**
 * Example: Basic Server Setup
 * 
 * This example shows how to set up a basic collaboration server
 */

const { CollaborationServer } = require('../src/index');

// Create server instance
const server = new CollaborationServer(8080);

// Start the server
server.start();

// Log server stats every 10 seconds
setInterval(() => {
  const stats = server.getStats();
  console.log('\n=== Server Statistics ===');
  console.log(`Connected clients: ${stats.connectedClients}`);
  console.log(`Active rooms: ${stats.activeRooms}`);
  
  if (stats.rooms.length > 0) {
    console.log('\nActive Rooms:');
    stats.rooms.forEach(room => {
      console.log(`  📁 ${room.projectName}`);
      console.log(`     Room ID: ${room.id}`);
      console.log(`     Clients: ${room.clientCount}`);
    });
  }
  console.log('========================\n');
}, 10000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.stop();
  process.exit(0);
});

console.log('🚀 Collaboration server started on port 8080');
console.log('📊 Stats will be displayed every 10 seconds');
console.log('Press Ctrl+C to stop\n');
