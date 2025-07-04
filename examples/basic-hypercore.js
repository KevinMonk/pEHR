/**
 * Basic Hypercore P2P test - bypassing Autopass
 */

import Hypercore from 'hypercore'
import Hyperswarm from 'hyperswarm'
import { randomBytes } from 'crypto'
import os from 'os'
import path from 'path'

async function testBasicHypercore() {
  console.log('Testing basic Hypercore P2P functionality...\n')
  
  let core1 = null
  let core2 = null
  let swarm1 = null
  let swarm2 = null
  
  try {
    // Create first hypercore
    console.log('1. Creating first Hypercore...')
    const dir1 = path.join(os.tmpdir(), 'hypercore-1-' + randomBytes(4).toString('hex'))
    core1 = new Hypercore(dir1)
    await core1.ready()
    console.log(`✓ Core 1 ready, key: ${core1.key.toString('hex').substring(0, 16)}...`)
    
    // Add some data
    console.log('\n2. Adding data to core 1...')
    await core1.append('Hello from core 1')
    await core1.append(JSON.stringify({ 
      type: 'medical-record',
      patient: 'john-doe',
      data: { diagnosis: 'Test diagnosis' }
    }))
    console.log(`✓ Added 2 entries, length: ${core1.length}`)
    
    // Create swarm for core 1
    console.log('\n3. Setting up P2P networking for core 1...')
    swarm1 = new Hyperswarm()
    swarm1.on('connection', (conn) => {
      console.log('Core 1: Got connection!')
      core1.replicate(conn)
    })
    
    const topic = core1.discoveryKey
    swarm1.join(topic)
    await swarm1.flush()
    console.log('✓ Core 1 joined swarm')
    
    // Create second hypercore (replicating the first)
    console.log('\n4. Creating second Hypercore (replicating)...')
    const dir2 = path.join(os.tmpdir(), 'hypercore-2-' + randomBytes(4).toString('hex'))
    core2 = new Hypercore(dir2, core1.key) // Use same key to replicate
    await core2.ready()
    console.log(`✓ Core 2 ready, same key: ${core2.key.toString('hex').substring(0, 16)}...`)
    
    // Create swarm for core 2
    console.log('\n5. Setting up P2P networking for core 2...')
    swarm2 = new Hyperswarm()
    swarm2.on('connection', (conn) => {
      console.log('Core 2: Got connection!')
      core2.replicate(conn)
    })
    
    swarm2.join(topic)
    await swarm2.flush()
    console.log('✓ Core 2 joined swarm')
    
    // Wait for sync
    console.log('\n6. Waiting for sync...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if core2 got the data
    await core2.update()
    console.log(`✓ Core 2 length after sync: ${core2.length}`)
    
    if (core2.length > 0) {
      const entry0 = await core2.get(0)
      const entry1 = await core2.get(1)
      console.log(`✓ Core 2 entry 0: ${entry0.toString()}`)
      console.log(`✓ Core 2 entry 1: ${entry1.toString()}`)
      
      console.log('\n🎉 SUCCESS! Basic P2P replication working!')
      
      // Test adding from core2
      console.log('\n7. Adding data from core 2...')
      await core2.append('Hello from core 2')
      await core1.update()
      console.log(`✓ Core 1 length after core 2 addition: ${core1.length}`)
      
      if (core1.length > 2) {
        const newEntry = await core1.get(2)
        console.log(`✓ Core 1 sees: ${newEntry.toString()}`)
        console.log('\n🚀 BI-DIRECTIONAL P2P WORKING!')
      }
      
    } else {
      console.log('❌ Sync failed - no data replicated')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    // Cleanup
    try {
      swarm1?.destroy()
      swarm2?.destroy()
      await core1?.close()
      await core2?.close()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

testBasicHypercore().catch(console.error)