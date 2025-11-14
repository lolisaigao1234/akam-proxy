# Contributing to akam-proxy

Thank you for your interest in contributing to akam-proxy! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 14+ (tested with v24.x)
- Git
- Optional: Python 3.6+ for IP discovery features

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/akam-proxy
   cd akam-proxy
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/akam-proxy
   ```

4. **Run setup script**:
   ```bash
   bash scripts/setup.sh
   ```

   Or manually:
   ```bash
   npm install
   cp config/example.json5 config.json5
   ```

5. **Verify setup**:
   ```bash
   npm test
   ```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Your Changes

- Write clean, readable code
- Follow the code style guide (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Check test coverage
npm run test:coverage

# Run linter
npm run lint
```

### 4. Commit Your Changes

Follow conventional commit format:

```bash
git add .
git commit -m "feat: add new IP discovery method"
# or
git commit -m "fix: resolve proxy mapping issue"
# or
git commit -m "docs: update setup instructions"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style

### JavaScript Style Guide

We use ESLint with the following conventions:

- **Indentation**: 4 spaces
- **Quotes**: Single quotes (except to avoid escaping)
- **Semicolons**: No semicolons (except where required)
- **Line endings**: Unix (LF)
- **Trailing commas**: Yes (for multi-line)
- **Arrow functions**: Preferred over function expressions

**Example**:

```javascript
const example = (param1, param2) => {
    if (param1) {
        console.log('Processing param1')
        return processData(param1)
    }

    const result = {
        value: param2,
        timestamp: Date.now()
    }

    return result
}
```

### File Organization

```javascript
// 1. Node.js built-in imports
const fs = require('fs')
const path = require('path')

// 2. External dependencies
const somePackage = require('some-package')

// 3. Internal imports
const utils = require('./utils')
const config = require('../config')

// 4. Constants
const MAX_RETRIES = 3

// 5. Main code
class MyClass {
    // ...
}

// 6. Exports
module.exports = MyClass
```

### Naming Conventions

- **Files**: `kebab-case.js`
- **Classes**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private methods**: Prefix with `_` (e.g., `_helperMethod`)

## Testing

### Writing Tests

- Place tests in `tests/unit/` for unit tests
- Place tests in `tests/integration/` for integration tests
- Test file naming: `module-name.test.js`
- Aim for >70% code coverage

**Example test structure**:

```javascript
const myModule = require('../../src/module/my-module')

describe('myModule', () => {
    describe('functionName', () => {
        test('should handle valid input', () => {
            const result = myModule.functionName('valid')
            expect(result).toBe(expected)
        })

        test('should reject invalid input', () => {
            expect(() => {
                myModule.functionName('invalid')
            }).toThrow()
        })
    })
})
```

### Test Coverage Requirements

- **New features**: Must include tests
- **Bug fixes**: Add test reproducing the bug
- **Minimum coverage**: 50% (aim for 70%+)

## Submitting Changes

### Pull Request Guidelines

1. **Update documentation** if needed
2. **Add/update tests** for your changes
3. **Ensure all tests pass**: `npm test`
4. **Run linter**: `npm run lint`
5. **Write clear PR description**:
   - What problem does this solve?
   - How does it solve it?
   - Any breaking changes?
   - Screenshots (if UI changes)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Linter passing

## Checklist
- [ ] Code follows style guide
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Maintainer reviews code
2. Automated tests run
3. Feedback provided if changes needed
4. Once approved, PR is merged

## Reporting Issues

### Bug Reports

Use GitHub Issues and include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**:
   ```
   1. Start server with config X
   2. Access URL Y
   3. See error Z
   ```
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**:
   - OS: (e.g., Ubuntu 22.04)
   - Node version: (e.g., v20.10.0)
   - akam-proxy version: (e.g., 1.0.0)
6. **Logs/Screenshots**: Include relevant error messages

### Feature Requests

Include:

1. **Problem**: What problem does this solve?
2. **Proposed Solution**: How should it work?
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Any other relevant information

## Project Structure

```
akam-proxy/
├── src/                  # Source code
│   ├── core/            # Core application logic
│   ├── proxy/           # Proxy implementation
│   ├── ip-management/   # IP management modules
│   └── utils/           # Shared utilities
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── fixtures/       # Test data
├── docs/                # Documentation
├── config/              # Configuration templates
├── tools/               # External tools
└── scripts/             # Utility scripts
```

## Getting Help

- **Documentation**: Check [docs/](docs/) folder
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors are recognized in:
- GitHub contributors page
- CHANGELOG.md (for significant contributions)
- README.md credits (for major features)

Thank you for contributing to akam-proxy! 🎉
