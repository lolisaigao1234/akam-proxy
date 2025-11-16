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

    // Handle different domainMap formats (Map vs plain Object)
    let entries;
    if (domainMap instanceof Map) {
        // New format: Map<pattern, bestServer>
        entries = Array.from(domainMap.entries());
    } else if (domainMap && typeof domainMap === 'object') {
        // Check for old format: { host, originalHost }
        if (domainMap.host && domainMap.originalHost) {
            // Old single-domain format - map ALL known CDN domains
            // (Old behavior: single IP for all Bilibili CDN domains)
            const knownDomains = ['bilivideo.com', 'akamaized.net'];

            // Check if hostname matches originalHost exactly
            if (hostname === domainMap.originalHost) {
                matched = true;
                bestServer = { host: domainMap.host };
            } else {
                // Check if hostname contains any known CDN domain
                for (const domain of knownDomains) {
                    if (hostname.includes(domain)) {
                        matched = true;
                        bestServer = { host: domainMap.host };
                        break;
                    }
                }
            }
            entries = []; // Skip iteration below
        } else {
            // Plain object with pattern keys: { 'akamaized.net': {...}, ... }
            entries = Object.entries(domainMap);
        }
    } else {
        entries = [];
    }

    // Iterate through entries to find matching pattern
    for (const [pattern, best] of entries) {
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