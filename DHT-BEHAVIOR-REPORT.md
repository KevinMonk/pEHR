# DHT Behavior Report - pEHR Electron App

## Overview

This report documents the DHT (Distributed Hash Table) behavior in the pEHR Electron application, including when and how the app connects to the DHT network, and what monitoring capabilities are available.

## Key Findings

### 1. DHT Connection Timing

**The app connects to the DHT immediately upon EHRAutopass initialization**, not on app startup:

- **App Launch**: No DHT connection
- **Profile Creation**: DHT connection established when `ehrSystem.initialize()` is called
- **DHT Bootstrap**: Begins immediately when Autopass creates its Hyperswarm instance

### 2. DHT Connection Process

When a user creates a patient or provider profile:

1. `EHRAutopass` is instantiated with role and ID
2. `await ehrSystem.initialize()` is called
3. Autopass creates a Hyperswarm instance
4. Hyperswarm automatically creates a HyperDHT instance
5. DHT begins bootstrapping to known nodes immediately
6. The app joins the DHT network even without any P2P connections

### 3. DHT Network Statistics

The DHT connection provides access to several statistics:

```javascript
// Access through EHRAutopass instance
ehrSystem.autopass.swarm.dht.stats
```

Available stats include:
- **queries**: Active and total DHT queries
- **commands**: Ping, pingNat, findNode, and downHint counts
- **punches**: NAT traversal attempts (consistent, random, open)

### 4. DHT Node Discovery

The app can see other DHT nodes through:

```javascript
// Get all nodes in routing table
const nodes = ehrSystem.autopass.swarm.dht.table.toArray()

// Each node contains:
{
  id: Buffer,     // Node ID
  host: string,   // IP address
  port: number    // UDP port
}
```

Typical DHT behavior:
- Starts with 0 nodes
- Quickly discovers 50-80+ nodes within seconds
- Maintains routing table of nearby nodes in the DHT

### 5. Peer Connection Monitoring

For actual P2P connections (not just DHT nodes):

```javascript
// Correct way to get peer count
const peerCount = ehrSystem.autopass.swarm.connections.size

// Also available:
const peersMap = ehrSystem.autopass.swarm.peers.size
```

**Important distinction**:
- **DHT nodes**: Other participants in the DHT network (for routing)
- **Peers**: Actual P2P connections sharing EHR data

### 6. Current Implementation in Electron App

The Electron app currently shows peer count in the UI:

```javascript
// From main.js
peers: ehrSystem.autopass.peers.length  // This is incorrect!

// Should be:
peers: ehrSystem.autopass.swarm.connections.size
```

### 7. DHT Behavior Summary

1. **No profile = No DHT**: App doesn't join DHT until user creates a profile
2. **Immediate join**: DHT connection happens immediately on profile creation
3. **Global visibility**: The app becomes visible to the DHT network
4. **Node discovery**: Discovers 50-80+ DHT nodes within seconds
5. **Persistent connection**: Maintains DHT connection while app is running
6. **No data sharing**: DHT is only for discovery, not data transfer

## Recommendations

### 1. Fix Peer Count Display

Update `src/electron/main.js` line 312:
```javascript
// Change from:
peers: ehrSystem.autopass.peers.length

// To:
peers: ehrSystem.autopass?.swarm?.connections?.size || 0
```

### 2. Add DHT Monitoring View

Create a debug/monitoring view that shows:
- DHT connection status
- Number of DHT nodes discovered
- DHT statistics (queries, pings, etc.)
- Differentiate between DHT nodes and actual peers

### 3. Privacy Considerations

Users should be aware that:
- Creating a profile immediately joins the global DHT
- The app's discovery key becomes visible to the network
- No medical data is shared through DHT (only used for peer discovery)

### 4. Example DHT Monitor Implementation

```javascript
async function getDHTStatus() {
  if (!ehrSystem?.autopass?.swarm?.dht) {
    return { connected: false }
  }
  
  const dht = ehrSystem.autopass.swarm.dht
  const nodes = dht.table.toArray()
  
  return {
    connected: true,
    online: dht.online,
    bootstrapped: dht.bootstrapped,
    nodeCount: nodes.length,
    stats: dht.stats,
    peers: ehrSystem.autopass.swarm.connections.size,
    sampleNodes: nodes.slice(0, 5).map(n => ({
      host: n.host,
      port: n.port,
      id: n.id.toString('hex').substring(0, 8) + '...'
    }))
  }
}
```

## Conclusion

The pEHR Electron app connects to the DHT network immediately upon profile creation, not at app startup. This connection is used for peer discovery but does not share any medical data. The app can monitor both DHT nodes (for routing) and actual peer connections (for data sharing), though the current implementation has a bug in how it counts peers.