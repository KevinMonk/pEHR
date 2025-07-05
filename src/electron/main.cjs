const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const { join } = require('path')
const { default: Store } = require('electron-store')

// For dynamic import of ES modules
let EHRAutopass = null

async function loadEHRModule() {
  if (!EHRAutopass) {
    const module = await import('../core/ehr-autopass.js')
    EHRAutopass = module.EHRAutopass
  }
  return EHRAutopass
}

// Enable live reload for development
if (process.argv.includes('--dev')) {
  try {
    require('electron-reload')(__dirname, {
      electron: join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    })
  } catch (error) {
    // electron-reload is optional in dev
  }
}

// Store for persistent settings
const store = new Store()

// Global references
let mainWindow = null
let ehrSystem = null

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.cjs')
    },
    titleBarStyle: 'hiddenInset', // macOS style
    show: false // Don't show until ready
  })

  // Load the app
  mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'))
  
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools()
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // Focus on window
    if (process.platform === 'darwin') {
      app.dock.show()
    }
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle window close event
  mainWindow.on('close', async (event) => {
    if (ehrSystem) {
      event.preventDefault()
      await cleanupEHRSystem()
      mainWindow.destroy()
    }
  })
}

// App event handlers
app.whenReady().then(() => {
  createWindow()
  createMenu()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await cleanupEHRSystem()
})

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Patient Record',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-record')
          }
        },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-settings')
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Network',
      submenu: [
        {
          label: 'Connection Status',
          click: () => {
            mainWindow.webContents.send('menu-network-status')
          }
        },
        {
          label: 'Invite Provider',
          click: () => {
            mainWindow.webContents.send('menu-invite-provider')
          }
        },
        {
          label: 'Join as Provider',
          click: () => {
            mainWindow.webContents.send('menu-join-provider')
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About pEHR',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About pEHR',
              message: 'pEHR - Peer-to-Peer Electronic Health Records',
              detail: 'A decentralized EHR system built on Holepunch Pear Runtime.\n\nVersion: 0.1.0\nBuilt with Electron and Autopass'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Cleanup EHR system
async function cleanupEHRSystem() {
  if (ehrSystem) {
    try {
      await ehrSystem.close()
      ehrSystem = null
    } catch (error) {
      console.error('Error closing EHR system:', error)
    }
  }
}

// IPC handlers for EHR operations
ipcMain.handle('ehr-initialize', async (event, options) => {
  try {
    if (ehrSystem) {
      await ehrSystem.close()
    }

    const EHRClass = await loadEHRModule()
    ehrSystem = new EHRClass(options)
    await ehrSystem.initialize()
    
    return {
      success: true,
      patientId: ehrSystem.options.patientId,
      key: ehrSystem.autopass.key.toString('hex').substring(0, 16) + '...'
    }
  } catch (error) {
    console.error('EHR initialization error:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

ipcMain.handle('ehr-add-record', async (event, record) => {
  try {
    if (!ehrSystem) {
      throw new Error('EHR system not initialized')
    }
    
    const result = await ehrSystem.addMedicalRecord(record)
    return { success: true, recordId: result }
  } catch (error) {
    console.error('Add record error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('ehr-get-records', async (event, patientId) => {
  try {
    if (!ehrSystem) {
      throw new Error('EHR system not initialized')
    }
    
    const records = await ehrSystem.getPatientRecords(patientId)
    return { success: true, records }
  } catch (error) {
    console.error('Get records error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('ehr-invite-provider', async (event, providerName, role) => {
  try {
    if (!ehrSystem) {
      throw new Error('EHR system not initialized')
    }
    
    const invite = await ehrSystem.inviteProvider(providerName, role)
    return { success: true, invite }
  } catch (error) {
    console.error('Invite provider error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('ehr-join-provider', async (event, storagePath, providerId, invite) => {
  try {
    if (ehrSystem) {
      await ehrSystem.close()
    }

    const EHRClass = await loadEHRModule()
    ehrSystem = await EHRClass.joinAsProvider(storagePath, providerId, invite)
    return { 
      success: true, 
      providerId: ehrSystem.options.providerId,
      connectedPatients: [] // Will be populated as data syncs
    }
  } catch (error) {
    console.error('Join provider error:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('ehr-get-status', async () => {
  try {
    if (!ehrSystem) {
      return { 
        success: true, 
        initialized: false,
        peers: 0,
        role: null
      }
    }
    
    return {
      success: true,
      initialized: true,
      peers: ehrSystem.autopass.peers.length,
      role: ehrSystem.options.role,
      patientId: ehrSystem.options.patientId,
      providerId: ehrSystem.options.providerId
    }
  } catch (error) {
    console.error('Get status error:', error)
    return { success: false, error: error.message }
  }
})

// Settings handlers
ipcMain.handle('settings-get', (event, key) => {
  return store.get(key)
})

ipcMain.handle('settings-set', (event, key, value) => {
  store.set(key, value)
  return true
})

ipcMain.handle('settings-get-all', () => {
  return store.store
})

// File dialog handlers
ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options)
  return result
})

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options)
  return result
})

// Log for debugging
console.log('pEHR Electron app starting...')