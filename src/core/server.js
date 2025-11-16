const proxyServer = require('../proxy/server')
const DomainManager = require('./domain-manager')
const AkamRunner = require('../ip-management/akam-runner')
const logger = require('../utils/logger')

/**
 * Main server manager
 * Handles initialization, IP testing, akamTester integration, and periodic refresh
 * Now supports MULTIPLE DOMAINS with separate IP pools per domain
 */
class Server {
    constructor(config) {
        this.config = config
        const verbose = config.verboseDebug || false

        // Build domain configurations
        this.domainConfigs = this.buildDomainConfigs(config)

        // Create domain manager (manages multiple IP pools)
        this.domainManager = new DomainManager(this.domainConfigs, verbose)

        this.akamRunner = null
        this.refreshTimer = null
        this.akamTimer = null
    }

    /**
     * Build domain configurations from config
     * Maps targetHosts to domain patterns and IP list files
     */
    buildDomainConfigs(config) {
        const domainConfigs = []

        if (config.akamTester && config.akamTester.targetHosts) {
            // Use targetHosts from akamTester config
            config.akamTester.targetHosts.forEach(targetHost => {
                // Extract domain pattern from targetHost
                // e.g., 'upos-hz-mirrorakam.akamaized.net' -> 'akamaized.net'
                //       'upos-sz-mirroraliov.bilivideo.com' -> 'bilivideo.com'
                const pattern = this.extractDomainPattern(targetHost)

                domainConfigs.push({
                    pattern: pattern,
                    targetHost: targetHost,
                    ipListFile: `data/${pattern}_iplist.txt`
                })
            })
        } else {
            // Fallback: use legacy single host config
            logger.warn('No targetHosts found in config.akamTester')
            logger.warn('Using legacy single-domain mode')
            domainConfigs.push({
                pattern: this.extractDomainPattern(config.host),
                targetHost: config.host,
                ipListFile: 'data/ip_list.txt' // Legacy file
            })
        }

        logger.log('')
        logger.box('Domain Configuration', [
            `Managing ${domainConfigs.length} domain(s):`,
            ...domainConfigs.map(c => `  - ${c.pattern} → ${c.targetHost}`)
        ])
        console.log('')

        return domainConfigs
    }

    /**
     * Extract domain pattern from target host
     * e.g., 'upos-hz-mirrorakam.akamaized.net' -> 'akamaized.net'
     */
    extractDomainPattern(targetHost) {
        const parts = targetHost.split('.')
        if (parts.length >= 2) {
            // Return last two parts (domain.tld)
            return parts.slice(-2).join('.')
        }
        return targetHost
    }

    /**
     * Initialize and start the server
     */
    async start() {
        // Initialize akamTester first (before loading IP lists)
        this.initAkamTester()

        // Run immediate IP validation if enabled
        if (this.akamRunner && this.config.akamTester.validateOnStartup) {
            await this.runStartupValidation()
        }

        // Load IP lists for all domains
        this.domainManager.loadAllFromFile()

        // Initial server selection for all domains
        await this.domainManager.refreshAllBest()

        // Start periodic refresh
        this.startPeriodicRefresh()

        // Start periodic akamTester discovery
        this.startPeriodicDiscovery()

        // Start proxy server with domain map
        const domainMap = this.domainManager.getDomainMap()
        proxyServer(domainMap, this.config.port)
    }

    /**
     * Run immediate IP validation on startup
     * Fetches fresh IPs from akamTester and replaces the old lists
     */
    async runStartupValidation() {
        console.log('')
        logger.box('STARTUP IP VALIDATION', [
            'Running akamTester to fetch fresh IPs for ALL domains...',
            'Old IP lists will be replaced with fresh results',
            'This ensures no expired/rotated IPs are used'
        ])
        console.log('')

        try {
            // Run akamTester and get domain-specific IPs
            const domainIpMap = await this.akamRunner.run()

            if (domainIpMap.size === 0) {
                logger.error('akamTester returned no IPs during startup validation!')
                logger.log('Falling back to existing IP list files (if they exist)')
                console.log('')
                return
            }

            // Update each domain's IP pool
            const replaceMode = this.config.akamTester.replaceMode !== false // Default to true
            domainIpMap.forEach((ips, targetHost) => {
                // Find matching domain config
                const domainConfig = this.domainConfigs.find(c => c.targetHost === targetHost)
                if (!domainConfig) {
                    logger.warn(`No domain config found for ${targetHost}, skipping`)
                    return
                }

                if (ips.length === 0) {
                    logger.warn(`No IPs discovered for ${targetHost}, keeping existing list`)
                    return
                }

                // Replace or merge IPs
                if (replaceMode) {
                    this.domainManager.replaceIps(domainConfig.pattern, ips, this.config.akamTester.maxIps)
                } else {
                    this.domainManager.mergeNewIps(domainConfig.pattern, ips, this.config.akamTester.maxIps)
                }

                // Save to file
                this.domainManager.saveToFile(domainConfig.pattern)
                logger.log(`✓ Saved fresh IP list for ${domainConfig.pattern} to ${domainConfig.ipListFile}`)
            })

            console.log('')
            logger.box('Startup validation completed', [
                `Fresh IP lists ready for ${domainIpMap.size} domain(s)`
            ])
            console.log('')

        } catch (error) {
            logger.error('Startup IP validation failed:', error.message)
            logger.log('Falling back to existing IP list files (if they exist)')
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
                `Max IPs per domain: ${this.config.akamTester.maxIps}`
            ])
            console.log('')

            this.akamRunner = new AkamRunner(this.config.akamTester)
        } else {
            logger.log('akamTester integration disabled (set akamTester.enabled=true in config.json5 to enable)')
            logger.log(`To update IPs manually, use: nslookup <target-host>`)
        }
    }

    /**
     * Start periodic IP refresh (tcp-ping testing)
     */
    startPeriodicRefresh() {
        this.refreshTimer = setInterval(async () => {
            await this.domainManager.refreshAllBest()

            // Save updated lists if akamTester is enabled and saveToFile is true
            if (this.akamRunner && this.config.akamTester.saveToFile) {
                this.domainManager.saveAllToFile()
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
        logger.box('Running akamTester to discover new IPs for ALL domains', [
            `Current total IPs: ${this.domainManager.getTotalIpCount()}`,
            `Mode: ${replaceMode ? 'REPLACE (old IPs will be wiped)' : 'MERGE (combine with existing)'}`
        ])

        try {
            // Run akamTester and get domain-specific IPs
            const domainIpMap = await this.akamRunner.run()

            if (domainIpMap.size === 0) {
                logger.log('akamTester returned no new IPs, keeping existing lists')
                console.log('')
                return
            }

            // Update each domain's IP pool
            domainIpMap.forEach((ips, targetHost) => {
                // Find matching domain config
                const domainConfig = this.domainConfigs.find(c => c.targetHost === targetHost)
                if (!domainConfig) {
                    logger.warn(`No domain config found for ${targetHost}, skipping`)
                    return
                }

                if (ips.length === 0) {
                    logger.warn(`No IPs discovered for ${targetHost}, keeping existing list`)
                    return
                }

                // Replace or merge IPs based on config
                if (replaceMode) {
                    this.domainManager.replaceIps(domainConfig.pattern, ips, this.config.akamTester.maxIps)
                } else {
                    this.domainManager.mergeNewIps(domainConfig.pattern, ips, this.config.akamTester.maxIps)
                }

                // Save to file if configured
                if (this.config.akamTester.saveToFile) {
                    this.domainManager.saveToFile(domainConfig.pattern)
                    logger.log(`✓ Saved updated IP list for ${domainConfig.pattern} to ${domainConfig.ipListFile}`)
                }
            })

            // Re-test all IPs and select the best ones for each domain
            logger.log('Re-testing all IPs with dual-layer testing to find the best servers...')
            await this.domainManager.refreshAllBest()

            console.log('')
            logger.box('IP refresh cycle completed')
            console.log('')
        } catch (error) {
            logger.error('Error refreshing IP lists from akamTester:', error.message)
            logger.log('Continuing with existing IP lists')
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
