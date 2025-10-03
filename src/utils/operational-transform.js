/**
 * Operational Transform Module
 * Handles conflict resolution for concurrent edits
 */

class OperationalTransform {
  /**
   * Transform two concurrent operations
   * @param {Object} op1 - First operation
   * @param {Object} op2 - Second operation
   * @returns {Array} Transformed operations [op1', op2']
   */
  transform(op1, op2) {
    // Handle MIDI operations
    if (op1.type === 'midi' && op2.type === 'midi') {
      return this.transformMidi(op1, op2);
    }

    // Handle automation operations
    if (op1.type === 'automation' && op2.type === 'automation') {
      return this.transformAutomation(op1, op2);
    }

    // Different types don't conflict
    return [op1, op2];
  }

  /**
   * Transform MIDI operations
   * @param {Object} op1 - First MIDI operation
   * @param {Object} op2 - Second MIDI operation
   * @returns {Array} Transformed operations
   */
  transformMidi(op1, op2) {
    const transformed1 = { ...op1 };
    const transformed2 = { ...op2 };

    // Handle insert operations
    if (op1.action === 'insert' && op2.action === 'insert') {
      if (op1.index <= op2.index) {
        transformed2.index += 1;
      } else {
        transformed1.index += 1;
      }
    }

    // Handle delete operations
    if (op1.action === 'delete' && op2.action === 'delete') {
      if (op1.index < op2.index) {
        transformed2.index -= 1;
      } else if (op1.index > op2.index) {
        transformed1.index -= 1;
      } else {
        // Same index - both deleting same item
        // Second operation becomes no-op
        transformed2.action = 'noop';
      }
    }

    // Handle insert vs delete
    if (op1.action === 'insert' && op2.action === 'delete') {
      if (op1.index <= op2.index) {
        transformed2.index += 1;
      }
    }

    if (op1.action === 'delete' && op2.action === 'insert') {
      if (op2.index <= op1.index) {
        transformed1.index += 1;
      }
    }

    // Handle modify operations
    if (op1.action === 'modify' && op2.action === 'modify') {
      if (op1.index === op2.index) {
        // Concurrent modification of same item
        // Use timestamp to resolve conflict
        if (op1.timestamp > op2.timestamp) {
          transformed2.action = 'noop';
        } else {
          transformed1.action = 'noop';
        }
      }
    }

    return [transformed1, transformed2];
  }

  /**
   * Transform automation operations
   * @param {Object} op1 - First automation operation
   * @param {Object} op2 - Second automation operation
   * @returns {Array} Transformed operations
   */
  transformAutomation(op1, op2) {
    const transformed1 = { ...op1 };
    const transformed2 = { ...op2 };

    // Handle point insertions
    if (op1.action === 'insert-point' && op2.action === 'insert-point') {
      // If inserting at same time position, use timestamp to order
      if (Math.abs(op1.time - op2.time) < 0.001) {
        if (op1.timestamp < op2.timestamp) {
          // Keep op1 as is, adjust op2 slightly
          transformed2.time += 0.001;
        } else {
          transformed1.time += 0.001;
        }
      }
    }

    // Handle point deletions
    if (op1.action === 'delete-point' && op2.action === 'delete-point') {
      if (op1.pointIndex === op2.pointIndex) {
        // Both deleting same point - make second a no-op
        transformed2.action = 'noop';
      } else if (op1.pointIndex < op2.pointIndex) {
        transformed2.pointIndex -= 1;
      } else {
        transformed1.pointIndex -= 1;
      }
    }

    // Handle concurrent modifications of same point
    if (op1.action === 'modify-point' && op2.action === 'modify-point') {
      if (op1.pointIndex === op2.pointIndex) {
        // Use timestamp to resolve conflict
        if (op1.timestamp > op2.timestamp) {
          transformed2.action = 'noop';
        } else {
          transformed1.action = 'noop';
        }
      }
    }

    return [transformed1, transformed2];
  }

  /**
   * Apply an operation to a state
   * @param {Object} state - Current state
   * @param {Object} operation - Operation to apply
   * @returns {Object} New state
   */
  apply(state, operation) {
    if (operation.action === 'noop') {
      return state;
    }

    if (operation.type === 'midi') {
      return this.applyMidiOperation(state, operation);
    }

    if (operation.type === 'automation') {
      return this.applyAutomationOperation(state, operation);
    }

    return state;
  }

  /**
   * Apply MIDI operation to state
   * @param {Object} state - Current state
   * @param {Object} operation - MIDI operation
   * @returns {Object} New state
   */
  applyMidiOperation(state, operation) {
    const newState = JSON.parse(JSON.stringify(state));
    
    switch (operation.action) {
    case 'insert':
      newState.midi.splice(operation.index, 0, operation.data);
      break;
    case 'delete':
      newState.midi.splice(operation.index, 1);
      break;
    case 'modify':
      if (newState.midi[operation.index]) {
        newState.midi[operation.index] = { 
          ...newState.midi[operation.index], 
          ...operation.data 
        };
      }
      break;
    }

    return newState;
  }

  /**
   * Apply automation operation to state
   * @param {Object} state - Current state
   * @param {Object} operation - Automation operation
   * @returns {Object} New state
   */
  applyAutomationOperation(state, operation) {
    const newState = JSON.parse(JSON.stringify(state));
    
    const envelope = newState.automation.find(
      e => e.trackId === operation.trackId && e.type === operation.envelopeType
    );

    if (!envelope) return newState;

    switch (operation.action) {
    case 'insert-point':
      envelope.points.push({
        time: operation.time,
        value: operation.value,
        shape: operation.shape || 0
      });
      envelope.points.sort((a, b) => a.time - b.time);
      break;
    case 'delete-point':
      envelope.points.splice(operation.pointIndex, 1);
      break;
    case 'modify-point':
      if (envelope.points[operation.pointIndex]) {
        envelope.points[operation.pointIndex] = {
          ...envelope.points[operation.pointIndex],
          ...operation.data
        };
      }
      break;
    }

    return newState;
  }

  /**
   * Compose two operations into one
   * @param {Object} op1 - First operation
   * @param {Object} op2 - Second operation
   * @returns {Object} Composed operation
   */
  compose(op1, op2) {
    // If operations are on different items, return both
    if (op1.index !== op2.index && op1.pointIndex !== op2.pointIndex) {
      return [op1, op2];
    }

    // Compose operations on same item
    if (op1.action === 'insert' && op2.action === 'delete') {
      if (op1.index === op2.index) {
        // Insert then delete = noop
        return { action: 'noop' };
      }
    }

    if (op1.action === 'modify' && op2.action === 'modify') {
      if (op1.index === op2.index) {
        // Combine modifications
        return {
          ...op1,
          data: { ...op1.data, ...op2.data },
          timestamp: op2.timestamp
        };
      }
    }

    return [op1, op2];
  }
}

module.exports = OperationalTransform;
