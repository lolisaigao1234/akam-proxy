const proxyMap = require('../../src/proxy/mapper')

describe('proxyMap', () => {
    const mapper = {
        host: '2.16.11.163',
        originalHost: 'upos-hz-mirrorakam.akamaized.net'
    }

    test('should map exact originalHost to optimal IP', () => {
        const result = proxyMap(mapper, 'upos-hz-mirrorakam.akamaized.net', 443)
        expect(result.hostname).toBe('2.16.11.163')
        expect(result.port).toBe(443)
    })

    test('should map bilivideo.com subdomains to optimal IP', () => {
        const result = proxyMap(mapper, 'cn-hbxy-cu-01-21.bilivideo.com', 443)
        expect(result.hostname).toBe('2.16.11.163')
        expect(result.port).toBe(443)
    })

    test('should map akamaized.net subdomains to optimal IP', () => {
        const result = proxyMap(mapper, 'upos-sz-mirroraliov.akamaized.net', 443)
        expect(result.hostname).toBe('2.16.11.163')
        expect(result.port).toBe(443)
    })

    test('should pass through unrelated domains', () => {
        const result = proxyMap(mapper, 'google.com', 443)
        expect(result.hostname).toBe('google.com')
        expect(result.port).toBe(443)
    })

    test('should pass through github.com', () => {
        const result = proxyMap(mapper, 'github.com', 443)
        expect(result.hostname).toBe('github.com')
        expect(result.port).toBe(443)
    })

    test('should preserve port for unmapped domains', () => {
        const result = proxyMap(mapper, 'example.com', 8080)
        expect(result.hostname).toBe('example.com')
        expect(result.port).toBe(8080)
    })

    test('should preserve port for mapped domains', () => {
        const result = proxyMap(mapper, 'upos-hz-mirrorakam.akamaized.net', 80)
        expect(result.hostname).toBe('2.16.11.163')
        expect(result.port).toBe(80)
    })
})
