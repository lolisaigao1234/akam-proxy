const proxyMap = require('../../src/proxy/mapper')

describe('proxyMap', () => {
    describe('legacy format { host, originalHost }', () => {
        const mapper = {
            host: '2.16.11.163',
            originalHost: 'upos-hz-mirrorakam.akamaized.net'
        }

        test('should map exact originalHost to optimal IP', () => {
            const result = proxyMap(mapper, { hostname: 'upos-hz-mirrorakam.akamaized.net', port: 443 })
            expect(result.hostname).toBe('2.16.11.163')
            expect(result.port).toBe(443)
        })

        test('should map bilivideo.com subdomains to optimal IP', () => {
            const result = proxyMap(mapper, { hostname: 'cn-hbxy-cu-01-21.bilivideo.com', port: 443 })
            expect(result.hostname).toBe('2.16.11.163')
            expect(result.port).toBe(443)
        })

        test('should map akamaized.net subdomains to optimal IP', () => {
            const result = proxyMap(mapper, { hostname: 'upos-sz-mirroraliov.akamaized.net', port: 443 })
            expect(result.hostname).toBe('2.16.11.163')
            expect(result.port).toBe(443)
        })

        test('should pass through unrelated domains', () => {
            const result = proxyMap(mapper, { hostname: 'google.com', port: 443 })
            expect(result.hostname).toBe('google.com')
            expect(result.port).toBe(443)
        })

        test('should pass through github.com', () => {
            const result = proxyMap(mapper, { hostname: 'github.com', port: 443 })
            expect(result.hostname).toBe('github.com')
            expect(result.port).toBe(443)
        })

        test('should preserve port for unmapped domains', () => {
            const result = proxyMap(mapper, { hostname: 'example.com', port: 8080 })
            expect(result.hostname).toBe('example.com')
            expect(result.port).toBe(8080)
        })

        test('should preserve port for mapped domains', () => {
            const result = proxyMap(mapper, { hostname: 'upos-hz-mirrorakam.akamaized.net', port: 80 })
            expect(result.hostname).toBe('2.16.11.163')
            expect(result.port).toBe(80)
        })
    })

    describe('Map format (new multi-domain)', () => {
        test('should handle Map with exact domain match', () => {
            const domainMap = new Map([
                ['akamaized.net', { host: '23.47.72.160', avg: 10 }],
                ['bilivideo.com', { host: '104.96.51.89', avg: 20 }]
            ])

            const result = proxyMap(domainMap, { hostname: 'akamaized.net', port: 443 })
            expect(result.hostname).toBe('23.47.72.160')
            expect(result.port).toBe(443)
        })

        test('should handle Map with subdomain match', () => {
            const domainMap = new Map([
                ['akamaized.net', { host: '23.47.72.160', avg: 10 }],
                ['bilivideo.com', { host: '104.96.51.89', avg: 20 }]
            ])

            const result = proxyMap(domainMap, { hostname: 'upos-hz-mirrorakam.akamaized.net', port: 443 })
            expect(result.hostname).toBe('23.47.72.160')
            expect(result.port).toBe(443)
        })

        test('should handle Map with different domains independently', () => {
            const domainMap = new Map([
                ['akamaized.net', { host: '23.47.72.160', avg: 10 }],
                ['bilivideo.com', { host: '104.96.51.89', avg: 20 }]
            ])

            // Test akamaized.net subdomain
            let result = proxyMap(domainMap, { hostname: 'upos-sz-mirroraliov.akamaized.net', port: 443 })
            expect(result.hostname).toBe('23.47.72.160')

            // Test bilivideo.com subdomain
            result = proxyMap(domainMap, { hostname: 'cn-hbxy-cu-01-21.bilivideo.com', port: 443 })
            expect(result.hostname).toBe('104.96.51.89')
        })

        test('should pass through unmatched domains with Map', () => {
            const domainMap = new Map([
                ['akamaized.net', { host: '23.47.72.160', avg: 10 }]
            ])

            const result = proxyMap(domainMap, { hostname: 'google.com', port: 443 })
            expect(result.hostname).toBe('google.com')
            expect(result.port).toBe(443)
        })

        test('should handle empty Map', () => {
            const domainMap = new Map()

            const result = proxyMap(domainMap, { hostname: 'example.com', port: 443 })
            expect(result.hostname).toBe('example.com')
            expect(result.port).toBe(443)
        })
    })

    describe('plain object with pattern keys', () => {
        test('should handle plain object with domain patterns', () => {
            const domainMap = {
                'akamaized.net': { host: '23.47.72.160', avg: 10 },
                'bilivideo.com': { host: '104.96.51.89', avg: 20 }
            }

            const result = proxyMap(domainMap, { hostname: 'upos-hz-mirrorakam.akamaized.net', port: 443 })
            expect(result.hostname).toBe('23.47.72.160')
            expect(result.port).toBe(443)
        })

        test('should handle plain object with exact match', () => {
            const domainMap = {
                'akamaized.net': { host: '23.47.72.160', avg: 10 }
            }

            const result = proxyMap(domainMap, { hostname: 'akamaized.net', port: 443 })
            expect(result.hostname).toBe('23.47.72.160')
            expect(result.port).toBe(443)
        })

        test('should handle plain object with no match', () => {
            const domainMap = {
                'akamaized.net': { host: '23.47.72.160', avg: 10 }
            }

            const result = proxyMap(domainMap, { hostname: 'google.com', port: 443 })
            expect(result.hostname).toBe('google.com')
            expect(result.port).toBe(443)
        })
    })

    describe('edge cases', () => {
        test('should handle null domainMap gracefully', () => {
            const result = proxyMap(null, { hostname: 'example.com', port: 443 })
            expect(result.hostname).toBe('example.com')
            expect(result.port).toBe(443)
        })

        test('should handle undefined domainMap gracefully', () => {
            const result = proxyMap(undefined, { hostname: 'example.com', port: 443 })
            expect(result.hostname).toBe('example.com')
            expect(result.port).toBe(443)
        })

        test('should handle empty object', () => {
            const result = proxyMap({}, { hostname: 'example.com', port: 443 })
            expect(result.hostname).toBe('example.com')
            expect(result.port).toBe(443)
        })

        test('should preserve additional properties in options', () => {
            const domainMap = new Map([
                ['akamaized.net', { host: '23.47.72.160', avg: 10 }]
            ])

            const result = proxyMap(domainMap, {
                hostname: 'upos-hz-mirrorakam.akamaized.net',
                port: 443,
                headers: { 'User-Agent': 'test' }
            })

            expect(result.hostname).toBe('23.47.72.160')
            expect(result.port).toBe(443)
            expect(result.headers).toEqual({ 'User-Agent': 'test' })
        })
    })
})
