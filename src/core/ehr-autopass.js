/**
 * EHRAutopass - True P2P EHR implementation using Autopass
 * 
 * This provides patient-controlled health records with invite-based
 * provider access and real-time multi-peer synchronization.
 */

import Autopass from 'autopass'
import Corestore from 'corestore'
import { OpenEHRSchemas } from '../schemas/openehr-schemas.js'
import { randomBytes } from 'crypto'
import { EventEmitter } from 'events'

export class EHRAutopass extends EventEmitter {
  constructor(options = {}) {
    super()
    this.options = {
      storagePath: './ehr-data',
      role: 'patient', // 'patient' or 'provider'
      patientId: null,
      providerId: null,
      ...options
    }
    
    this.store = null
    this.autopass = null
    this.isInitialized = false
    this.metadata = {}
  }

  async initialize() {
    if (this.isInitialized) {
      throw new Error('EHRAutopass already initialized')
    }

    try {
      // Initialize Corestore with unique path for this instance
      const storePath = `${this.options.storagePath}/${this.options.role}-${this.options.patientId || this.options.providerId}`
      this.store = new Corestore(storePath)
      
      // Initialize Autopass
      this.autopass = new Autopass(this.store)
      await this.autopass.ready()
      
      // Store metadata about this instance
      this.metadata = {
        role: this.options.role,
        patientId: this.options.patientId,
        providerId: this.options.providerId,
        createdAt: new Date().toISOString()
      }
      
      // Save metadata to autopass
      await this.autopass.add('_metadata', JSON.stringify(this.metadata))
      
      this.isInitialized = true
      console.log(`EHR ${this.options.role} node initialized`)
      console.log(`Storage path: ${storePath}`)
      
      // Set up event listeners
      this.setupEventListeners()
      
    } catch (error) {
      console.error('Failed to initialize EHRAutopass:', error)
      throw error
    }
  }

  async close() {
    if (!this.isInitialized) return
    
    try {
      await this.autopass?.close()
      await this.store?.close()
      
      this.isInitialized = false
      console.log('EHRAutopass closed')
    } catch (error) {
      console.error('Error closing EHRAutopass:', error)
    }
  }

  // Healthcare-specific invitation methods
  async inviteProvider(providerType, providerName) {
    if (!this.isInitialized) {
      throw new Error('EHRAutopass not initialized')
    }

    if (this.options.role !== 'patient') {
      throw new Error('Only patients can invite providers')
    }

    try {
      const invite = await this.autopass.createInvite()
      
      // Store invite metadata
      const inviteData = {
        invite: invite.toString(),
        providerType,
        providerName,
        patientId: this.options.patientId,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
      
      await this.autopass.add(`invite:${providerName}`, JSON.stringify(inviteData))
      
      console.log(`Created invite for ${providerType} ${providerName}`)
      
      return invite.toString()
    } catch (error) {
      console.error('Failed to create provider invite:', error)
      throw error
    }
  }

  async invitePatient(patientName) {
    if (!this.isInitialized) {
      throw new Error('EHRAutopass not initialized')
    }

    if (this.options.role !== 'provider') {
      throw new Error('Only providers can invite patients')
    }

    try {
      const invite = await this.autopass.createInvite()
      
      // Store invite metadata
      const inviteData = {
        invite: invite.toString(),
        patientName,
        providerId: this.options.providerId,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }
      
      await this.autopass.add(`invite:${patientName}`, JSON.stringify(inviteData))
      
      console.log(`Created invite for patient ${patientName}`)
      
      return invite.toString()
    } catch (error) {
      console.error('Failed to create patient invite:', error)
      throw error
    }
  }

  // Pairing method for providers/patients to connect
  static async pair(invite, options = {}) {
    try {
      const storePath = `${options.storagePath || './ehr-data'}/${options.role}-${options.patientId || options.providerId}`
      const store = new Corestore(storePath)
      
      // Perform pairing
      const autopass = await Autopass.pair(invite, store)
      
      // Create EHRAutopass instance with paired autopass
      const ehr = new EHRAutopass(options)
      ehr.store = store
      ehr.autopass = autopass
      ehr.isInitialized = true
      ehr.metadata = {
        role: options.role,
        patientId: options.patientId,
        providerId: options.providerId,
        pairedAt: new Date().toISOString()
      }
      
      // Save metadata
      await ehr.autopass.add('_metadata', JSON.stringify(ehr.metadata))
      
      ehr.setupEventListeners()
      
      console.log(`Successfully paired ${options.role} node`)
      
      return ehr
    } catch (error) {
      console.error('Failed to pair:', error)
      throw error
    }
  }

  // Add medical record with openEHR validation
  async addMedicalRecord(record) {
    if (!this.isInitialized) {
      throw new Error('EHRAutopass not initialized')
    }

    try {
      // Validate record against openEHR schemas
      if (record.archetype) {
        const errors = OpenEHRSchemas.validateRecord(record)
        if (errors.length > 0) {
          throw new Error(`Invalid record: ${errors.join(', ')}`)
        }
      }

      // Add author information
      const enrichedRecord = {
        ...record,
        timestamp: new Date().toISOString(),
        recordId: record.recordId || `rec_${Date.now()}_${randomBytes(4).toString('hex')}`,
        authorRole: this.options.role,
        authorId: this.options.role === 'patient' ? this.options.patientId : this.options.providerId
      }

      // Store record with composite key
      const key = `record:${enrichedRecord.patientId}:${enrichedRecord.recordId}`
      await this.autopass.add(key, JSON.stringify(enrichedRecord))
      
      console.log(`Added medical record ${enrichedRecord.recordId} for patient ${enrichedRecord.patientId}`)
      
      // Emit event for real-time updates
      this.emit('record:added', enrichedRecord)
      
      return enrichedRecord
    } catch (error) {
      console.error('Failed to add medical record:', error)
      throw error
    }
  }

  // Add medical file (images, documents)
  async addMedicalFile(fileName, buffer, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('EHRAutopass not initialized')
    }

    try {
      const fileId = `file_${Date.now()}_${randomBytes(4).toString('hex')}`
      const fileKey = `file:${fileId}:${fileName}`
      
      // Store file
      await this.autopass.addFile(fileKey, buffer)
      
      // Store file metadata
      const fileMetadata = {
        fileId,
        fileName,
        size: buffer.length,
        uploadedAt: new Date().toISOString(),
        uploadedBy: this.options.role === 'patient' ? this.options.patientId : this.options.providerId,
        uploadedRole: this.options.role,
        ...metadata
      }
      
      await this.autopass.add(`file-meta:${fileId}`, JSON.stringify(fileMetadata))
      
      console.log(`Added medical file: ${fileName}`)
      
      // Emit event
      this.emit('file:added', fileMetadata)
      
      return { fileId, fileKey, ...fileMetadata }
    } catch (error) {
      console.error('Failed to add medical file:', error)
      throw error
    }
  }

  // Get medical record
  async getMedicalRecord(patientId, recordId) {
    if (!this.isInitialized) {
      throw new Error('EHRAutopass not initialized')
    }

    try {
      const key = `record:${patientId}:${recordId}`
      const data = await this.autopass.get(key)
      
      if (!data) return null
      
      return JSON.parse(data.toString())
    } catch (error) {
      console.error('Failed to get medical record:', error)
      return null
    }
  }

  // Get all records for a patient
  async getPatientRecords(patientId) {
    if (!this.isInitialized) {
      throw new Error('EHRAutopass not initialized')
    }

    try {
      const records = []
      const prefix = `record:${patientId}:`
      
      // Get all entries (this is a simplified approach - Autopass may need iteration)
      const entries = await this.autopass.all()
      
      for (const [key, value] of entries) {
        if (key.startsWith(prefix)) {
          try {
            const record = JSON.parse(value.toString())
            records.push(record)
          } catch (e) {
            console.warn(`Failed to parse record ${key}:`, e)
          }
        }
      }
      
      // Sort by timestamp
      records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      
      return records
    } catch (error) {
      console.error('Failed to get patient records:', error)
      return []
    }
  }

  // Get medical file
  async getMedicalFile(fileId) {
    if (!this.isInitialized) {
      throw new Error('EHRAutopass not initialized')
    }

    try {
      // Get file metadata first
      const metaData = await this.autopass.get(`file-meta:${fileId}`)
      if (!metaData) {
        throw new Error('File metadata not found')
      }
      
      const metadata = JSON.parse(metaData.toString())
      const fileKey = `file:${fileId}:${metadata.fileName}`
      
      // Get file content
      const buffer = await this.autopass.getFile(fileKey)
      
      return {
        buffer,
        metadata
      }
    } catch (error) {
      console.error('Failed to get medical file:', error)
      throw error
    }
  }

  // Get current status
  async getStatus() {
    if (!this.isInitialized) {
      return { initialized: false }
    }

    try {
      // Count records and files
      let recordCount = 0
      let fileCount = 0
      let inviteCount = 0
      
      const entries = await this.autopass.all()
      
      for (const [key] of entries) {
        if (key.startsWith('record:')) recordCount++
        else if (key.startsWith('file:')) fileCount++
        else if (key.startsWith('invite:')) inviteCount++
      }
      
      return {
        initialized: true,
        role: this.options.role,
        patientId: this.options.patientId,
        providerId: this.options.providerId,
        recordCount,
        fileCount,
        inviteCount,
        writers: this.autopass.writers?.length || 1,
        storagePath: this.store.path
      }
    } catch (error) {
      console.error('Failed to get status:', error)
      return { initialized: true, error: error.message }
    }
  }

  // Setup event listeners for real-time updates
  setupEventListeners() {
    if (!this.autopass) return
    
    // Listen for updates (implementation depends on Autopass events)
    // This is a placeholder for when Autopass emits update events
    console.log('Event listeners configured')
  }

  // Helper method to create various record types
  async addDiagnosis(patientId, diagnosis, severity, notes = '') {
    const record = {
      patientId,
      archetype: 'openEHR-EHR-EVALUATION.problem_diagnosis.v1',
      data: {
        diagnosis,
        dateOfDiagnosis: new Date().toISOString().split('T')[0],
        severity,
        status: 'active',
        clinician: this.options.providerId,
        notes
      }
    }
    
    return await this.addMedicalRecord(record)
  }

  async addMedication(patientId, medication, dosage, frequency, instructions = '') {
    const record = {
      patientId,
      archetype: 'openEHR-EHR-INSTRUCTION.medication_order.v1',
      data: {
        medication,
        dosage,
        frequency,
        route: 'oral',
        startDate: new Date().toISOString(),
        prescriberId: this.options.providerId,
        instructions
      }
    }
    
    return await this.addMedicalRecord(record)
  }

  async addVitalSigns(patientId, measurements) {
    const record = {
      patientId,
      archetype: 'openEHR-EHR-OBSERVATION.vital_signs.v1',
      data: {
        measurements,
        dateRecorded: new Date().toISOString(),
        recordedBy: this.options.providerId || this.options.patientId
      }
    }
    
    return await this.addMedicalRecord(record)
  }
}