/**
 * Minimal Autopass test - just create and add one item
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import os from 'os'
import path from 'path'
import { randomBytes } from 'crypto'

async function testMinimalAutopass() {
  console.log('Testing minimal Autopass creation...\n')
  
  try {
    console.log('1. Creating Corestore...')
    const dir = path.join(os.tmpdir(), 'autopass-minimal-' + randomBytes(4).toString('hex'))
    const store = new Corestore(dir)
    await store.ready()
    console.log('✓ Corestore ready')
    
    console.log('\n2. Creating Autopass without any options...')
    const pass = new Autopass(store)
    await pass.ready()
    console.log('✓ Autopass ready')
    
    console.log('\n3. Adding a simple item...')
    await pass.add('hello', 'world')
    console.log('✓ Item added')
    
    console.log('\n4. Retrieving the item...')
    const value = await pass.get('hello')
    console.log(`✓ Retrieved: ${value}`)
    
    console.log('\n🎉 SUCCESS! Basic Autopass works!')
    
    await pass.close()
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testMinimalAutopass().catch(console.error)