/**
 * Test Autopass with explicit bootstrap key
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import { randomBytes } from 'crypto'
import os from 'os'
import path from 'path'

async function testAutopassWithBootstrap() {
  console.log('Testing Autopass with explicit bootstrap key...\n')
  
  let pass1 = null
  let pass2 = null
  
  try {
    // Method 1: Try with explicit bootstrap key
    console.log('1. Creating Autopass with bootstrap key...')
    const dir1 = path.join(os.tmpdir(), 'autopass-1-' + randomBytes(4).toString('hex'))
    const store1 = new Corestore(dir1)
    await store1.ready()
    
    // Generate a bootstrap key
    const bootstrapKey = randomBytes(32)
    console.log(`   Bootstrap key: ${bootstrapKey.toString('hex').substring(0, 16)}...`)
    
    pass1 = new Autopass(store1, { 
      key: bootstrapKey,
      bootstrap: null 
    })
    await pass1.ready()
    console.log('✓ First Autopass ready with bootstrap key')
    
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
    await store2.ready()
    
    pass2 = await Autopass.pair(store2, invite)
    console.log('✓ Second instance paired')
    
    // Read data from second instance
    console.log('\n5. Reading data from second instance...')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Give time to sync
    
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
    await new Promise(resolve => setTimeout(resolve, 1000)) // Give time to sync
    
    const doctorData = await pass1.get('doctor:smith')
    console.log(`✓ First instance sees: ${JSON.stringify(doctorData)}`)
    
    console.log('\n🎉 SUCCESS! Autopass working with bootstrap key!')
    
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

// Alternative approach: Use createKeyPair from Corestore
async function testAutopassWithCorestore() {
  console.log('\n=== Alternative: Using Corestore createKeyPair ===\n')
  
  let pass1 = null
  let pass2 = null
  
  try {
    console.log('1. Creating Autopass with Corestore-generated key...')
    const dir1 = path.join(os.tmpdir(), 'autopass-alt-1-' + randomBytes(4).toString('hex'))
    const store1 = new Corestore(dir1)
    await store1.ready()
    
    // Use Corestore's key generation
    const keyPair = await store1.createKeyPair('autopass')
    console.log(`   Generated key: ${keyPair.publicKey.toString('hex').substring(0, 16)}...`)
    
    pass1 = new Autopass(store1, { 
      key: keyPair.publicKey,
      bootstrap: null 
    })
    await pass1.ready()
    console.log('✓ Autopass ready with Corestore-generated key')
    
    // Test basic functionality
    await pass1.add('test', 'works')
    const result = await pass1.get('test')
    console.log(`✓ Basic test: ${result}`)
    
    console.log('\n🎉 SUCCESS! Alternative approach also works!')
    
  } catch (error) {
    console.error('\n❌ Alternative failed:', error.message)
  } finally {
    try {
      await pass1?.close()
      await pass2?.close()
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Run both tests
async function runAllTests() {
  await testAutopassWithBootstrap()
  await testAutopassWithCorestore()
}

runAllTests().catch(console.error)