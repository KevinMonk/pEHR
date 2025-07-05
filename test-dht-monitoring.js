#!/usr/bin/env node

/**
 * Test to understand DHT behavior and monitoring capabilities
 */

import Hyperswarm from 'hyperswarm'
import DHT from 'hyperdht'
import { randomBytes } from 'crypto'

console.log('🔍 DHT Monitoring Test')
console.log('=' .repeat(50))

async function testDHTBehavior() {
  console.log('\n1. Testing raw HyperDHT...')
  
  // Create a DHT instance
  const dht = new DHT()
  await dht.ready()
  
  console.log('\nDHT Stats:')
  console.log('  - DHT ID:', dht.id ? dht.id.toString('hex').substring(0, 16) + '...' : 'ephemeral')
  console.log('  - Online:', dht.online)
  console.log('  - Bootstrapped:', dht.bootstrapped)
  console.log('  - Ephemeral:', dht.ephemeral)
  console.log('  - Firewalled:', dht.firewalled)
  console.log('  - Stats:', JSON.stringify(dht.stats, null, 2))
  
  // Check routing table
  console.log('\nRouting Table:')
  console.log('  - Table size:', dht.table.size)
  console.log('  - Nodes count:', dht.nodes.size)
  
  // Try to get nodes from routing table
  const nodes = dht.table.toArray()
  console.log('  - Nodes in table:', nodes.length)
  if (nodes.length > 0) {
    console.log('  - Sample node:', {
      id: nodes[0].id.toString('hex').substring(0, 16) + '...',
      host: nodes[0].host,
      port: nodes[0].port
    })
  }
  
  console.log('\n2. Testing Hyperswarm with DHT monitoring...')
  
  // Create a swarm
  const swarm = new Hyperswarm()
  
  console.log('\nSwarm DHT access:')
  console.log('  - Has DHT:', !!swarm.dht)
  console.log('  - DHT ID:', swarm.dht.id ? swarm.dht.id.toString('hex').substring(0, 16) + '...' : 'ephemeral')
  console.log('  - DHT online:', swarm.dht.online)
  console.log('  - DHT bootstrapped:', swarm.dht.bootstrapped)
  
  // Monitor DHT events
  swarm.dht.on('ready', () => console.log('✓ DHT ready event'))
  swarm.dht.on('persistent', () => console.log('✓ DHT persistent event'))
  swarm.dht.on('network-change', (interfaces) => console.log('✓ DHT network-change event', interfaces))
  
  // Join a topic to trigger DHT activity
  const topic = randomBytes(32)
  console.log('\n3. Joining topic to trigger DHT activity...')
  console.log('  - Topic:', topic.toString('hex').substring(0, 16) + '...')
  
  const discovery = swarm.join(topic)
  await discovery.flushed()
  
  console.log('\n4. Checking DHT after joining topic...')
  console.log('  - DHT bootstrapped:', swarm.dht.bootstrapped)
  console.log('  - DHT table size:', swarm.dht.table.size)
  console.log('  - DHT nodes count:', swarm.dht.nodes.size)
  console.log('  - DHT stats:', JSON.stringify(swarm.dht.stats, null, 2))
  
  // Wait a bit for DHT to populate
  console.log('\n5. Waiting 5 seconds for DHT to populate...')
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('\n6. Final DHT state:')
  console.log('  - DHT table size:', swarm.dht.table.size)
  console.log('  - DHT nodes count:', swarm.dht.nodes.size)
  console.log('  - DHT stats:', JSON.stringify(swarm.dht.stats, null, 2))
  console.log('  - Swarm connections:', swarm.connections.size)
  console.log('  - Swarm peers:', swarm.peers.size)
  
  // Get all nodes
  const allNodes = swarm.dht.table.toArray()
  console.log('\n7. DHT Nodes discovered:')
  console.log('  - Total nodes:', allNodes.length)
  if (allNodes.length > 0) {
    console.log('  - First 5 nodes:')
    allNodes.slice(0, 5).forEach((node, i) => {
      console.log(`    ${i + 1}. ${node.host}:${node.port} (ID: ${node.id.toString('hex').substring(0, 8)}...)`)
    })
  }
  
  // Cleanup
  await swarm.destroy()
  await dht.destroy()
  
  console.log('\n✅ Test completed')
}

testDHTBehavior().catch(console.error)