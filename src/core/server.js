const proxyServer = require('../proxy/server')
const IpPool = require('../ip-management/ip-pool')
const AkamRunner = require('../ip-management/akam-runner')
const logger = require('../utils/logger')

/**
 * Main server manager
 * Handles initialization, IP testing, akamTester integration, and periodic refresh
 */
class Server {
    constructor(config) {
        this.config = config
        const verbose = config.verboseDebug || false
        this.ipPool = new IpPool('data/ip_list.txt', 5, verbose)
        this.akamRunner = null
        this.refreshTimer = null
        this.akamTimer = null
    }

    /**
     * Initialize and start the server
     */
    async start() {
        // Initialize akamTester first (before loading IP list)
        this.initAkamTester()

        // Run immediate IP validation if enabled
        if (this.akamRunner && this.config.akamTester.validateOnStartup) {
            await this.runStartupValidation()
        }

        // Load IP list (either fresh from akamTester or existing file)
        const ipList = this.ipPool.loadFromFile()

        // Initialize best object with first IP
        const best = this.ipPool.getBest()
        best.originalHost = this.config.host
        if (ipList.length > 0) {
            best.host = ipList[0]
        }

        // Initial server selection
        await this.ipPool.refreshBest()

        // Start periodic refresh
        this.startPeriodicRefresh()

        // Start periodic akamTester discovery
        this.startPeriodicDiscovery()

        // Start proxy server
        proxyServer(best, this.config.port)
    }

    /**
     * Run immediate IP validation on startup
     * Fetches fresh IPs from akamTester and replaces the old list
     */
    async runStartupValidation() {
        console.log('')
        logger.box('STARTUP IP VALIDATION', [
            'Running akamTester to fetch fresh IPs...',
            'Old ip_list.txt will be replaced with fresh results',
            'This ensures no expired/rotated IPs are used'
        ])
        console.log('')

        try {
            const newIps = await this.akamRunner.run()

            if (newIps.length === 0) {
                logger.error('akamTester returned no IPs during startup validation!')
                logger.log('Falling back to existing ip_list.txt (if it exists)')
                console.log('')
                return
            }

            // Replace the entire IP list with fresh results
            const replaceMode = this.config.akamTester.replaceMode !== false // Default to true
            if (replaceMode) {
                this.ipPool.replaceIps(newIps, this.config.akamTester.maxIps)
            } else {
                this.ipPool.mergeNewIps(newIps, this.config.akamTester.maxIps)
            }

            // Save to file
            this.ipPool.saveToFile()
            logger.log('✓ Saved fresh IP list to data/ip_list.txt')

            console.log('')
            logger.box('Startup validation completed', [
                `Fresh IP list ready with ${this.ipPool.getIpList().length} IPs`
            ])
            console.log('')

        } catch (error) {
            logger.error('Startup IP validation failed:', error.message)
            logger.log('Falling back to existing ip_list.txt (if it exists)')
            console.log('')
        }
    }

    /**
     * Initialize akamTester integration
     */
    initAkamTester() {
        if (this.config.akamTester && this.config.akamTester.enabled) {
            logger.box('akamTester Integration ENABLED', [
                `Discovery interval: ${this.config.akamTester.interval}s (${Math.floor(this.config.akamTester.interval / 60)} minutes)`,
                this.config.akamTester.condaEnv
                    ? `Python environment: Conda environment '${this.config.akamTester.condaEnv}'`
                    : `Python path: ${this.config.akamTester.pythonPath}`,
                `Target hosts: ${this.config.akamTester.targetHosts.join(', ')}`,
                `Max IPs: ${this.config.akamTester.maxIps}`
            ])
            console.log('')

            this.akamRunner = new AkamRunner(this.config.akamTester)
        } else {
            logger.log('akamTester integration disabled (set akamTester.enabled=true in config.json5 to enable)')
            logger.log(`To update IPs manually, use: nslookup ${this.config.host}`)
        }
    }

    /**
     * Start periodic IP refresh (tcp-ping testing)
     */
    startPeriodicRefresh() {
        this.refreshTimer = setInterval(async () => {
            await this.ipPool.refreshBest()

            // Save updated list if akamTester is enabled and saveToFile is true
            if (this.akamRunner && this.config.akamTester.saveToFile) {
                this.ipPool.saveToFile()
            }
        }, this.config.refreshInterval * 1000)
    }

    /**
     * Start periodic IP discovery with akamTester
     */
    startPeriodicDiscovery() {
        if (!this.akamRunner) {
            return
        }

        // Skip periodic discovery if validateOnStartup is enabled (already ran)
        if (this.config.akamTester.validateOnStartup) {
            logger.log(`Periodic akamTester runs scheduled every ${Math.floor(this.config.akamTester.interval / 60)} minutes`)
            console.log('')

            // Run every interval (no initial 30s delay since we just ran on startup)
            this.akamTimer = setInterval(() => {
                this.runDiscovery()
            }, this.config.akamTester.interval * 1000)
        } else {
            logger.log('First akamTester run scheduled in 30 seconds...')
            logger.log(`Subsequent runs every ${Math.floor(this.config.akamTester.interval / 60)} minutes`)
            console.log('')

            // First run after 30 seconds
            setTimeout(() => {
                this.runDiscovery()
            }, 30000)

            // Then run every interval
            this.akamTimer = setInterval(() => {
                this.runDiscovery()
            }, this.config.akamTester.interval * 1000)
        }
    }

    /**
     * Run IP discovery cycle
     */
    async runDiscovery() {
        if (!this.akamRunner) {
            return
        }

        console.log('')
        const replaceMode = this.config.akamTester.replaceMode !== false // Default to true
        logger.box('Running akamTester to discover new IPs', [
            `Current IP list size: ${this.ipPool.getIpList().length}`,
            `Mode: ${replaceMode ? 'REPLACE (old IPs will be wiped)' : 'MERGE (combine with existing)'}`
        ])

        try {
            const newIps = await this.akamRunner.run()

            if (newIps.length === 0) {
                logger.log('akamTester returned no new IPs, keeping existing list')
                console.log('')
                return
            }

            // Replace or merge new IPs based on config
            if (replaceMode) {
                this.ipPool.replaceIps(newIps, this.config.akamTester.maxIps)
            } else {
                this.ipPool.mergeNewIps(newIps, this.config.akamTester.maxIps)
            }

            // Save to file if configured
            if (this.config.akamTester.saveToFile) {
                this.ipPool.saveToFile()
                logger.log('✓ Saved updated IP list to data/ip_list.txt')
            }

            // Re-test all IPs and select the best one
            logger.log('Re-testing all IPs with tcp-ping to find the best server...')
            await this.ipPool.refreshBest()

            console.log('')
            logger.box('IP refresh cycle completed')
            console.log('')
        } catch (error) {
            logger.error('Error refreshing IP list from akamTester:', error.message)
            logger.log('Continuing with existing IP list')
            console.log('')
        }
    }

    /**
     * Stop the server and cleanup
     */
    stop() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer)
        }
        if (this.akamTimer) {
            clearInterval(this.akamTimer)
        }
    }
}

module.exports = Server
