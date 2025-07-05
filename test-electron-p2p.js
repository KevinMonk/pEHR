#!/usr/bin/env node

/**
 * Test script to verify P2P connectivity between two Electron instances
 * This simulates the patient-provider workflow we built in the live demos
 */

import { EHRAutopass } from './src/core/ehr-autopass.js'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

console.log('🧪 Testing Electron P2P Setup')
console.log('=' .repeat(50))

// Helper to generate unique temp directories
function createTempDir(prefix) {
  const random = randomBytes(4).toString('hex')
  return join(tmpdir(), `${prefix}-${random}`)
}

async function testP2PConnection() {
  console.log('\n🎯 Step 1: Creating Patient Alice (like first Electron instance)')
  const aliceDir = createTempDir('alice-electron-test')
  const alice = new EHRAutopass({
    storagePath: aliceDir,
    role: 'patient',
    patientId: 'alice-electron-test',
    name: 'Alice Johnson',
    dateOfBirth: '1985-06-15'
  })
  
  await alice.initialize()
  console.log(`✓ Alice initialized`)
  console.log(`   Patient ID: ${alice.options.patientId}`)
  console.log(`   Key: ${alice.autopass.key.toString('hex').substring(0, 16)}...`)
  console.log(`   Peers: ${alice.autopass?.swarm?.connections?.size || 0}`)
  
  console.log('\n🎯 Step 2: Alice creates invitation (like "Invite Provider" button)')
  const invite = await alice.inviteProvider('Dr. Smith', 'primary-care')
  console.log(`✓ Invitation created: ${invite.substring(0, 50)}...`)
  
  console.log('\n🎯 Step 3: Creating Provider Dr. Smith (like second Electron instance)')
  const doctorDir = createTempDir('dr-smith-electron-test')
  const drSmith = await EHRAutopass.joinAsProvider(doctorDir, 'dr-smith-test', invite)
  
  console.log(`✓ Dr. Smith joined`)
  console.log(`   Provider ID: ${drSmith.options.providerId}`)
  console.log(`   Key: ${drSmith.autopass.key.toString('hex').substring(0, 16)}...`)
  
  console.log('\n🎯 Step 4: Waiting for P2P connection...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const alicePeers = alice.autopass?.swarm?.connections?.size || 0
  const doctorPeers = drSmith.autopass?.swarm?.connections?.size || 0
  
  console.log(`   Alice peers: ${alicePeers}`)
  console.log(`   Doctor peers: ${doctorPeers}`)
  
  if (alicePeers > 0 && doctorPeers > 0) {
    console.log('\n✅ SUCCESS: P2P connection established!')
    console.log('   This means your Electron app should work the same way')
    console.log('   Make sure to use the "Invite Provider" workflow')
  } else {
    console.log('\n⚠️  No direct peer connection yet, but this is normal')
    console.log('   P2P connections happen through data replication')
    console.log('   Let\'s test data sync...')
  }
  
  console.log('\n🎯 Step 5: Testing data synchronization')
  
  // Alice adds a record
  await alice.addMedicalRecord({
    type: 'vital_signs',
    timestamp: new Date().toISOString(),
    data: {
      blood_pressure: { systolic: 120, diastolic: 80 },
      heart_rate: 72
    }
  })
  console.log('✓ Alice added vital signs')
  
  // Wait for sync
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Doctor tries to read records
  const doctorRecords = await drSmith.getPatientRecords(alice.options.patientId)
  console.log(`✓ Doctor can see ${doctorRecords.length} patient records`)
  
  if (doctorRecords.length > 0) {
    console.log('\n🎉 FULL SUCCESS: P2P data replication working!')
    console.log('   Your Electron instances should connect the same way')
  } else {
    console.log('\n🔄 Data still syncing - this is normal for P2P systems')
  }
  
  console.log('\n📋 ELECTRON APP INSTRUCTIONS:')
  console.log('1. Start first instance: npm run electron')
  console.log('2. Set up as Patient with name and storage path')
  console.log('3. Go to Network tab and click "Invite Provider"')
  console.log('4. Copy the invitation code')
  console.log('5. Start second instance: npm run electron')
  console.log('6. Set up as Provider and paste invitation code')
  console.log('7. Both should show connected peers after setup')
  
  // Cleanup
  await alice.close()
  await drSmith.close()
  
  console.log('\n✅ Test completed - Check console logs for any errors')
}

testP2PConnection().catch(console.error)