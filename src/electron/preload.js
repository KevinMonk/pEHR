import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // EHR operations
  ehr: {
    initialize: (options) => ipcRenderer.invoke('ehr-initialize', options),
    addRecord: (record) => ipcRenderer.invoke('ehr-add-record', record),
    getRecords: (patientId) => ipcRenderer.invoke('ehr-get-records', patientId),
    inviteProvider: (providerName, role) => ipcRenderer.invoke('ehr-invite-provider', providerName, role),
    joinProvider: (storagePath, providerId, invite) => ipcRenderer.invoke('ehr-join-provider', storagePath, providerId, invite),
    getStatus: () => ipcRenderer.invoke('ehr-get-status')
  },

  // Settings operations
  settings: {
    get: (key) => ipcRenderer.invoke('settings-get', key),
    set: (key, value) => ipcRenderer.invoke('settings-set', key, value),
    getAll: () => ipcRenderer.invoke('settings-get-all')
  },

  // File dialogs
  dialog: {
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options)
  },

  // Menu event listeners
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-record', callback)
    ipcRenderer.on('menu-settings', callback)
    ipcRenderer.on('menu-network-status', callback)
    ipcRenderer.on('menu-invite-provider', callback)
    ipcRenderer.on('menu-join-provider', callback)
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})

// Version info
contextBridge.exposeInMainWorld('versions', {
  node: process.versions.node,
  chrome: process.versions.chrome,
  electron: process.versions.electron
})

console.log('pEHR preload script loaded')