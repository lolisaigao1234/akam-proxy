# Project Structure Update Plan

## Executive Summary

This document outlines a comprehensive restructuring plan for the akam-proxy project to improve maintainability, clarity, and organization. The current structure has accumulated technical debt including deprecated code, scattered documentation, and unclear module boundaries.

## Current Issues

### 1. Dead Code and Dependencies
- **`utils/chinazPing.js`**: Completely deprecated (chinaz.com changed to dynamic JS)
- **Unused dependencies**: `cheerio`, `superagent` (only used by chinazPing)
- **Legacy config**: `refreshIpList`, `saveChinazResult` parameters no longer functional

### 2. Documentation Fragmentation
- **CLAUDE.md**: 554 lines of comprehensive documentation
- **readme.md**: 124 lines with overlapping content
- **No clear separation** between user docs and developer docs

### 3. Poor Module Organization
```
Current Structure:
akam-proxy/
├── index.js (190 lines - mixing concerns)
├── libs/ (proxy implementation)
├── utils/ (mixed active + deprecated)
├── python/akamTester-master/ (3rd party tool, nested)
├── ip_list.txt + ip_list_bk.txt (unclear purpose)
├── config.json5 (mixed active + legacy config)
└── screenshots/ (user documentation assets)
```

### 4. Missing Project Infrastructure
- No tests
- No linting configuration
- No `.editorconfig` or code style guides
- No contribution guidelines
- No changelog

### 5. Configuration Issues
- Chinese comments in `config.json5` (inconsistent with English docs)
- Legacy parameters cluttering the config
- No config validation
- No environment-based configuration support

## Proposed New Structure

```
akam-proxy/
├── src/                          # Source code (NEW)
│   ├── core/                     # Core application logic
│   │   ├── index.js              # Main entry point (simplified)
│   │   ├── server.js             # Server lifecycle management
│   │   └── config.js             # Config loading & validation
│   ├── proxy/                    # Proxy implementation
│   │   ├── server.js             # HTTP/HTTPS proxy server (from libs/proxy.js)
│   │   └── mapper.js             # Host mapping logic (from libs/proxy-map.js)
│   ├── ip-management/            # IP discovery & testing
│   │   ├── tester.js             # IP latency testing (from utils/getGoodServer.js)
│   │   ├── akam-runner.js        # akamTester integration (from utils/akamTesterRunner.js)
│   │   └── ip-pool.js            # IP list management & dead IP removal (NEW)
│   └── utils/                    # Shared utilities
│       ├── logger.js             # Structured logging (NEW)
│       └── validators.js         # Config/IP validation (NEW)
│
├── config/                       # Configuration files
│   ├── default.json5             # Default configuration (English comments)
│   ├── example.json5             # Example for users to copy
│   └── schema.json               # JSON schema for validation (NEW)
│
├── data/                         # Data files
│   ├── ip_list.txt               # Active IP list
│   └── .gitkeep                  # Keep folder in git
│
├── tools/                        # External tools (Python scripts)
│   └── akamTester/               # Renamed from python/akamTester-master
│       ├── akamTester.py
│       ├── ColorPrinter.py
│       ├── GlobalDNS.py
│       ├── requirements.txt
│       └── README.md
│
├── docs/                         # Documentation
│   ├── README.md                 # User-facing quick start
│   ├── SETUP.md                  # Detailed setup guide (NEW)
│   ├── ARCHITECTURE.md           # System design (from CLAUDE.md) (NEW)
│   ├── TROUBLESHOOTING.md        # Common issues (from CLAUDE.md) (NEW)
│   ├── API.md                    # Code API documentation (NEW)
│   ├── CONTRIBUTING.md           # Contribution guidelines (NEW)
│   └── assets/                   # Documentation images
│       └── screenshots/          # Browser config screenshots
│
├── tests/                        # Test suite (NEW)
│   ├── unit/                     # Unit tests
│   │   ├── proxy.test.js
│   │   ├── mapper.test.js
│   │   └── tester.test.js
│   ├── integration/              # Integration tests
│   │   └── e2e.test.js
│   └── fixtures/                 # Test data
│       └── sample-config.json5
│
├── scripts/                      # Utility scripts (NEW)
│   ├── setup.sh                  # First-time setup script
│   ├── update-ips.sh             # Manual IP update helper
│   └── cleanup.sh                # Clean cache/temp files
│
├── .github/                      # GitHub configuration (NEW)
│   ├── workflows/
│   │   └── test.yml              # CI/CD pipeline
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── index.js                      # Entry point (delegates to src/core/index.js)
├── package.json                  # Updated scripts and metadata
├── .gitignore                    # Updated ignore rules
├── .eslintrc.js                  # Linting configuration (NEW)
├── .editorconfig                 # Editor configuration (NEW)
├── CHANGELOG.md                  # Version history (NEW)
├── LICENSE                       # License file
└── CLAUDE.md                     # AI assistant guide (kept for Claude Code)
```

## Migration Plan

### Phase 1: Remove Dead Code ✂️

**Goal**: Clean up deprecated functionality

**Actions**:
1. Delete `utils/chinazPing.js`
2. Remove `cheerio` and `superagent` from dependencies
3. Remove legacy config parameters:
   - `refreshIpList.interval`
   - `refreshIpList.retry`
   - `saveChinazResult`
4. Delete `ip_list_bk.txt` (or move to `.gitignore` as user backup)

**Validation**:
- Server still starts successfully
- IP testing works correctly
- akamTester integration unchanged

### Phase 2: Reorganize Source Code 📁

**Goal**: Create clear module boundaries

**Actions**:

1. **Create new directory structure**:
   ```bash
   mkdir -p src/{core,proxy,ip-management,utils}
   mkdir -p config data docs/assets tests/{unit,integration,fixtures} scripts
   ```

2. **Move and refactor files**:
   ```bash
   # Proxy modules
   mv libs/proxy.js → src/proxy/server.js
   mv libs/proxy-map.js → src/proxy/mapper.js

   # IP management
   mv utils/getGoodServer.js → src/ip-management/tester.js
   mv utils/akamTesterRunner.js → src/ip-management/akam-runner.js

   # Python tools
   mv python/akamTester-master → tools/akamTester

   # Data files
   mv ip_list.txt → data/ip_list.txt
   mv screenshots → docs/assets/screenshots
   ```

3. **Create new core modules**:
   - `src/core/server.js` - Extract server lifecycle from index.js
   - `src/ip-management/ip-pool.js` - Extract IP management logic
   - `src/utils/logger.js` - Structured logging wrapper
   - `src/utils/validators.js` - Config and IP validation

4. **Simplify `index.js`**:
   - Reduce to ~20 lines
   - Only responsibility: load config and start server
   - All logic moves to `src/core/`

### Phase 3: Improve Configuration 🔧

**Goal**: Clean, validated, multilingual config

**Actions**:

1. **Create `config/default.json5`** with English comments:
   ```json5
   {
     // Target CDN hostname (do not modify unless you know what you're doing)
     host: 'upos-hz-mirrorakam.akamaized.net',

     // Proxy server port
     port: 2689,

     // Interval to re-test IPs and select best server (seconds)
     refreshInterval: 3600,

     // akamTester automatic IP discovery integration
     akamTester: {
       enabled: false,  // Disabled by default for backward compatibility
       interval: 900,   // Run every 15 minutes
       pythonPath: 'python',
       condaEnv: null,  // Optional: Conda environment name
       scriptPath: 'tools/akamTester/akamTester.py',
       targetHosts: ['upos-hz-mirrorakam.akamaized.net'],
       saveToFile: true,
       timeout: 600000,
       maxIps: 200
     }
   }
   ```

2. **Create `config/schema.json`** for validation:
   - JSON Schema definition
   - Validate on startup
   - Provide helpful error messages

3. **Update startup logic**:
   - Check for `config.json5` in root
   - If not found, copy from `config/default.json5`
   - Validate against schema

### Phase 4: Split Documentation 📚

**Goal**: Separate user docs from developer docs

**Actions**:

1. **Create `docs/README.md`** (User Quick Start):
   - Installation
   - Basic configuration
   - Browser setup
   - Common commands
   - ~100 lines maximum

2. **Create `docs/SETUP.md`** (Detailed Setup):
   - Prerequisites
   - Step-by-step installation
   - Configuration options explained
   - Browser proxy configuration (with screenshots)

3. **Create `docs/ARCHITECTURE.md`** (Developer Guide):
   - System overview
   - Component descriptions
   - Data flow diagrams
   - Code organization

4. **Create `docs/TROUBLESHOOTING.md`**:
   - Common errors
   - Solutions
   - Debug logging guide
   - FAQ

5. **Create `docs/API.md`**:
   - Function signatures
   - Module interfaces
   - Extension points

6. **Update `CLAUDE.md`**:
   - Keep as AI assistant guide
   - Reference other docs instead of duplicating
   - Focus on project-specific context

7. **Update root `README.md`**:
   - Project overview
   - Quick start (link to docs/)
   - Features
   - Credits
   - License

### Phase 5: Add Testing Infrastructure 🧪

**Goal**: Ensure code reliability

**Actions**:

1. **Install testing dependencies**:
   ```bash
   npm install --save-dev jest supertest
   ```

2. **Create test files**:
   - `tests/unit/proxy.test.js` - Proxy server logic
   - `tests/unit/mapper.test.js` - Host mapping
   - `tests/unit/tester.test.js` - IP latency testing
   - `tests/integration/e2e.test.js` - Full proxy flow

3. **Add test scripts to `package.json`**:
   ```json
   "scripts": {
     "start": "node index.js",
     "test": "jest",
     "test:watch": "jest --watch",
     "test:coverage": "jest --coverage"
   }
   ```

4. **Create `.github/workflows/test.yml`** for CI:
   - Run tests on push
   - Run tests on pull requests
   - Report coverage

### Phase 6: Developer Experience Improvements 🛠️

**Goal**: Make development easier

**Actions**:

1. **Create `.eslintrc.js`**:
   ```javascript
   module.exports = {
     env: { node: true, es6: true },
     extends: 'eslint:recommended',
     rules: {
       'no-console': 'off',  // Console logging is expected
       'semi': ['error', 'never'],
       'quotes': ['error', 'single']
     }
   }
   ```

2. **Create `.editorconfig`**:
   ```ini
   root = true

   [*]
   indent_style = space
   indent_size = 4
   end_of_line = lf
   charset = utf-8
   trim_trailing_whitespace = true
   insert_final_newline = true
   ```

3. **Create `scripts/setup.sh`**:
   - Install npm dependencies
   - Install Python dependencies
   - Create config.json5 from template
   - Verify prerequisites

4. **Create `scripts/update-ips.sh`**:
   - Helper to run akamTester manually
   - Copy results to data/ip_list.txt

5. **Create `CONTRIBUTING.md`**:
   - Code style guide
   - How to submit issues
   - How to submit PRs
   - Development workflow

6. **Create `CHANGELOG.md`**:
   - Track version history
   - Document breaking changes
   - Follow Keep a Changelog format

### Phase 7: Update Dependencies and Paths 🔗

**Goal**: Fix all import paths after restructure

**Actions**:

1. **Update all `require()` statements**:
   ```javascript
   // Before: require('./libs/proxy')
   // After:  require('./src/proxy/server')
   ```

2. **Update path references**:
   ```javascript
   // Before: 'ip_list.txt'
   // After:  'data/ip_list.txt'

   // Before: 'python/akamTester-master/akamTester.py'
   // After:  'tools/akamTester/akamTester.py'
   ```

3. **Update `.gitignore`**:
   ```gitignore
   node_modules/
   data/ip_list.txt
   data/*.bak
   config/config.json5
   *.log
   .DS_Store
   coverage/
   ```

4. **Update `package.json` metadata**:
   ```json
   {
     "name": "akam-proxy",
     "version": "2.0.0",
     "description": "Intelligent proxy server for Bilibili CDN optimization",
     "main": "index.js",
     "keywords": ["proxy", "cdn", "bilibili", "akamai", "optimization"],
     "repository": {
       "type": "git",
       "url": "https://github.com/[owner]/akam-proxy"
     }
   }
   ```

## Breaking Changes

### For Users

**Configuration**:
- Legacy config parameters removed (non-functional anyway)
- `config.json5` location unchanged (root directory)
- `ip_list.txt` moved to `data/ip_list.txt` (automatic migration)

**Migration**:
```bash
# Automatic migration on first run
npm start  # Will detect old structure and migrate
```

**Manual migration** (if needed):
```bash
mv ip_list.txt data/ip_list.txt
```

### For Developers

**Import paths changed**:
```javascript
// Before
const proxy = require('./libs/proxy')
const getGoodServer = require('./utils/getGoodServer')

// After
const proxy = require('./src/proxy/server')
const tester = require('./src/ip-management/tester')
```

## Implementation Checklist

- [ ] **Phase 1**: Remove dead code
  - [ ] Delete `utils/chinazPing.js`
  - [ ] Remove `cheerio`, `superagent` dependencies
  - [ ] Clean legacy config parameters
  - [ ] Test server startup

- [ ] **Phase 2**: Reorganize source code
  - [ ] Create new directory structure
  - [ ] Move existing files
  - [ ] Create new core modules
  - [ ] Simplify `index.js`
  - [ ] Update all require() paths
  - [ ] Test all functionality

- [ ] **Phase 3**: Improve configuration
  - [ ] Create `config/default.json5`
  - [ ] Create `config/schema.json`
  - [ ] Add config validation
  - [ ] Test config loading

- [ ] **Phase 4**: Split documentation
  - [ ] Create `docs/README.md`
  - [ ] Create `docs/SETUP.md`
  - [ ] Create `docs/ARCHITECTURE.md`
  - [ ] Create `docs/TROUBLESHOOTING.md`
  - [ ] Create `docs/API.md`
  - [ ] Update `CLAUDE.md`
  - [ ] Update root `README.md`
  - [ ] Move screenshots to `docs/assets/`

- [ ] **Phase 5**: Add testing infrastructure
  - [ ] Install jest, supertest
  - [ ] Write unit tests
  - [ ] Write integration tests
  - [ ] Add test scripts
  - [ ] Set up GitHub Actions CI

- [ ] **Phase 6**: Developer experience
  - [ ] Create `.eslintrc.js`
  - [ ] Create `.editorconfig`
  - [ ] Create setup scripts
  - [ ] Create `CONTRIBUTING.md`
  - [ ] Create `CHANGELOG.md`

- [ ] **Phase 7**: Final touches
  - [ ] Update `.gitignore`
  - [ ] Update `package.json` metadata
  - [ ] Add migration script for existing users
  - [ ] Final testing
  - [ ] Update version to 2.0.0

## Timeline Estimate

- **Phase 1**: 1-2 hours (straightforward deletion)
- **Phase 2**: 4-6 hours (careful refactoring and testing)
- **Phase 3**: 2-3 hours (config schema and validation)
- **Phase 4**: 3-4 hours (documentation writing)
- **Phase 5**: 6-8 hours (writing comprehensive tests)
- **Phase 6**: 2-3 hours (tooling setup)
- **Phase 7**: 2-3 hours (final integration)

**Total**: 20-29 hours of focused work

## Rollback Plan

If issues arise during migration:

1. **Git branch strategy**:
   ```bash
   git checkout -b structure-update
   # Do all work on branch
   # Only merge to main after thorough testing
   ```

2. **Tag current version**:
   ```bash
   git tag v1.0.0-legacy
   # Easy rollback: git checkout v1.0.0-legacy
   ```

3. **Keep migration script**:
   - Create `scripts/rollback.sh` to undo changes
   - Restore old file locations if needed

## Benefits After Completion

### Code Quality
- ✅ Clear module boundaries
- ✅ No dead code
- ✅ Consistent code style
- ✅ Test coverage
- ✅ CI/CD pipeline

### Documentation
- ✅ Separated user vs developer docs
- ✅ Clear troubleshooting guide
- ✅ Architecture documentation
- ✅ Contribution guidelines

### Maintainability
- ✅ Easier to find code
- ✅ Easier to test
- ✅ Easier to extend
- ✅ Easier for new contributors

### Developer Experience
- ✅ Setup scripts
- ✅ Linting and formatting
- ✅ Automated testing
- ✅ Clear project structure

## Questions to Resolve

1. **Version number**: Should we bump to 2.0.0 or keep 1.x?
   - **Recommendation**: 2.0.0 (significant restructure)

2. **Breaking changes**: Acceptable for users?
   - **Recommendation**: Minimize with migration script

3. **Testing**: How much coverage needed before merge?
   - **Recommendation**: 70%+ coverage for core modules

4. **Documentation**: Keep CLAUDE.md or merge into docs/?
   - **Recommendation**: Keep CLAUDE.md as AI assistant guide

5. **Python tools**: Keep in repo or make external?
   - **Recommendation**: Keep in `tools/` for convenience

## Next Steps

1. **Review this plan** with stakeholders
2. **Create GitHub issue** tracking implementation
3. **Create feature branch**: `git checkout -b structure-update`
4. **Start with Phase 1** (safest, quickest wins)
5. **Iterate through phases** with testing at each step
6. **Final review and merge** when complete

---

**Document Version**: 1.0
**Created**: 2025-11-13
**Last Updated**: 2025-11-13
**Author**: Claude Code
**Status**: Proposed ✨
