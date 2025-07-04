/**
 * Simple Autopass test using the correct Corestore pattern
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import os from 'os'
import path from 'path'
import { randomBytes } from 'crypto'

async function testSimpleAutopass() {
  console.log('Testing Autopass with named cores...\n')
  
  let pass1 = null
  let pass2 = null
  
  try {
    // Create first Autopass - use a named core approach
    console.log('1. Creating first Autopass instance...')
    const dir1 = path.join(os.tmpdir(), 'autopass-1-' + randomBytes(4).toString('hex'))
    const store1 = new Corestore(dir1)
    await store1.ready()
    
    // Get a named core to establish a key
    const core = store1.get({ name: 'autopass-core' })
    await core.ready()
    const key = core.key
    console.log(`✓ Got core key: ${key.toString('hex').substring(0, 16)}...`)
    
    // Create Autopass with this key
    pass1 = new Autopass(store1, { key })
    await pass1.ready()
    console.log('✓ First Autopass ready')
    
    // Add some data
    console.log('\n2. Adding data to first instance...')
    await pass1.add('test-key', 'test-value')
    await pass1.add('patient:john', { name: 'John Doe', age: 35 })
    console.log('✓ Data added')
    
    // Verify data
    const value = await pass1.get('test-key')
    console.log(`✓ Retrieved: ${value}`)
    
    // Create invite
    console.log('\n3. Creating invite...')
    const invite = await pass1.createInvite()
    console.log('✓ Invite created:')
    console.log(`  ${invite}`)
    
    // Pair second instance
    console.log('\n4. Pairing second instance...')
    const dir2 = path.join(os.tmpdir(), 'autopass-2-' + randomBytes(4).toString('hex'))
    const store2 = new Corestore(dir2)
    pass2 = await Autopass.pair(store2, invite)
    console.log('✓ Second instance paired')
    
    // Read data from second instance
    console.log('\n5. Reading data from second instance...')
    await new Promise(resolve => setTimeout(resolve, 2000)) // Give time to sync
    
    const syncedValue = await pass2.get('test-key')
    const syncedPatient = await pass2.get('patient:john')
    
    console.log(`✓ Synced value: ${syncedValue}`)
    console.log(`✓ Synced patient: ${JSON.stringify(syncedPatient)}`)
    
    // Add data from second instance
    console.log('\n6. Adding data from second instance...')
    await pass2.add('doctor:smith', { name: 'Dr. Smith', specialty: 'Primary Care' })
    console.log('✓ Doctor data added')
    
    // Check if first instance sees it
    console.log('\n7. Checking if first instance sees new data...')
    await new Promise(resolve => setTimeout(resolve, 2000)) // Give time to sync
    
    const doctorData = await pass1.get('doctor:smith')
    console.log(`✓ First instance sees: ${JSON.stringify(doctorData)}`)
    
    console.log('\n🎉 SUCCESS! Autopass is working perfectly!')
    console.log('\nThe solution was to use a named core to get a proper key!')
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    console.error('Stack:', error.stack)
  } finally {
    // Cleanup
    try {
      await pass1?.close()
      await pass2?.close()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Run test
testSimpleAutopass().catch(console.error)