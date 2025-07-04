/**
 * Minimal Autopass test - based on their test structure
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import os from 'os'
import path from 'path'
import { randomBytes } from 'crypto'

// Create temp directory helper
function tmpdir() {
  const dir = path.join(os.tmpdir(), 'autopass-test-' + randomBytes(8).toString('hex'))
  return dir
}

async function minimalTest() {
  console.log('Minimal Autopass Test\n')
  
  const dir1 = tmpdir()
  const dir2 = tmpdir()
  
  let a = null
  let b = null
  
  try {
    // Create first Autopass
    console.log('1. Creating first Autopass...')
    console.log(`   Directory: ${dir1}`)
    a = new Autopass(new Corestore(dir1))
    await a.ready()
    console.log('✓ First Autopass ready')
    
    // Add data
    console.log('\n2. Adding data...')
    await a.add('hello', 'world')
    const val = await a.get('hello')
    console.log(`✓ Added and retrieved: ${val}`)
    
    // Create invite
    console.log('\n3. Creating invite...')
    const inv = await a.createInvite()
    console.log(`✓ Invite: ${inv}`)
    
    // Pair second instance
    console.log('\n4. Pairing second Autopass...')
    console.log(`   Directory: ${dir2}`)
    b = await Autopass.pair(new Corestore(dir2), inv)
    console.log('✓ Second Autopass paired')
    
    // Try to read from second
    console.log('\n5. Reading from paired instance...')
    // Give it a moment to sync
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const val2 = await b.get('hello')
    console.log(`✓ Retrieved from second: ${val2}`)
    
    console.log('\n✅ Success! Autopass is working.')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    try {
      await a?.close()
      await b?.close()
    } catch (e) {
      // Ignore
    }
  }
}

minimalTest().catch(console.error)