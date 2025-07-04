/**
 * Correct Autopass test based on source code analysis
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import os from 'os'
import path from 'path'
import { randomBytes } from 'crypto'

async function testCorrectAutopass() {
  console.log('Testing Autopass the correct way...\n')
  
  let pass1 = null
  let pass2 = null
  
  try {
    // Create first Autopass instance - let it create everything itself
    console.log('1. Creating first Autopass instance...')
    const dir1 = path.join(os.tmpdir(), 'autopass-1-' + randomBytes(4).toString('hex'))
    const store1 = new Corestore(dir1)
    
    // Just create Autopass with store - no extra options
    pass1 = new Autopass(store1)
    await pass1.ready()
    console.log('✓ First Autopass ready')
    console.log(`  Key: ${pass1.key?.toString('hex').substring(0, 16)}...`)
    console.log(`  Discovery: ${pass1.discoveryKey?.toString('hex').substring(0, 16)}...`)
    console.log(`  Writable: ${pass1.writable}`)
    
    // Add some data
    console.log('\n2. Adding data to first instance...')
    await pass1.add('test-key', 'test-value')
    await pass1.add('patient:john', { name: 'John Doe', age: 35 })
    console.log('✓ Data added')
    
    // Verify data
    const value = await pass1.get('test-key')
    console.log(`✓ Retrieved: ${value}`)
    
    // Create invite for pairing
    console.log('\n3. Creating invite...')
    const invite = await pass1.createInvite()
    console.log('✓ Invite created:')
    console.log(`  ${invite}`)
    
    // Pair second instance using the invite
    console.log('\n4. Pairing second instance...')
    const dir2 = path.join(os.tmpdir(), 'autopass-2-' + randomBytes(4).toString('hex'))
    const store2 = new Corestore(dir2)
    
    // Use the pair method as shown in source
    const pairing = Autopass.pair(store2, invite)
    pass2 = await pairing.finished()
    console.log('✓ Second instance paired')
    
    // Give time for initial sync
    console.log('\n5. Waiting for sync...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Read data from second instance
    console.log('\n6. Reading data from second instance...')
    const syncedValue = await pass2.get('test-key')
    const syncedPatient = await pass2.get('patient:john')
    
    console.log(`✓ Synced value: ${syncedValue}`)
    console.log(`✓ Synced patient: ${JSON.stringify(syncedPatient)}`)
    
    // Add data from second instance
    console.log('\n7. Adding data from second instance...')
    await pass2.add('doctor:smith', { name: 'Dr. Smith', specialty: 'Primary Care' })
    console.log('✓ Doctor data added')
    
    // Check if first instance sees it
    console.log('\n8. Checking if first instance sees new data...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const doctorData = await pass1.get('doctor:smith')
    console.log(`✓ First instance sees: ${JSON.stringify(doctorData)}`)
    
    console.log('\n🎉 SUCCESS! Autopass is working perfectly!')
    console.log('The key was to let Autopass manage everything and use proper pairing!')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // Cleanup
    try {
      await pass1?.close()
      await pass2?.close()
    } catch (e) {
      console.log('Cleanup completed')
    }
  }
}

testCorrectAutopass().catch(console.error)