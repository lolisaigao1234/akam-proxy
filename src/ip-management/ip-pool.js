const fs = require('fs')
const tester = require('./tester')
const logger = require('../utils/logger')

/**
 * IP Pool Manager
 * Manages IP list, testing, dead IP removal, and best server selection
 */
class IpPool {
    constructor(ipListPath, maxFailures = 5, verbose = false) {
        this.ipListPath = ipListPath
        this.maxFailures = maxFailures
        this.ipList = []
        this.ipFailureCount = new Map()
        this.best = { host: null, avg: Number.MAX_SAFE_INTEGER, originalHost: null }
        this.verbose = verbose
    }

    /**
     * Load IP list from file
     */
    loadFromFile() {
        const ipListText = fs.readFileSync(this.ipListPath, 'utf-8')
        this.ipList = ipListText.split(/\r\n|\r|\n/).filter(item => !!item && !/\:/.test(item))
        console.log(`Loaded ${this.ipList.length} IP addresses from ${this.ipListPath}`)
        return this.ipList
    }

    /**
     * Save IP list to file
     */
    saveToFile() {
        fs.writeFileSync(this.ipListPath, this.ipList.join('\n'), 'utf-8')
    }

    /**
     * Get current IP list
     */
    getIpList() {
        return this.ipList
    }

    /**
     * Set IP list (for merging new discoveries)
     */
    setIpList(newIpList) {
        this.ipList = newIpList
    }

    /**
     * Get best server info
     */
    getBest() {
        return this.best
    }

    /**
     * Test all IPs and select the best server
     * Returns Promise<void>
     */
    async refreshBest() {
        const goodList = await tester(this.ipList, { verbose: this.verbose })

        if (goodList.length) {
            this.best.host = goodList[0].host
            this.best.avg = goodList[0].avg

            if (this.verbose) {
                // Show top 5 performers
                console.log('')
                logger.box('Top 5 Best Performing IPs', [
                    ...goodList.slice(0, 5).map((ip, index) => {
                        const rank = index + 1
                        const tcpAvg = ip.tcp.avg.toFixed(2)
                        const httpAvg = ip.http.avg.toFixed(2)
                        const score = ip.score.toFixed(2)
                        const packetLoss = ip.overall.packetLoss.toFixed(1)
                        return `${rank}. ${ip.host} - Score: ${score}ms (TCP: ${tcpAvg}ms, HTTP: ${httpAvg}ms, Loss: ${packetLoss}%)`
                    })
                ])
                console.log('')
                logger.log(`✓ Selected best server: ${this.best.host} (score: ${this.best.avg.toFixed(2)}ms)`)
                console.log('')
            } else {
                // Simple output for non-verbose mode
                console.log(`The best server is ${this.best.host} which delay is ${this.best.avg.toFixed(2)}ms`)
            }

            // Reset failure counts for alive IPs
            const aliveIps = new Set(goodList.map(item => item.host))
            goodList.forEach(item => {
                this.ipFailureCount.set(item.host, 0)
            })

            // Increment failure count for dead IPs and remove if needed
            const deadIps = []
            this.ipList.forEach(ip => {
                if (!aliveIps.has(ip)) {
                    const count = (this.ipFailureCount.get(ip) || 0) + 1
                    this.ipFailureCount.set(ip, count)

                    // Mark for removal if failed too many times
                    if (count >= this.maxFailures) {
                        deadIps.push(ip)
                    }
                }
            })

            // Remove dead IPs from the list
            if (deadIps.length > 0) {
                this.removeDeadIps(deadIps)
            }

            if (this.verbose) {
                // Show detailed statistics
                this.showStatistics(goodList)
            }
        } else {
            console.log('Could not find any available server')
        }
    }

    /**
     * Show detailed testing statistics
     */
    showStatistics(goodList) {
        const tcpLatencies = goodList.map(ip => ip.tcp.avg)
        const httpLatencies = goodList.map(ip => ip.http.avg)
        const scores = goodList.map(ip => ip.score)

        const avgTcp = (tcpLatencies.reduce((a, b) => a + b, 0) / tcpLatencies.length).toFixed(2)
        const avgHttp = (httpLatencies.reduce((a, b) => a + b, 0) / httpLatencies.length).toFixed(2)
        const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)

        const minTcp = Math.min(...tcpLatencies).toFixed(2)
        const maxTcp = Math.max(...tcpLatencies).toFixed(2)
        const minHttp = Math.min(...httpLatencies).toFixed(2)
        const maxHttp = Math.max(...httpLatencies).toFixed(2)

        const totalPacketLoss = goodList.reduce((sum, ip) => sum + ip.overall.packetLoss, 0)
        const avgPacketLoss = (totalPacketLoss / goodList.length).toFixed(2)

        logger.box('Testing Statistics Summary', [
            `Average TCP Latency: ${avgTcp}ms (range: ${minTcp}-${maxTcp}ms)`,
            `Average HTTP Latency: ${avgHttp}ms (range: ${minHttp}-${maxHttp}ms)`,
            `Average Combined Score: ${avgScore}ms`,
            `Average Packet Loss: ${avgPacketLoss}%`,
            `Total Alive IPs: ${goodList.length}/${this.ipList.length}`
        ])
        console.log('')
    }

    /**
     * Remove dead IPs from the pool
     */
    removeDeadIps(deadIps) {
        console.log(`Removing ${deadIps.length} dead IP(s) (failed ${this.maxFailures}+ times consecutively):`)
        deadIps.forEach(ip => {
            const index = this.ipList.indexOf(ip)
            if (index > -1) {
                this.ipList.splice(index, 1)
                console.log(`  - Removed: ${ip}`)
                this.ipFailureCount.delete(ip)
            }
        })
        console.log(`✓ Updated IP list (now ${this.ipList.length} IPs)`)
    }

    /**
     * Replace the entire IP list with new IPs (no merging)
     * Used when fresh IPs are needed (e.g., on startup validation)
     */
    replaceIps(newIps, maxIps = 200) {
        const oldCount = this.ipList.length

        // Deduplicate new IPs
        const uniqueIps = Array.from(new Set(newIps))

        // Limit total IPs if needed
        if (uniqueIps.length > maxIps) {
            console.log(`Discovered ${uniqueIps.length} IPs, limiting to ${maxIps}`)
            this.ipList = uniqueIps.slice(0, maxIps)
        } else {
            this.ipList = uniqueIps
        }

        // Clear failure counts since we have fresh IPs
        this.ipFailureCount.clear()

        console.log(`IP list replaced: ${oldCount} → ${this.ipList.length} IPs (${this.ipList.length} fresh from akamTester)`)

        return this.ipList.length
    }

    /**
     * Merge new IPs into the pool (deduplication)
     */
    mergeNewIps(newIps, maxIps = 200) {
        const existingSet = new Set(this.ipList)
        const reallyNewIps = newIps.filter(ip => !existingSet.has(ip))

        console.log(`Discovered ${newIps.length} IPs (${reallyNewIps.length} new, ${newIps.length - reallyNewIps.length} already known)`)

        // Merge with Set deduplication
        const mergedIps = new Set([...this.ipList, ...newIps])
        const mergedArray = Array.from(mergedIps)

        // Limit total IPs
        if (mergedArray.length > maxIps) {
            console.log(`IP list exceeds maxIps (${maxIps})`)
            console.log('Dead IPs will be automatically removed during testing')
        }

        console.log(`IP list updated: ${this.ipList.length} → ${mergedArray.length} IPs`)
        this.ipList = mergedArray

        return reallyNewIps.length
    }
}

module.exports = IpPool
