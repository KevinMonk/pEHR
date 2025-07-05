#!/usr/bin/env node

/**
 * Test EHRAutopass DHT monitoring capabilities
 */

import { EHRAutopass } from './src/core/ehr-autopass.js'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

console.log('🔍 EHR DHT Monitoring Test')
console.log('=' .repeat(50))

function createTempDir(prefix) {
  const random = randomBytes(4).toString('hex')
  return join(tmpdir(), `${prefix}-${random}`)
}

async function testEHRDHTMonitoring() {
  console.log('\n1. Creating EHRAutopass instance...')
  
  const patientDir = createTempDir('patient-dht-test')
  const patient = new EHRAutopass({
    storagePath: patientDir,
    role: 'patient',
    patientId: 'patient-dht-test',
    name: 'Test Patient'
  })
  
  console.log('\n2. Before initialization:')
  console.log('  - Is initialized:', patient.isInitialized)
  console.log('  - Has autopass:', !!patient.autopass)
  
  await patient.initialize()
  
  console.log('\n3. After initialization:')
  console.log('  - Is initialized:', patient.isInitialized)
  console.log('  - Has autopass:', !!patient.autopass)
  console.log('  - Autopass key:', patient.autopass.key.toString('hex').substring(0, 16) + '...')
  
  // Check if we can access swarm through autopass
  console.log('\n4. Checking Autopass internals:')
  console.log('  - Has swarm:', !!patient.autopass.swarm)
  console.log('  - Has base:', !!patient.autopass.base)
  console.log('  - Writable:', patient.autopass.writable)
  console.log('  - Discovery key:', patient.autopass.discoveryKey?.toString('hex').substring(0, 16) + '...')
  
  // If swarm exists, check DHT
  if (patient.autopass.swarm) {
    console.log('\n5. Hyperswarm DHT access:')
    const swarm = patient.autopass.swarm
    console.log('  - Has DHT:', !!swarm.dht)
    
    if (swarm.dht) {
      console.log('  - DHT online:', swarm.dht.online)
      console.log('  - DHT bootstrapped:', swarm.dht.bootstrapped)
      console.log('  - DHT table size:', swarm.dht.table.size)
      console.log('  - DHT stats:', JSON.stringify(swarm.dht.stats, null, 2))
      
      // Get nodes
      const nodes = swarm.dht.table.toArray()
      console.log('\n6. DHT Nodes:')
      console.log('  - Total nodes in table:', nodes.length)
      if (nodes.length > 0) {
        console.log('  - First 3 nodes:')
        nodes.slice(0, 3).forEach((node, i) => {
          console.log(`    ${i + 1}. ${node.host}:${node.port}`)
        })
      }
    }
    
    // Check swarm connections
    console.log('\n7. Swarm connections:')
    console.log('  - Active connections:', swarm.connections.size)
    console.log('  - Known peers:', swarm.peers.size)
  } else {
    console.log('\n5. No swarm available - checking if we need to trigger it...')
    
    // Create an invite to trigger swarm initialization
    console.log('\n6. Creating invite to trigger swarm...')
    const invite = await patient.inviteProvider('Test Doctor', 'test')
    console.log('  - Invite created:', invite.substring(0, 50) + '...')
    
    // Check again
    if (patient.autopass.swarm) {
      console.log('\n7. Swarm now available!')
      const swarm = patient.autopass.swarm
      
      if (swarm.dht) {
        console.log('  - DHT online:', swarm.dht.online)
        console.log('  - DHT bootstrapped:', swarm.dht.bootstrapped)
        console.log('  - DHT table size:', swarm.dht.table.size)
        
        const nodes = swarm.dht.table.toArray()
        console.log('  - DHT nodes:', nodes.length)
      }
    }
  }
  
  // Check peers property
  console.log('\n8. Checking peers property:')
  console.log('  - Has peers property:', 'peers' in patient.autopass)
  console.log('  - Peers type:', typeof patient.autopass.peers)
  console.log('  - Peers value:', patient.autopass.peers)
  
  // Wait a bit to see if DHT populates
  console.log('\n9. Waiting 3 seconds for DHT activity...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  if (patient.autopass.swarm?.dht) {
    const finalNodes = patient.autopass.swarm.dht.table.toArray()
    console.log('\n10. Final DHT state:')
    console.log('  - DHT nodes:', finalNodes.length)
    console.log('  - DHT bootstrapped:', patient.autopass.swarm.dht.bootstrapped)
  }
  
  // Cleanup
  await patient.close()
  
  console.log('\n✅ Test completed')
}

testEHRDHTMonitoring().catch(console.error)