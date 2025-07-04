/**
 * Basic Usage Examples for pEHR
 * Demonstrates how to use the P2P EHR system
 */

import { EHRCoreSimple as EHRCore } from '../src/core/ehr-core-simple.js'
import { EHRRecordFactory } from '../src/schemas/openehr-schemas.js'

async function basicUsageExample() {
  console.log('=== pEHR Basic Usage Example ===')
  
  // Initialize EHR system
  const ehr = new EHRCore({
    storagePath: './example-ehr-store',
    filesPath: './example-ehr-files'
  })
  
  try {
    await ehr.initialize()
    console.log('✓ EHR system initialized')
    
    // Add users (doctor and patient)
    const doctor = await ehr.addUser('dr-smith')
    const patient = await ehr.addUser('patient-123')
    
    console.log('✓ Added doctor and patient users')
    
    // Create patient demographics record
    const demographics = EHRRecordFactory.createPatientDemographics(
      'patient-123',
      'John Doe',
      '1985-03-15',
      'male',
      { authorId: 'patient-123' }
    )
    
    await ehr.addRecord(patient.core, demographics)
    console.log('✓ Added patient demographics')
    
    // Create diagnosis record
    const diagnosis = EHRRecordFactory.createDiagnosis(
      'patient-123',
      'Essential Hypertension',
      '2024-01-15',
      'moderate',
      { 
        authorId: 'dr-smith',
        clinician: 'Dr. Smith',
        notes: 'Patient presents with elevated blood pressure readings'
      }
    )
    
    await ehr.addRecord(doctor.core, diagnosis)
    console.log('✓ Added diagnosis record')
    
    // Create medication record
    const medication = EHRRecordFactory.createMedication(
      'patient-123',
      'Lisinopril',
      '10mg',
      'once daily',
      {
        authorId: 'dr-smith',
        prescriberId: 'dr-smith',
        route: 'oral',
        instructions: 'Take with food in the morning'
      }
    )
    
    await ehr.addRecord(doctor.core, medication)
    console.log('✓ Added medication record')
    
    // Create vital signs record
    const vitals = EHRRecordFactory.createVitalSigns(
      'patient-123',
      {
        bloodPressure: '140/90',
        heartRate: '72',
        temperature: '98.6',
        weight: '180 lbs',
        height: '5\'10"'
      },
      new Date().toISOString(),
      {
        authorId: 'dr-smith',
        recordedBy: 'Nurse Johnson'
      }
    )
    
    await ehr.addRecord(doctor.core, vitals)
    console.log('✓ Added vital signs record')
    
    // Create lab result
    const labResult = EHRRecordFactory.createLabResult(
      'patient-123',
      'Complete Blood Count',
      {
        wbc: '7.2',
        rbc: '4.5',
        hemoglobin: '14.2',
        hematocrit: '42.1'
      },
      '2024-01-16',
      {
        authorId: 'dr-smith',
        units: 'K/uL',
        labId: 'LAB-001',
        referenceRange: 'Normal'
      }
    )
    
    await ehr.addRecord(doctor.core, labResult)
    console.log('✓ Added lab result')
    
    // Upload a sample file (simulated medical image)
    const sampleImageData = Buffer.from('fake-medical-image-data')
    const fileRef = await ehr.uploadFile('chest-xray-20240116.jpg', sampleImageData)
    console.log('✓ Uploaded sample medical image')
    
    // Create imaging study record with file reference
    const imagingStudy = EHRRecordFactory.createImagingStudy(
      'patient-123',
      'Chest X-ray',
      '2024-01-16',
      'Heart size normal, lungs clear',
      {
        authorId: 'dr-smith',
        radiologist: 'Dr. Wilson',
        imageFiles: [fileRef]
      }
    )
    
    await ehr.addRecord(doctor.core, imagingStudy)
    console.log('✓ Added imaging study with file reference')
    
    // Wait a moment for records to be processed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Retrieve and display all patient records
    console.log('\n=== Patient Records ===')
    const records = await ehr.getPatientRecords('patient-123')
    
    records.forEach((record, index) => {
      console.log(`\n${index + 1}. ${record.archetype}`)
      console.log(`   Record ID: ${record.recordId}`)
      console.log(`   Author: ${record.authorId}`)
      console.log(`   Date: ${record.timestamp}`)
      console.log(`   Data: ${JSON.stringify(record.data, null, 2)}`)
    })
    
    // Show system status
    console.log('\n=== System Status ===')
    const status = await ehr.getStatus()
    console.log(`Connected peers: ${status.connectedPeers}`)
    console.log(`Total records: ${status.recordCount}`)
    console.log(`Input cores: ${status.inputs}`)
    
    // Demonstrate file download
    console.log('\n=== File Operations ===')
    const downloadedFile = await ehr.downloadFile(fileRef)
    console.log(`Downloaded file size: ${downloadedFile.length} bytes`)
    console.log(`File matches: ${downloadedFile.equals(sampleImageData)}`)
    
  } catch (error) {
    console.error('Error in example:', error)
  } finally {
    await ehr.close()
    console.log('\n✓ EHR system closed')
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  basicUsageExample().catch(console.error)
}