#!/usr/bin/env node

/**
 * pEHR - Distributed P2P Electronic Health Record System
 * Main entry point for the application
 */

import { EHRCoreSimple as EHRCore } from './core/ehr-core-simple.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pkg = require('../package.json')

async function main() {
  console.log(`pEHR v${pkg.version} - Distributed P2P EHR System`)
  console.log('Starting P2P EHR system...')
  
  try {
    // Initialize the core EHR system
    const ehr = new EHRCore({
      storagePath: './ehr-store',
      filesPath: './ehr-files'
    })
    
    await ehr.initialize()
    console.log('EHR system initialized successfully')
    
    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...')
      await ehr.close()
      process.exit(0)
    })
    
    // Basic status display
    setInterval(async () => {
      const status = await ehr.getStatus()
      console.log(`Connected peers: ${status.connectedPeers} | Records: ${status.recordCount}`)
    }, 10000)
    
  } catch (error) {
    console.error('Failed to start EHR system:', error)
    process.exit(1)
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}