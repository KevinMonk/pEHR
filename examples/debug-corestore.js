/**
 * Debug Corestore initialization directly
 */

import Corestore from 'corestore'
import { randomBytes } from 'crypto'
import os from 'os'
import path from 'path'

async function debugCorestore() {
  console.log('Debugging Corestore initialization patterns...\n')
  
  const attempts = [
    {
      name: 'Basic Corestore (no options)',
      fn: async () => {
        const dir = path.join(os.tmpdir(), 'corestore-1-' + randomBytes(4).toString('hex'))
        const store = new Corestore(dir)
        await store.ready()
        return store
      }
    },
    {
      name: 'Corestore with primaryKey',
      fn: async () => {
        const dir = path.join(os.tmpdir(), 'corestore-2-' + randomBytes(4).toString('hex'))
        const primaryKey = randomBytes(32)
        const store = new Corestore(dir, { primaryKey })
        await store.ready()
        return store
      }
    },
    {
      name: 'Get core with name',
      fn: async () => {
        const dir = path.join(os.tmpdir(), 'corestore-3-' + randomBytes(4).toString('hex'))
        const store = new Corestore(dir)
        await store.ready()
        const core = store.get({ name: 'test-core' })
        await core.ready()
        return { store, core }
      }
    },
    {
      name: 'Get core with generated key',
      fn: async () => {
        const dir = path.join(os.tmpdir(), 'corestore-4-' + randomBytes(4).toString('hex'))
        const store = new Corestore(dir)
        await store.ready()
        const core = store.get()
        await core.ready()
        return { store, core }
      }
    }
  ]
  
  for (const attempt of attempts) {
    console.log(`Trying: ${attempt.name}`)
    try {
      const result = await attempt.fn()
      console.log(`✅ SUCCESS: ${attempt.name} worked!`)
      
      if (result.core) {
        console.log(`   Core key: ${result.core.key?.toString('hex').substring(0, 16)}...`)
        console.log(`   Discovery key: ${result.core.discoveryKey?.toString('hex').substring(0, 16)}...`)
      }
      
      // Cleanup
      if (result.store) await result.store.close()
      else if (result.close) await result.close()
      
    } catch (error) {
      console.log(`❌ FAILED: ${attempt.name}`)
      console.log(`   Error: ${error.message}`)
    }
    console.log()
  }
}

debugCorestore().catch(console.error)