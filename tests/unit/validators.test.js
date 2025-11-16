const { validateConfig, validateIp, validateIpList } = require('../../src/utils/validators')

describe('validateConfig', () => {
    test('should pass valid configuration', () => {
        const config = {
            host: 'upos-hz-mirrorakam.akamaized.net',
            port: 2689,
            refreshInterval: 3600
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
    })

    test('should fail when host is missing', () => {
        const config = {
            port: 2689,
            refreshInterval: 3600
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.host must be a non-empty string')
    })

    test('should fail when host is not a string', () => {
        const config = {
            host: 123,
            port: 2689,
            refreshInterval: 3600
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.host must be a non-empty string')
    })

    test('should fail when port is missing', () => {
        const config = {
            host: 'test.com',
            refreshInterval: 3600
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.port must be a number')
    })

    test('should fail when port is not a number', () => {
        const config = {
            host: 'test.com',
            port: '2689',
            refreshInterval: 3600
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.port must be a number')
    })

    test('should fail when port is out of range', () => {
        const config = {
            host: 'test.com',
            port: 99999,
            refreshInterval: 3600
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.port must be between 1 and 65535')
    })

    test('should fail when port is 0 (falsy value)', () => {
        const config = {
            host: 'test.com',
            port: 0,
            refreshInterval: 3600
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        // Port 0 is caught by the falsy check, not range check
        expect(result.errors).toContain('config.port must be a number')
    })

    test('should fail when refreshInterval is missing', () => {
        const config = {
            host: 'test.com',
            port: 2689
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.refreshInterval must be a number')
    })

    test('should fail when refreshInterval is not a number', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: '3600'
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.refreshInterval must be a number')
    })

    test('should fail when refreshInterval is too small', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 30
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.refreshInterval must be at least 60 seconds')
    })

    test('should fail when verboseDebug is not a boolean', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            verboseDebug: 'true'
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.verboseDebug must be a boolean')
    })

    test('should pass when verboseDebug is boolean', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            verboseDebug: true
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(true)
    })

    test('should validate akamTester configuration', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                enabled: true,
                interval: 900,
                pythonPath: 'python',
                targetHosts: ['test.com'],
                maxIps: 200
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(true)
    })

    test('should fail when akamTester.enabled is not boolean', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                enabled: 'true'
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.enabled must be a boolean')
    })

    test('should fail when akamTester.interval is not a number', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                interval: '900'
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.interval must be a number')
    })

    test('should fail when akamTester interval is too small', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                interval: 100
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.interval must be at least 300 seconds (5 minutes)')
    })

    test('should fail when akamTester.pythonPath is not a string', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                pythonPath: 123
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.pythonPath must be a string')
    })

    test('should fail when akamTester.condaEnv is not a string or null', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                condaEnv: 123
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.condaEnv must be a string or null')
    })

    test('should pass when akamTester.condaEnv is null', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                condaEnv: null
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(true)
    })

    test('should fail when akamTester.scriptPath is not a string', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                scriptPath: 123
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.scriptPath must be a string')
    })

    test('should fail when akamTester.targetHosts is not an array', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                targetHosts: 'test.com'
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.targetHosts must be an array')
    })

    test('should fail when akamTester.targetHosts is empty', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                targetHosts: []
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.targetHosts must contain at least one host')
    })

    test('should fail when akamTester.targetHosts contains non-string', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                targetHosts: ['test.com', 123, 'other.com']
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.targetHosts must contain only strings')
    })

    test('should fail when akamTester.saveToFile is not boolean', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                saveToFile: 'true'
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.saveToFile must be a boolean')
    })

    test('should fail when akamTester.timeout is not a number', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                timeout: '600000'
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.timeout must be a number')
    })

    test('should fail when akamTester.timeout is too small', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                timeout: 30000
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.timeout must be at least 60000ms (1 minute)')
    })

    test('should fail when akamTester.maxIps is not a number', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                maxIps: '200'
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.maxIps must be a number')
    })

    test('should fail when akamTester.maxIps is too small', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                maxIps: 5
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.maxIps must be at least 10')
    })

    test('should fail when akamTester.maxIps is too large', () => {
        const config = {
            host: 'test.com',
            port: 2689,
            refreshInterval: 3600,
            akamTester: {
                maxIps: 2000
            }
        }
        const result = validateConfig(config)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('config.akamTester.maxIps must not exceed 1000')
    })
})

describe('validateIp', () => {
    test('should accept valid IPv4 addresses', () => {
        expect(validateIp('192.168.1.1')).toBe(true)
        expect(validateIp('10.0.0.1')).toBe(true)
        expect(validateIp('172.16.0.1')).toBe(true)
        expect(validateIp('8.8.8.8')).toBe(true)
        expect(validateIp('255.255.255.255')).toBe(true)
        expect(validateIp('0.0.0.0')).toBe(true)
    })

    test('should reject invalid IPv4 addresses', () => {
        expect(validateIp('256.1.1.1')).toBe(false)
        expect(validateIp('192.168.1')).toBe(false)
        expect(validateIp('192.168.1.1.1')).toBe(false)
        expect(validateIp('invalid')).toBe(false)
        expect(validateIp('')).toBe(false)
        expect(validateIp('::1')).toBe(false) // IPv6
    })

    test('should reject non-string inputs', () => {
        expect(validateIp(null)).toBe(false)
        expect(validateIp(undefined)).toBe(false)
        expect(validateIp(123)).toBe(false)
        expect(validateIp({})).toBe(false)
    })
})

describe('validateIpList', () => {
    test('should accept valid IP lists', () => {
        const ipList = ['192.168.1.1', '10.0.0.1', '172.16.0.1']
        const result = validateIpList(ipList)
        expect(result.valid).toBe(true)
        expect(result.invalidIps).toEqual([])
    })

    test('should detect invalid IPs in list', () => {
        const ipList = ['192.168.1.1', 'invalid', '256.1.1.1']
        const result = validateIpList(ipList)
        expect(result.valid).toBe(false)
        expect(result.invalidIps).toContain('invalid')
        expect(result.invalidIps).toContain('256.1.1.1')
    })

    test('should reject non-array inputs', () => {
        const result = validateIpList('not an array')
        expect(result.valid).toBe(false)
        expect(result.invalidIps).toContain('IP list is not an array')
    })

    test('should accept empty arrays', () => {
        const result = validateIpList([])
        expect(result.valid).toBe(true)
        expect(result.invalidIps).toEqual([])
    })
})
