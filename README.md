# pEHR - Distributed P2P Electronic Health Record System

A peer-to-peer Electronic Health Record system built on Holepunch's Pear Runtime that enables decentralized health data management without central servers.

## Features

- **Decentralized Architecture**: No central servers, operates purely peer-to-peer
- **Multiple Authorship**: Patients, doctors, and hospitals can all contribute to records
- **Multiple Truths**: Each peer can maintain their own filtered view of health data
- **Privacy-First**: End-to-end encryption and local data control
- **Offline Support**: Works without internet connectivity
- **Standards Compliant**: Uses openEHR for structured health records

## Architecture

- **Autobase**: Multi-writer protocol for conflict-free health record collaboration
- **Hyperdrive**: P2P file system for medical images and documents
- **Hyperbee**: Efficient querying of health records using B-tree indexing
- **HyperDHT/Hyperswarm**: Peer discovery and connection management
- **openEHR**: Standardized health record format with archetype-based modeling

## Quick Start

```bash
# Install dependencies
npm install

# Check system status
npm run cli -- status

# Try interactive mode (recommended)
npm run cli -- interactive

# Run complete demo
node examples/basic-usage.js

# Run tests
npm test
```

## Understanding the Current Implementation

**Important**: The current version uses simplified in-memory storage for demonstration. Each CLI command creates a fresh instance, so data doesn't persist between separate commands. For persistent testing within a session, use:

- **Interactive mode**: `npm run cli -- interactive`
- **Example scripts**: `node examples/basic-usage.js`

See [TESTING-GUIDE.md](docs/TESTING-GUIDE.md) for detailed testing instructions.

## Project Structure

```
src/
├── core/           # Core P2P infrastructure
├── schemas/        # openEHR record schemas
├── cli/           # Command-line interface
└── ui/            # Web interface components

tests/             # Test files
docs/             # Documentation
examples/         # Example usage
```

## Development Status

### Current Implementation
- ✅ **OpenEHR-compliant schemas** - Full healthcare data standards
- ✅ **Multi-user record management** - Complete workflow demonstrations
- ✅ **CLI interface** - Comprehensive testing tools
- ✅ **File storage** - Medical images and documents
- ✅ **Architecture design** - Patient-controlled P2P system

### In Progress
- 🚧 **True P2P networking** - Autopass integration (see [P2P Status](docs/P2P-IMPLEMENTATION-STATUS.md))
- 🚧 **Persistent storage** - Moving from in-memory to distributed
- 🚧 **Real-time synchronization** - Multi-peer collaboration

### Roadmap
- 📋 Encryption and access controls
- 📋 Web-based user interface
- 📋 FHIR integration for external systems
- 📋 Production deployment readiness

## Contributing

This project is currently in the prototype phase. Contributions welcome once the core architecture is stable.

## License

MIT License - see LICENSE file for details