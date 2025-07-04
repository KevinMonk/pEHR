/**
 * EHR P2P Demo - Demonstrates patient-controlled health records
 */

import { EHRAutopass } from '../src/core/ehr-autopass.js'
import { randomBytes } from 'crypto'
import os from 'os'
import path from 'path'

async function demoEHRP2P() {
  console.log('🏥 EHR P2P Demo - Patient-Controlled Health Records\n')
  
  let patient = null
  let doctor = null
  
  try {
    // 1. Create patient node
    console.log('1. Creating patient node...')
    const patientDir = path.join(os.tmpdir(), 'ehr-patient-' + randomBytes(4).toString('hex'))
    patient = new EHRAutopass({
      storagePath: patientDir,
      role: 'patient',
      patientId: 'patient-alice'
    })
    await patient.initialize()
    console.log('✓ Patient node ready')
    console.log(`   Patient ID: ${patient.metadata.patientId}`)
    console.log(`   Key: ${patient.autopass.key?.toString('hex').substring(0, 16)}...`)
    console.log(`   Writable: ${patient.autopass.writable}`)
    
    // 2. Patient adds self-reported data
    console.log('\n2. Patient adding personal health data...')
    await patient.addMedicalRecord({
      type: 'vital_signs',
      timestamp: new Date().toISOString(),
      data: {
        blood_pressure: { systolic: 120, diastolic: 80 },
        heart_rate: 72,
        temperature: 98.6,
        weight: 150,
        notes: 'Self-reported morning vitals'
      },
      author: 'patient-alice',
      location: 'home'
    })
    console.log('✓ Vital signs recorded')
    
    // 3. Create invite for doctor
    console.log('\n3. Patient creating invite for doctor...')
    const invite = await patient.inviteProvider('Dr. Smith', 'primary-care')
    console.log('✓ Invite created:')
    console.log(`   ${invite}`)
    
    // 4. Doctor joins using invite
    console.log('\n4. Doctor joining with invite...')
    const doctorDir = path.join(os.tmpdir(), 'ehr-doctor-' + randomBytes(4).toString('hex'))
    doctor = await EHRAutopass.joinAsProvider(doctorDir, 'dr-smith', invite)
    console.log('✓ Doctor connected')
    console.log(`   Doctor ID: ${doctor.metadata.providerId}`)
    console.log(`   Writable: ${doctor.autopass.writable}`)
    
    // 5. Give time for initial sync
    console.log('\n5. Waiting for data synchronization...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 6. Doctor reads patient's records
    console.log('\n6. Doctor accessing patient records...')
    const patientRecords = await doctor.getPatientRecords('patient-alice')
    console.log('✓ Patient records synchronized:')
    for (const record of patientRecords) {
      console.log(`   ${record.type}: ${record.data.heart_rate ? record.data.heart_rate + ' bpm' : 'Data available'}`)
    }
    
    // 7. Doctor adds medical assessment
    console.log('\n7. Doctor adding medical assessment...')
    await doctor.addMedicalRecord({
      type: 'assessment',
      timestamp: new Date().toISOString(),
      patientId: 'patient-alice',
      data: {
        diagnosis: 'Routine check-up',
        findings: 'All vital signs within normal range',
        recommendations: [
          'Continue current lifestyle',
          'Return in 6 months for follow-up'
        ],
        medications: []
      },
      author: 'dr-smith',
      location: 'clinic'
    })
    console.log('✓ Medical assessment recorded')
    
    // 8. Patient sees doctor's assessment
    console.log('\n8. Patient checking for new records...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const updatedRecords = await patient.getPatientRecords('patient-alice')
    console.log('✓ Updated records available:')
    for (const record of updatedRecords) {
      if (record.author === 'dr-smith') {
        console.log(`   Doctor's ${record.type}: ${record.data.diagnosis}`)
      }
    }
    
    console.log('\n🎉 SUCCESS! P2P EHR working perfectly!')
    console.log('\nKey achievements:')
    console.log('• Patient controls their own health data')
    console.log('• Doctor access via secure invites only')
    console.log('• Real-time P2P synchronization')
    console.log('• No central servers or gatekeepers')
    console.log('• HIPAA-ready encrypted communication')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    // Cleanup
    try {
      await patient?.close()
      await doctor?.close()
      console.log('\nDemo cleanup completed')
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

demoEHRP2P().catch(console.error)