/**
 * File Monitor Module
 * Monitors RPP files for changes using chokidar
 */

const chokidar = require('chokidar');
const fs = require('fs').promises;
const path = require('path');

class FileMonitor {
  constructor(watchDirectory, parser) {
    this.watchDirectory = watchDirectory;
    this.parser = parser;
    this.watcher = null;
    this.fileStates = new Map();
    this.listeners = new Map();
  }

  /**
   * Start monitoring files
   * @param {Object} options - Watcher options
   */
  start(options = {}) {
    const defaultOptions = {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      },
      ...options
    };

    this.watcher = chokidar.watch(
      path.join(this.watchDirectory, '**/*.RPP'),
      defaultOptions
    );

    this.watcher
      .on('add', filepath => this.handleFileAdd(filepath))
      .on('change', filepath => this.handleFileChange(filepath))
      .on('unlink', filepath => this.handleFileRemove(filepath))
      .on('error', error => this.handleError(error));

    console.log(`Monitoring directory: ${this.watchDirectory}`);
  }

  /**
   * Stop monitoring files
   */
  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('File monitoring stopped');
    }
  }

  /**
   * Register a listener for file changes
   * @param {string} event - Event type ('add', 'change', 'remove', 'error')
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} event - Event type
   * @param {*} data - Event data
   */
  emit(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(callback => callback(data));
  }

  /**
   * Handle file addition
   * @param {string} filepath - File path
   */
  async handleFileAdd(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const parsed = this.parser.parse(content);
      
      this.fileStates.set(filepath, {
        content,
        parsed,
        lastModified: Date.now()
      });

      this.emit('add', {
        filepath,
        parsed,
        timestamp: Date.now()
      });

      console.log(`File added: ${filepath}`);
    } catch (error) {
      this.handleError({ filepath, error });
    }
  }

  /**
   * Handle file changes
   * @param {string} filepath - File path
   */
  async handleFileChange(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const parsed = this.parser.parse(content);
      
      const oldState = this.fileStates.get(filepath);
      const changes = oldState 
        ? this.parser.detectChanges(oldState.parsed, parsed)
        : null;

      this.fileStates.set(filepath, {
        content,
        parsed,
        lastModified: Date.now()
      });

      this.emit('change', {
        filepath,
        parsed,
        changes,
        timestamp: Date.now()
      });

      console.log(`File changed: ${filepath}`);
    } catch (error) {
      this.handleError({ filepath, error });
    }
  }

  /**
   * Handle file removal
   * @param {string} filepath - File path
   */
  handleFileRemove(filepath) {
    const oldState = this.fileStates.get(filepath);
    this.fileStates.delete(filepath);

    this.emit('remove', {
      filepath,
      oldState,
      timestamp: Date.now()
    });

    console.log(`File removed: ${filepath}`);
  }

  /**
   * Handle errors
   * @param {Object} errorData - Error data
   */
  handleError(errorData) {
    console.error('File monitor error:', errorData);
    this.emit('error', errorData);
  }

  /**
   * Get current state of a file
   * @param {string} filepath - File path
   * @returns {Object|null} File state
   */
  getFileState(filepath) {
    return this.fileStates.get(filepath) || null;
  }
}

module.exports = FileMonitor;
