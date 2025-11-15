# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Structure

**For users and general documentation**, see:
- **[Quick Start](docs/README.md)** - Installation and basic setup
- **[Detailed Setup](docs/SETUP.md)** - Step-by-step configuration
- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[API Reference](docs/API.md)** - Code documentation

**This file (CLAUDE.md)** contains AI assistant-specific context, project conventions, and development notes that supplement the user-facing documentation.

## Project Overview

akam-proxy is a Node.js proxy server that automatically selects the optimal CDN node for Bilibili's overseas CDN (upos-hz-mirrorakam.akamaized.net) by testing latency and choosing the lowest-delay server.

## Getting Started

### Prerequisites
- Node.js installed (tested with v24.x)
- Required files: `config.json5` and `ip_list.txt` must exist in project root

### Setup Steps
1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Verify configuration**: Check `config.json5` exists and port 2689 is available (or modify port if needed)

3. **Start the proxy server**:
   ```bash
   npm start
   ```

4. **Verify startup**: Should see:
   - "Pinging ipList" - Server testing begins
   - "forward proxy server started, listening on port 2689"
   - "The best server is X.X.X.X which delay is XXXms"

5. **Configure browser**: Set up proxy extension (see Troubleshooting section for details)

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start the proxy server
npm start
```

### Configuration
- Configuration file: `config.json5` (JSON5 format, root directory)
- Example configs: `config/default.json5`, `config/example.json5`
- IP list: `data/ip_list.txt` (local cache of available IP addresses)
- Validation: Automatic on startup via `src/utils/validators.js`

## Architecture

**Note**: For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Core Components (After Phase 1 & 2 Restructure)

**Entry Point: `index.js`** (24 lines)
- Loads and validates configuration from `config.json5`
- Creates `Server` instance
- Handles graceful shutdown

**Application Manager: `src/core/server.js`**
- Coordinates all subsystems (IP pool, proxy, akamTester)
- Manages periodic refresh and discovery timers
- Initializes and starts all services

**Proxy Server: `src/proxy/server.js`**
- Creates HTTP/HTTPS proxy server using Node.js `http` and `net` modules
- Handles HTTP requests via `httpOptions()` function
- Handles HTTPS CONNECT requests via `connect` event listener
- Uses `src/proxy/mapper.js` to map requests from specified domains to the optimal IP
- Pipes client requests to destination servers and returns responses
- Includes comprehensive debug logging (10-step for HTTP, 8-step for HTTPS)
- Enhanced clientError handler with rawPacket debugging

**Host Mapping: `src/proxy/mapper.js`**
- Maps incoming requests for specific domains (bilivideo.com, akamaized.net, etc.) to optimal IP
- Supports multiple domains and subdomain matching
- Logs proxy mappings when hostname is changed
- Returns modified `{ hostname, port }` for connection

**IP Testing: `src/ip-management/tester.js`**
- Dual-layer testing: TCP connection (network layer) + HTTP/HTTPS requests (application layer)
- Tests each IP 5 times per layer with 3 second timeout (default)
- Calculates comprehensive metrics: latency (avg/min/max), packet loss, jitter
- Weighted scoring: 40% TCP + 60% HTTP (app-level more important)
- Filters out dead IPs and sorts by combined score
- Supports verbose debug logging (see "Verbose Debug Mode" section)
- Returns array of alive servers sorted by best score

**IP Pool Manager: `src/ip-management/ip-pool.js`**
- Loads/saves IP list from `data/ip_list.txt`
- Tracks failure counts per IP
- Removes dead IPs after 5 consecutive failures
- Merges new discoveries with deduplication
- Enforces maximum pool size

**akamTester Integration: `src/ip-management/akam-runner.js`**
- Executes Python akamTester script in subprocess
- Validates Python/conda environment
- Parses output files
- Handles timeouts and errors
- Mutex protection against concurrent runs

### Data Flow

1. On startup: Load IP list → Test all IPs → Select best server → Start proxy
2. Proxy request: Client request → Check if hostname matches domains → Replace with optimal IP → Forward request
3. Periodic refresh (every hour): Re-test existing IPs → Update best server

### Configuration Structure

The `config.json5` file contains:
- `host`: Target CDN hostname to optimize (default: 'upos-hz-mirrorakam.akamaized.net')
- `port`: Local proxy server port (default: 2689)
- `refreshInterval`: How often to re-test IPs in seconds
- `verboseDebug`: Enable detailed TCP/HTTP ping logging (default: false, see "Verbose Debug Mode" section)
- `akamTester`: Configuration for automated IP discovery (see "Automated IP Discovery" section)
- `refreshIpList.interval`: Legacy parameter (no longer used)
- `refreshIpList.retry.times`: Legacy parameter (no longer used)
- `refreshIpList.retry.interval`: Legacy parameter (no longer used)
- `saveChinazResult`: Legacy parameter (no longer used)

## Important Notes

- **Selective Proxy Behavior**: This is NOT a general-purpose HTTP proxy. It ONLY intercepts and redirects requests to specific domains (bilivideo.com, akamaized.net, etc.). All other requests pass through unchanged. This is a critical distinction - the proxy acts as a pass-through for everything except the specific CDN domains being optimized.
- The proxy modifies the destination hostname while preserving all other request parameters
- IPv6 addresses are filtered out (only IPv4 supported)
- The `best` object is passed by reference to the proxy, so updates to the optimal server take effect immediately without restarting the proxy
- **Debug logging**: The proxy includes comprehensive step-by-step debug logging. This can be verbose but is helpful for troubleshooting Parse Errors and connection issues.

## Verbose Debug Mode (TCP + HTTP Ping Logging)

The proxy supports detailed debug logging for the dual-layer IP testing process. This feature provides comprehensive visibility into TCP and HTTP ping operations, which is invaluable for understanding server selection and troubleshooting network issues.

### Enabling Verbose Debug Mode

Add the `verboseDebug` option to your `config.json5`:

```json5
{
    host: 'upos-hz-mirrorakam.akamaized.net',
    port: 2689,
    refreshInterval: 3600,

    // Enable verbose debug logging
    verboseDebug: true,

    // ... rest of config
}
```

### What Gets Logged

When `verboseDebug: true`, you'll see:

1. **Test Initialization**:
   - Total number of IPs to test
   - Number of TCP and HTTP attempts per IP
   - Timeout and port settings
   - Scoring algorithm details (40% TCP + 60% HTTP weighted)

2. **Individual IP Test Results**:
   - TCP connection latency (avg/min/max)
   - HTTP/HTTPS request latency (avg/min/max)
   - Success rate for each test type
   - Combined score calculation
   - Packet loss percentage
   - Jitter (latency variance) metrics
   - Real-time progress (X/Y tested, Z% complete)

3. **Summary Statistics**:
   - Top 5 best performing IPs with detailed metrics
   - Average TCP/HTTP latency across all alive IPs
   - Latency ranges (min-max)
   - Overall packet loss percentage
   - Total alive vs dead IPs

### Example Output

**Without verbose mode** (default):
```
The best server is 23.47.72.160 which delay is 15.59ms
```

**With verbose mode** (`verboseDebug: true`):
```
╔══════════════════════════════════════════╗
║  Starting Dual-Layer IP Testing          ║
╠══════════════════════════════════════════╣
║  Total IPs to test: 89                   ║
║  TCP ping attempts: 5 per IP             ║
║  HTTPS ping attempts: 5 per IP           ║
║  Timeout: 3000ms per attempt             ║
║  Port: 443                               ║
║  Scoring: 40% TCP + 60% HTTP (weighted)  ║
╚══════════════════════════════════════════╝

  Testing 23.47.72.160:443...
    ✓ TCP: 12.45ms avg (5/5 success)
    ✓ HTTPS: 18.32ms avg (5/5 success)
    → Combined Score: 15.97ms (40% TCP + 60% HTTP)
    → Jitter: TCP 2.31ms, HTTP 3.12ms
[1/89] 1% - Tested 23.47.72.160

  Testing 2.16.11.163:443...
    ✓ TCP: 88.12ms avg (5/5 success)
    ✓ HTTPS: 92.45ms avg (5/5 success)
    → Combined Score: 90.74ms (40% TCP + 60% HTTP)
[2/89] 2% - Tested 2.16.11.163

  Testing 104.96.51.89:443...
    ✗ TCP: Failed (0/5 success)
    ✗ HTTPS: Failed (0/5 success)
[3/89] 3% - Tested 104.96.51.89

... (continues for all IPs) ...

╔══════════════════════════════════════════╗
║  IP Testing Complete                     ║
╠══════════════════════════════════════════╣
║  Tested: 89 IPs in 45.23s                ║
║  Alive: 77 IPs                           ║
║  Dead: 12 IPs                            ║
║  Total tests performed: 890 (TCP + HTTP) ║
╚══════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════╗
║  Top 5 Best Performing IPs                                   ║
╠══════════════════════════════════════════════════════════════╣
║  1. 23.47.72.160 - Score: 15.97ms (TCP: 12.45ms, HTTP: 18.32ms, Loss: 0.0%)  ║
║  2. 104.97.23.45 - Score: 22.13ms (TCP: 18.90ms, HTTP: 24.20ms, Loss: 0.0%)  ║
║  3. 184.25.56.78 - Score: 35.42ms (TCP: 31.20ms, HTTP: 38.10ms, Loss: 0.0%)  ║
║  4. 23.48.123.90 - Score: 42.88ms (TCP: 39.50ms, HTTP: 45.10ms, Loss: 0.0%)  ║
║  5. 2.16.11.163 - Score: 90.74ms (TCP: 88.12ms, HTTP: 92.45ms, Loss: 0.0%)   ║
╚══════════════════════════════════════════════════════════════╝

✓ Selected best server: 23.47.72.160 (score: 15.97ms)

╔══════════════════════════════════════════════════════════════╗
║  Testing Statistics Summary                                  ║
╠══════════════════════════════════════════════════════════════╣
║  Average TCP Latency: 125.34ms (range: 12.45-350.12ms)      ║
║  Average HTTP Latency: 138.67ms (range: 18.32-420.45ms)     ║
║  Average Combined Score: 133.21ms                            ║
║  Average Packet Loss: 2.34%                                  ║
║  Total Alive IPs: 77/89                                      ║
╚══════════════════════════════════════════════════════════════╝
```

### Understanding the Metrics

**TCP Latency**: Connection-level latency (network layer)
- Measures raw TCP connection establishment time
- Lower-level network performance indicator
- Weighted 40% in final score

**HTTP/HTTPS Latency**: Application-level latency
- Measures full request-response time
- Real-world proxy performance indicator
- Weighted 60% in final score (more important)

**Combined Score**: Weighted average with packet loss penalty
- Formula: `(TCP_avg * 0.4 + HTTP_avg * 0.6) * (1 + packet_loss/100)`
- Lower score = better performance
- Used for server selection

**Packet Loss**: Percentage of failed test attempts
- 0% = all attempts succeeded
- >0% = some attempts timed out or failed
- Increases combined score as penalty

**Jitter**: Standard deviation of latency measurements
- Measures latency consistency/variance
- Lower jitter = more stable connection
- High jitter = unstable/congested network

### Performance Impact

**With `verboseDebug: false` (default)**:
- Minimal console output
- Faster startup (no formatting overhead)
- Recommended for production

**With `verboseDebug: true`**:
- Detailed console output (can be very long with many IPs)
- Slightly slower due to logging overhead (~1-2 seconds)
- Recommended for:
  - Debugging network issues
  - Understanding server selection
  - Monitoring IP pool health
  - Development and testing

### When to Use Verbose Mode

✅ **Enable when**:
- Debugging why certain IPs are selected/rejected
- Investigating packet loss or high latency
- Understanding scoring algorithm behavior
- Monitoring IP pool quality over time
- Troubleshooting akamTester integration

❌ **Disable when**:
- Running in production (too much log spam)
- You trust the automatic selection
- Console output is redirected to files (large files)
- Running as a background service

### Implementation Details

**Location**:
- Testing logic: `src/ip-management/tester.js`
- IP pool management: `src/ip-management/ip-pool.js`
- Server initialization: `src/core/server.js`

**How it works**:
1. `config.verboseDebug` flag is read at startup
2. Passed to `IpPool` constructor → stored as `this.verbose`
3. Passed to `tester()` function as `{ verbose: true/false }`
4. Tester uses `logger.box()` and `logger.log()` for formatted output
5. IP pool uses verbose flag to show/hide top performers and statistics

## Troubleshooting

### EADDRINUSE Error (Port Already in Use)

**Problem**: `Error: listen EADDRINUSE: address already in use :::2689`

**Cause**: Another process is already using port 2689, or a previous instance of the proxy server is still running.

**Solutions**:

1. **Find and kill the process using the port**:
   - Windows: `netstat -ano | findstr :2689` then `taskkill /PID <PID> /F`
   - Linux/Mac: `lsof -i :2689` then `kill -9 <PID>`

2. **Change the port in `config.json5`**:
   ```json5
   {
       port: 3000,  // Use a different port
       // ... other config
   }
   ```

3. **Check for zombie processes**: If you've stopped the server with Ctrl+C, check Task Manager/Activity Monitor for lingering Node.js processes

### Browser Proxy Configuration Issues

**Problem**: Browser proxy extension (e.g., ZeroOmega, SwitchyOmega) doesn't work with the proxy.

**Root Cause Understanding**: This proxy is designed SPECIFICALLY for Bilibili's CDN domains (bilivideo.com, akamaized.net). It will not optimize or affect traffic to other domains. The proxy passes through all non-matching requests unchanged.

**Proper Configuration**:

1. **For SwitchyOmega/ZeroOmega - Use Selective Proxy Mode**:
   - Create a new proxy profile with server `127.0.0.1` and port `2689` (HTTP proxy)
   - In "Switch Rules" or "Auto Switch" mode, add a rule:
     - Condition Type: Host wildcard
     - Pattern: `*.akamaized.net` or specifically `upos-hz-mirrorakam.akamaized.net`
     - Profile: Your proxy profile
   - This ensures only Bilibili CDN requests go through the proxy

2. **Do NOT use "Proxy all requests" mode** unless you understand that only matching domains will be optimized while other requests pass through normally.

3. **Verify the proxy is working**:
   - Start the proxy server: `npm start`
   - Check console output: Should show "forward proxy server started, listening on port 2689"
   - Watch for "proxy request" logs when accessing Bilibili videos
   - Logs like `proxy request: upos-hz-mirrorakam.akamaized.net:443 => 23.x.x.x:443` confirm the proxy is working

4. **Testing without browser extension**:
   - You can manually set system-wide proxy settings to `127.0.0.1:2689` for testing
   - Or use curl: `curl -x http://127.0.0.1:2689 http://example.com` (will pass through)

### No Proxy Logs Appearing

**Problem**: Proxy server starts successfully but no "proxy request" logs appear when browsing.

**Causes**:
1. Browser extension not configured correctly (see above)
2. The website you're visiting doesn't use matching domains - only Bilibili video streams use these CDNs
3. Browser is caching DNS or using QUIC/HTTP3 which bypasses the proxy

**Solutions**:
1. Test specifically with Bilibili video playback (https://www.bilibili.com/video/*)
2. Clear browser cache and disable QUIC in browser settings
3. Check that the browser extension is active (icon should indicate proxy is enabled)

### Excessive Debug Logging

**Problem**: Console output is flooded with 10-step debug logs for every HTTP request.

**Cause**: Debug logging was added to diagnose Parse Errors and is currently always enabled.

**Solution**: To disable debug logging, edit `libs/proxy.js`:
- Comment out or remove `console.log()` statements in lines 13-44 (HTTP handler)
- Comment out or remove `console.log()` statements in lines 91-125 (HTTPS handler)
- Keep the error logging (`console.error()`) for troubleshooting

## IP Address Management

The proxy's effectiveness depends on having an up-to-date list of CDN IP addresses in `ip_list.txt`.

### Manual Update via DNS Query

Quick method using nslookup or dig:

```bash
nslookup upos-hz-mirrorakam.akamaized.net
# Or on Linux/Mac:
dig upos-hz-mirrorakam.akamaized.net
```

Copy the resulting IP addresses into `ip_list.txt` (one IP per line) and restart the proxy server.

### Using akamTester (Recommended)

The project includes `python/akamTester-master/` - a Python tool for discovering and testing Akamai CDN IPs.

**akamTester v6.0** by @Miyouzi and @oldip:
- Discovers IPs for Akamai CDN domains using global DNS queries
- Tests HTTPS connection latency to find optimal nodes
- Generates hosts file entries for manual configuration
- More comprehensive than simple DNS queries

**Usage**:

1. **Install dependencies**:
   ```bash
   cd python/akamTester-master
   pip install -r requirements.txt
   ```

2. **Run with default domains**:
   ```bash
   python akamTester.py
   ```

3. **Run with custom domains**:
   ```bash
   python akamTester.py -u upos-hz-mirrorakam.akamaized.net
   ```

4. **Update ip_list.txt**:
   - Copy all IP addresses shown in the results
   - Or read from generated `upos-hz-mirrorakam.akamaized.net_iplist.txt`
   - Paste IPs into root `ip_list.txt` (one per line)
   - Remove duplicates if needed
   - Save the file

5. **Restart proxy**:
   ```bash
   npm start
   ```
   The proxy will automatically test all IPs and select the best one.

**Note**: akamTester may show occasional timeout errors for viewdns.info. This is a non-critical network/external service issue. The script handles this gracefully and still discovers plenty of IPs from other sources (4 other web sources + 15 public DNS servers).

## Automated IP Discovery (akamTester Integration)

**NEW FEATURE**: The proxy now supports fully automated IP discovery! No more manual copy-paste of IP addresses.

### Overview

The akamTester integration automatically:
- Runs akamTester.py periodically (default: every 15 minutes)
- Discovers new CDN IPs from global DNS sources
- Merges discoveries with existing IPs (deduplication)
- Tests all IPs with tcp-ping and selects the best one
- Removes dead IPs automatically after 5 consecutive failures
- Saves updated IP list to `ip_list.txt`

**Architecture**: Uses akamTester for **IP discovery** (comprehensive but slow) and tcp-ping for **IP selection** (fast and responsive to current network conditions).

### Quick Start

1. **Install Python dependencies**:
   ```bash
   cd python/akamTester-master
   pip install -r requirements.txt
   cd ../..
   ```

2. **Enable in config.json5**:
   ```json5
   {
       akamTester: {
           enabled: true,        // Enable automatic discovery
           interval: 900,        // Run every 15 minutes
           pythonPath: 'python', // Adjust if needed
           // ... other settings use defaults
       }
   }
   ```

3. **Start the proxy**:
   ```bash
   npm start
   ```

4. **Verify it's working**:
   - Look for "akamTester Integration ENABLED" in startup logs
   - After 30 seconds, you'll see "Running akamTester to discover new IPs"
   - Watch for "IP list updated" and "Saved updated IP list to ip_list.txt"

### How It Works

**Startup Flow**:
1. Server loads existing `ip_list.txt`
2. Tests all IPs with tcp-ping
3. Selects best server and starts proxy
4. **After 30 seconds**, runs first akamTester discovery (background)
5. **Every 15 minutes** (configurable), runs akamTester again

**Discovery Cycle**:
1. akamTester queries global DNS sources (2-5 minutes)
2. New IPs are merged with existing list (Set deduplication)
3. Updated list saved to `ip_list.txt` (if `saveToFile: true`)
4. All IPs re-tested with tcp-ping (~10 seconds)
5. Best server selected and proxy updated (no restart needed!)

**Dead IP Removal**:
- Every time `refreshBest()` runs (every hour by default)
- IPs that fail tcp-ping get failure count incremented
- IPs that succeed get failure count reset to 0
- After 5 consecutive failures, IP is removed from list
- Updated list saved to `ip_list.txt`

### Configuration Options

**File**: `config.json5` → `akamTester` section

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | `false` | Enable/disable automatic IP discovery |
| `interval` | `900` | How often to run akamTester (seconds). Recommended: 900 (15min), 1800 (30min), 3600 (1hr) |
| `pythonPath` | `'python'` | Path to Python executable. Windows: `'python'` or `'C:\\Python312\\python.exe'`. Linux/Mac: `'python3'` or `'/usr/bin/python3'` |
| `scriptPath` | `'python/akamTester-master/akamTester.py'` | Path to akamTester.py (relative to project root) |
| `targetHosts` | `['upos-hz-mirrorakam.akamaized.net']` | Array of CDN domains to discover IPs for |
| `saveToFile` | `true` | Save updated IP list to `ip_list.txt` (persists across restarts) |
| `timeout` | `600000` | Max execution time for akamTester in milliseconds (10 minutes) |
| `maxIps` | `200` | Maximum IPs to keep in pool (prevents unlimited growth) |

**Example Configuration**:

```json5
{
    host: 'upos-hz-mirrorakam.akamaized.net',
    port: 2689,
    refreshInterval: 3600,

    akamTester: {
        enabled: true,           // Turn on automatic discovery
        interval: 900,           // Run every 15 minutes
        pythonPath: 'python3',   // Linux/Mac users might need this
        scriptPath: 'python/akamTester-master/akamTester.py',
        targetHosts: ['upos-hz-mirrorakam.akamaized.net'],
        saveToFile: true,        // Persist discoveries
        timeout: 600000,         // 10 minute timeout
        maxIps: 200              // Keep best 200 IPs
    }
}
```

### Troubleshooting

#### Problem: "Python executable not found"

**Cause**: Python is not installed or `pythonPath` is incorrect.

**Solution**:
1. Install Python 3: https://www.python.org/downloads/
2. Or update `pythonPath` in `config.json5`:
   ```json5
   pythonPath: 'C:\\Python312\\python.exe'  // Windows full path
   pythonPath: '/usr/bin/python3'            // Linux/Mac full path
   ```

#### Problem: "akamTester execution failed"

**Cause**: Python dependencies not installed or script error.

**Solution**:
1. Run manually to diagnose:
   ```bash
   cd python/akamTester-master
   python akamTester.py -u upos-hz-mirrorakam.akamaized.net
   ```
2. Install missing dependencies:
   ```bash
   pip install -r requirements.txt
   ```

#### Problem: IP list not updating

**Cause**: Various - check logs for specific error.

**Solutions**:
- Verify Python is working: `python --version`
- Check akamTester runs manually: `cd python/akamTester-master && python akamTester.py`
- Look for error messages in server logs
- Verify `saveToFile: true` in config
- Check file permissions on `ip_list.txt`

#### Problem: "akamTester timeout"

**Cause**: akamTester taking longer than `timeout` setting (usually due to slow DNS sources).

**Solutions**:
- Increase timeout in config: `timeout: 900000` (15 minutes)
- This is usually not a problem - server continues with existing IPs

#### Problem: "akamTester is already running, skipping this interval"

**Cause**: Previous akamTester run is still executing when next interval triggers.

**Solution**: This is normal behavior (mutex protection). Either:
- Increase `interval` to give more time: `interval: 1800` (30 minutes)
- Decrease `timeout` to kill slow runs faster (not recommended)

#### Problem: Too many/few IPs in list

**Cause**: `maxIps` setting and dead IP removal logic.

**Solutions**:
- Adjust `maxIps` in config: `maxIps: 300` for more IPs
- Dead IPs are automatically removed after 5 failures
- Manually edit `ip_list.txt` to remove unwanted IPs

### Graceful Degradation

The akamTester integration is designed to **never break your proxy**:

✅ If Python is not installed → Warning logged, proxy continues with existing IPs
✅ If akamTester fails → Error logged, proxy continues with existing IPs
✅ If timeout occurs → Process killed, proxy continues with existing IPs
✅ If feature is disabled → Proxy works exactly as before

**The proxy will always work**, even if akamTester is completely broken!

### Performance Impact

- **Startup**: No impact (akamTester runs 30 seconds after startup)
- **During discovery**: No impact (runs asynchronously in background)
- **During re-testing**: Brief CPU spike for tcp-ping (~10 seconds every 15 minutes)
- **Memory**: Negligible (~1-2 KB per IP, max 200 IPs = ~400 KB)

### Logs to Expect

**When enabled at startup**:
```
╔══════════════════════════════════════════════════════════════╗
║  akamTester Integration ENABLED                              ║
╚══════════════════════════════════════════════════════════════╝
Discovery interval: 900s (15 minutes)
Python path: python
Target hosts: upos-hz-mirrorakam.akamaized.net
Max IPs: 200

First akamTester run scheduled in 30 seconds...
Subsequent runs every 15 minutes
```

**During discovery**:
```
╔══════════════════════════════════════════════════════════════╗
║  Running akamTester to discover new IPs                      ║
╚══════════════════════════════════════════════════════════════╝
Current IP list size: 77
Executing akamTester.py...
Running: python python/akamTester-master/akamTester.py -u upos-hz-mirrorakam.akamaized.net
[akamTester] 当前 akamTester 版本: 6.0
[akamTester] 当前测试域名：upos-hz-mirrorakam.akamaized.net
...
akamTester discovered 48 IPs (12 new, 36 already known)
IP list updated: 77 → 89 IPs
✓ Saved updated IP list to ip_list.txt
Re-testing all IPs with tcp-ping to find the best server...
Pinging ipList
The best server is 2.16.11.163 which delay is 88.2417ms

╔══════════════════════════════════════════════════════════════╗
║  IP refresh cycle completed                                  ║
╚══════════════════════════════════════════════════════════════╝
```

**When dead IPs are removed**:
```
Removing 3 dead IP(s) (failed 5+ times consecutively):
  - Removed: 23.45.67.89
  - Removed: 98.76.54.32
  - Removed: 12.34.56.78
✓ Updated ip_list.txt (now 86 IPs)
```

### Comparison: Manual vs Automated

| Aspect | Manual (akamTester CLI) | Automated (Integration) |
|--------|------------------------|-------------------------|
| Setup | Run script, copy IPs, paste, restart | Enable in config, done! |
| Frequency | Whenever you remember | Every 15 minutes automatically |
| Server restart needed | Yes | No |
| Effort | High (manual each time) | Zero (fully automatic) |
| Dead IP removal | Manual | Automatic after 5 failures |
| Best for | One-time setup | Production / long-running |

**Recommendation**: Use automated integration for production. Use manual method for testing or if you don't have Python installed.

## Code History and Bug Fixes

This codebase has undergone significant debugging and improvements. The following issues were identified and fixed:

### Major Fixes Applied

1. **chinazPing Removal** (November 2025)
   - Removed unreliable chinaz.com scraping functionality
   - chinaz.com changed to dynamic JavaScript with encrypted tokens, making scraping impossible
   - Simplified codebase and improved startup performance
   - Users now update IPs manually via nslookup or akamTester

2. **Parse Error Fix** (November 2025)
   - Fixed URL object incompatibility in proxy.js
   - `new URL()` returns URL objects, but proxyMap expected plain objects
   - Added conversion step: URL object → plain `{hostname, port}` object
   - All HTTP/HTTPS proxy requests now work correctly

3. **Variable Scope Fix** (November 2025)
   - Fixed critical bug where `options`, `hostname`, `port` were declared inside try blocks
   - Variables were undefined when used outside try blocks
   - Moved declarations outside try blocks to proper scope
   - Eliminated intermittent Parse Errors

4. **Deprecated url.parse() Replacement** (January 2025)
   - Replaced deprecated `url.parse()` with WHATWG URL API (`new URL()`)
   - Eliminated deprecation warnings
   - Improved security and future-proofing

5. **Error Handling Improvements** (January 2025)
   - Distinguished expected disconnects (ECONNABORTED, ECONNRESET) from real errors
   - Added socket.destroyed checks before cleanup
   - Cleaner, less scary error logs

6. **Debug Logging Added** (November 2025)
   - Comprehensive 10-step debug logging for HTTP requests
   - 8-step debug logging for HTTPS CONNECT requests
   - Enhanced clientError handler with rawPacket hex dump
   - Makes future Parse Error debugging much easier

### Current Status

✅ **Parse Error completely fixed** (variable scope + URL object handling)
✅ **Comprehensive debug logging** for future troubleshooting
✅ **No chinaz-related errors** or warnings
✅ **Faster server selection** (88ms vs previous 181ms)
✅ **Cleaner startup output**
✅ **Simpler, more maintainable codebase**
✅ **Clear manual IP update instructions** via nslookup or akamTester
✅ **Python akamTester tool integrated** for advanced IP discovery

The proxy is now fully functional, production-ready, and optimized for Bilibili's Akamai CDN with comprehensive debugging capabilities.

## Testing and Test Coverage

The project includes a comprehensive test suite with unit tests for all critical modules.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/unit/ip-pool.test.js
```

### Test Coverage Summary

Current test coverage (as of v2.0.0):

| Module | Statements | Branches | Functions | Lines | Status |
|--------|------------|----------|-----------|-------|--------|
| **ip-pool.js** | 100% | 88.88% | 100% | 100% | ✅ Full Coverage |
| **tester.js** | 91.17% | 69.56% | 80.95% | 90.32% | ✅ Excellent |
| **mapper.js** | 100% | 100% | 100% | 100% | ✅ Full Coverage |
| **logger.js** | 100% | 100% | 100% | 100% | ✅ Full Coverage |
| **validators.js** | 71.42% | 70.51% | 100% | 69.49% | ✅ Good |
| **Overall** | 35.56% | 41.37% | 46.46% | 34.11% | ✅ Meets Thresholds |

**Coverage Thresholds** (enforced by Jest):
- Statements: 30% (current: 35.56%) ✅
- Branches: 35% (current: 41.37%) ✅
- Functions: 40% (current: 46.46%) ✅
- Lines: 30% (current: 34.11%) ✅

### Test Files Structure

```
tests/
├── unit/
│   ├── ip-pool.test.js      (26 tests) - IP management, dedup, dead IP removal
│   ├── tester.test.js       (14 tests) - Dual-layer latency testing, packet loss
│   ├── mapper.test.js       (7 tests)  - Domain mapping and proxy logic
│   ├── validators.test.js   (13 tests) - Config validation and IP format checking
│   ├── logger.test.js       (5 tests)  - Logging utilities
│   └── index.test.js        (7 tests)  - Entry point and dependencies
└── integration/
    └── (placeholder for future e2e tests)
```

**Total: 71+ test cases**

### What's Tested

✅ **IP Pool Management** (ip-pool.test.js):
- Loading/saving IP lists from files
- Dead IP tracking and removal (after 5 failures)
- IP deduplication and merging
- Handling different line endings (Unix, Windows, Mac)
- IPv6 filtering

✅ **Enhanced IP Testing** (tester.test.js):
- Dual-layer testing (TCP + HTTP/HTTPS)
- Packet loss calculation
- Jitter measurement (latency variance)
- Comprehensive metrics structure
- Weighted scoring algorithm (40% TCP + 60% HTTP)
- Backward compatibility with legacy fields

✅ **Domain Mapping** (mapper.test.js):
- Exact domain matching (upos-hz-mirrorakam.akamaized.net)
- Subdomain matching (*.bilivideo.com, *.akamaized.net)
- Pass-through for unrelated domains
- Port preservation

✅ **Configuration Validation** (validators.test.js):
- Config schema validation
- Port range checking (1-65535)
- Refresh interval limits
- IPv4 address format validation
- akamTester configuration validation

✅ **Utilities** (logger.test.js, index.test.js):
- Logging functions (log, error, warn, box)
- Entry point dependencies
- Config file existence and readability

### What's NOT Tested (Integration-Heavy)

❌ **Proxy Server** (src/proxy/server.js): Requires full HTTP/HTTPS server integration
❌ **Core Server** (src/core/server.js): Application lifecycle and timer management
❌ **akamTester Runner** (src/ip-management/akam-runner.js): Python subprocess integration

These modules are integration-heavy and difficult to unit test without extensive mocking. They are best tested manually or with end-to-end integration tests.

### CI/CD Integration

The project includes GitHub Actions workflow (`.github/workflows/test.yml`) that:
- Runs tests on Node.js 18, 20, 22
- Generates coverage reports
- Uploads coverage to Codecov
- Fails if coverage thresholds are not met

### Adding New Tests

When adding new functionality:

1. **Write tests first** (TDD approach recommended)
2. **Run tests locally**: `npm test`
3. **Check coverage**: `npm run test:coverage`
4. **Ensure thresholds are met** before committing
5. **Update this documentation** if coverage significantly improves

## Future Development

From README.md:
- **Automate `ip_list.txt` updates**: Integrate the `akamTester` Python script's results directly into the Node.js application. This would eliminate the manual copy-paste step and could involve:
  - Having the Node.js server periodically execute the Python script to refresh the IP list
  - Automatically reading the output file (`upos-hz-mirrorakam.akamaized.net_iplist.txt`) generated by the Python script
  - Reloading the IP list in the running proxy without requiring a server restart
