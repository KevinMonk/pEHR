/**
 * Debug Autopass initialization - try different approaches
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import { randomBytes } from 'crypto'
import os from 'os'
import path from 'path'

async function debugAutopass() {
  console.log('Debugging Autopass initialization...\n')
  
  const attempts = [
    {
      name: 'Basic Corestore',
      fn: async () => {
        const dir = path.join(os.tmpdir(), 'debug-1-' + randomBytes(4).toString('hex'))
        const store = new Corestore(dir)
        return new Autopass(store)
      }
    },
    {
      name: 'Corestore with primaryKey',
      fn: async () => {
        const dir = path.join(os.tmpdir(), 'debug-2-' + randomBytes(4).toString('hex'))
        const primaryKey = randomBytes(32)
        const store = new Corestore(dir, { primaryKey })
        return new Autopass(store)
      }
    },
    {
      name: 'Corestore with network options',
      fn: async () => {
        const dir = path.join(os.tmpdir(), 'debug-3-' + randomBytes(4).toString('hex'))
        const store = new Corestore(dir, { 
          network: { bootstrap: [] }
        })
        return new Autopass(store)
      }
    },
    {
      name: 'Autopass with options',
      fn: async () => {
        const dir = path.join(os.tmpdir(), 'debug-4-' + randomBytes(4).toString('hex'))
        const store = new Corestore(dir)
        return new Autopass(store, { 
          replicate: false 
        })
      }
    }
  ]
  
  for (const attempt of attempts) {
    console.log(`Trying: ${attempt.name}`)
    try {
      const autopass = await attempt.fn()
      await autopass.ready()
      console.log(`✅ SUCCESS: ${attempt.name} worked!`)
      
      // Try basic operations
      await autopass.add('test', 'value')
      const val = await autopass.get('test')
      console.log(`   Can store/retrieve: ${val}`)
      
      const invite = await autopass.createInvite()
      console.log(`   Can create invite: ${invite.toString().substring(0, 20)}...`)
      
      await autopass.close()
      break
      
    } catch (error) {
      console.log(`❌ FAILED: ${attempt.name}`)
      console.log(`   Error: ${error.message}`)
    }
    console.log()
  }
}

debugAutopass().catch(console.error)