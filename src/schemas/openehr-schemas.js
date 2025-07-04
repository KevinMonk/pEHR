/**
 * OpenEHR Schema Definitions
 * Simplified openEHR archetype-based schemas for the P2P EHR system
 */

export class OpenEHRSchemas {
  static validateRecord(record) {
    const errors = []
    
    // Basic structure validation
    if (!record.patientId) {
      errors.push('patientId is required')
    }
    
    if (!record.recordId) {
      errors.push('recordId is required')
    }
    
    if (!record.archetype) {
      errors.push('archetype is required')
    }
    
    if (!record.data) {
      errors.push('data is required')
    }
    
    // Archetype-specific validation
    if (record.archetype && this.archetypes[record.archetype]) {
      const archetypeErrors = this.archetypes[record.archetype].validate(record.data)
      errors.push(...archetypeErrors)
    }
    
    return errors
  }
  
  static createRecord(patientId, archetype, data, options = {}) {
    const record = {
      patientId,
      recordId: options.recordId || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      archetype,
      data,
      timestamp: new Date().toISOString(),
      authorId: options.authorId || null,
      facilityId: options.facilityId || null,
      version: options.version || '1.0',
      ...options
    }
    
    const errors = this.validateRecord(record)
    if (errors.length > 0) {
      throw new Error(`Invalid record: ${errors.join(', ')}`)
    }
    
    return record
  }
  
  static archetypes = {
    // Patient Demographics
    'openEHR-EHR-COMPOSITION.encounter.v1': {
      name: 'Patient Demographics',
      validate: (data) => {
        const errors = []
        if (!data.name) errors.push('name is required')
        if (!data.dateOfBirth) errors.push('dateOfBirth is required')
        if (!data.gender) errors.push('gender is required')
        return errors
      },
      create: (name, dateOfBirth, gender, additionalInfo = {}) => ({
        name,
        dateOfBirth,
        gender,
        ...additionalInfo
      })
    },
    
    // Diagnosis
    'openEHR-EHR-EVALUATION.problem_diagnosis.v1': {
      name: 'Problem/Diagnosis',
      validate: (data) => {
        const errors = []
        if (!data.diagnosis) errors.push('diagnosis is required')
        if (!data.dateOfDiagnosis) errors.push('dateOfDiagnosis is required')
        if (!data.severity) errors.push('severity is required')
        return errors
      },
      create: (diagnosis, dateOfDiagnosis, severity, additionalInfo = {}) => ({
        diagnosis,
        dateOfDiagnosis,
        severity,
        status: additionalInfo.status || 'active',
        clinician: additionalInfo.clinician || null,
        notes: additionalInfo.notes || null,
        ...additionalInfo
      })
    },
    
    // Medication
    'openEHR-EHR-INSTRUCTION.medication_order.v1': {
      name: 'Medication Order',
      validate: (data) => {
        const errors = []
        if (!data.medication) errors.push('medication is required')
        if (!data.dosage) errors.push('dosage is required')
        if (!data.frequency) errors.push('frequency is required')
        return errors
      },
      create: (medication, dosage, frequency, additionalInfo = {}) => ({
        medication,
        dosage,
        frequency,
        route: additionalInfo.route || 'oral',
        startDate: additionalInfo.startDate || new Date().toISOString(),
        endDate: additionalInfo.endDate || null,
        prescriberId: additionalInfo.prescriberId || null,
        instructions: additionalInfo.instructions || null,
        ...additionalInfo
      })
    },
    
    // Vital Signs
    'openEHR-EHR-OBSERVATION.vital_signs.v1': {
      name: 'Vital Signs',
      validate: (data) => {
        const errors = []
        if (!data.measurements) errors.push('measurements is required')
        if (!data.dateRecorded) errors.push('dateRecorded is required')
        return errors
      },
      create: (measurements, dateRecorded, additionalInfo = {}) => ({
        measurements,
        dateRecorded,
        recordedBy: additionalInfo.recordedBy || null,
        deviceUsed: additionalInfo.deviceUsed || null,
        notes: additionalInfo.notes || null,
        ...additionalInfo
      })
    },
    
    // Lab Results
    'openEHR-EHR-OBSERVATION.laboratory_test_result.v1': {
      name: 'Laboratory Test Result',
      validate: (data) => {
        const errors = []
        if (!data.testName) errors.push('testName is required')
        if (!data.result) errors.push('result is required')
        if (!data.datePerformed) errors.push('datePerformed is required')
        return errors
      },
      create: (testName, result, datePerformed, additionalInfo = {}) => ({
        testName,
        result,
        datePerformed,
        units: additionalInfo.units || null,
        referenceRange: additionalInfo.referenceRange || null,
        labId: additionalInfo.labId || null,
        status: additionalInfo.status || 'final',
        ...additionalInfo
      })
    },
    
    // Imaging Study
    'openEHR-EHR-OBSERVATION.imaging_examination_result.v1': {
      name: 'Imaging Examination Result',
      validate: (data) => {
        const errors = []
        if (!data.studyType) errors.push('studyType is required')
        if (!data.datePerformed) errors.push('datePerformed is required')
        if (!data.findings) errors.push('findings is required')
        return errors
      },
      create: (studyType, datePerformed, findings, additionalInfo = {}) => ({
        studyType,
        datePerformed,
        findings,
        radiologist: additionalInfo.radiologist || null,
        imageFiles: additionalInfo.imageFiles || [],
        dicomStudyId: additionalInfo.dicomStudyId || null,
        ...additionalInfo
      })
    },
    
    // Allergy/Intolerance
    'openEHR-EHR-EVALUATION.adverse_reaction_risk.v1': {
      name: 'Adverse Reaction Risk',
      validate: (data) => {
        const errors = []
        if (!data.substance) errors.push('substance is required')
        if (!data.reaction) errors.push('reaction is required')
        if (!data.severity) errors.push('severity is required')
        return errors
      },
      create: (substance, reaction, severity, additionalInfo = {}) => ({
        substance,
        reaction,
        severity,
        dateOfReaction: additionalInfo.dateOfReaction || null,
        status: additionalInfo.status || 'active',
        clinicalImpact: additionalInfo.clinicalImpact || null,
        ...additionalInfo
      })
    },
    
    // Immunization
    'openEHR-EHR-ACTION.medication.v1': {
      name: 'Immunization',
      validate: (data) => {
        const errors = []
        if (!data.vaccine) errors.push('vaccine is required')
        if (!data.dateAdministered) errors.push('dateAdministered is required')
        return errors
      },
      create: (vaccine, dateAdministered, additionalInfo = {}) => ({
        vaccine,
        dateAdministered,
        batchNumber: additionalInfo.batchNumber || null,
        manufacturer: additionalInfo.manufacturer || null,
        site: additionalInfo.site || null,
        route: additionalInfo.route || 'intramuscular',
        providerId: additionalInfo.providerId || null,
        ...additionalInfo
      })
    }
  }
}

// Helper functions for creating common records
export class EHRRecordFactory {
  static createPatientDemographics(patientId, name, dateOfBirth, gender, options = {}) {
    const data = OpenEHRSchemas.archetypes['openEHR-EHR-COMPOSITION.encounter.v1']
      .create(name, dateOfBirth, gender, options)
    
    return OpenEHRSchemas.createRecord(
      patientId,
      'openEHR-EHR-COMPOSITION.encounter.v1',
      data,
      options
    )
  }
  
  static createDiagnosis(patientId, diagnosis, dateOfDiagnosis, severity, options = {}) {
    const data = OpenEHRSchemas.archetypes['openEHR-EHR-EVALUATION.problem_diagnosis.v1']
      .create(diagnosis, dateOfDiagnosis, severity, options)
    
    return OpenEHRSchemas.createRecord(
      patientId,
      'openEHR-EHR-EVALUATION.problem_diagnosis.v1',
      data,
      options
    )
  }
  
  static createMedication(patientId, medication, dosage, frequency, options = {}) {
    const data = OpenEHRSchemas.archetypes['openEHR-EHR-INSTRUCTION.medication_order.v1']
      .create(medication, dosage, frequency, options)
    
    return OpenEHRSchemas.createRecord(
      patientId,
      'openEHR-EHR-INSTRUCTION.medication_order.v1',
      data,
      options
    )
  }
  
  static createVitalSigns(patientId, measurements, dateRecorded, options = {}) {
    const data = OpenEHRSchemas.archetypes['openEHR-EHR-OBSERVATION.vital_signs.v1']
      .create(measurements, dateRecorded, options)
    
    return OpenEHRSchemas.createRecord(
      patientId,
      'openEHR-EHR-OBSERVATION.vital_signs.v1',
      data,
      options
    )
  }
  
  static createLabResult(patientId, testName, result, datePerformed, options = {}) {
    const data = OpenEHRSchemas.archetypes['openEHR-EHR-OBSERVATION.laboratory_test_result.v1']
      .create(testName, result, datePerformed, options)
    
    return OpenEHRSchemas.createRecord(
      patientId,
      'openEHR-EHR-OBSERVATION.laboratory_test_result.v1',
      data,
      options
    )
  }
  
  static createImagingStudy(patientId, studyType, datePerformed, findings, options = {}) {
    const data = OpenEHRSchemas.archetypes['openEHR-EHR-OBSERVATION.imaging_examination_result.v1']
      .create(studyType, datePerformed, findings, options)
    
    return OpenEHRSchemas.createRecord(
      patientId,
      'openEHR-EHR-OBSERVATION.imaging_examination_result.v1',
      data,
      options
    )
  }
  
  static createAllergy(patientId, substance, reaction, severity, options = {}) {
    const data = OpenEHRSchemas.archetypes['openEHR-EHR-EVALUATION.adverse_reaction_risk.v1']
      .create(substance, reaction, severity, options)
    
    return OpenEHRSchemas.createRecord(
      patientId,
      'openEHR-EHR-EVALUATION.adverse_reaction_risk.v1',
      data,
      options
    )
  }
  
  static createImmunization(patientId, vaccine, dateAdministered, options = {}) {
    const data = OpenEHRSchemas.archetypes['openEHR-EHR-ACTION.medication.v1']
      .create(vaccine, dateAdministered, options)
    
    return OpenEHRSchemas.createRecord(
      patientId,
      'openEHR-EHR-ACTION.medication.v1',
      data,
      options
    )
  }
}