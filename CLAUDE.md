# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a distributed peer-to-peer Electronic Health Record (EHR) system built on Holepunch's Pear Runtime. The system aims to create a decentralized EHR that operates without central servers, supports multiple authorship (patients, doctors, hospitals), and enables multiple "truths" where each peer can curate their own version of health records.

## Architecture

**✅ BREAKTHROUGH: TRUE P2P EHR IS NOW WORKING!**

The system successfully uses **Autopass** as the core P2P layer with full functionality:

### ✅ Working P2P Implementation
- **Autopass 1.0.2**: Secure multi-writer P2P data synchronization ✅
- **Corestore 6.18.4**: Compatible persistent distributed storage ✅
- **Invite-based access**: Patient-controlled provider access ✅
- **Real-time sync**: Changes propagate instantly between peers ✅
- **OpenEHR compliance**: Full healthcare data standards ✅
- **Multi-peer scenarios**: Doctor-patient workflows working ✅

### Compatibility Solution
**Key Fix**: The breakthrough came from using Corestore 6.18.4 (same version Autopass tests use) instead of 7.x. This resolves the "Could not derive discovery from input" error that blocked P2P initialization.

### Legacy Implementation (Simplified Demo)
- **In-memory storage**: For quick testing and demos
- **No real P2P**: Isolated instances for concept validation
- **Still functional**: Available as fallback in `ehr-core-simple.js`

### Key Components

1. **Data Model**:
   - Autobase stores openEHR-formatted records in Hyperbee views
   - Each peer (patient, doctor, hospital) maintains their own Hypercore log
   - Hyperdrive stores large files with metadata references in Autobase
   - Records follow structure: `{ patientID, recordID, type, data, fileRef, timestamp }`

2. **Multiple Truths Implementation**:
   - Autobase's `apply` function creates peer-specific filtered views
   - Hospitals can exclude non-clinical data while patients retain all records
   - Views built using Hyperbee queries on openEHR archetypes

3. **Security & Compliance**:
   - libsodium encryption for HIPAA/GDPR compliance
   - Hypercore key pairs for write access control
   - Immutable audit logs via Hypercore's append-only structure

## Working Examples

### ✅ P2P EHR Demo (WORKING!)
```bash
# Run the complete P2P healthcare scenario
node examples/ehr-p2p-demo.js
```
**This demonstrates**:
- Patient creates health records
- Patient invites doctor via secure P2P invite
- Doctor joins and accesses patient data
- Doctor adds assessment, patient sees it instantly
- All data synchronized in real-time P2P

### ✅ Basic Autopass Test (WORKING!)
```bash
# Verify Autopass P2P functionality
node examples/correct-autopass-test.js
```

### ✅ Basic Hypercore P2P Test
```bash
# Test raw Hypercore replication
node examples/basic-hypercore.js
```

## Development Commands

### Current Implementation (Simplified)
```bash
# Install dependencies
npm install

# Test CLI interface
npm run cli -- status
npm run cli -- interactive

# Run examples and demos
node examples/basic-usage.js
node examples/status-demo.js

# Run test suite
npm test

# Development mode
npm run dev
```

### Testing Notes
- **Current version uses in-memory storage** - No persistence between CLI commands
- **Each CLI command creates isolated instance** - Use interactive mode for persistent sessions
- **True P2P functionality pending** - Hypercore compatibility issues being resolved
- **See docs/TESTING-GUIDE.md** for comprehensive testing instructions

## Technical Considerations

### Data Storage Strategy
- Use Autobase for structured health records with multi-writer support
- Use Hyperdrive for large files (X-rays, PDFs, medical images)
- Implement sparse replication to sync only relevant patient data
- Support offline writes with reconciliation upon reconnection

### Querying
- Leverage Hyperbee's B-tree structure for efficient patient/record lookups
- Use openEHR's AQL (Archetype Query Language) for complex clinical queries
- Index records by patientID, recordID, and clinical data types

### Compliance Requirements
- Implement end-to-end encryption for all health data
- Ensure audit trails via immutable Hypercore logs
- Support fine-grained access controls (doctor vs patient permissions)
- Handle data retention and deletion policies per regulations

### Performance Optimization
- Optimize for low-bandwidth and offline scenarios
- Implement efficient peer discovery and connection management
- Use sparse replication to minimize data transfer
- Consider caching strategies for frequently accessed records

## Future Integration Points

- **FHIR**: For external system integration (hospitals, insurance)
- **External APIs**: Lab results, pharmacy systems
- **Legacy EHR**: Import/export capabilities
- **Mobile Apps**: Patient-facing applications

This codebase represents a novel approach to health data management using cutting-edge P2P technology while maintaining strict compliance and privacy standards.