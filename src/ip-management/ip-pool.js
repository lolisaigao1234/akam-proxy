const fs = require('fs')
const tester = require('./tester')

/**
 * IP Pool Manager
 * Manages IP list, testing, dead IP removal, and best server selection
 */
class IpPool {
    constructor(ipListPath, maxFailures = 5) {
        this.ipListPath = ipListPath
        this.maxFailures = maxFailures
        this.ipList = []
        this.ipFailureCount = new Map()
        this.best = { host: null, avg: Number.MAX_SAFE_INTEGER, originalHost: null }
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
        console.log('Pinging ipList')
        const goodList = await tester(this.ipList)

        if (goodList.length) {
            this.best.host = goodList[0].host
            this.best.avg = goodList[0].avg
            console.log(`The best server is ${this.best.host} which delay is ${this.best.avg}ms`)

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
        } else {
            console.log('Could not find any available server')
        }
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
