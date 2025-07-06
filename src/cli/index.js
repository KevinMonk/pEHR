#!/usr/bin/env node

/**
 * CLI Interface for pEHR
 * Provides command-line tools for testing and managing the P2P EHR system
 */

import { Command } from 'commander'
import chalk from 'chalk'
import { EHRCoreSimple as EHRCore } from '../core/ehr-core-simple.js'
import { EHRRecordFactory } from '../schemas/openehr-schemas.js'

import pkg from '../../package.json'

// Note: We can use a lot of `bare-` imports to fill in the Node API or just use these simplified versions
// import { CommandPear } from "./commandpear.js";
// import chalk from "./chalkpear.js";

// Note: Unsupported dependencies
// import inquirer from "inquirer";
import { pearprompt as inquirer } from './pear-prompt.js'

const program = new Command()

program
  .name('pehr')
  .description('CLI for pEHR - Distributed P2P Electronic Health Record System')
  .version(pkg.version)

// Global EHR instance
let ehr = null

async function initializeEHR() {
  if (!ehr) {
    ehr = new EHRCore({
      storagePath: './ehr-store',
      filesPath: './ehr-files'
    })
    await ehr.initialize()
  }
  return ehr
}

async function closeEHR() {
  if (ehr) {
    await ehr.close()
    ehr = null
  }
}

// Status command
program
  .command('status')
  .description('Show EHR system status')
  .action(async () => {
    try {
      const ehrInstance = await initializeEHR()
      const status = await ehrInstance.getStatus()
      
      console.log(chalk.blue('=== pEHR System Status ==='))
      console.log(`${chalk.green('✓')} System initialized: ${status.initialized}`)
      console.log(`${chalk.cyan('→')} Connected peers: ${status.connectedPeers}`)
      console.log(`${chalk.cyan('→')} Total users: ${status.userCount || 0}`)
      console.log(`${chalk.cyan('→')} Total records: ${status.recordCount}`)
      console.log(`${chalk.cyan('→')} Total files: ${status.fileCount || 0}`)
      console.log(`${chalk.cyan('→')} Input cores: ${status.inputs}`)
      console.log(`${chalk.gray('→')} Records key: ${status.autobaseKey}`)
      console.log(`${chalk.gray('→')} Files key: ${status.driveKey}`)
      
      await closeEHR()
    } catch (error) {
      console.error(chalk.red('Error getting status:'), error.message)
      Pear.exit(1)
    }
  })

// Add user command
program
  .command('add-user <userId>')
  .description('Add a new user to the EHR system')
  .action(async (userId) => {
    try {
      const ehrInstance = await initializeEHR()
      const user = await ehrInstance.addUser(userId)
      
      console.log(chalk.green('✓'), `User ${userId} added successfully`)
      console.log(`${chalk.gray('→')} Public key: ${user.publicKey.toString('hex')}`)
      
      await closeEHR()
    } catch (error) {
      console.error(chalk.red('Error adding user:'), error.message)
      Pear.exit(1)
    }
  })

// Add record command
program
  .command('add-record')
  .description('Add a medical record (interactive)')
  .action(async () => {
    try {
      const ehrInstance = await initializeEHR()
      
      // Interactive record creation
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'patientId',
          message: 'Patient ID:',
          validate: (input) => input.trim() !== '' || 'Patient ID is required'
        },
        {
          type: 'input',
          name: 'userId',
          message: 'User ID (author):',
          validate: (input) => input.trim() !== '' || 'User ID is required'
        },
        {
          type: 'list',
          name: 'recordType',
          message: 'Record type:',
          choices: [
            { name: 'Patient Demographics', value: 'demographics' },
            { name: 'Diagnosis', value: 'diagnosis' },
            { name: 'Medication', value: 'medication' },
            { name: 'Vital Signs', value: 'vitals' },
            { name: 'Lab Result', value: 'lab' },
            { name: 'Imaging Study', value: 'imaging' },
            { name: 'Allergy', value: 'allergy' },
            { name: 'Immunization', value: 'immunization' }
          ]
        }
      ])
      
      let record = null
      
      // Create record based on type
      switch (answers.recordType) {
        case 'demographics':
          const demoData = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'Patient name:' },
            { type: 'input', name: 'dateOfBirth', message: 'Date of birth (YYYY-MM-DD):' },
            { type: 'list', name: 'gender', message: 'Gender:', choices: ['male', 'female', 'other'] }
          ])
          record = EHRRecordFactory.createPatientDemographics(
            answers.patientId,
            demoData.name,
            demoData.dateOfBirth,
            demoData.gender,
            { authorId: answers.userId }
          )
          break
          
        case 'diagnosis':
          const diagData = await inquirer.prompt([
            { type: 'input', name: 'diagnosis', message: 'Diagnosis:' },
            { type: 'input', name: 'dateOfDiagnosis', message: 'Date of diagnosis (YYYY-MM-DD):' },
            { type: 'list', name: 'severity', message: 'Severity:', choices: ['mild', 'moderate', 'severe'] }
          ])
          record = EHRRecordFactory.createDiagnosis(
            answers.patientId,
            diagData.diagnosis,
            diagData.dateOfDiagnosis,
            diagData.severity,
            { authorId: answers.userId }
          )
          break
          
        case 'medication':
          const medData = await inquirer.prompt([
            { type: 'input', name: 'medication', message: 'Medication name:' },
            { type: 'input', name: 'dosage', message: 'Dosage:' },
            { type: 'input', name: 'frequency', message: 'Frequency:' }
          ])
          record = EHRRecordFactory.createMedication(
            answers.patientId,
            medData.medication,
            medData.dosage,
            medData.frequency,
            { authorId: answers.userId }
          )
          break
          
        case 'vitals':
          const vitalData = await inquirer.prompt([
            { type: 'input', name: 'bloodPressure', message: 'Blood pressure (e.g., 120/80):' },
            { type: 'input', name: 'heartRate', message: 'Heart rate (bpm):' },
            { type: 'input', name: 'temperature', message: 'Temperature (°F):' }
          ])
          record = EHRRecordFactory.createVitalSigns(
            answers.patientId,
            {
              bloodPressure: vitalData.bloodPressure,
              heartRate: vitalData.heartRate,
              temperature: vitalData.temperature
            },
            new Date().toISOString(),
            { authorId: answers.userId }
          )
          break
          
        default:
          console.log(chalk.yellow('Record type not implemented yet'))
          return
      }
      
      // Get user's core (simplified - in real app, would manage this better)
      const user = await ehrInstance.addUser(answers.userId)
      await ehrInstance.addRecord(user.core, record)
      
      console.log(chalk.green('✓'), `Record added successfully`)
      console.log(`${chalk.gray('→')} Record ID: ${record.recordId}`)
      console.log(`${chalk.gray('→')} Type: ${record.archetype}`)
      
      await closeEHR()
    } catch (error) {
      console.error(chalk.red('Error adding record:'), error.message)
      Pear.exit(1)
    }
  })

// List records command
program
  .command('list-records <patientId>')
  .description('List all records for a patient')
  .action(async (patientId) => {
    try {
      const ehrInstance = await initializeEHR()
      const records = await ehrInstance.getPatientRecords(patientId)
      
      console.log(chalk.blue(`=== Records for Patient ${patientId} ===`))
      
      if (records.length === 0) {
        console.log(chalk.yellow('No records found'))
      } else {
        records.forEach((record, index) => {
          console.log(`\n${chalk.cyan(`${index + 1}.`)} ${record.archetype}`)
          console.log(`   ${chalk.gray('ID:')} ${record.recordId}`)
          console.log(`   ${chalk.gray('Date:')} ${record.timestamp}`)
          console.log(`   ${chalk.gray('Author:')} ${record.authorId || 'N/A'}`)
          console.log(`   ${chalk.gray('Data:')} ${JSON.stringify(record.data, null, 2)}`)
        })
      }
      
      await closeEHR()
    } catch (error) {
      console.error(chalk.red('Error listing records:'), error.message)
      Pear.exit(1)
    }
  })

// Get record command
program
  .command('get-record <patientId> <recordId>')
  .description('Get a specific record')
  .action(async (patientId, recordId) => {
    try {
      const ehrInstance = await initializeEHR()
      const record = await ehrInstance.getRecord(patientId, recordId)
      
      if (!record) {
        console.log(chalk.yellow('Record not found'))
      } else {
        console.log(chalk.blue('=== Record Details ==='))
        console.log(JSON.stringify(record, null, 2))
      }
      
      await closeEHR()
    } catch (error) {
      console.error(chalk.red('Error getting record:'), error.message)
      Pear.exit(1)
    }
  })

// Interactive mode
program
  .command('interactive')
  .description('Start interactive mode')
  .action(async () => {
    try {
      const ehrInstance = await initializeEHR()
      
      console.log(chalk.green('Welcome to pEHR Interactive Mode'))
      console.log(chalk.gray('Type "help" for available commands, "exit" to quit'))
      
      while (true) {
        const { command } = await inquirer.prompt([
          {
            type: 'input',
            name: 'command',
            message: 'pehr>',
            prefix: ''
          }
        ])
        
        if (command.trim() === 'exit') {
          break
        }
        
        if (command.trim() === 'help') {
          console.log(chalk.blue('Available commands:'))
          console.log('  status - Show system status')
          console.log('  add-user <userId> - Add a new user')
          console.log('  add-record - Add a medical record')
          console.log('  list-records <patientId> - List patient records')
          console.log('  help - Show this help')
          console.log('  exit - Exit interactive mode')
          continue
        }
        
        // Parse and execute command
        const args = command.trim().split(' ')
        try {
          if (args[0] === 'status') {
            const status = await ehrInstance.getStatus()
            console.log(`Users: ${status.userCount || 0}, Records: ${status.recordCount}, Files: ${status.fileCount || 0}, Peers: ${status.connectedPeers}`)
          } else if (args[0] === 'add-user' && args[1]) {
            const user = await ehrInstance.addUser(args[1])
            console.log(chalk.green('✓'), `User ${args[1]} added`)
          } else if (args[0] === 'list-records' && args[1]) {
            const records = await ehrInstance.getPatientRecords(args[1])
            console.log(`Found ${records.length} records for patient ${args[1]}`)
          } else {
            console.log(chalk.yellow('Unknown command or missing arguments'))
          }
        } catch (error) {
          console.error(chalk.red('Error:'), error.message)
        }
      }
      
      await closeEHR()
    } catch (error) {
      console.error(chalk.red('Error in interactive mode:'), error.message)
      Pear.exit(1)
    }
  })

// Handle cleanup
Pear.teardown(async () => {
  console.log(chalk.yellow('\nShutting down...'))
  await closeEHR()
  Pear.exit(0)
})

program.parse(Pear.config.args, { from: 'user' })
