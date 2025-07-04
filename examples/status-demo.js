/**
 * Simple demo to show status changes as users and records are added
 */

import { EHRCoreSimple as EHRCore } from '../src/core/ehr-core-simple.js'
import { EHRRecordFactory } from '../src/schemas/openehr-schemas.js'

async function statusDemo() {
  console.log('=== pEHR Status Demo ===\n')
  
  const ehr = new EHRCore()
  await ehr.initialize()
  
  console.log('📊 Initial Status:')
  let status = await ehr.getStatus()
  console.log(`   Users: ${status.userCount}, Records: ${status.recordCount}, Files: ${status.fileCount}\n`)
  
  console.log('👤 Adding first user (dr-smith)...')
  await ehr.addUser('dr-smith')
  status = await ehr.getStatus()
  console.log(`   Users: ${status.userCount}, Records: ${status.recordCount}, Files: ${status.fileCount}\n`)
  
  console.log('👤 Adding second user (patient-john)...')
  const patient = await ehr.addUser('patient-john')
  status = await ehr.getStatus()
  console.log(`   Users: ${status.userCount}, Records: ${status.recordCount}, Files: ${status.fileCount}\n`)
  
  console.log('📝 Adding patient demographics record...')
  const demographics = EHRRecordFactory.createPatientDemographics(
    'patient-john',
    'John Doe',
    '1990-05-15',
    'male'
  )
  await ehr.addRecord(patient.core, demographics)
  status = await ehr.getStatus()
  console.log(`   Users: ${status.userCount}, Records: ${status.recordCount}, Files: ${status.fileCount}\n`)
  
  console.log('💊 Adding medication record...')
  const doctor = await ehr.addUser('dr-wilson')
  const medication = EHRRecordFactory.createMedication(
    'patient-john',
    'Aspirin',
    '81mg',
    'daily'
  )
  await ehr.addRecord(doctor.core, medication)
  status = await ehr.getStatus()
  console.log(`   Users: ${status.userCount}, Records: ${status.recordCount}, Files: ${status.fileCount}\n`)
  
  console.log('📁 Adding a file...')
  const fileData = Buffer.from('Sample medical document content')
  await ehr.uploadFile('test-report.pdf', fileData)
  status = await ehr.getStatus()
  console.log(`   Users: ${status.userCount}, Records: ${status.recordCount}, Files: ${status.fileCount}\n`)
  
  console.log('📋 Final Status Summary:')
  console.log(`   Total Users: ${status.userCount}`)
  console.log(`   Total Records: ${status.recordCount}`)
  console.log(`   Total Files: ${status.fileCount}`)
  console.log(`   Connected Peers: ${status.connectedPeers}`)
  
  await ehr.close()
  console.log('\n✅ Demo complete!')
}

statusDemo().catch(console.error)