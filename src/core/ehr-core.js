/**
 * EHRCore - Core P2P EHR system implementation
 * Manages Autobase for records and Hyperdrive for files
 */

import Corestore from 'corestore'
import Autobase from 'autobase'
import Hyperbee from 'hyperbee'
import Hyperdrive from 'hyperdrive'
import Hyperswarm from 'hyperswarm'
import { randomBytes } from 'crypto'

export class EHRCore {
  constructor(options = {}) {
    this.options = {
      storagePath: './ehr-store',
      filesPath: './ehr-files',
      ...options
    }
    
    this.store = null
    this.autobase = null
    this.drive = null
    this.swarm = null
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) {
      throw new Error('EHRCore already initialized')
    }

    try {
      // Initialize storage
      this.store = new Corestore(this.options.storagePath)
      
      // Initialize file drive with corestore
      this.drive = new Hyperdrive(this.store, { sparse: true })
      await this.drive.ready()
      
      // Initialize Autobase for records
      this.autobase = new Autobase(this.store, {
        inputs: [],
        open: (store) => ({
          records: new Hyperbee(store.get({ name: 'records' }), {
            keyEncoding: 'utf-8',
            valueEncoding: 'json'
          })
        }),
        apply: this._applyRecord.bind(this)
      })
      
      await this.autobase.ready()
      
      // Initialize P2P networking
      this.swarm = new Hyperswarm()
      this.swarm.on('connection', this._onConnection.bind(this))
      
      // Join the EHR topic for peer discovery
      const topic = Buffer.from('pehr-network', 'utf-8')
      this.swarm.join(topic, { lookup: true, announce: true })
      
      this.isInitialized = true
      console.log('EHR Core initialized')
      console.log(`Records key: ${this.autobase.key.toString('hex')}`)
      console.log(`Files key: ${this.drive.key.toString('hex')}`)
      
    } catch (error) {
      console.error('Failed to initialize EHR Core:', error)
      throw error
    }
  }

  async close() {
    if (!this.isInitialized) return
    
    try {
      await this.swarm?.destroy()
      await this.drive?.close()
      await this.autobase?.close()
      await this.store?.close()
      
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

      // Create user's hypercore
      const userCore = this.store.get({
        name: `user-${userId}`,
        keyPair
      })
      
      await userCore.ready()
      await this.autobase.addInput(userCore)
      
      console.log(`Added user ${userId} with key: ${userCore.key.toString('hex')}`)
      
      return {
        userId,
        publicKey: userCore.key,
        core: userCore
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

      // Append to user's hypercore
      await userCore.append(Buffer.from(JSON.stringify(enrichedRecord)))
      
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
      await this.autobase.view.update()
      const key = `${patientId}:${recordId}`
      const record = await this.autobase.view.records.get(key)
      return record?.value || null
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
      await this.autobase.view.update()
      const records = []
      const stream = this.autobase.view.records.createReadStream({
        gte: `${patientId}:`,
        lt: `${patientId}:\xFF`
      })

      for await (const { key, value } of stream) {
        records.push(value)
      }

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
      const filePath = `/${fileName}`
      await this.drive.put(filePath, buffer)
      
      const fileRef = `hyper://${this.drive.key.toString('hex')}${filePath}`
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
      // Parse hyper:// URL
      const url = new URL(fileRef)
      const path = url.pathname
      
      // For now, assume it's our own drive
      // In a full implementation, we'd need to open the remote drive
      const buffer = await this.drive.get(path)
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
      await this.autobase.view.update()
      
      // Count total records
      let recordCount = 0
      const stream = this.autobase.view.records.createReadStream()
      for await (const entry of stream) {
        recordCount++
      }

      return {
        initialized: true,
        connectedPeers: this.swarm.connections.size,
        recordCount,
        inputs: this.autobase.inputs.length,
        driveKey: this.drive.key.toString('hex'),
        autobaseKey: this.autobase.key.toString('hex')
      }
    } catch (error) {
      console.error('Failed to get status:', error)
      return { initialized: true, error: error.message }
    }
  }

  // Private methods
  async _applyRecord(nodes, view) {
    try {
      for (const node of nodes) {
        const record = JSON.parse(node.value.toString())
        
        // Validate record structure
        if (!record.patientId || !record.recordId) {
          console.warn('Invalid record structure, skipping:', record)
          continue
        }

        // Store record with composite key
        const key = `${record.patientId}:${record.recordId}`
        await view.records.put(key, record)
        
        console.log(`Applied record: ${key}`)
      }
    } catch (error) {
      console.error('Error applying record:', error)
    }
  }

  _onConnection(connection, info) {
    console.log(`New peer connected: ${info.publicKey.toString('hex')}`)
    
    // Replicate autobase and drive
    this.autobase.replicate(connection)
    this.drive.replicate(connection)
    
    connection.on('close', () => {
      console.log(`Peer disconnected: ${info.publicKey.toString('hex')}`)
    })
  }
}