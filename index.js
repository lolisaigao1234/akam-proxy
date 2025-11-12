const proxy = require('./libs/proxy')
const fs = require('fs')
const getGoodServer = require('./utils/getGoodServer')
const AkamTesterRunner = require('./utils/akamTesterRunner')
require('json5/lib/register')
const config = require('./config.json5')

const ipListText = fs.readFileSync('ip_list.txt', 'utf-8')
let ipList = ipListText.split(/\r\n|\r|\n/).filter(item => !!item && !/\:/.test(item))

console.log(`Loaded ${ipList.length} IP addresses from ip_list.txt`)

// Initialize akamTester runner if enabled
let akamTester = null;
if (config.akamTester && config.akamTester.enabled) {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  akamTester Integration ENABLED                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`Discovery interval: ${config.akamTester.interval}s (${Math.floor(config.akamTester.interval / 60)} minutes)`);
    if (config.akamTester.condaEnv) {
        console.log(`Python environment: Conda environment '${config.akamTester.condaEnv}'`);
    } else {
        console.log(`Python path: ${config.akamTester.pythonPath}`);
    }
    console.log(`Target hosts: ${config.akamTester.targetHosts.join(', ')}`);
    console.log(`Max IPs: ${config.akamTester.maxIps}`);
    console.log('');
    akamTester = new AkamTesterRunner(config.akamTester);
} else {
    console.log('akamTester integration disabled (set akamTester.enabled=true in config.json5 to enable)');
    console.log(`To update IPs manually, use: nslookup ${config.host}`);
}

let best = {host: ipList[0], avg: Number.MAX_SAFE_INTEGER, originalHost: config.host}

// Track failed IPs for automatic removal
// Map: IP -> consecutive failure count
const ipFailureCount = new Map();
const MAX_FAILURES_BEFORE_REMOVAL = 5;

function refreshBest(ipList) {
    console.log('Pinging ipList')
    getGoodServer(ipList)
    .then(goodList => {
        if(goodList.length) {
            best.host = goodList[0].host
            best.avg = goodList[0].avg
            console.log(`The best server is ${best.host} which delay is ${best.avg}ms`)

            // Reset failure counts for alive IPs
            const aliveIps = new Set(goodList.map(item => item.host));
            goodList.forEach(item => {
                ipFailureCount.set(item.host, 0);
            });

            // Increment failure count for dead IPs and remove if needed
            const deadIps = [];
            ipList.forEach(ip => {
                if (!aliveIps.has(ip)) {
                    const count = (ipFailureCount.get(ip) || 0) + 1;
                    ipFailureCount.set(ip, count);

                    // Remove IPs that failed MAX_FAILURES_BEFORE_REMOVAL times consecutively
                    if (count >= MAX_FAILURES_BEFORE_REMOVAL) {
                        deadIps.push(ip);
                    }
                }
            });

            // Remove dead IPs from the list
            if (deadIps.length > 0) {
                console.log(`Removing ${deadIps.length} dead IP(s) (failed ${MAX_FAILURES_BEFORE_REMOVAL}+ times consecutively):`);
                deadIps.forEach(ip => {
                    const index = ipList.indexOf(ip);
                    if (index > -1) {
                        ipList.splice(index, 1);
                        console.log(`  - Removed: ${ip}`);
                        ipFailureCount.delete(ip);
                    }
                });

                // Save updated list to file if akamTester is enabled and saveToFile is true
                if (akamTester && config.akamTester.saveToFile) {
                    fs.writeFileSync('ip_list.txt', ipList.join('\n'), 'utf-8');
                    console.log(`✓ Updated ip_list.txt (now ${ipList.length} IPs)`);
                }
            }

        } else {
            console.log(`Could not find any available server`)
        }
    })
}

/**
 * Refresh IP list from akamTester
 * - Runs akamTester to discover new IPs
 * - Merges with existing IPs (deduplication)
 * - Saves to ip_list.txt if configured
 * - Re-tests all IPs to select the best one
 */
async function refreshIpListFromAkamTester() {
    if (!akamTester) {
        return;  // akamTester disabled
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  Running akamTester to discover new IPs                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`Current IP list size: ${ipList.length}`);

    try {
        const newIps = await akamTester.run();

        if (newIps.length === 0) {
            console.log('akamTester returned no new IPs, keeping existing list');
            console.log('');
            return;
        }

        // Count how many are actually new
        const existingSet = new Set(ipList);
        const reallyNewIps = newIps.filter(ip => !existingSet.has(ip));

        console.log(`akamTester discovered ${newIps.length} IPs (${reallyNewIps.length} new, ${newIps.length - reallyNewIps.length} already known)`);

        // Merge new IPs with existing ones (Set deduplication)
        const mergedIps = new Set([...ipList, ...newIps]);
        const mergedArray = Array.from(mergedIps);

        // Limit total IPs to maxIps
        if (mergedArray.length > config.akamTester.maxIps) {
            console.log(`IP list exceeds maxIps (${config.akamTester.maxIps})`);
            console.log('Dead IPs will be automatically removed during testing');
        }

        console.log(`IP list updated: ${ipList.length} → ${mergedArray.length} IPs`);

        // Update global ipList
        ipList = mergedArray;

        // Save to file if configured
        if (config.akamTester.saveToFile) {
            fs.writeFileSync('ip_list.txt', ipList.join('\n'), 'utf-8');
            console.log('✓ Saved updated IP list to ip_list.txt');
        }

        // Re-test all IPs and select the best one
        console.log('Re-testing all IPs with tcp-ping to find the best server...');
        await refreshBest(ipList);

        console.log('');
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║  IP refresh cycle completed                                  ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');

    } catch (error) {
        console.error('Error refreshing IP list from akamTester:', error.message);
        console.log('Continuing with existing IP list');
        console.log('');
    }
}

// Initial server selection
refreshBest(ipList)

// Periodically re-test and select the best server (existing logic)
setInterval(() => refreshBest(ipList), config.refreshInterval * 1000)

// NEW: Periodically discover new IPs with akamTester
if (akamTester) {
    // Run first discovery after 30 seconds (let server start up first)
    console.log(`First akamTester run scheduled in 30 seconds...`);
    console.log(`Subsequent runs every ${Math.floor(config.akamTester.interval / 60)} minutes`);
    console.log('');

    setTimeout(() => {
        refreshIpListFromAkamTester();
    }, 30000);  // 30 seconds delay

    // Then run every interval
    setInterval(() => {
        refreshIpListFromAkamTester();
    }, config.akamTester.interval * 1000);
}

proxy(best, config.port)
