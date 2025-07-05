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

- **Autopass 2.2.0**: Complete P2P EHR system with invite-based access control
- **Autobase 7.13.3**: Multi-writer protocol for conflict-free health record collaboration
- **Corestore 7.4.5**: Persistent distributed storage with latest optimizations
- **Hypercore 11.10.0**: Append-only logs with enhanced performance
- **Hyperbee 2.24.2**: Efficient querying of health records using B-tree indexing
- **Hyperswarm 4.11.7**: Advanced peer discovery and connection management
- **openEHR**: Standardized health record format with archetype-based modeling

## Quick Start

```bash
# Install dependencies
npm install

# Run interactive P2P demo (recommended)
node examples/live-demo.js

# Run automated P2P healthcare scenario
node examples/ehr-p2p-demo.js

# Check system status
npm run cli -- status

# Try interactive mode
npm run cli -- interactive

# Run tests
npm test
```

## P2P EHR System (WORKING!)

**✅ Fully Functional**: The P2P EHR system is now fully operational with complete patient-doctor workflows:

- **Patient-controlled data**: Patients own and control their health records
- **Secure provider access**: Doctors invited via encrypted P2P invites
- **Real-time synchronization**: Changes sync instantly between peers
- **No central servers**: True peer-to-peer architecture
- **HIPAA-ready**: Encrypted communication and audit trails

**Try the demos**:
- `node examples/live-demo.js` - Interactive step-by-step demonstration
- `node examples/ehr-p2p-demo.js` - Automated healthcare scenario

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

### ✅ Production-Ready Features
- ✅ **True P2P networking** - Complete Autopass 2.2.0 integration
- ✅ **Patient-controlled health records** - Full data ownership
- ✅ **Secure provider invitations** - Encrypted P2P access control
- ✅ **Real-time synchronization** - Multi-peer collaboration working
- ✅ **OpenEHR-compliant schemas** - Full healthcare data standards
- ✅ **Latest ecosystem versions** - All packages upgraded to latest stable
- ✅ **Interactive demonstrations** - Comprehensive workflow examples
- ✅ **HIPAA-ready architecture** - Encrypted storage and communication

### Next Phase
- 📋 Enhanced encryption and fine-grained access controls
- 📋 Web-based user interface for patients and providers
- 📋 FHIR integration for external healthcare systems
- 📋 Mobile applications for patient access
- 📋 Healthcare provider onboarding tools

## Contributing

The core P2P EHR system is now fully functional and ready for production use. Contributions are welcome for:

- UI/UX improvements
- Additional healthcare integrations
- Mobile applications
- Advanced security features
- Performance optimizations

## License

MIT License - see LICENSE file for details