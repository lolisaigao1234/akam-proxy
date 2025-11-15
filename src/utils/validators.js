/**
 * Configuration validators
 * Validates config structure and values without external dependencies
 */

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateConfig(config) {
    const errors = []

    // Validate required fields
    if (!config.host || typeof config.host !== 'string') {
        errors.push('config.host must be a non-empty string')
    }

    if (!config.port || typeof config.port !== 'number') {
        errors.push('config.port must be a number')
    } else if (config.port < 1 || config.port > 65535) {
        errors.push('config.port must be between 1 and 65535')
    }

    if (config.refreshInterval === undefined || typeof config.refreshInterval !== 'number') {
        errors.push('config.refreshInterval must be a number')
    } else if (config.refreshInterval < 60) {
        errors.push('config.refreshInterval must be at least 60 seconds')
    }

    // Validate verboseDebug (optional)
    if (config.verboseDebug !== undefined && typeof config.verboseDebug !== 'boolean') {
        errors.push('config.verboseDebug must be a boolean')
    }

    // Validate akamTester configuration if present
    if (config.akamTester) {
        const at = config.akamTester

        if (at.enabled !== undefined && typeof at.enabled !== 'boolean') {
            errors.push('config.akamTester.enabled must be a boolean')
        }

        if (at.interval !== undefined) {
            if (typeof at.interval !== 'number') {
                errors.push('config.akamTester.interval must be a number')
            } else if (at.interval < 300) {
                errors.push('config.akamTester.interval must be at least 300 seconds (5 minutes)')
            }
        }

        if (at.pythonPath && typeof at.pythonPath !== 'string') {
            errors.push('config.akamTester.pythonPath must be a string')
        }

        if (at.condaEnv !== null && at.condaEnv !== undefined && typeof at.condaEnv !== 'string') {
            errors.push('config.akamTester.condaEnv must be a string or null')
        }

        if (at.scriptPath && typeof at.scriptPath !== 'string') {
            errors.push('config.akamTester.scriptPath must be a string')
        }

        if (at.targetHosts) {
            if (!Array.isArray(at.targetHosts)) {
                errors.push('config.akamTester.targetHosts must be an array')
            } else if (at.targetHosts.length === 0) {
                errors.push('config.akamTester.targetHosts must contain at least one host')
            } else if (!at.targetHosts.every(h => typeof h === 'string')) {
                errors.push('config.akamTester.targetHosts must contain only strings')
            }
        }

        if (at.saveToFile !== undefined && typeof at.saveToFile !== 'boolean') {
            errors.push('config.akamTester.saveToFile must be a boolean')
        }

        if (at.timeout !== undefined) {
            if (typeof at.timeout !== 'number') {
                errors.push('config.akamTester.timeout must be a number')
            } else if (at.timeout < 60000) {
                errors.push('config.akamTester.timeout must be at least 60000ms (1 minute)')
            }
        }

        if (at.maxIps !== undefined) {
            if (typeof at.maxIps !== 'number') {
                errors.push('config.akamTester.maxIps must be a number')
            } else if (at.maxIps < 10) {
                errors.push('config.akamTester.maxIps must be at least 10')
            } else if (at.maxIps > 1000) {
                errors.push('config.akamTester.maxIps must not exceed 1000')
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

/**
 * Validate IP address format (IPv4)
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IPv4
 */
function validateIp(ip) {
    if (typeof ip !== 'string') return false

    const parts = ip.split('.')
    if (parts.length !== 4) return false

    return parts.every(part => {
        const num = parseInt(part, 10)
        return num >= 0 && num <= 255 && part === num.toString()
    })
}

/**
 * Validate IP list array
 * @param {string[]} ipList - Array of IP addresses
 * @returns {Object} { valid: boolean, invalidIps: string[] }
 */
function validateIpList(ipList) {
    if (!Array.isArray(ipList)) {
        return { valid: false, invalidIps: ['IP list is not an array'] }
    }

    const invalidIps = ipList.filter(ip => !validateIp(ip))

    return {
        valid: invalidIps.length === 0,
        invalidIps
    }
}

module.exports = {
    validateConfig,
    validateIp,
    validateIpList
}
