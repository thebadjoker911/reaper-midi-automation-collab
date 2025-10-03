/**
 * WebSocket Client Module
 * Connects to collaboration server and handles real-time updates
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class CollaborationClient extends EventEmitter {
  constructor(serverUrl = 'ws://localhost:8080', options = {}) {
    super();
    this.serverUrl = serverUrl;
    this.options = options;
    this.ws = null;
    this.clientId = null;
    this.currentRoom = null;
    this.reconnectInterval = 5000;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl, this.options);

        this.ws.on('open', () => {
          console.log('Connected to collaboration server');
          this.reconnectAttempts = 0;
          this.setupHeartbeat();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(data);
        });

        this.ws.on('close', () => {
          console.log('Disconnected from collaboration server');
          this.emit('disconnected');
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });

        // Resolve when we receive the connected message
        this.once('connected', (data) => {
          this.clientId = data.clientId;
          resolve(data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Handle incoming messages
   * @param {Buffer|string} data - Message data
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      // Emit specific event types
      this.emit(message.type, message);
      
      // Also emit a general message event
      this.emit('message', message);

    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Join a collaboration room
   * @param {string} roomId - Room ID
   * @param {string} projectName - Project name
   */
  joinRoom(roomId, projectName) {
    return new Promise((resolve) => {
      this.send({
        type: 'join-room',
        roomId,
        projectName
      });

      this.once('room-joined', (data) => {
        this.currentRoom = roomId;
        resolve(data);
      });
    });
  }

  /**
   * Leave the current room
   */
  leaveRoom() {
    if (this.currentRoom) {
      this.send({
        type: 'leave-room',
        roomId: this.currentRoom
      });
      this.currentRoom = null;
    }
  }

  /**
   * Send MIDI changes to the server
   * @param {Object} changes - MIDI changes
   */
  sendMidiChanges(changes) {
    if (!this.currentRoom) {
      console.warn('Not in a room. Cannot send MIDI changes.');
      return;
    }

    this.send({
      type: 'midi-change',
      roomId: this.currentRoom,
      changes
    });
  }

  /**
   * Send automation changes to the server
   * @param {Object} changes - Automation changes
   */
  sendAutomationChanges(changes) {
    if (!this.currentRoom) {
      console.warn('Not in a room. Cannot send automation changes.');
      return;
    }

    this.send({
      type: 'automation-change',
      roomId: this.currentRoom,
      changes
    });
  }

  /**
   * Request sync with current room state
   */
  requestSync() {
    if (!this.currentRoom) {
      console.warn('Not in a room. Cannot request sync.');
      return;
    }

    this.send({
      type: 'sync-request',
      roomId: this.currentRoom
    });
  }

  /**
   * Send a message to the server
   * @param {Object} message - Message to send
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected. Cannot send message.');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  /**
   * Attempt to reconnect to the server
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('max-reconnect-attempts');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.reconnectInterval);
  }

  /**
   * Set up heartbeat mechanism
   */
  setupHeartbeat() {
    const heartbeatInterval = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        clearInterval(heartbeatInterval);
        return;
      }
      this.ws.ping();
    }, 30000);

    if (this.ws) {
      this.ws.on('close', () => {
        clearInterval(heartbeatInterval);
      });
    }
  }

  /**
   * Check if client is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get client ID
   * @returns {string|null} Client ID
   */
  getClientId() {
    return this.clientId;
  }

  /**
   * Get current room ID
   * @returns {string|null} Room ID
   */
  getCurrentRoom() {
    return this.currentRoom;
  }
}

module.exports = CollaborationClient;
