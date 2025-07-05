#!/usr/bin/env node

/**
 * Example: Adding DHT monitoring capabilities to EHRAutopass
 * 
 * This shows how to extend the Electron app with DHT statistics
 */

import { EHRAutopass } from '../src/core/ehr-autopass.js'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

console.log('📊 DHT Monitoring Example')
console.log('=' .repeat(50))

// Extended EHRAutopass with DHT monitoring
class EHRAutopassWithMonitoring extends EHRAutopass {
  
  async getDHTStatus() {
    if (!this.isInitialized || !this.autopass?.swarm?.dht) {
      return {
        connected: false,
        message: 'DHT not connected'
      }
    }
    
    const dht = this.autopass.swarm.dht
    const nodes = dht.table.toArray()
    
    return {
      connected: true,
      online: dht.online,
      bootstrapped: dht.bootstrapped,
      ephemeral: dht.ephemeral,
      firewalled: dht.firewalled,
      nodeCount: nodes.length,
      tableSize: dht.table.size,
      stats: {
        queries: dht.stats.queries,
        commands: dht.stats.commands,
        punches: dht.stats.punches
      },
      connections: {
        swarm: this.autopass.swarm.connections.size,
        peers: this.autopass.swarm.peers.size,
        connecting: this.autopass.swarm.connecting
      },
      // Sample of discovered nodes (first 5)
      sampleNodes: nodes.slice(0, 5).map(node => ({
        id: node.id.toString('hex').substring(0, 8) + '...',
        host: node.host,
        port: node.port
      }))
    }
  }
  
  // Monitor DHT changes
  startDHTMonitoring(interval = 5000) {
    if (this._dhtMonitor) return
    
    this._dhtMonitor = setInterval(async () => {
      const status = await this.getDHTStatus()
      this.emit('dht:status', status)
    }, interval)
    
    // Also emit on swarm events
    if (this.autopass?.swarm) {
      this.autopass.swarm.on('connection', (conn) => {
        this.emit('dht:connection', { 
          event: 'new-connection',
          connections: this.autopass.swarm.connections.size 
        })
      })
    }
  }
  
  stopDHTMonitoring() {
    if (this._dhtMonitor) {
      clearInterval(this._dhtMonitor)
      this._dhtMonitor = null
    }
  }
  
  async close() {
    this.stopDHTMonitoring()
    await super.close()
  }
}

// Demo usage
async function demonstrateDHTMonitoring() {
  const dir = join(tmpdir(), 'ehr-dht-monitor-' + randomBytes(4).toString('hex'))
  
  console.log('\n1. Creating monitored EHR instance...')
  const ehr = new EHRAutopassWithMonitoring({
    storagePath: dir,
    role: 'patient',
    patientId: 'patient-monitor-demo',
    name: 'Demo Patient'
  })
  
  // Set up monitoring listeners
  ehr.on('dht:status', (status) => {
    console.log('\n📊 DHT Status Update:')
    console.log(`  - Connected: ${status.connected}`)
    console.log(`  - DHT Nodes: ${status.nodeCount}`)
    console.log(`  - P2P Connections: ${status.connections.swarm}`)
    console.log(`  - Queries: ${status.stats.queries.active} active, ${status.stats.queries.total} total`)
  })
  
  ehr.on('dht:connection', (info) => {
    console.log('\n🔗 Connection Event:', info)
  })
  
  console.log('\n2. Initializing...')
  await ehr.initialize()
  
  // Get initial status
  const initialStatus = await ehr.getDHTStatus()
  console.log('\n3. Initial DHT Status:')
  console.log(JSON.stringify(initialStatus, null, 2))
  
  // Start monitoring
  console.log('\n4. Starting DHT monitoring (updates every 5 seconds)...')
  ehr.startDHTMonitoring(5000)
  
  // Create an invite to trigger more DHT activity
  console.log('\n5. Creating invite to trigger DHT activity...')
  const invite = await ehr.inviteProvider('Dr. Monitor', 'testing')
  console.log(`  - Invite: ${invite.substring(0, 50)}...`)
  
  // Wait to see monitoring updates
  console.log('\n6. Monitoring for 15 seconds...')
  await new Promise(resolve => setTimeout(resolve, 15000))
  
  // Final status
  const finalStatus = await ehr.getDHTStatus()
  console.log('\n7. Final DHT Status:')
  console.log(`  - DHT Nodes discovered: ${finalStatus.nodeCount}`)
  console.log(`  - Total queries made: ${finalStatus.stats.queries.total}`)
  console.log(`  - Sample nodes:`)
  finalStatus.sampleNodes.forEach((node, i) => {
    console.log(`    ${i + 1}. ${node.host}:${node.port} (${node.id})`)
  })
  
  // Cleanup
  console.log('\n8. Cleaning up...')
  await ehr.close()
  
  console.log('\n✅ Demo completed!')
}

// Integration example for Electron main.js
console.log('\n📝 Integration Example for Electron:')
console.log('```javascript')
console.log(`// In main.js, add new IPC handler:
ipcMain.handle('ehr-get-dht-status', async () => {
  try {
    if (!ehrSystem || !ehrSystem.getDHTStatus) {
      return { success: false, error: 'DHT monitoring not available' }
    }
    
    const status = await ehrSystem.getDHTStatus()
    return { success: true, ...status }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// In renderer, call it like:
const dhtStatus = await window.electronAPI.ehr.getDHTStatus()
console.log('DHT Nodes:', dhtStatus.nodeCount)
console.log('P2P Peers:', dhtStatus.connections.swarm)
`)
console.log('```')

// Run the demo
demonstrateDHTMonitoring().catch(console.error)