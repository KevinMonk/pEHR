/**
 * P2P Demo - Demonstrates true peer-to-peer EHR functionality with Autopass
 * 
 * This example shows:
 * 1. Patient creating their EHR
 * 2. Patient inviting a doctor
 * 3. Doctor pairing and adding records
 * 4. Real-time synchronization
 */

import { EHRAutopass } from '../src/core/ehr-autopass.js'
import chalk from 'chalk'

async function p2pDemo() {
  console.log(chalk.blue('=== pEHR P2P Demo with Autopass ===\n'))
  
  let patientEHR = null
  let doctorEHR = null
  
  try {
    // Step 1: Patient creates their EHR
    console.log(chalk.cyan('1. Patient John Doe creates his EHR...'))
    patientEHR = new EHRAutopass({
      role: 'patient',
      patientId: 'john-doe',
      storagePath: './demo-ehr-data'
    })
    
    await patientEHR.initialize()
    
    let status = await patientEHR.getStatus()
    console.log(chalk.green('✓'), 'Patient EHR created')
    console.log(`   Records: ${status.recordCount}, Files: ${status.fileCount}, Writers: ${status.writers}\n`)
    
    // Step 2: Patient adds initial data
    console.log(chalk.cyan('2. Patient adds personal health information...'))
    
    // Add demographics
    await patientEHR.addMedicalRecord({
      patientId: 'john-doe',
      archetype: 'openEHR-EHR-COMPOSITION.encounter.v1',
      data: {
        name: 'John Doe',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        bloodType: 'O+',
        allergies: ['Penicillin']
      }
    })
    
    // Add self-reported symptoms
    await patientEHR.addMedicalRecord({
      patientId: 'john-doe',
      archetype: 'openEHR-EHR-OBSERVATION.symptom_sign.v1',
      data: {
        symptom: 'Persistent headaches',
        severity: 'moderate',
        duration: '2 weeks',
        notes: 'Worse in the morning, improves with caffeine'
      }
    })
    
    console.log(chalk.green('✓'), 'Personal health data added\n')
    
    // Step 3: Patient invites doctor
    console.log(chalk.cyan('3. Patient invites Dr. Smith...'))
    const invite = await patientEHR.inviteProvider('primary-care', 'dr-smith')
    console.log(chalk.green('✓'), 'Invite created:')
    console.log(chalk.gray(`   ${invite}\n`))
    
    // Step 4: Doctor pairs with patient
    console.log(chalk.cyan('4. Dr. Smith pairs with patient using invite...'))
    doctorEHR = await EHRAutopass.pair(invite, {
      role: 'provider',
      providerId: 'dr-smith',
      storagePath: './demo-ehr-data'
    })
    
    console.log(chalk.green('✓'), 'Doctor successfully paired with patient\n')
    
    // Step 5: Doctor reads existing records
    console.log(chalk.cyan('5. Dr. Smith reviews patient records...'))
    const records = await doctorEHR.getPatientRecords('john-doe')
    console.log(`   Found ${records.length} existing records:`)
    records.forEach(record => {
      console.log(`   - ${record.archetype}: ${JSON.stringify(record.data).substring(0, 50)}...`)
    })
    console.log()
    
    // Step 6: Doctor adds diagnosis
    console.log(chalk.cyan('6. Dr. Smith adds diagnosis...'))
    await doctorEHR.addDiagnosis(
      'john-doe',
      'Tension Headache',
      'moderate',
      'Likely stress-related, recommend lifestyle changes'
    )
    console.log(chalk.green('✓'), 'Diagnosis added\n')
    
    // Step 7: Doctor prescribes medication
    console.log(chalk.cyan('7. Dr. Smith prescribes medication...'))
    await doctorEHR.addMedication(
      'john-doe',
      'Ibuprofen',
      '400mg',
      'twice daily',
      'Take with food, use for 1 week then reassess'
    )
    console.log(chalk.green('✓'), 'Prescription added\n')
    
    // Step 8: Add vital signs
    console.log(chalk.cyan('8. Nurse adds vital signs...'))
    await doctorEHR.addVitalSigns('john-doe', {
      bloodPressure: '120/80',
      heartRate: '72',
      temperature: '98.6',
      weight: '180 lbs'
    })
    console.log(chalk.green('✓'), 'Vital signs recorded\n')
    
    // Step 9: Doctor uploads test results
    console.log(chalk.cyan('9. Dr. Smith uploads blood test results...'))
    const testResults = Buffer.from('Blood test results: All normal ranges')
    const file = await doctorEHR.addMedicalFile(
      'blood-test-2024-01.pdf',
      testResults,
      {
        testType: 'Complete Blood Count',
        labName: 'City Medical Lab'
      }
    )
    console.log(chalk.green('✓'), 'Test results uploaded')
    console.log(`   File ID: ${file.fileId}\n`)
    
    // Step 10: Patient sees all updates
    console.log(chalk.cyan('10. Patient John checks his updated records...'))
    console.log(chalk.yellow('    (In real P2P, this would happen on different machines!)'))
    
    // Wait a moment for sync (in real implementation, this would be instant)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const updatedRecords = await patientEHR.getPatientRecords('john-doe')
    console.log(`   Total records: ${updatedRecords.length}`)
    
    // Group by author
    const patientRecords = updatedRecords.filter(r => r.authorRole === 'patient')
    const doctorRecords = updatedRecords.filter(r => r.authorRole === 'provider')
    
    console.log(`   - Added by patient: ${patientRecords.length}`)
    console.log(`   - Added by doctor: ${doctorRecords.length}`)
    
    // Get the uploaded file
    const downloadedFile = await patientEHR.getMedicalFile(file.fileId)
    console.log(`   - Downloaded file: ${downloadedFile.metadata.fileName} (${downloadedFile.buffer.length} bytes)`)
    
    // Final status
    console.log(chalk.blue('\n=== Final Status ==='))
    const patientStatus = await patientEHR.getStatus()
    const doctorStatus = await doctorEHR.getStatus()
    
    console.log('Patient node:')
    console.log(`  Records: ${patientStatus.recordCount}, Files: ${patientStatus.fileCount}, Writers: ${patientStatus.writers}`)
    
    console.log('Doctor node:')
    console.log(`  Records: ${doctorStatus.recordCount}, Files: ${doctorStatus.fileCount}, Writers: ${doctorStatus.writers}`)
    
    console.log(chalk.green('\n✅ P2P Demo Complete!'))
    console.log(chalk.yellow('\nIn a real deployment:'))
    console.log('- Patient and doctor would be on different computers')
    console.log('- Changes would sync in real-time across the network')
    console.log('- Data would persist between sessions')
    console.log('- Multiple providers could collaborate on the same patient record')
    
  } catch (error) {
    console.error(chalk.red('Demo error:'), error)
  } finally {
    // Clean up
    await patientEHR?.close()
    await doctorEHR?.close()
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  p2pDemo().catch(console.error)
}