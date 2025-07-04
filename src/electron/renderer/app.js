// Application State
let currentScreen = 'loading'
let currentView = 'records'
let ehrInitialized = false
let userRole = 'patient'
let userName = ''

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('pEHR Desktop App Loading...')
    initializeApp()
})

async function initializeApp() {
    // Set up event listeners
    setupEventListeners()
    
    // Check if we should use saved config
    // Note: renderer process doesn't have access to process.argv, so we'll check URL params
    const urlParams = new URLSearchParams(window.location.search)
    const isFreshMode = urlParams.has('fresh')
    const savedConfig = !isFreshMode ? await window.electronAPI.settings.get('userConfig') : null
    
    if (savedConfig) {
        try {
            // Add timestamp to make storage path unique for each instance
            if (savedConfig.storagePath && !savedConfig.storagePath.includes('-instance-')) {
                savedConfig.storagePath = savedConfig.storagePath + '-instance-' + Date.now()
            }
            
            // Try to initialize with saved config
            const result = await window.electronAPI.ehr.initialize(savedConfig)
            
            if (result.success) {
                ehrInitialized = true
                userRole = savedConfig.role
                userName = savedConfig.name || savedConfig.patientId || savedConfig.providerId
                showScreen('dashboard')
                updateDashboard()
            } else {
                // Config exists but failed to initialize
                showScreen('setup')
            }
        } catch (error) {
            console.error('Failed to initialize with saved config:', error)
            showScreen('setup')
        }
    } else {
        // First time setup
        console.log('No saved config, showing setup screen...')
        setTimeout(() => {
            console.log('Transitioning to setup screen')
            showScreen('setup')
        }, 2000)
    }
}

function setupEventListeners() {
    // Screen navigation
    document.getElementById('patient-setup')?.addEventListener('click', () => {
        showScreen('patient-form')
        setDefaultStoragePath('patient')
    })
    
    document.getElementById('provider-setup')?.addEventListener('click', () => {
        showScreen('provider-form')
        setDefaultStoragePath('provider')
    })
    
    document.getElementById('back-to-setup')?.addEventListener('click', () => {
        showScreen('setup')
    })
    
    document.getElementById('back-to-setup-provider')?.addEventListener('click', () => {
        showScreen('setup')
    })
    
    // Storage path browsers
    document.getElementById('browse-storage')?.addEventListener('click', async () => {
        const result = await window.electronAPI.dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Storage Location'
        })
        
        if (!result.canceled && result.filePaths.length > 0) {
            document.getElementById('storage-path').value = result.filePaths[0]
        }
    })
    
    document.getElementById('browse-provider-storage')?.addEventListener('click', async () => {
        const result = await window.electronAPI.dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Storage Location'
        })
        
        if (!result.canceled && result.filePaths.length > 0) {
            document.getElementById('provider-storage-path').value = result.filePaths[0]
        }
    })
    
    // Form submissions
    document.getElementById('patient-setup-form')?.addEventListener('submit', handlePatientSetup)
    document.getElementById('provider-setup-form')?.addEventListener('submit', handleProviderSetup)
    
    // Dashboard navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view
            if (view) {
                showView(view)
            }
        })
    })
    
    // Modal controls
    setupModalControls()
    
    // Menu event listeners
    window.electronAPI.onMenuAction((event, action) => {
        handleMenuAction(action)
    })
    
    // Status updates
    setInterval(updateStatus, 5000) // Update every 5 seconds
    
    // Patient selector for providers
    document.getElementById('load-patient-records')?.addEventListener('click', () => {
        const patientId = document.getElementById('patient-id-input').value.trim()
        if (patientId) {
            loadRecordsForPatient(patientId)
        }
    })
    
    // Refresh records button
    document.getElementById('refresh-records-btn')?.addEventListener('click', () => {
        console.log('Manual refresh clicked')
        loadRecords()
    })
}

function setupModalControls() {
    // Add Record Modal
    document.getElementById('add-record-btn')?.addEventListener('click', () => {
        showModal('add-record-modal')
    })
    
    document.getElementById('add-record-form')?.addEventListener('submit', handleAddRecord)
    document.getElementById('cancel-record')?.addEventListener('click', () => hideModal())
    
    // Invite Provider Modal
    document.getElementById('invite-provider-btn')?.addEventListener('click', () => {
        showModal('invite-modal')
    })
    
    document.getElementById('invite-form')?.addEventListener('submit', handleInviteProvider)
    document.getElementById('cancel-invite')?.addEventListener('click', () => hideModal())
    
    // Copy invite button
    document.getElementById('copy-invite')?.addEventListener('click', () => {
        const textarea = document.getElementById('generated-invite')
        textarea.select()
        document.execCommand('copy')
        
        const btn = document.getElementById('copy-invite')
        const originalText = btn.textContent
        btn.textContent = 'Copied!'
        setTimeout(() => {
            btn.textContent = originalText
        }, 2000)
    })
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', hideModal)
    })
    
    // Modal overlay click
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') {
            hideModal()
        }
    })
}

async function setDefaultStoragePath(type) {
    // Get the actual home directory from Electron
    const homeDir = await window.electronAPI.getHomeDir()
    const timestamp = Date.now()
    const defaultPath = `${homeDir}/pEHR-${type}-${timestamp}`
    
    if (type === 'patient') {
        document.getElementById('storage-path').value = defaultPath
    } else {
        document.getElementById('provider-storage-path').value = defaultPath
    }
}

async function handlePatientSetup(e) {
    e.preventDefault()
    
    const formData = new FormData(e.target)
    const name = formData.get('patient-name') || document.getElementById('patient-name').value
    const dob = formData.get('patient-dob') || document.getElementById('patient-dob').value
    const patientId = formData.get('patient-id') || document.getElementById('patient-id').value || `patient-${Date.now()}`
    const storagePath = document.getElementById('storage-path').value
    
    if (!name || !dob || !storagePath) {
        alert('Please fill in all required fields')
        return
    }
    
    showScreen('loading')
    
    try {
        const config = {
            storagePath,
            role: 'patient',
            patientId,
            name,
            dateOfBirth: dob
        }
        
        const result = await window.electronAPI.ehr.initialize(config)
        
        if (result.success) {
            // Save config
            await window.electronAPI.settings.set('userConfig', config)
            
            ehrInitialized = true
            userRole = 'patient'
            userName = name
            
            showScreen('dashboard')
            updateDashboard()
        } else {
            alert(`Setup failed: ${result.error}`)
            showScreen('patient-form')
        }
    } catch (error) {
        console.error('Patient setup error:', error)
        alert(`Setup failed: ${error.message}`)
        showScreen('patient-form')
    }
}

async function handleProviderSetup(e) {
    e.preventDefault()
    
    const providerName = document.getElementById('provider-name').value
    const providerId = document.getElementById('provider-id').value
    const inviteCode = document.getElementById('invite-code').value
    const storagePath = document.getElementById('provider-storage-path').value
    
    if (!providerName || !providerId || !inviteCode || !storagePath) {
        alert('Please fill in all required fields')
        return
    }
    
    showScreen('loading')
    
    try {
        const result = await window.electronAPI.ehr.joinProvider(storagePath, providerId, inviteCode)
        
        if (result.success) {
            // Extract patient ID from invite code (this is a hack for demo purposes)
            // In production, this would come from the invite metadata
            let connectedPatientId = null
            try {
                // The invite contains the patient info - we'll parse it later
                // For now, we'll set it in the network view when we connect
                console.log('Provider setup result:', result)
            } catch (e) {
                console.log('Could not extract patient ID from invite')
            }
            
            // Save config
            const config = {
                storagePath,
                role: 'provider',
                providerId,
                name: providerName,
                inviteCode,
                connectedPatientId: connectedPatientId
            }
            await window.electronAPI.settings.set('userConfig', config)
            
            ehrInitialized = true
            userRole = 'provider'
            userName = providerName
            
            showScreen('dashboard')
            updateDashboard()
        } else {
            alert(`Setup failed: ${result.error}`)
            showScreen('provider-form')
        }
    } catch (error) {
        console.error('Provider setup error:', error)
        alert(`Setup failed: ${error.message}`)
        showScreen('provider-form')
    }
}

async function handleAddRecord(e) {
    e.preventDefault()
    
    const recordType = document.getElementById('record-type').value
    const recordDataText = document.getElementById('record-data').value
    const notes = document.getElementById('record-notes').value
    
    if (!recordType || !recordDataText) {
        alert('Please fill in all required fields')
        return
    }
    
    try {
        const recordData = JSON.parse(recordDataText)
        
        const record = {
            type: recordType,
            timestamp: new Date().toISOString(),
            data: {
                ...recordData,
                notes: notes || undefined
            }
        }
        
        const result = await window.electronAPI.ehr.addRecord(record)
        
        if (result.success) {
            console.log('Record added successfully:', result)
            hideModal()
            
            // Wait a moment for the record to be written
            setTimeout(() => {
                loadRecords() // Refresh records display
            }, 500)
            
            // Clear form
            document.getElementById('add-record-form').reset()
        } else {
            console.error('Failed to add record:', result.error)
            alert(`Failed to add record: ${result.error}`)
        }
    } catch (error) {
        if (error instanceof SyntaxError) {
            alert('Invalid JSON in record data. Please check the format.')
        } else {
            console.error('Add record error:', error)
            alert(`Failed to add record: ${error.message}`)
        }
    }
}

async function handleInviteProvider(e) {
    e.preventDefault()
    
    const providerName = document.getElementById('provider-name-invite').value
    const role = document.getElementById('provider-role').value
    
    if (!providerName || !role) {
        alert('Please fill in all required fields')
        return
    }
    
    try {
        const result = await window.electronAPI.ehr.inviteProvider(providerName, role)
        
        if (result.success) {
            // Show the invite code
            document.getElementById('generated-invite').value = result.invite
            document.getElementById('invite-result').style.display = 'block'
            document.getElementById('generate-invite').style.display = 'none'
        } else {
            alert(`Failed to generate invite: ${result.error}`)
        }
    } catch (error) {
        console.error('Invite provider error:', error)
        alert(`Failed to generate invite: ${error.message}`)
    }
}

function showScreen(screenId) {
    console.log(`Showing screen: ${screenId}`)
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active')
    })
    
    // Show target screen
    const targetScreen = document.getElementById(screenId)
    if (targetScreen) {
        targetScreen.classList.add('active')
        currentScreen = screenId
        console.log(`Screen ${screenId} is now active`)
    } else {
        console.error(`Screen ${screenId} not found!`)
    }
}

function showView(viewId) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active')
    })
    document.querySelector(`[data-view="${viewId}"]`).classList.add('active')
    
    // Show view
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active')
    })
    
    const targetView = document.getElementById(`${viewId}-view`)
    if (targetView) {
        targetView.classList.add('active')
        currentView = viewId
        
        // Load view-specific data
        if (viewId === 'records') {
            console.log('Switching to records view - loading records...')
            loadRecords()
        } else if (viewId === 'network') {
            updateNetworkStatus()
        }
    }
}

function showModal(modalId) {
    const overlay = document.getElementById('modal-overlay')
    const modal = document.getElementById(modalId)
    
    if (overlay && modal) {
        // Hide all modals
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none')
        
        // Show target modal
        modal.style.display = 'block'
        overlay.classList.add('active')
    }
}

function hideModal() {
    const overlay = document.getElementById('modal-overlay')
    if (overlay) {
        overlay.classList.remove('active')
        
        // Reset invite modal state
        document.getElementById('invite-result').style.display = 'none'
        document.getElementById('generate-invite').style.display = 'block'
        document.getElementById('invite-form').reset()
    }
}

async function updateDashboard() {
    // Update user info
    document.getElementById('user-name').textContent = userName
    document.getElementById('user-role').textContent = userRole === 'patient' ? 'Patient' : 'Provider'
    document.getElementById('user-role').className = `role-badge ${userRole}`
    
    // Show patient selector for providers
    if (userRole === 'provider') {
        document.getElementById('patient-selector').style.display = 'flex'
    }
    
    // Load initial data
    if (currentView === 'records') {
        loadRecords()
    }
    
    updateStatus()
}

async function loadRecords() {
    if (!ehrInitialized) return
    
    try {
        const config = await window.electronAPI.settings.get('userConfig')
        const status = await window.electronAPI.ehr.getStatus()
        
        console.log('Load records - Config:', config)
        console.log('Load records - Status:', status)
        
        // Use the patient ID from the EHR system status first, then fall back to config
        let patientId = status.patientId || config.patientId
        
        // If we're a provider, we need to get the connected patient's ID
        if (config.role === 'provider' && !patientId) {
            // For providers, we need to get the connected patient's ID
            console.log('Provider mode - looking for connected patient')
            patientId = status.connectedPatientId || config.connectedPatientId
        }
        
        console.log('Final patient ID for records:', patientId)
        
        if (!patientId) {
            console.log('No patient ID available')
            const container = document.getElementById('records-list')
            container.innerHTML = '<p>No patient connected. Please join a patient network first.</p>'
            return
        }
        
        const result = await window.electronAPI.ehr.getRecords(patientId)
        console.log('Records result for patient', patientId, ':', result)
        
        if (result.success) {
            displayRecords(result.records)
        } else {
            console.error('Failed to load records:', result.error)
        }
    } catch (error) {
        console.error('Load records error:', error)
    }
}

async function loadRecordsForPatient(patientId) {
    console.log('Loading records for specific patient:', patientId)
    
    try {
        const result = await window.electronAPI.ehr.getRecords(patientId)
        console.log('Records result for', patientId, ':', result)
        
        if (result.success) {
            displayRecords(result.records)
        } else {
            console.error('Failed to load records for patient:', patientId, result.error)
            const container = document.getElementById('records-list')
            container.innerHTML = `<p>Failed to load records for patient ${patientId}: ${result.error}</p>`
        }
    } catch (error) {
        console.error('Error loading records for patient:', patientId, error)
    }
}

function displayRecords(records) {
    const container = document.getElementById('records-list')
    
    if (!records || records.length === 0) {
        container.innerHTML = '<p>No medical records found. Add your first record to get started.</p>'
        return
    }
    
    container.innerHTML = records.map(record => `
        <div class="record-card">
            <div class="record-header">
                <span class="record-type">${record.type.replace('_', ' ')}</span>
                <span class="record-timestamp">${new Date(record.timestamp).toLocaleString()}</span>
            </div>
            <div class="record-data">
                ${formatRecordData(record.data)}
            </div>
        </div>
    `).join('')
}

function formatRecordData(data) {
    if (!data) return 'No data'
    
    // Handle common record types
    if (data.blood_pressure) {
        return `Blood Pressure: ${data.blood_pressure.systolic}/${data.blood_pressure.diastolic} mmHg`
    }
    
    if (data.chief_complaint) {
        return `Chief Complaint: ${data.chief_complaint}`
    }
    
    if (data.diagnosis) {
        return `Diagnosis: ${data.diagnosis}`
    }
    
    if (data.allergies) {
        return `Allergies: ${data.allergies.join(', ')}`
    }
    
    // Fallback to JSON representation
    return `<pre>${JSON.stringify(data, null, 2)}</pre>`
}

async function updateStatus() {
    if (!ehrInitialized) return
    
    try {
        const status = await window.electronAPI.ehr.getStatus()
        
        if (status.success) {
            // Update connection indicator
            const indicator = document.getElementById('connection-status')
            const peerCount = document.getElementById('peer-count')
            
            if (indicator) {
                indicator.className = status.peers > 0 ? 'status-indicator connected' : 'status-indicator'
            }
            
            if (peerCount) {
                peerCount.textContent = `${status.peers} peers`
            }
            
            // Update network view if active
            if (currentView === 'network') {
                updateNetworkStatus(status)
            }
        }
    } catch (error) {
        console.error('Status update error:', error)
    }
}

function updateNetworkStatus(status = null) {
    if (status) {
        document.getElementById('network-status').textContent = status.peers > 0 ? 'Connected' : (status.initialized ? 'Ready' : 'Offline')
        document.getElementById('network-peers').textContent = status.peers
        document.getElementById('network-role').textContent = status.role || 'Unknown'
        document.getElementById('identity-patient-id').textContent = status.patientId || status.providerId || 'Unknown'
        document.getElementById('identity-key').textContent = status.key || 'Unknown'
    }
}

function handleMenuAction(action) {
    switch (action) {
        case 'menu-new-record':
            if (currentScreen === 'dashboard') {
                showModal('add-record-modal')
            }
            break
        case 'menu-settings':
            if (currentScreen === 'dashboard') {
                showView('settings')
            }
            break
        case 'menu-network-status':
            if (currentScreen === 'dashboard') {
                showView('network')
            }
            break
        case 'menu-invite-provider':
            if (currentScreen === 'dashboard' && userRole === 'patient') {
                showModal('invite-modal')
            }
            break
    }
}

// Populate record type examples
document.addEventListener('DOMContentLoaded', () => {
    const recordTypeSelect = document.getElementById('record-type')
    const recordDataTextarea = document.getElementById('record-data')
    
    if (recordTypeSelect && recordDataTextarea) {
        recordTypeSelect.addEventListener('change', (e) => {
            const examples = {
                vital_signs: {
                    blood_pressure: { systolic: 120, diastolic: 80 },
                    heart_rate: 72,
                    temperature: 98.6,
                    weight: 150,
                    height: 170
                },
                symptoms: {
                    chief_complaint: "Headache",
                    duration: "2 days",
                    severity: 7,
                    location: "Frontal"
                },
                medical_history: {
                    allergies: ["penicillin"],
                    medications: ["Aspirin 81mg daily"],
                    past_surgeries: [],
                    family_history: []
                },
                assessment: {
                    diagnosis: "Tension headache",
                    plan: "Rest and hydration",
                    follow_up: "Return if symptoms worsen"
                }
            }
            
            if (examples[e.target.value]) {
                recordDataTextarea.value = JSON.stringify(examples[e.target.value], null, 2)
            }
        })
    }
})

console.log('pEHR app.js loaded')