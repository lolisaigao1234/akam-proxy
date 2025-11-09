const domains = [
    'bilibili.com',
    'bilivideo.com',
    'akamaized.net',
    'hdslb.com',
    'upos-hz-mirrorakam.akamaized.net',
    'upos-sz-mirrorcosov.bilivideo.com',
];

module.exports = (mapper, options) => {
    const { hostname, port } = options;
    const result = options;

    // Check if the hostname matches any of the domains or their subdomains.
    const shouldProxy = domains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
    );

    if (shouldProxy) {
        result.hostname = mapper.host;
    }

    if (hostname !== result.hostname) {
        console.log(`proxy request: ${hostname}:${port} => ${result.hostname}:${result.port}`);
    }

    return result;
};