/**
 * Tests for OpenEHR Schemas
 */

import { test, describe } from 'node:test'
import assert from 'node:assert'
import { OpenEHRSchemas, EHRRecordFactory } from '../src/schemas/openehr-schemas.js'

describe('OpenEHRSchemas', () => {
  test('should validate record structure', () => {
    const validRecord = {
      patientId: 'patient-123',
      recordId: 'rec-001',
      archetype: 'openEHR-EHR-EVALUATION.problem_diagnosis.v1',
      data: {
        diagnosis: 'Hypertension',
        dateOfDiagnosis: '2024-01-01',
        severity: 'moderate'
      }
    }
    
    const errors = OpenEHRSchemas.validateRecord(validRecord)
    assert.strictEqual(errors.length, 0)
  })

  test('should detect missing required fields', () => {
    const invalidRecord = {
      // Missing patientId, recordId, archetype, data
    }
    
    const errors = OpenEHRSchemas.validateRecord(invalidRecord)
    assert(errors.length > 0)
    assert(errors.includes('patientId is required'))
    assert(errors.includes('recordId is required'))
    assert(errors.includes('archetype is required'))
    assert(errors.includes('data is required'))
  })

  test('should validate diagnosis archetype', () => {
    const validData = {
      diagnosis: 'Hypertension',
      dateOfDiagnosis: '2024-01-01',
      severity: 'moderate'
    }
    
    const errors = OpenEHRSchemas.archetypes['openEHR-EHR-EVALUATION.problem_diagnosis.v1']
      .validate(validData)
    
    assert.strictEqual(errors.length, 0)
    
    const invalidData = {
      // Missing required fields
      diagnosis: 'Hypertension'
    }
    
    const errors2 = OpenEHRSchemas.archetypes['openEHR-EHR-EVALUATION.problem_diagnosis.v1']
      .validate(invalidData)
    
    assert(errors2.length > 0)
    assert(errors2.includes('dateOfDiagnosis is required'))
    assert(errors2.includes('severity is required'))
  })

  test('should validate medication archetype', () => {
    const validData = {
      medication: 'Lisinopril',
      dosage: '10mg',
      frequency: 'once daily'
    }
    
    const errors = OpenEHRSchemas.archetypes['openEHR-EHR-INSTRUCTION.medication_order.v1']
      .validate(validData)
    
    assert.strictEqual(errors.length, 0)
  })

  test('should validate vital signs archetype', () => {
    const validData = {
      measurements: {
        bloodPressure: '120/80',
        heartRate: '72'
      },
      dateRecorded: '2024-01-01'
    }
    
    const errors = OpenEHRSchemas.archetypes['openEHR-EHR-OBSERVATION.vital_signs.v1']
      .validate(validData)
    
    assert.strictEqual(errors.length, 0)
  })

  test('should create valid record', () => {
    const record = OpenEHRSchemas.createRecord(
      'patient-123',
      'openEHR-EHR-EVALUATION.problem_diagnosis.v1',
      {
        diagnosis: 'Hypertension',
        dateOfDiagnosis: '2024-01-01',
        severity: 'moderate'
      },
      { authorId: 'doctor-1' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-EVALUATION.problem_diagnosis.v1')
    assert.strictEqual(record.data.diagnosis, 'Hypertension')
    assert.strictEqual(record.authorId, 'doctor-1')
    assert(record.recordId)
    assert(record.timestamp)
    assert.strictEqual(record.version, '1.0')
  })

  test('should throw error for invalid record', () => {
    assert.throws(() => {
      OpenEHRSchemas.createRecord(
        'patient-123',
        'openEHR-EHR-EVALUATION.problem_diagnosis.v1',
        {
          // Missing required fields
          diagnosis: 'Hypertension'
        }
      )
    }, /Invalid record/)
  })
})

describe('EHRRecordFactory', () => {
  test('should create patient demographics record', () => {
    const record = EHRRecordFactory.createPatientDemographics(
      'patient-123',
      'John Doe',
      '1985-03-15',
      'male',
      { authorId: 'admin-1' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-COMPOSITION.encounter.v1')
    assert.strictEqual(record.data.name, 'John Doe')
    assert.strictEqual(record.data.dateOfBirth, '1985-03-15')
    assert.strictEqual(record.data.gender, 'male')
    assert.strictEqual(record.authorId, 'admin-1')
  })

  test('should create diagnosis record', () => {
    const record = EHRRecordFactory.createDiagnosis(
      'patient-123',
      'Essential Hypertension',
      '2024-01-15',
      'moderate',
      { authorId: 'doctor-1', clinician: 'Dr. Smith' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-EVALUATION.problem_diagnosis.v1')
    assert.strictEqual(record.data.diagnosis, 'Essential Hypertension')
    assert.strictEqual(record.data.severity, 'moderate')
    assert.strictEqual(record.data.status, 'active')
    assert.strictEqual(record.data.clinician, 'Dr. Smith')
    assert.strictEqual(record.authorId, 'doctor-1')
  })

  test('should create medication record', () => {
    const record = EHRRecordFactory.createMedication(
      'patient-123',
      'Lisinopril',
      '10mg',
      'once daily',
      { authorId: 'doctor-1', route: 'oral' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-INSTRUCTION.medication_order.v1')
    assert.strictEqual(record.data.medication, 'Lisinopril')
    assert.strictEqual(record.data.dosage, '10mg')
    assert.strictEqual(record.data.frequency, 'once daily')
    assert.strictEqual(record.data.route, 'oral')
    assert.strictEqual(record.authorId, 'doctor-1')
  })

  test('should create vital signs record', () => {
    const measurements = {
      bloodPressure: '120/80',
      heartRate: '72',
      temperature: '98.6'
    }
    
    const record = EHRRecordFactory.createVitalSigns(
      'patient-123',
      measurements,
      '2024-01-01T10:00:00Z',
      { authorId: 'nurse-1', recordedBy: 'Nurse Johnson' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-OBSERVATION.vital_signs.v1')
    assert.deepStrictEqual(record.data.measurements, measurements)
    assert.strictEqual(record.data.dateRecorded, '2024-01-01T10:00:00Z')
    assert.strictEqual(record.data.recordedBy, 'Nurse Johnson')
    assert.strictEqual(record.authorId, 'nurse-1')
  })

  test('should create lab result record', () => {
    const record = EHRRecordFactory.createLabResult(
      'patient-123',
      'Complete Blood Count',
      { wbc: '7.2', rbc: '4.5' },
      '2024-01-01',
      { authorId: 'lab-tech-1', units: 'K/uL' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-OBSERVATION.laboratory_test_result.v1')
    assert.strictEqual(record.data.testName, 'Complete Blood Count')
    assert.deepStrictEqual(record.data.result, { wbc: '7.2', rbc: '4.5' })
    assert.strictEqual(record.data.units, 'K/uL')
    assert.strictEqual(record.data.status, 'final')
    assert.strictEqual(record.authorId, 'lab-tech-1')
  })

  test('should create imaging study record', () => {
    const record = EHRRecordFactory.createImagingStudy(
      'patient-123',
      'Chest X-ray',
      '2024-01-01',
      'Normal heart size, clear lungs',
      { authorId: 'radiologist-1', radiologist: 'Dr. Wilson' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-OBSERVATION.imaging_examination_result.v1')
    assert.strictEqual(record.data.studyType, 'Chest X-ray')
    assert.strictEqual(record.data.findings, 'Normal heart size, clear lungs')
    assert.strictEqual(record.data.radiologist, 'Dr. Wilson')
    assert.strictEqual(record.authorId, 'radiologist-1')
  })

  test('should create allergy record', () => {
    const record = EHRRecordFactory.createAllergy(
      'patient-123',
      'Penicillin',
      'Rash',
      'moderate',
      { authorId: 'doctor-1', status: 'active' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-EVALUATION.adverse_reaction_risk.v1')
    assert.strictEqual(record.data.substance, 'Penicillin')
    assert.strictEqual(record.data.reaction, 'Rash')
    assert.strictEqual(record.data.severity, 'moderate')
    assert.strictEqual(record.data.status, 'active')
    assert.strictEqual(record.authorId, 'doctor-1')
  })

  test('should create immunization record', () => {
    const record = EHRRecordFactory.createImmunization(
      'patient-123',
      'COVID-19 Vaccine',
      '2024-01-01',
      { authorId: 'nurse-1', batchNumber: 'ABC123' }
    )
    
    assert.strictEqual(record.patientId, 'patient-123')
    assert.strictEqual(record.archetype, 'openEHR-EHR-ACTION.medication.v1')
    assert.strictEqual(record.data.vaccine, 'COVID-19 Vaccine')
    assert.strictEqual(record.data.dateAdministered, '2024-01-01')
    assert.strictEqual(record.data.batchNumber, 'ABC123')
    assert.strictEqual(record.data.route, 'intramuscular')
    assert.strictEqual(record.authorId, 'nurse-1')
  })
})