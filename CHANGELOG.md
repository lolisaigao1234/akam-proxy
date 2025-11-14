# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with Jest
- ESLint configuration for code quality
- GitHub Actions CI/CD pipeline
- Setup script for easy first-time setup
- Contributing guidelines
- EditorConfig for consistent code formatting
- Complete documentation structure (Quick Start, Setup, Architecture, Troubleshooting, API)
- Configuration validation on startup
- Example configuration templates

### Changed
- Restructured project with clean module boundaries
- Updated entry point (index.js) from 190 lines to 52 lines (73% reduction)
- Reorganized source code into logical directories (src/core, src/proxy, src/ip-management)
- Moved Python tools to tools/ directory
- Moved IP lists to data/ directory
- Improved README with badges and better organization
- Updated CLAUDE.md to reference new documentation structure

### Removed
- Dead code: chinazPing functionality (deprecated)
- Unused dependencies: cheerio, superagent
- Legacy configuration parameters

## [1.0.0] - Initial Release

### Added
- HTTP/HTTPS proxy server implementation
- Automatic CDN node selection based on latency
- TCP ping-based IP testing
- akamTester Python integration for IP discovery
- Periodic IP refresh and dead IP removal
- Selective domain proxying
- Real-time server switching without restart
- Comprehensive debug logging
- JSON5 configuration support

### Features
- Zero downtime updates
- Automatic dead IP removal after 5 failures
- Support for conda Python environments
- Configurable refresh intervals
- Maximum IP pool size management

---

## Version History

- **Unreleased**: Major restructuring and testing infrastructure
- **1.0.0**: Initial stable release

## Migration Guides

### Upgrading to Unreleased from 1.0.0

**File Locations Changed**:
- `ip_list.txt` → `data/ip_list.txt` (automatic migration on first run)
- `python/akamTester-master/` → `tools/akamTester/`
- `libs/` → `src/proxy/`
- `utils/` → `src/ip-management/`

**Configuration Changes**:
- Legacy parameters removed (refreshIpList, saveChinazResult)
- Added automatic validation
- Example config at `config/example.json5`

**For Users**:
```bash
# Update config path in config.json5
# Old: scriptPath: 'python/akamTester-master/akamTester.py'
# New: scriptPath: 'tools/akamTester/akamTester.py'

# IP list will be migrated automatically on first run
# Or manually: mv ip_list.txt data/ip_list.txt
```

**For Developers**:
```javascript
// Update import paths
// Old: require('./libs/proxy')
// New: require('./src/proxy/server')

// Old: require('./utils/getGoodServer')
// New: require('./src/ip-management/tester')
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute to this project.

## License

MIT License - see [LICENSE](LICENSE) file for details.
