# Architecture Documentation

## System Overview

The Reaper MIDI & Automation Collaboration System is designed as a distributed real-time collaborative editing platform for Reaper DAW projects. It follows a client-server architecture with operational transform algorithms for conflict resolution.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Collaboration Network                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Client 1   │◄───────►│   WebSocket  │                  │
│  │              │         │    Server    │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         │                        │                           │
│  ┌──────▼───────┐         ┌──────▼───────┐                  │
│  │ File Monitor │         │     Rooms    │                  │
│  │   (Local)    │         │   Manager    │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         │                        │                           │
│  ┌──────▼───────┐         ┌──────▼───────┐                  │
│  │  RPP Parser  │         │   Client 2   │◄────┐            │
│  │              │         │              │     │            │
│  └──────┬───────┘         └──────┬───────┘     │            │
│         │                        │              │            │
│         │                        │              │            │
│  ┌──────▼───────┐         ┌──────▼───────┐     │            │
│  │   Reaper     │         │ File Monitor │     │            │
│  │   (DAW)      │         │   (Local)    │     │            │
│  │              │         └──────┬───────┘     │            │
│  └──────▲───────┘                │              │            │
│         │                 ┌──────▼───────┐     │            │
│         │                 │  RPP Parser  │     │            │
│         │                 │              │     │            │
│         │                 └──────┬───────┘     │            │
│         │                        │              │            │
│  ┌──────┴───────┐         ┌──────▼───────┐     │            │
│  │  ReaScript   │         │   Reaper     │     │            │
│  │ Integration  │         │   (DAW)      │     │            │
│  │              │         │              │     │            │
│  └──────────────┘         └──────▲───────┘     │            │
│                                  │              │            │
│                           ┌──────┴───────┐     │            │
│                           │  ReaScript   │     │            │
│                           │ Integration  │     │            │
│                           │              │     │            │
│                           └──────────────┘     │            │
│                                                 │            │
│                    (Multiple clients...)────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. RPP Parser (`src/parser/rpp-parser.js`)

**Purpose:** Parse and extract MIDI and automation data from Reaper Project (RPP) files.

**Key Features:**
- Parses RPP text format using line-by-line analysis
- Tracks nesting with stack-based approach
- Extracts MIDI events and automation envelopes
- Detects changes between project states

**Data Flow:**
```
RPP File → Parser → Structured Data → Change Detection → Delta
```

### 2. File Monitor (`src/utils/file-monitor.js`)

**Purpose:** Watch for file system changes to RPP files.

**Key Features:**
- Uses chokidar for cross-platform file watching
- Debounces rapid changes
- Maintains file state cache
- Emits events for file changes

**Event Flow:**
```
File Change → Chokidar → File Monitor → Parse → Emit Event → Client
```

### 3. WebSocket Server (`src/server/websocket-server.js`)

**Purpose:** Central hub for real-time communication between clients.

**Key Features:**
- Manages client connections
- Implements room-based collaboration
- Broadcasts changes to room members
- Heartbeat mechanism for connection health

**Architecture:**
```
┌─────────────────┐
│  WS Server      │
├─────────────────┤
│ Connection Mgr  │
│ Room Manager    │
│ Message Router  │
│ Heartbeat       │
└─────────────────┘
```

### 4. WebSocket Client (`src/client/websocket-client.js`)

**Purpose:** Connect to server and handle real-time updates.

**Key Features:**
- Auto-reconnection with exponential backoff
- Event-based message handling
- Room joining/leaving
- Heartbeat support

**State Machine:**
```
Disconnected → Connecting → Connected → Joined Room
     ↑                                        ↓
     └────────────← Disconnect ←─────────────┘
```

### 5. Operational Transform (`src/utils/operational-transform.js`)

**Purpose:** Resolve conflicts when multiple users edit simultaneously.

**Key Concepts:**
- **Transform**: Adjust operations based on concurrent operations
- **Compose**: Combine sequential operations
- **Apply**: Apply operations to state

**Example Conflict Resolution:**
```
User A: Insert MIDI note at position 100
User B: Insert MIDI note at position 100
         ↓
    OT Transform
         ↓
User A: Insert at position 100
User B: Insert at position 101 (adjusted)
```

### 6. ReaScript Integration (`src/reascript/collab-integration.lua`)

**Purpose:** Bridge between Reaper API and collaboration system.

**Key Features:**
- Extracts MIDI and automation data from Reaper
- Writes state to bridge files
- Reads incoming changes from collaborators
- Applies changes to Reaper project

**Data Bridge:**
```
Reaper API → Lua Script → JSON File → Node.js Client
Node.js Client → JSON File → Lua Script → Reaper API
```

## Data Flow

### Outgoing Changes (Local → Remote)

```
1. User edits in Reaper
2. ReaScript detects change
3. ReaScript writes to bridge file
4. File Monitor detects change
5. RPP Parser extracts changes
6. Client sends to WebSocket server
7. Server broadcasts to room members
8. Other clients receive changes
9. Other ReaScripts apply changes
```

### Incoming Changes (Remote → Local)

```
1. Client receives WebSocket message
2. Change data is validated
3. Operational Transform resolves conflicts
4. Change is written to bridge file
5. ReaScript reads bridge file
6. ReaScript applies change via Reaper API
7. Reaper project is updated
```

## Conflict Resolution Strategy

### Operational Transform Algorithm

1. **Concurrent Operations Detection**
   - Track operation timestamps
   - Identify conflicting operations

2. **Transformation**
   - Transform operations relative to each other
   - Maintain operation intent
   - Ensure convergence

3. **Application**
   - Apply transformed operations
   - Update local state
   - Broadcast to other clients

### Conflict Examples

**Example 1: Concurrent Inserts**
```javascript
// Before: [A, B, C]
Operation 1: Insert D at index 1
Operation 2: Insert E at index 1

// After transform:
Operation 1: Insert D at index 1  // [A, D, B, C]
Operation 2: Insert E at index 2  // [A, D, E, B, C]
```

**Example 2: Concurrent Modifications**
```javascript
// Both users modify same MIDI note
Operation 1: Set velocity to 100 (timestamp: 1000)
Operation 2: Set velocity to 80  (timestamp: 1001)

// Resolution: Use later timestamp
Result: Velocity = 80
```

## Scalability Considerations

### Current Implementation

- Single server instance
- In-memory state management
- Direct WebSocket connections

### Future Enhancements

1. **Horizontal Scaling**
   - Multiple server instances
   - Redis for shared state
   - Load balancer for client distribution

2. **State Persistence**
   - Database for project history
   - Event sourcing for replay
   - Snapshot mechanism for fast sync

3. **Performance Optimization**
   - Compression for large operations
   - Delta compression for bandwidth
   - Lazy loading for large projects

## Security Considerations

### Current Implementation

- No authentication
- No encryption (WS, not WSS)
- No authorization

### Recommended Enhancements

1. **Authentication**
   - User login system
   - Token-based auth
   - Session management

2. **Authorization**
   - Room access control
   - Permission levels
   - Project ownership

3. **Encryption**
   - WSS (WebSocket Secure)
   - End-to-end encryption
   - Data validation

## Error Handling

### Connection Errors

- Auto-reconnection with backoff
- State recovery on reconnect
- User notification

### File System Errors

- Graceful degradation
- Error logging
- Retry mechanism

### Parse Errors

- Invalid RPP format handling
- Partial parsing support
- Error reporting

## Testing Strategy

### Unit Tests (Recommended)

- Parser functionality
- Operational transform logic
- Message protocol

### Integration Tests (Recommended)

- Client-server communication
- File monitoring
- End-to-end workflows

### Manual Testing

- Multiple client scenarios
- Network interruption
- Concurrent editing

## Performance Metrics

### Key Performance Indicators

1. **Latency**: Time from local edit to remote update
   - Target: < 100ms on LAN
   - Target: < 500ms on WAN

2. **Throughput**: Number of operations per second
   - Target: > 100 ops/sec per client

3. **Scalability**: Number of concurrent clients
   - Current: ~10-20 clients per server
   - Target: > 100 clients with optimizations

## Technology Stack

- **Runtime**: Node.js
- **WebSocket Library**: ws
- **File Monitoring**: chokidar
- **Language**: JavaScript (Node.js), Lua (ReaScript)
- **Protocol**: WebSocket, JSON messages

## Development Principles

1. **Modularity**: Each component is independent and testable
2. **Extensibility**: Easy to add new features
3. **Reliability**: Robust error handling and recovery
4. **Performance**: Efficient algorithms and data structures
5. **Maintainability**: Clean code and documentation
