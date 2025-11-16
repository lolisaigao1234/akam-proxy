/**
 * Domain-aware proxy mapper
 * Routes requests to the correct IP based on domain pattern matching
 *
 * @param {Map} domainMap - Map of domain patterns to best server objects
 *                          e.g., Map { 'akamaized.net' => { host: '1.2.3.4', avg: 10 }, ... }
 * @param {Object} options - Request options { hostname, port }
 * @returns {Object} Modified options with potentially updated hostname
 */
module.exports = (domainMap, options) => {
    const { hostname, port } = options;
    const result = { ...options }; // Clone to avoid mutation

    // Try to match hostname to a domain pattern
    let matched = false;
    let bestServer = null;

    for (const [pattern, best] of domainMap) {
        // Check if hostname exactly matches pattern or is a subdomain
        if (hostname === pattern || hostname.endsWith('.' + pattern)) {
            matched = true;
            bestServer = best;
            break;
        }
    }

    // If matched, replace hostname with best server IP
    if (matched && bestServer && bestServer.host) {
        result.hostname = bestServer.host;
    }

    // Log proxy mapping if hostname was changed
    if (hostname !== result.hostname) {
        console.log(`proxy request: ${hostname}:${port} => ${result.hostname}:${result.port}`);
    }

    return result;
};