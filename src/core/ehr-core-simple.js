/**
 * Simplified EHRCore implementation for demonstration
 * Uses in-memory storage until Hypercore ecosystem compatibility is resolved
 */

import { randomBytes } from "hypercore-crypto";
import { OpenEHRSchemas } from '../schemas/openehr-schemas.js'

export class EHRCoreSimple {
  constructor(options = {}) {
    this.options = {
      storagePath: './ehr-store',
      filesPath: './ehr-files',
      ...options
    }
    
    // In-memory storage for demonstration
    this.records = new Map() // patientId:recordId -> record
    this.files = new Map() // fileRef -> buffer
    this.users = new Map() // userId -> user info
    this.isInitialized = false
    this.mockConnectedPeers = 0
  }

  async initialize() {
    if (this.isInitialized) {
      throw new Error('EHRCore already initialized')
    }

    try {
      console.log('Initializing simplified EHR Core (in-memory storage)')
      
      // Simulate P2P initialization
      this.recordsKey = randomBytes(32).toString('hex')
      this.filesKey = randomBytes(32).toString('hex')
      
      this.isInitialized = true
      console.log('EHR Core initialized')
      console.log(`Records key: ${this.recordsKey}`)
      console.log(`Files key: ${this.filesKey}`)
      
    } catch (error) {
      console.error('Failed to initialize EHR Core:', error)
      throw error
    }
  }

  async close() {
    if (!this.isInitialized) return
    
    try {
      this.isInitialized = false
      console.log('EHR Core closed')
    } catch (error) {
      console.error('Error closing EHR Core:', error)
    }
  }

  async addUser(userId, keyPair = null) {
    if (!this.isInitialized) {
      throw new Error('EHRCore not initialized')
    }

    try {
      // Generate key pair if not provided
      if (!keyPair) {
        keyPair = {
          publicKey: randomBytes(32),
          privateKey: randomBytes(32)
        }
      }

      const user = {
        userId,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        createdAt: new Date().toISOString()
      }
      
      this.users.set(userId, user)
      
      console.log(`Added user ${userId} with key: ${user.publicKey.toString('hex')}`)
      
      return {
        userId,
        publicKey: user.publicKey,
        core: { userId } // Mock core object
      }
    } catch (error) {
      console.error(`Failed to add user ${userId}:`, error)
      throw error
    }
  }

  async addRecord(userCore, record) {
    if (!this.isInitialized) {
      throw new Error('EHRCore not initialized')
    }

    try {
      // Add timestamp and validate basic structure
      const enrichedRecord = {
        ...record,
        timestamp: new Date().toISOString(),
        recordId: record.recordId || `rec_${Date.now()}_${randomBytes(4).toString('hex')}`
      }

      // Validate required fields
      if (!enrichedRecord.patientId) {
        throw new Error('patientId is required')
      }

      // Validate using OpenEHR schemas if archetype is specified
      if (enrichedRecord.archetype) {
        const errors = OpenEHRSchemas.validateRecord(enrichedRecord)
        if (errors.length > 0) {
          throw new Error(`Invalid record: ${errors.join(', ')}`)
        }
      }

      // Store record
      const key = `${enrichedRecord.patientId}:${enrichedRecord.recordId}`
      this.records.set(key, enrichedRecord)
      
      console.log(`Added record ${enrichedRecord.recordId} for patient ${enrichedRecord.patientId}`)
      
      return enrichedRecord
    } catch (error) {
      console.error('Failed to add record:', error)
      throw error
    }
  }

  async getRecord(patientId, recordId) {
    if (!this.isInitialized) {
      throw new Error('EHRCore not initialized')
    }

    try {
      const key = `${patientId}:${recordId}`
      return this.records.get(key) || null
    } catch (error) {
      console.error('Failed to get record:', error)
      return null
    }
  }

  async getPatientRecords(patientId) {
    if (!this.isInitialized) {
      throw new Error('EHRCore not initialized')
    }

    try {
      const records = []
      for (const [key, record] of this.records.entries()) {
        if (key.startsWith(`${patientId}:`)) {
          records.push(record)
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

  async uploadFile(fileName, buffer) {
    if (!this.isInitialized) {
      throw new Error('EHRCore not initialized')
    }

    try {
      const fileId = randomBytes(16).toString('hex')
      const fileRef = `pehr://${this.filesKey}/${fileId}/${fileName}`
      
      this.files.set(fileRef, buffer)
      
      console.log(`Uploaded file: ${fileRef}`)
      
      return fileRef
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  async downloadFile(fileRef) {
    if (!this.isInitialized) {
      throw new Error('EHRCore not initialized')
    }

    try {
      const buffer = this.files.get(fileRef)
      if (!buffer) {
        throw new Error('File not found')
      }
      return buffer
    } catch (error) {
      console.error('Failed to download file:', error)
      throw error
    }
  }

  async getStatus() {
    if (!this.isInitialized) {
      return { initialized: false }
    }

    try {
      return {
        initialized: true,
        connectedPeers: this.mockConnectedPeers,
        recordCount: this.records.size,
        userCount: this.users.size,
        fileCount: this.files.size,
        inputs: this.users.size, // Mock inputs count
        driveKey: this.filesKey,
        autobaseKey: this.recordsKey,
        storageType: 'in-memory'
      }
    } catch (error) {
      console.error('Failed to get status:', error)
      return { initialized: true, error: error.message }
    }
  }

  // Mock peer simulation
  simulateConnectedPeer() {
    this.mockConnectedPeers++
  }

  simulateDisconnectedPeer() {
    if (this.mockConnectedPeers > 0) {
      this.mockConnectedPeers--
    }
  }
}