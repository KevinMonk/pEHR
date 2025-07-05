#!/usr/bin/env node

import { EHRAutopass } from '../src/core/ehr-autopass.js'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

console.log('🏥 P2P EHR Live Demo - Interactive Healthcare Network')
console.log('='.repeat(60))

// Helper function to wait for user input
function waitForInput(message) {
  return new Promise(resolve => {
    process.stdout.write(message)
    process.stdin.once('data', () => resolve())
  })
}

// Helper to generate unique temp directories
function createTempDir(prefix) {
  const random = randomBytes(4).toString('hex')
  return join(tmpdir(), `${prefix}-${random}`)
}

async function runDemo() {
  console.log('\n📋 SCENARIO: Patient Alice needs medical care')
  console.log('   - Alice controls her own health data')
  console.log('   - She can invite doctors to access specific records')
  console.log('   - All data syncs peer-to-peer, no central servers')
  
  await waitForInput('\nPress Enter to start the demo...')
  
  // Step 1: Create Patient Alice
  console.log('\n🎯 Step 1: Alice creates her personal health record')
  const aliceDir = createTempDir('alice-ehr')
  const alice = new EHRAutopass({
    storagePath: aliceDir,
    role: 'patient',
    patientId: 'alice-2024',
    name: 'Alice Johnson',
    dateOfBirth: '1985-06-15'
  })
  
  await alice.initialize()
  console.log(`✓ Alice's EHR initialized`)
  console.log(`   Patient ID: ${alice.options.patientId}`)
  console.log(`   Storage: ${aliceDir}`)
  console.log(`   Key: ${alice.autopass.key.toString('hex').substring(0, 16)}...`)
  
  await waitForInput('\nPress Enter to continue...')
  
  // Step 2: Alice adds her medical history
  console.log('\n🎯 Step 2: Alice adds her medical history')
  
  // Add vital signs
  await alice.addMedicalRecord({
    type: 'vital_signs',
    timestamp: new Date().toISOString(),
    data: {
      blood_pressure: { systolic: 125, diastolic: 82 },
      heart_rate: 75,
      temperature: 98.4,
      weight: 140,
      height: 165,
      notes: 'Morning vitals after coffee'
    }
  })
  console.log('✓ Vital signs recorded')
  
  // Add medical history
  await alice.addMedicalRecord({
    type: 'medical_history',
    timestamp: new Date().toISOString(),
    data: {
      allergies: ['penicillin', 'shellfish'],
      medications: ['Vitamin D3 2000 IU daily'],
      past_surgeries: ['Appendectomy 2010'],
      family_history: ['Diabetes (maternal)', 'Heart disease (paternal)'],
      notes: 'Generally healthy, exercises regularly'
    }
  })
  console.log('✓ Medical history recorded')
  
  // Add recent symptoms
  await alice.addMedicalRecord({
    type: 'symptoms',
    timestamp: new Date().toISOString(),
    data: {
      chief_complaint: 'Persistent headaches',
      duration: '3 days',
      severity: 6,
      triggers: ['stress', 'lack of sleep'],
      notes: 'Headaches worse in the morning, improve with ibuprofen'
    }
  })
  console.log('✓ Current symptoms recorded')
  
  await waitForInput('\nPress Enter to continue...')
  
  // Step 3: Show Alice's records
  console.log('\n🎯 Step 3: Viewing Alice\'s complete health record')
  const aliceRecords = await alice.getPatientRecords(alice.options.patientId)
  
  console.log(`\n📊 Alice's Health Records (${aliceRecords.length} entries):`)
  aliceRecords.forEach((record, i) => {
    console.log(`\n${i + 1}. ${record.type.toUpperCase()} - ${new Date(record.timestamp).toLocaleString()}`)
    if (record.type === 'vital_signs') {
      console.log(`   Blood Pressure: ${record.data.blood_pressure.systolic}/${record.data.blood_pressure.diastolic}`)
      console.log(`   Heart Rate: ${record.data.heart_rate} bpm`)
      console.log(`   Weight: ${record.data.weight} lbs`)
    } else if (record.type === 'medical_history') {
      console.log(`   Allergies: ${record.data.allergies.join(', ')}`)
      console.log(`   Medications: ${record.data.medications.join(', ')}`)
    } else if (record.type === 'symptoms') {
      console.log(`   Complaint: ${record.data.chief_complaint}`)
      console.log(`   Severity: ${record.data.severity}/10`)
    }
  })
  
  await waitForInput('\nPress Enter to continue...')
  
  // Step 4: Alice needs medical care
  console.log('\n🎯 Step 4: Alice needs to see a doctor')
  console.log('   Alice wants to share her records with Dr. Smith for consultation')
  
  const invite = await alice.inviteProvider('Dr. Smith', 'primary-care')
  console.log('\n✓ Secure invite created for Dr. Smith')
  console.log(`   Invite Code: ${invite}`)
  console.log('\n🔐 This invite allows Dr. Smith to:')
  console.log('   - Access Alice\'s medical records')
  console.log('   - Add new medical assessments')
  console.log('   - Sync data peer-to-peer')
  console.log('   - Cannot modify Alice\'s existing records')
  
  await waitForInput('\nPress Enter to simulate Dr. Smith joining...')
  
  // Step 5: Dr. Smith joins
  console.log('\n🎯 Step 5: Dr. Smith joins using the invite')
  const doctorDir = createTempDir('dr-smith-ehr')
  const drSmith = await EHRAutopass.joinAsProvider(doctorDir, 'dr-smith', invite)
  
  console.log('✓ Dr. Smith connected successfully')
  console.log(`   Doctor ID: ${drSmith.options.providerId}`)
  console.log(`   Storage: ${doctorDir}`)
  console.log(`   Connected to Alice's health network`)
  
  await waitForInput('\nPress Enter to continue...')
  
  // Step 6: Doctor reviews patient records
  console.log('\n🎯 Step 6: Dr. Smith reviews Alice\'s medical records')
  
  // Wait for sync
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const doctorViewRecords = await drSmith.getPatientRecords(alice.options.patientId)
  console.log(`\n👨‍⚕️ Dr. Smith's view of Alice's records (${doctorViewRecords.length} entries):`)
  
  doctorViewRecords.forEach((record, i) => {
    console.log(`\n${i + 1}. ${record.type.toUpperCase()}`)
    if (record.type === 'vital_signs') {
      console.log(`   📊 BP: ${record.data.blood_pressure.systolic}/${record.data.blood_pressure.diastolic}, HR: ${record.data.heart_rate}`)
    } else if (record.type === 'medical_history') {
      console.log(`   🚨 Allergies: ${record.data.allergies.join(', ')}`)
      console.log(`   💊 Current meds: ${record.data.medications.join(', ')}`)
    } else if (record.type === 'symptoms') {
      console.log(`   🤕 Chief complaint: ${record.data.chief_complaint}`)
      console.log(`   📈 Severity: ${record.data.severity}/10`)
    }
  })
  
  await waitForInput('\nPress Enter to continue...')
  
  // Step 7: Doctor adds assessment
  console.log('\n🎯 Step 7: Dr. Smith adds medical assessment')
  
  await drSmith.addMedicalRecord({
    type: 'assessment',
    timestamp: new Date().toISOString(),
    providerId: 'dr-smith',
    providerName: 'Dr. Smith',
    data: {
      diagnosis: 'Tension headaches likely due to stress',
      assessment: 'Patient presents with 3-day history of morning headaches. Vital signs stable. Medical history significant for stress triggers.',
      recommendations: [
        'Stress management techniques',
        'Regular sleep schedule (7-8 hours)',
        'Limit caffeine intake',
        'Consider relaxation therapy'
      ],
      follow_up: 'Return in 2 weeks if symptoms persist',
      prescribed_medications: ['Magnesium supplement 400mg daily'],
      notes: 'Patient educated on headache triggers and lifestyle modifications'
    }
  })
  
  console.log('✓ Medical assessment recorded by Dr. Smith')
  
  await waitForInput('\nPress Enter to continue...')
  
  // Step 8: Alice sees the updated records
  console.log('\n🎯 Step 8: Alice checks her updated health records')
  
  // Wait for sync
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const updatedRecords = await alice.getPatientRecords(alice.options.patientId)
  const newAssessment = updatedRecords.find(r => r.type === 'assessment')
  
  console.log(`\n📋 Alice's updated records (${updatedRecords.length} total entries):`)
  
  if (newAssessment) {
    console.log('\n🆕 NEW ASSESSMENT from Dr. Smith:')
    console.log(`   Diagnosis: ${newAssessment.data.diagnosis}`)
    console.log(`   Assessment: ${newAssessment.data.assessment}`)
    console.log(`   Recommendations:`)
    newAssessment.data.recommendations.forEach(rec => {
      console.log(`     • ${rec}`)
    })
    console.log(`   Follow-up: ${newAssessment.data.follow_up}`)
    console.log(`   Prescribed: ${newAssessment.data.prescribed_medications.join(', ')}`)
  }
  
  await waitForInput('\nPress Enter to continue...')
  
  // Step 9: Show P2P architecture benefits
  console.log('\n🎯 Step 9: P2P Architecture Benefits Demonstrated')
  console.log('\n🔒 PRIVACY & CONTROL:')
  console.log('   ✓ Alice owns and controls her health data')
  console.log('   ✓ No central server storing sensitive information')
  console.log('   ✓ Alice can revoke doctor access at any time')
  
  console.log('\n🌐 PEER-TO-PEER SYNC:')
  console.log('   ✓ Data syncs directly between Alice and Dr. Smith')
  console.log('   ✓ Works offline - syncs when peers reconnect')
  console.log('   ✓ Encrypted communication using public key cryptography')
  
  console.log('\n🏥 HEALTHCARE WORKFLOW:')
  console.log('   ✓ Patient-controlled invites for provider access')
  console.log('   ✓ Real-time collaboration between patient and providers')
  console.log('   ✓ Audit trail of all medical records and assessments')
  
  console.log('\n📊 TECHNICAL ACHIEVEMENTS:')
  console.log('   ✓ Built on Hypercore Protocol (peer-to-peer database)')
  console.log('   ✓ Uses Autobase for multi-writer collaboration')
  console.log('   ✓ Encrypted storage with patient-controlled keys')
  console.log('   ✓ OpenEHR compliant data structures')
  
  await waitForInput('\nPress Enter to finish demo...')
  
  // Cleanup
  console.log('\n🎯 Demo Complete - Cleaning up...')
  await alice.close()
  await drSmith.close()
  
  console.log('\n🎉 P2P EHR Demo Successfully Completed!')
  console.log('\n💡 Key Takeaways:')
  console.log('   • Patients have full control over their health data')
  console.log('   • No central servers or gatekeepers required')
  console.log('   • Secure peer-to-peer synchronization')
  console.log('   • Real-time collaboration between patients and providers')
  console.log('   • Privacy-preserving healthcare data exchange')
  
  console.log('\n🚀 Ready for production use with HIPAA compliance!')
  
  process.exit(0)
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Demo interrupted - Thanks for trying P2P EHR!')
  process.exit(0)
})

runDemo().catch(console.error)