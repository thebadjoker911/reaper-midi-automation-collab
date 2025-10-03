/**
 * RPP Parser Module
 * Parses Reaper Project (RPP) files to extract MIDI and automation data
 */

class RPPParser {
  /**
   * Parse RPP file content
   * @param {string} content - Raw RPP file content
   * @returns {Object} Parsed project data
   */
  parse(content) {
    const lines = content.split('\n');
    const project = {
      tracks: [],
      midi: [],
      automation: []
    };

    let currentTrack = null;
    let currentItem = null;
    const stack = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('//')) continue;

      const closeBrackets = (line.match(/>/g) || []).length;

      // Track detection
      if (line.startsWith('<TRACK')) {
        currentTrack = {
          id: stack.length,
          name: '',
          items: [],
          envelopes: [],
          lineStart: i
        };
        stack.push({ type: 'TRACK', data: currentTrack });
      }
      
      // Track name
      if (line.startsWith('NAME') && currentTrack) {
        currentTrack.name = line.substring(4).trim().replace(/"/g, '');
      }

      // MIDI item detection
      if (line.startsWith('<ITEM')) {
        currentItem = {
          position: 0,
          length: 0,
          midiData: [],
          lineStart: i
        };
        stack.push({ type: 'ITEM', data: currentItem });
      }

      // Item position and length
      if (line.startsWith('POSITION') && currentItem) {
        currentItem.position = parseFloat(line.split(/\s+/)[1]);
      }
      if (line.startsWith('LENGTH') && currentItem) {
        currentItem.length = parseFloat(line.split(/\s+/)[1]);
      }

      // MIDI source detection
      if (line.startsWith('<SOURCE MIDI')) {
        if (currentItem) {
          currentItem.isMidi = true;
        }
        stack.push({ type: 'SOURCE_MIDI', data: {} });
      }

      // MIDI events (E lines in MIDI source)
      if (line.startsWith('E') && stack.some(s => s.type === 'SOURCE_MIDI')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 4 && currentItem) {
          currentItem.midiData.push({
            position: parseFloat(parts[1]),
            type: parts[2],
            data: parts.slice(3).join(' ')
          });
        }
      }

      // Automation envelope detection
      if (line.startsWith('<VOLENV') || line.startsWith('<PANENV') || line.startsWith('<PARMENV')) {
        const envelope = {
          type: line.split(/\s+/)[0].substring(1),
          points: [],
          lineStart: i
        };
        stack.push({ type: 'ENVELOPE', data: envelope });
        if (currentTrack) {
          currentTrack.envelopes.push(envelope);
        }
      }

      // Automation points (PT lines in envelopes)
      if (line.startsWith('PT') && stack.some(s => s.type === 'ENVELOPE')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          const envelope = stack.find(s => s.type === 'ENVELOPE')?.data;
          if (envelope) {
            envelope.points.push({
              time: parseFloat(parts[1]),
              value: parseFloat(parts[2]),
              shape: parts[3] ? parseInt(parts[3]) : 0
            });
          }
        }
      }

      // Handle closing tags
      if (closeBrackets > 0) {
        for (let j = 0; j < closeBrackets; j++) {
          const popped = stack.pop();
          if (popped?.type === 'TRACK' && currentTrack) {
            currentTrack.lineEnd = i;
            project.tracks.push(currentTrack);
            currentTrack = null;
          } else if (popped?.type === 'ITEM' && currentItem) {
            currentItem.lineEnd = i;
            if (currentItem.isMidi) {
              project.midi.push(currentItem);
            }
            if (currentTrack) {
              currentTrack.items.push(currentItem);
            }
            currentItem = null;
          }
        }
      }
    }

    return project;
  }

  /**
   * Extract only MIDI data from parsed project
   * @param {Object} project - Parsed project data
   * @returns {Array} MIDI items
   */
  extractMidiData(project) {
    return project.midi.map(item => ({
      position: item.position,
      length: item.length,
      events: item.midiData
    }));
  }

  /**
   * Extract only automation data from parsed project
   * @param {Object} project - Parsed project data
   * @returns {Array} Automation envelopes
   */
  extractAutomationData(project) {
    const automation = [];
    project.tracks.forEach(track => {
      track.envelopes.forEach(envelope => {
        automation.push({
          trackName: track.name,
          trackId: track.id,
          type: envelope.type,
          points: envelope.points
        });
      });
    });
    return automation;
  }

  /**
   * Detect changes between two parsed projects
   * @param {Object} oldProject - Previous project state
   * @param {Object} newProject - Current project state
   * @returns {Object} Detected changes
   */
  detectChanges(oldProject, newProject) {
    const changes = {
      midi: {
        added: [],
        modified: [],
        removed: []
      },
      automation: {
        added: [],
        modified: [],
        removed: []
      }
    };

    // Compare MIDI items
    const oldMidi = this.extractMidiData(oldProject);
    const newMidi = this.extractMidiData(newProject);

    newMidi.forEach((newItem, index) => {
      const oldItem = oldMidi[index];
      if (!oldItem) {
        changes.midi.added.push({ index, data: newItem });
      } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
        changes.midi.modified.push({ index, data: newItem, old: oldItem });
      }
    });

    if (oldMidi.length > newMidi.length) {
      for (let i = newMidi.length; i < oldMidi.length; i++) {
        changes.midi.removed.push({ index: i, data: oldMidi[i] });
      }
    }

    // Compare automation
    const oldAuto = this.extractAutomationData(oldProject);
    const newAuto = this.extractAutomationData(newProject);

    newAuto.forEach((newEnv, index) => {
      const oldEnv = oldAuto[index];
      if (!oldEnv) {
        changes.automation.added.push({ index, data: newEnv });
      } else if (JSON.stringify(oldEnv) !== JSON.stringify(newEnv)) {
        changes.automation.modified.push({ index, data: newEnv, old: oldEnv });
      }
    });

    if (oldAuto.length > newAuto.length) {
      for (let i = newAuto.length; i < oldAuto.length; i++) {
        changes.automation.removed.push({ index: i, data: oldAuto[i] });
      }
    }

    return changes;
  }
}

module.exports = RPPParser;
