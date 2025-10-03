/**
 * WebSocket Server Module
 * Handles real-time communication between clients
 */

const WebSocket = require('ws');

class CollaborationServer {
  constructor(port = 8080, options = {}) {
    this.port = port;
    this.options = options;
    this.server = null;
    this.clients = new Map();
    this.rooms = new Map();
  }

  /**
   * Start the WebSocket server
   */
  start() {
    this.server = new WebSocket.Server({ 
      port: this.port,
      ...this.options 
    });

    this.server.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    this.server.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    console.log(`WebSocket server started on port ${this.port}`);
  }

  /**
   * Stop the WebSocket server
   */
  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('WebSocket server stopped');
      });
      this.server = null;
    }
  }

  /**
   * Handle new client connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} req - HTTP request
   */
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ws,
      rooms: new Set(),
      connectedAt: Date.now(),
      ip: req.socket.remoteAddress
    };

    this.clients.set(clientId, clientInfo);
    console.log(`Client connected: ${clientId} from ${clientInfo.ip}`);

    // Set up message handler
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    // Set up close handler
    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    // Set up error handler
    ws.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      clientId,
      timestamp: Date.now()
    });

    // Set up heartbeat
    this.setupHeartbeat(ws);
  }

  /**
   * Handle incoming messages from clients
   * @param {string} clientId - Client ID
   * @param {Buffer|string} data - Message data
   */
  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Message from ${clientId}:`, message.type);

      switch (message.type) {
      case 'join-room':
        this.handleJoinRoom(clientId, message);
        break;
      case 'leave-room':
        this.handleLeaveRoom(clientId, message);
        break;
      case 'midi-change':
        this.handleMidiChange(clientId, message);
        break;
      case 'automation-change':
        this.handleAutomationChange(clientId, message);
        break;
      case 'sync-request':
        this.handleSyncRequest(clientId, message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error handling message from ${clientId}:`, error);
    }
  }

  /**
   * Handle client disconnection
   * @param {string} clientId - Client ID
   */
  handleDisconnect(clientId) {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo) return;

    // Remove client from all rooms
    clientInfo.rooms.forEach(roomId => {
      this.removeClientFromRoom(clientId, roomId);
    });

    this.clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  }

  /**
   * Handle join room request
   * @param {string} clientId - Client ID
   * @param {Object} message - Message data
   */
  handleJoinRoom(clientId, message) {
    const { roomId, projectName } = message;
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        projectName,
        clients: new Set(),
        state: null,
        createdAt: Date.now()
      });
    }

    const room = this.rooms.get(roomId);
    room.clients.add(clientId);

    const clientInfo = this.clients.get(clientId);
    if (clientInfo) {
      clientInfo.rooms.add(roomId);
    }

    // Notify other clients in the room
    this.broadcastToRoom(roomId, {
      type: 'client-joined',
      clientId,
      timestamp: Date.now()
    }, clientId);

    // Send current room state to the new client
    this.sendToClient(clientId, {
      type: 'room-joined',
      roomId,
      clients: Array.from(room.clients),
      state: room.state,
      timestamp: Date.now()
    });

    console.log(`Client ${clientId} joined room ${roomId}`);
  }

  /**
   * Handle leave room request
   * @param {string} clientId - Client ID
   * @param {Object} message - Message data
   */
  handleLeaveRoom(clientId, message) {
    const { roomId } = message;
    this.removeClientFromRoom(clientId, roomId);
  }

  /**
   * Remove client from a room
   * @param {string} clientId - Client ID
   * @param {string} roomId - Room ID
   */
  removeClientFromRoom(clientId, roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.delete(clientId);

    const clientInfo = this.clients.get(clientId);
    if (clientInfo) {
      clientInfo.rooms.delete(roomId);
    }

    // Notify other clients
    this.broadcastToRoom(roomId, {
      type: 'client-left',
      clientId,
      timestamp: Date.now()
    });

    // Clean up empty rooms
    if (room.clients.size === 0) {
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }

    console.log(`Client ${clientId} left room ${roomId}`);
  }

  /**
   * Handle MIDI change
   * @param {string} clientId - Client ID
   * @param {Object} message - Message data
   */
  handleMidiChange(clientId, message) {
    const { roomId, changes } = message;
    
    // Broadcast to other clients in the room
    this.broadcastToRoom(roomId, {
      type: 'midi-change',
      clientId,
      changes,
      timestamp: Date.now()
    }, clientId);
  }

  /**
   * Handle automation change
   * @param {string} clientId - Client ID
   * @param {Object} message - Message data
   */
  handleAutomationChange(clientId, message) {
    const { roomId, changes } = message;
    
    // Broadcast to other clients in the room
    this.broadcastToRoom(roomId, {
      type: 'automation-change',
      clientId,
      changes,
      timestamp: Date.now()
    }, clientId);
  }

  /**
   * Handle sync request
   * @param {string} clientId - Client ID
   * @param {Object} message - Message data
   */
  handleSyncRequest(clientId, message) {
    const { roomId } = message;
    const room = this.rooms.get(roomId);
    
    if (room && room.state) {
      this.sendToClient(clientId, {
        type: 'sync-response',
        state: room.state,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Send message to a specific client
   * @param {string} clientId - Client ID
   * @param {Object} message - Message to send
   */
  sendToClient(clientId, message) {
    const clientInfo = this.clients.get(clientId);
    if (!clientInfo || clientInfo.ws.readyState !== WebSocket.OPEN) return;

    try {
      clientInfo.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
    }
  }

  /**
   * Broadcast message to all clients in a room
   * @param {string} roomId - Room ID
   * @param {Object} message - Message to broadcast
   * @param {string} excludeClientId - Client ID to exclude from broadcast
   */
  broadcastToRoom(roomId, message, excludeClientId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.clients.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * Set up heartbeat for a WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   */
  setupHeartbeat(ws) {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    const interval = setInterval(() => {
      if (ws.isAlive === false) {
        clearInterval(interval);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('close', () => {
      clearInterval(interval);
    });
  }

  /**
   * Generate unique client ID
   * @returns {string} Client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server statistics
   * @returns {Object} Server stats
   */
  getStats() {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      rooms: Array.from(this.rooms.values()).map(room => ({
        id: room.id,
        projectName: room.projectName,
        clientCount: room.clients.size
      }))
    };
  }
}

module.exports = CollaborationServer;
