const IpPool = require('../ip-management/ip-pool')
const logger = require('../utils/logger')

/**
 * Domain Manager
 * Manages multiple IP pools, one per domain
 * Coordinates testing, refresh, and best server selection across domains
 */
class DomainManager {
    /**
     * @param {Array} domainConfigs - Array of domain configurations
     * @param {boolean} verbose - Enable verbose debug output
     *
     * Each domainConfig should have:
     * - pattern: Domain pattern to match (e.g., 'akamaized.net')
     * - targetHost: Full hostname for this domain (e.g., 'upos-hz-mirrorakam.akamaized.net')
     * - ipListFile: Path to IP list file for this domain
     */
    constructor(domainConfigs, verbose = false) {
        this.domainConfigs = domainConfigs
        this.verbose = verbose
        this.ipPools = new Map()  // pattern -> IpPool instance
        this.domainMap = new Map() // pattern -> best server object

        // Initialize IP pools for each domain
        domainConfigs.forEach(config => {
            const ipPool = new IpPool(config.ipListFile, 5, verbose)
            this.ipPools.set(config.pattern, ipPool)

            // Initialize best server object
            const best = ipPool.getBest()
            best.originalHost = config.targetHost
            this.domainMap.set(config.pattern, best)

            logger.log(`Initialized IP pool for domain: ${config.pattern}`)
            logger.log(`  Target host: ${config.targetHost}`)
            logger.log(`  IP list file: ${config.ipListFile}`)
        })
    }

    /**
     * Load IP lists from files for all domains
     */
    loadAllFromFile() {
        logger.log('')
        logger.box('Loading IP Lists for All Domains')
        console.log('')

        this.domainConfigs.forEach(config => {
            const ipPool = this.ipPools.get(config.pattern)
            const ipList = ipPool.loadFromFile()

            // Set initial best server to first IP if available
            const best = this.domainMap.get(config.pattern)
            if (ipList.length > 0) {
                best.host = ipList[0]
            }
        })

        console.log('')
    }

    /**
     * Test all IPs and select best server for all domains
     */
    async refreshAllBest() {
        logger.log('')
        logger.box('Testing IPs for All Domains')
        console.log('')

        for (const config of this.domainConfigs) {
            logger.log(`\n╔══════════════════════════════════════════════════════════════╗`)
            logger.log(`║  Domain: ${config.pattern.padEnd(52)} ║`)
            logger.log(`║  Target: ${config.targetHost.padEnd(51)} ║`)
            logger.log(`╚══════════════════════════════════════════════════════════════╝\n`)

            const ipPool = this.ipPools.get(config.pattern)

            // Check if IP list is empty
            if (ipPool.getIpList().length === 0) {
                logger.warn(`No IPs available for domain: ${config.pattern}`)
                logger.warn(`IP list file: ${config.ipListFile}`)
                console.log('')
                continue
            }

            console.log('Pinging ipList')
            await ipPool.refreshBest()
            console.log('')
        }

        console.log('')
        logger.box('All Domains Tested Successfully')
        console.log('')
    }

    /**
     * Get the domain map (pattern -> best server)
     * This is passed to the proxy mapper
     */
    getDomainMap() {
        return this.domainMap
    }

    /**
     * Get IP pool for a specific domain
     */
    getIpPool(pattern) {
        return this.ipPools.get(pattern)
    }

    /**
     * Get all domain configurations
     */
    getDomainConfigs() {
        return this.domainConfigs
    }

    /**
     * Replace IPs for a specific domain
     */
    replaceIps(pattern, newIps, maxIps = 200) {
        const ipPool = this.ipPools.get(pattern)
        if (!ipPool) {
            throw new Error(`Domain pattern '${pattern}' not found`)
        }
        return ipPool.replaceIps(newIps, maxIps)
    }

    /**
     * Merge new IPs for a specific domain
     */
    mergeNewIps(pattern, newIps, maxIps = 200) {
        const ipPool = this.ipPools.get(pattern)
        if (!ipPool) {
            throw new Error(`Domain pattern '${pattern}' not found`)
        }
        return ipPool.mergeNewIps(newIps, maxIps)
    }

    /**
     * Save IP list to file for a specific domain
     */
    saveToFile(pattern) {
        const ipPool = this.ipPools.get(pattern)
        if (!ipPool) {
            throw new Error(`Domain pattern '${pattern}' not found`)
        }
        ipPool.saveToFile()
    }

    /**
     * Save all IP lists to files
     */
    saveAllToFile() {
        this.domainConfigs.forEach(config => {
            const ipPool = this.ipPools.get(config.pattern)
            ipPool.saveToFile()
        })
    }

    /**
     * Get total number of IPs across all domains
     */
    getTotalIpCount() {
        let total = 0
        this.ipPools.forEach(pool => {
            total += pool.getIpList().length
        })
        return total
    }

    /**
     * Get summary of all domains
     */
    getSummary() {
        const summary = []
        this.domainConfigs.forEach(config => {
            const ipPool = this.ipPools.get(config.pattern)
            const best = this.domainMap.get(config.pattern)
            summary.push({
                pattern: config.pattern,
                targetHost: config.targetHost,
                ipCount: ipPool.getIpList().length,
                bestServer: best.host,
                bestDelay: best.avg
            })
        })
        return summary
    }
}

module.exports = DomainManager
