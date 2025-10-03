/**
 * Example: RPP Parser Usage
 * 
 * This example demonstrates how to use the RPP parser
 */

const fs = require('fs');
const path = require('path');
const { RPPParser } = require('../src/index');

// Create parser instance
const parser = new RPPParser();

// Read sample RPP file
const sampleFile = path.join(__dirname, 'sample-project.RPP');
const content = fs.readFileSync(sampleFile, 'utf-8');

console.log('📄 Parsing sample RPP file...\n');

// Parse the file
const project = parser.parse(content);

console.log('=== Parsed Project Data ===\n');

// Display tracks
console.log(`📁 Tracks: ${project.tracks.length}`);
project.tracks.forEach((track, index) => {
  console.log(`\n  Track ${index + 1}: "${track.name}"`);
  console.log(`    Items: ${track.items.length}`);
  console.log(`    Envelopes: ${track.envelopes.length}`);
  
  if (track.envelopes.length > 0) {
    track.envelopes.forEach(env => {
      console.log(`      - ${env.type}: ${env.points.length} points`);
    });
  }
});

// Display MIDI data
console.log(`\n🎹 MIDI Items: ${project.midi.length}`);
const midiData = parser.extractMidiData(project);
midiData.forEach((item, index) => {
  console.log(`\n  MIDI Item ${index + 1}:`);
  console.log(`    Position: ${item.position}`);
  console.log(`    Length: ${item.length}`);
  console.log(`    Events: ${item.events.length}`);
  
  item.events.forEach((event, i) => {
    console.log(`      Event ${i + 1}: pos=${event.position}, type=${event.type}, data=${event.data}`);
  });
});

// Display automation data
console.log(`\n🎚️  Automation Envelopes:`);
const autoData = parser.extractAutomationData(project);
autoData.forEach((envelope, index) => {
  console.log(`\n  Envelope ${index + 1}:`);
  console.log(`    Track: "${envelope.trackName}"`);
  console.log(`    Type: ${envelope.type}`);
  console.log(`    Points: ${envelope.points.length}`);
  
  envelope.points.slice(0, 3).forEach((point, i) => {
    console.log(`      Point ${i + 1}: time=${point.time}, value=${point.value}, shape=${point.shape}`);
  });
  
  if (envelope.points.length > 3) {
    console.log(`      ... and ${envelope.points.length - 3} more points`);
  }
});

console.log('\n============================\n');

// Demonstrate change detection
console.log('🔍 Simulating change detection...\n');

// Create a modified version
const modifiedContent = content.replace('PT 2 0.5 0', 'PT 2 0.7 0');
const modifiedProject = parser.parse(modifiedContent);

const changes = parser.detectChanges(project, modifiedProject);

console.log('Detected Changes:');
console.log(`  MIDI added: ${changes.midi.added.length}`);
console.log(`  MIDI modified: ${changes.midi.modified.length}`);
console.log(`  MIDI removed: ${changes.midi.removed.length}`);
console.log(`  Automation added: ${changes.automation.added.length}`);
console.log(`  Automation modified: ${changes.automation.modified.length}`);
console.log(`  Automation removed: ${changes.automation.removed.length}`);

console.log('\n✅ Parsing complete!\n');
