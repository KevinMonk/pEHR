/**
 * Tests for EHRCore
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { EHRCore } from '../src/core/ehr-core.js'
import { EHRRecordFactory } from '../src/schemas/openehr-schemas.js'
import { randomBytes } from 'crypto'

describe('EHRCore', () => {
  let ehr

  test('should initialize successfully', async () => {
    ehr = new EHRCore({
      storagePath: './test-ehr-store',
      filesPath: './test-ehr-files'
    })
    
    await ehr.initialize()
    
    const status = await ehr.getStatus()
    assert.strictEqual(status.initialized, true)
    assert.strictEqual(typeof status.autobaseKey, 'string')
    assert.strictEqual(typeof status.driveKey, 'string')
    
    await ehr.close()
  })

  test('should add and retrieve users', async () => {
    ehr = new EHRCore({
      storagePath: './test-ehr-store-2',
      filesPath: './test-ehr-files-2'
    })
    
    await ehr.initialize()
    
    const user = await ehr.addUser('test-user')
    assert.strictEqual(user.userId, 'test-user')
    assert(user.publicKey instanceof Buffer)
    assert(user.core)
    
    await ehr.close()
  })

  test('should add and retrieve records', async () => {
    ehr = new EHRCore({
      storagePath: './test-ehr-store-3',
      filesPath: './test-ehr-files-3'
    })
    
    await ehr.initialize()
    
    const user = await ehr.addUser('test-doctor')
    
    // Create a test record
    const record = EHRRecordFactory.createDiagnosis(
      'test-patient',
      'Test Diagnosis',
      '2024-01-01',
      'mild',
      { authorId: 'test-doctor' }
    )
    
    await ehr.addRecord(user.core, record)
    
    // Wait for record to be processed
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Retrieve the record
    const retrievedRecord = await ehr.getRecord('test-patient', record.recordId)
    
    assert(retrievedRecord)
    assert.strictEqual(retrievedRecord.patientId, 'test-patient')
    assert.strictEqual(retrievedRecord.data.diagnosis, 'Test Diagnosis')
    
    await ehr.close()
  })

  test('should retrieve patient records', async () => {
    ehr = new EHRCore({
      storagePath: './test-ehr-store-4',
      filesPath: './test-ehr-files-4'
    })
    
    await ehr.initialize()
    
    const user = await ehr.addUser('test-doctor')
    
    // Add multiple records for the same patient
    const records = [
      EHRRecordFactory.createDiagnosis(
        'test-patient',
        'Diagnosis 1',
        '2024-01-01',
        'mild',
        { authorId: 'test-doctor' }
      ),
      EHRRecordFactory.createMedication(
        'test-patient',
        'Medication 1',
        '10mg',
        'daily',
        { authorId: 'test-doctor' }
      )
    ]
    
    for (const record of records) {
      await ehr.addRecord(user.core, record)
    }
    
    // Wait for records to be processed
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Retrieve all patient records
    const patientRecords = await ehr.getPatientRecords('test-patient')
    
    assert.strictEqual(patientRecords.length, 2)
    assert(patientRecords.some(r => r.data.diagnosis === 'Diagnosis 1'))
    assert(patientRecords.some(r => r.data.medication === 'Medication 1'))
    
    await ehr.close()
  })

  test('should handle file upload and download', async () => {
    ehr = new EHRCore({
      storagePath: './test-ehr-store-5',
      filesPath: './test-ehr-files-5'
    })
    
    await ehr.initialize()
    
    const testData = Buffer.from('test file content')
    const fileName = 'test-file.txt'
    
    const fileRef = await ehr.uploadFile(fileName, testData)
    
    assert(fileRef.startsWith('hyper://'))
    assert(fileRef.includes(fileName))
    
    const downloadedData = await ehr.downloadFile(fileRef)
    
    assert(downloadedData.equals(testData))
    
    await ehr.close()
  })

  test('should validate record structure', async () => {
    ehr = new EHRCore({
      storagePath: './test-ehr-store-6',
      filesPath: './test-ehr-files-6'
    })
    
    await ehr.initialize()
    
    const user = await ehr.addUser('test-doctor')
    
    // Test with invalid record (missing required fields)
    const invalidRecord = {
      // Missing patientId
      data: { diagnosis: 'Test' }
    }
    
    await assert.rejects(
      async () => await ehr.addRecord(user.core, invalidRecord),
      /patientId is required/
    )
    
    await ehr.close()
  })

  test('should get system status', async () => {
    ehr = new EHRCore({
      storagePath: './test-ehr-store-7',
      filesPath: './test-ehr-files-7'
    })
    
    await ehr.initialize()
    
    const status = await ehr.getStatus()
    
    assert.strictEqual(status.initialized, true)
    assert.strictEqual(typeof status.connectedPeers, 'number')
    assert.strictEqual(typeof status.recordCount, 'number')
    assert.strictEqual(typeof status.inputs, 'number')
    assert.strictEqual(typeof status.driveKey, 'string')
    assert.strictEqual(typeof status.autobaseKey, 'string')
    
    await ehr.close()
  })
})