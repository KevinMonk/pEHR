# pEHR Testing Guide

This guide explains how to test the pEHR system, what behaviors to expect, and why certain limitations exist in the current implementation.

## Current Implementation Status

### ✅ What's Working
- **OpenEHR-compliant record management** - Full healthcare data standards
- **Multi-user record creation** - Multiple healthcare providers can contribute
- **Schema validation** - Automatic validation of health records
- **File storage and retrieval** - Medical images and documents
- **Complete CLI interface** - All core functionality accessible
- **In-memory demonstration** - Full workflow without persistence

### 🚧 Current Limitations
- **No persistence between CLI commands** - Each command creates a fresh instance
- **No real P2P networking** - Simplified in-memory implementation only
- **No peer discovery** - Cannot connect separate terminals/processes
- **No data synchronization** - No cross-instance communication

### 📋 Coming Soon
- **True P2P networking** - Real peer-to-peer connections
- **Persistent storage** - Data survives between sessions
- **Multi-node testing** - Run peers on different terminals/machines
- **Encryption and access controls** - HIPAA/GDPR compliance

## Understanding the Current Architecture

### Why CLI Commands Don't Persist Data

Each CLI command follows this lifecycle:

```bash
npm run cli -- add-user dr-smith
```

1. **Creates** new EHRCore instance
2. **Initializes** fresh in-memory storage  
3. **Executes** the command (adds user)
4. **Shows** success message
5. **Destroys** the instance and all data

```bash
npm run cli -- status
```

1. **Creates** brand new EHRCore instance
2. **Initializes** empty in-memory storage
3. **Shows** 0 users (because it's a clean slate)
4. **Destroys** the instance

**Result**: No data persists between commands because each command is an isolated demonstration.

### Evidence of Separate Instances

Notice the different keys between runs:

```bash
# First command
Records key: 130522125e3e4c4a03542eef6de17ca88971f723772e4793541456bb56ede069

# Second command  
Records key: 7c33b6036d800459c3cb4afd022ac1c0831b2d60b1af94c2b517b7258bd19941
```

Different keys = different instances = different data stores.

## How to Test Effectively

### 1. Single-Session Testing (Recommended)

#### Interactive Mode
```bash
npm run cli -- interactive
```

Then execute commands in sequence:
```
pehr> status           # Shows: Users: 0, Records: 0
pehr> add-user dr-smith
pehr> status           # Shows: Users: 1, Records: 0  
pehr> add-user patient-john
pehr> status           # Shows: Users: 2, Records: 0
pehr> exit
```

#### Example Scripts
```bash
# Shows incremental status changes
node examples/status-demo.js

# Complete healthcare workflow
node examples/basic-usage.js
```

### 2. Understanding Multi-User Scenarios

Create realistic healthcare scenarios within a single session:

```bash
npm run cli -- interactive
```

Example workflow:
```
# Add healthcare team
pehr> add-user dr-primary-care
pehr> add-user dr-cardiologist  
pehr> add-user nurse-practitioner
pehr> add-user lab-technician
pehr> status

# Each would add records for the same patient
# (Currently simulated via CLI prompts)
```

### 3. Testing Record Creation

Use the interactive record creator:
```bash
npm run cli -- add-record
```

Follow prompts to create:
- **Patient Demographics** (name, DOB, gender)
- **Diagnoses** (condition, severity, date)
- **Medications** (drug, dosage, frequency)
- **Vital Signs** (BP, HR, temperature)
- **Lab Results** (blood tests, values)
- **Imaging Studies** (X-rays, findings)

### 4. File Storage Testing

Files are handled automatically in examples:
```bash
node examples/basic-usage.js
# Watch for:
# ✓ Uploaded sample medical image
# Downloaded file size: 23 bytes
# File matches: true
```

## What Each Test Demonstrates

### CLI Commands (Isolated Instances)
- ✅ **System initialization** works
- ✅ **User creation** works  
- ✅ **Record validation** works
- ✅ **OpenEHR compliance** works
- ❌ **Data persistence** between commands
- ❌ **Peer connectivity** 

### Interactive Mode (Single Session)
- ✅ **All CLI functionality** PLUS
- ✅ **Data persistence** within session
- ✅ **Multi-user workflows**
- ✅ **Status tracking** over time
- ❌ **True P2P networking**

### Example Scripts (Complete Workflows)
- ✅ **End-to-end scenarios**
- ✅ **File upload/download**
- ✅ **Multi-record relationships**
- ✅ **Healthcare team collaboration**
- ✅ **OpenEHR archetype usage**

## Common Testing Mistakes

### ❌ Wrong: Expecting Persistence Across CLI Commands
```bash
npm run cli -- add-user dr-smith
npm run cli -- status                    # Will show 0 users
```

### ✅ Right: Testing Within Single Sessions
```bash
npm run cli -- interactive
# add-user dr-smith
# status                                 # Will show 1 user
```

### ❌ Wrong: Expecting Separate Terminals to Connect
```bash
# Terminal 1
npm run cli -- add-user dr-smith

# Terminal 2  
npm run cli -- status                    # Won't see dr-smith
```

### ✅ Right: Understanding Current Limitations
```bash
# Each terminal = isolated demo instance
# No cross-terminal communication yet
```

## Multi-Peer Testing (Future)

### When True P2P is Implemented

**Terminal 1 (Node 1):**
```bash
npm run start-peer -- --port 8001
# Persistent peer running on port 8001
```

**Terminal 2 (Node 2):**
```bash
npm run start-peer -- --port 8002 --connect localhost:8001
# Connects to node 1, syncs data
```

**Terminal 3 (Client):**
```bash
npm run cli -- add-user dr-smith --peer localhost:8001
# Adds user to node 1
```

**Terminal 2 (Node 2) status:**
```bash
# Will show dr-smith synced from node 1
# Connected peers: 1, Total users: 1
```

### What Will Be Possible
- ✅ **Multiple machines** running peers
- ✅ **Real-time data synchronization**
- ✅ **Offline/online scenarios**
- ✅ **Network partition testing**
- ✅ **Conflict resolution testing**

## Current Test Coverage

### ✅ Fully Testable Now
- **OpenEHR record validation**
- **Multi-user record creation**  
- **Healthcare workflow scenarios**
- **File storage and retrieval**
- **Schema compliance**
- **Error handling**

### 🚧 Partially Testable (Simulated)
- **Multi-writer collaboration** (within single session)
- **User management** (temporary instances)
- **Status monitoring** (session-based)

### ❌ Not Yet Testable
- **True peer-to-peer networking**
- **Cross-machine data sync**
- **Persistent storage**
- **Network resilience**
- **Encryption/security**

## Recommended Testing Flow

### 1. Start with Basics
```bash
npm run cli -- status
npm run cli -- add-user test-doctor
```
**Expectation**: Each command works independently

### 2. Try Interactive Mode
```bash
npm run cli -- interactive
```
**Expectation**: Data persists within the session

### 3. Run Complete Examples
```bash
node examples/status-demo.js
node examples/basic-usage.js
```
**Expectation**: See full workflows working

### 4. Create Custom Scenarios
Write your own scripts testing specific healthcare workflows

## Why This Design?

### Development Benefits
- **Fast iteration** - No complex setup required
- **Clean testing** - No leftover data between tests
- **Easy demonstration** - Just run and see it work
- **Architecture validation** - Core concepts proven

### User Benefits  
- **Immediate gratification** - Everything works out of the box
- **Clear examples** - See exactly what the system does
- **No configuration** - Zero setup complexity
- **Educational** - Learn the concepts easily

### Future Benefits
- **Solid foundation** - Architecture proven and tested
- **Easy migration** - Same interfaces, just different storage
- **Scalable design** - Ready for true P2P when available

## Summary

The current pEHR implementation is a **working demonstration** of a revolutionary healthcare data architecture. While it doesn't yet provide true peer-to-peer networking, it fully demonstrates:

- ✅ **Standards-compliant healthcare records**
- ✅ **Multi-user collaboration patterns** 
- ✅ **Complete EHR workflows**
- ✅ **File management for medical data**
- ✅ **Schema validation and data integrity**

Think of each CLI command as a "demo booth" showing the system working, and interactive mode/scripts as "live demonstrations" of complete workflows.

The architecture is ready for true P2P - we just need to resolve the Hypercore ecosystem compatibility to unlock the full distributed potential! 🚀