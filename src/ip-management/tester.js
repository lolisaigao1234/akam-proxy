const tcpp = require('tcp-ping')
const https = require('https')
const http = require('http')
const logger = require('../utils/logger')

/**
 * Enhanced IP tester with comprehensive latency and packet loss metrics
 *
 * Tests both connection-level (TCP) and application-level (HTTP/HTTPS) latency
 * Calculates packet loss, jitter, and provides detailed statistics
 *
 * @param {string[]} ipList - Array of IP addresses to test
 * @param {Object} options - Testing options
 * @param {number} options.attempts - Number of test attempts (default: 5)
 * @param {number} options.timeout - Timeout per attempt in ms (default: 3000)
 * @param {number} options.port - Port to test (default: 443)
 * @param {boolean} options.useHttps - Use HTTPS for app-level test (default: true)
 * @param {boolean} options.verbose - Enable detailed logging (default: false)
 * @returns {Promise<Array>} Sorted array of test results
 */
module.exports = (ipList, options = {}) => {
    const {
        attempts = 5,
        timeout = 3000,
        port = 443,
        useHttps = true,
        verbose = false
    } = options

    if (verbose) {
        console.log('')
        logger.box('Starting Dual-Layer IP Testing', [
            `Total IPs to test: ${ipList.length}`,
            `TCP ping attempts: ${attempts} per IP`,
            `HTTP${useHttps ? 'S' : ''} ping attempts: ${attempts} per IP`,
            `Timeout: ${timeout}ms per attempt`,
            `Port: ${port}`,
            `Scoring: 40% TCP + 60% HTTP (weighted)`
        ])
        console.log('')
    }

    const startTime = Date.now()
    let completedCount = 0

    return Promise.all(
        ipList.map(async (ip, index) => {
            const result = await testIp(ip, { attempts, timeout, port, useHttps, verbose })
            completedCount++

            if (verbose) {
                const progress = Math.round((completedCount / ipList.length) * 100)
                logger.log(`[${completedCount}/${ipList.length}] ${progress}% - Tested ${ip}`)
            }

            return result
        })
    )
    .then(results => {
        const aliveResults = results.filter(item => item.alive)
        const deadCount = results.length - aliveResults.length
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)

        if (verbose) {
            console.log('')
            logger.box('IP Testing Complete', [
                `Tested: ${ipList.length} IPs in ${elapsed}s`,
                `Alive: ${aliveResults.length} IPs`,
                `Dead: ${deadCount} IPs`,
                `Total tests performed: ${ipList.length * attempts * 2} (TCP + HTTP)`
            ])
            console.log('')
        }

        return aliveResults.sort((prev, next) => {
            // Sort by combined score (weighted average of TCP and HTTP latency)
            return prev.score - next.score
        })
    })
}

/**
 * Test a single IP with comprehensive metrics
 */
async function testIp(ip, options) {
    const { attempts, timeout, port, useHttps, verbose } = options

    try {
        if (verbose) {
            logger.log(`\n  Testing ${ip}:${port}...`)
        }

        // Run TCP connection tests
        const tcpResults = await testTcpConnection(ip, port, attempts, timeout)

        if (verbose) {
            const tcpStatus = tcpResults.alive
                ? `✓ TCP: ${tcpResults.avg.toFixed(2)}ms avg (${tcpResults.successCount}/${attempts} success)`
                : `✗ TCP: Failed (${tcpResults.successCount}/${attempts} success)`
            logger.log(`    ${tcpStatus}`)
        }

        // Run HTTP/HTTPS application-level tests
        const httpResults = await testHttpRequest(ip, port, attempts, timeout, useHttps)

        if (verbose) {
            const httpStatus = httpResults.alive
                ? `✓ HTTP${useHttps ? 'S' : ''}: ${httpResults.avg.toFixed(2)}ms avg (${httpResults.successCount}/${attempts} success)`
                : `✗ HTTP${useHttps ? 'S' : ''}: Failed (${httpResults.successCount}/${attempts} success)`
            logger.log(`    ${httpStatus}`)
        }

        // Calculate combined metrics
        const alive = tcpResults.alive || httpResults.alive
        const tcpSuccess = tcpResults.successCount
        const httpSuccess = httpResults.successCount
        const totalAttempts = attempts * 2 // TCP + HTTP tests

        // Calculate packet loss
        const tcpPacketLoss = ((attempts - tcpSuccess) / attempts) * 100
        const httpPacketLoss = ((attempts - httpSuccess) / attempts) * 100
        const overallPacketLoss = ((totalAttempts - tcpSuccess - httpSuccess) / totalAttempts) * 100

        // Calculate jitter (latency variance)
        const tcpJitter = calculateJitter(tcpResults.latencies)
        const httpJitter = calculateJitter(httpResults.latencies)

        // Calculate combined score (lower is better)
        // Weight: 40% TCP latency + 60% HTTP latency (app-level more important)
        const score = alive
            ? (tcpResults.avg * 0.4 + httpResults.avg * 0.6) * (1 + overallPacketLoss / 100)
            : Number.MAX_SAFE_INTEGER

        if (verbose && alive) {
            logger.log(`    → Combined Score: ${score.toFixed(2)}ms (40% TCP + 60% HTTP)`)
            if (overallPacketLoss > 0) {
                logger.log(`    → Packet Loss: ${overallPacketLoss.toFixed(1)}% (penalty applied)`)
            }
            if (tcpJitter > 0 || httpJitter > 0) {
                logger.log(`    → Jitter: TCP ${tcpJitter.toFixed(2)}ms, HTTP ${httpJitter.toFixed(2)}ms`)
            }
        }

        return {
            host: ip,
            alive,
            score,

            // TCP connection metrics (network layer)
            tcp: {
                avg: tcpResults.avg,
                min: tcpResults.min,
                max: tcpResults.max,
                jitter: tcpJitter,
                packetLoss: tcpPacketLoss,
                successCount: tcpSuccess,
                attempts
            },

            // HTTP/HTTPS metrics (application layer)
            http: {
                avg: httpResults.avg,
                min: httpResults.min,
                max: httpResults.max,
                jitter: httpJitter,
                packetLoss: httpPacketLoss,
                successCount: httpSuccess,
                attempts
            },

            // Overall metrics
            overall: {
                packetLoss: overallPacketLoss,
                totalAttempts,
                totalSuccesses: tcpSuccess + httpSuccess
            },

            // Legacy compatibility (for existing code)
            avg: score,
            results: {
                avg: score,
                min: Math.min(tcpResults.min, httpResults.min),
                max: Math.max(tcpResults.max, httpResults.max)
            }
        }
    } catch (error) {
        if (verbose) {
            logger.error(`    ✗ Error testing ${ip}: ${error.message}`)
        }

        return {
            host: ip,
            alive: false,
            score: Number.MAX_SAFE_INTEGER,
            error: error.message,
            tcp: { avg: 0, packetLoss: 100, successCount: 0, attempts },
            http: { avg: 0, packetLoss: 100, successCount: 0, attempts },
            overall: { packetLoss: 100, totalAttempts: attempts * 2, totalSuccesses: 0 }
        }
    }
}

/**
 * Test TCP connection latency
 */
function testTcpConnection(ip, port, attempts, timeout) {
    return new Promise((resolve) => {
        tcpp.ping({
            address: ip,
            port,
            attempts,
            timeout
        }, (err, data) => {
            if (err) {
                resolve({
                    alive: false,
                    avg: timeout,
                    min: timeout,
                    max: timeout,
                    successCount: 0,
                    latencies: []
                })
            } else {
                const latencies = data.results
                    .filter(r => r.err === undefined)
                    .map(r => r.time)

                resolve({
                    alive: latencies.length > 0,
                    avg: data.avg || timeout,
                    min: data.min || timeout,
                    max: data.max || timeout,
                    successCount: latencies.length,
                    latencies
                })
            }
        })
    })
}

/**
 * Test HTTP/HTTPS request latency (application layer)
 */
async function testHttpRequest(ip, port, attempts, timeout, useHttps) {
    const latencies = []
    const protocol = useHttps ? https : http

    for (let i = 0; i < attempts; i++) {
        try {
            const latency = await measureHttpLatency(protocol, ip, port, timeout)
            latencies.push(latency)
        } catch (error) {
            // Failed attempt, don't add to latencies
        }
    }

    if (latencies.length === 0) {
        return {
            alive: false,
            avg: timeout,
            min: timeout,
            max: timeout,
            successCount: 0,
            latencies: []
        }
    }

    const avg = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
    const min = Math.min(...latencies)
    const max = Math.max(...latencies)

    return {
        alive: true,
        avg,
        min,
        max,
        successCount: latencies.length,
        latencies
    }
}

/**
 * Measure single HTTP/HTTPS request latency
 */
function measureHttpLatency(protocol, ip, port, timeout) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now()

        const req = protocol.request({
            host: ip,
            port,
            path: '/',
            method: 'HEAD',
            timeout,
            headers: {
                'User-Agent': 'akam-proxy-tester/2.0'
            },
            // Disable certificate validation for IP-based requests
            rejectUnauthorized: false
        }, (res) => {
            const latency = Date.now() - startTime
            res.resume() // Consume response data
            resolve(latency)
        })

        req.on('error', reject)
        req.on('timeout', () => {
            req.destroy()
            reject(new Error('Timeout'))
        })

        req.end()
    })
}

/**
 * Calculate jitter (latency variance/standard deviation)
 */
function calculateJitter(latencies) {
    if (latencies.length < 2) return 0

    const avg = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
    const squaredDiffs = latencies.map(lat => Math.pow(lat - avg, 2))
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / latencies.length

    return Math.sqrt(variance) // Standard deviation
}
