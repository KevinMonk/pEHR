/**
 * Test basic Autopass functionality
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

async function testAutopass() {
  console.log('Testing Autopass basic functionality...\n')
  
  // Clean up previous test data
  try {
    await execAsync('rm -rf ./test-autopass-data')
  } catch (e) {
    // Ignore if doesn't exist
  }
  
  let pass1 = null
  let pass2 = null
  
  try {
    // Create first instance
    console.log('1. Creating first Autopass instance...')
    const store1 = new Corestore('./test-autopass-data/node1')
    await store1.ready()
    pass1 = new Autopass(store1)
    await pass1.ready()
    console.log('✓ First instance ready')
    
    // Add some data
    console.log('\n2. Adding data to first instance...')
    await pass1.add('test-key', 'test-value')
    await pass1.add('patient:john', JSON.stringify({ name: 'John Doe', age: 35 }))
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
    const store2 = new Corestore('./test-autopass-data/node2')
    await store2.ready()
    pass2 = await Autopass.pair(store2, invite)
    console.log('✓ Second instance paired')
    
    // Read data from second instance
    console.log('\n5. Reading data from second instance...')
    await new Promise(resolve => setTimeout(resolve, 500)) // Give time to sync
    
    const syncedValue = await pass2.get('test-key')
    const syncedPatient = await pass2.get('patient:john')
    
    console.log(`✓ Synced value: ${syncedValue}`)
    console.log(`✓ Synced patient: ${syncedPatient}`)
    
    // Add data from second instance
    console.log('\n6. Adding data from second instance...')
    await pass2.add('doctor:smith', JSON.stringify({ name: 'Dr. Smith', specialty: 'Primary Care' }))
    console.log('✓ Doctor data added')
    
    // Check if first instance sees it
    console.log('\n7. Checking if first instance sees new data...')
    await new Promise(resolve => setTimeout(resolve, 500)) // Give time to sync
    
    const doctorData = await pass1.get('doctor:smith')
    console.log(`✓ First instance sees: ${doctorData}`)
    
    console.log('\n✅ Autopass test successful!')
    
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
testAutopass().catch(console.error)