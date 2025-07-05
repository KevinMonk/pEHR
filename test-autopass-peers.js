#!/usr/bin/env node

/**
 * Test to understand how to correctly get peer count in Autopass
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import { randomBytes } from 'crypto'
import { tmpdir } from 'os'
import { join } from 'path'

console.log('🔍 Autopass Peers Test')
console.log('=' .repeat(50))

async function testAutopassPeers() {
  console.log('\n1. Creating two Autopass instances...')
  
  // Create first instance
  const dir1 = join(tmpdir(), 'autopass-peer-1-' + randomBytes(4).toString('hex'))
  const store1 = new Corestore(dir1)
  const pass1 = new Autopass(store1)
  await pass1.ready()
  
  console.log('\n2. First instance ready:')
  console.log('  - Key:', pass1.key.toString('hex').substring(0, 16) + '...')
  console.log('  - Has swarm:', !!pass1.swarm)
  console.log('  - Has base:', !!pass1.base)
  console.log('  - Has peers:', 'peers' in pass1)
  console.log('  - Has connections:', 'connections' in pass1)
  
  // Check all properties
  console.log('\n3. Checking Autopass properties:')
  const props = Object.getOwnPropertyNames(pass1)
  console.log('  Properties:', props)
  
  // Check base properties
  if (pass1.base) {
    console.log('\n4. Checking base properties:')
    console.log('  - Has peers:', 'peers' in pass1.base)
    console.log('  - Has writers:', 'writers' in pass1.base)
    console.log('  - Writers length:', pass1.base.writers?.length)
    console.log('  - Has inputs:', 'inputs' in pass1.base)
    console.log('  - Inputs length:', pass1.base.inputs?.length)
  }
  
  // Check swarm properties
  if (pass1.swarm) {
    console.log('\n5. Checking swarm properties:')
    console.log('  - Connections size:', pass1.swarm.connections?.size)
    console.log('  - Peers size:', pass1.swarm.peers?.size)
    console.log('  - Connecting:', pass1.swarm.connecting)
  }
  
  // Create invite and second instance
  console.log('\n6. Creating invite and pairing...')
  const invite = await pass1.createInvite()
  
  const dir2 = join(tmpdir(), 'autopass-peer-2-' + randomBytes(4).toString('hex'))
  const store2 = new Corestore(dir2)
  const pairing = Autopass.pair(store2, invite)
  const pass2 = await pairing.finished()
  
  console.log('\n7. Second instance paired')
  
  // Wait for connection
  console.log('\n8. Waiting for P2P connection...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Check connections after pairing
  console.log('\n9. After pairing:')
  if (pass1.swarm) {
    console.log('  Pass1 swarm:')
    console.log('    - Connections:', pass1.swarm.connections?.size)
    console.log('    - Peers:', pass1.swarm.peers?.size)
  }
  if (pass2.swarm) {
    console.log('  Pass2 swarm:')
    console.log('    - Connections:', pass2.swarm.connections?.size)
    console.log('    - Peers:', pass2.swarm.peers?.size)
  }
  
  // Check base writers
  console.log('\n10. Checking writers:')
  console.log('  Pass1 writers:', pass1.base?.writers?.length)
  console.log('  Pass2 writers:', pass2.base?.writers?.length)
  
  // Function to get peer count
  function getPeerCount(autopass) {
    // Try different methods
    if (autopass.swarm?.connections?.size) return autopass.swarm.connections.size
    if (autopass.swarm?.peers?.size) return autopass.swarm.peers.size
    if (autopass.base?.writers?.length) return autopass.base.writers.length - 1 // Subtract self
    if (autopass.base?.inputs?.length) return autopass.base.inputs.length - 1 // Subtract self
    return 0
  }
  
  console.log('\n11. Calculated peer counts:')
  console.log('  Pass1 peers:', getPeerCount(pass1))
  console.log('  Pass2 peers:', getPeerCount(pass2))
  
  // Cleanup
  await pass1.close()
  await pass2.close()
  
  console.log('\n✅ Test completed')
}

testAutopassPeers().catch(console.error)