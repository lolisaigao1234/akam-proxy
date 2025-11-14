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
