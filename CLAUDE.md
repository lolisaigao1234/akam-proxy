# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

akam-proxy is a Node.js proxy server that automatically selects the optimal CDN node for Bilibili's overseas CDN (upos-hz-mirrorakam.akamaized.net) by testing latency and choosing the lowest-delay server. It supports automatic updates of available IP nodes.

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
- Configuration file: `config.json5` (JSON5 format)
- IP list cache: `ip_list.txt` (local cache of available IP addresses)
- The proxy will automatically start testing IPs and refreshing the optimal server selection

## Architecture

### Core Components

**Entry Point: `index.js`**
- Loads configuration from `config.json5` using JSON5
- Reads IP list from `ip_list.txt`
- Manages two periodic tasks:
  - `refreshBest()`: Re-tests existing IPs to find the best server (every `refreshInterval` seconds, default 3600s)
  - `refreshIpList()`: Fetches new IPs from chinaz.com and updates the IP list (every `refreshIpList.interval` seconds, default 86400s)
- Maintains a `best` object containing the current optimal server's host, average latency, and original host
- Starts the proxy server via `proxy(best, config.port)`

**Proxy Server: `libs/proxy.js`**
- Creates HTTP/HTTPS proxy server using Node.js `http` and `net` modules
- Handles HTTP requests via `httpOptions()` function
- Handles HTTPS CONNECT requests via `connect` event listener
- Uses `proxy-map.js` to map requests from `originalHost` to the optimal `host`
- Pipes client requests to destination servers and returns responses

**Host Mapping: `libs/proxy-map.js`**
- Maps incoming requests for `mapper.originalHost` to `mapper.host` (the optimal IP)
- Logs proxy mappings when hostname is changed
- Returns modified `{ hostname, port }` for connection

**Server Testing: `utils/getGoodServer.js`**
- Tests latency of IP list using `tcp-ping` library
- Pings each IP 3 times with 3 second timeout
- Filters out dead IPs and sorts by average latency
- Returns array of alive servers sorted by best latency

**IP Discovery: `utils/chinazPing.js`**
- Scrapes chinaz.com ping service to discover new IP addresses for a given host
- Extracts `enkey` from HTML and iterates through all chinaz test servers
- Uses async retry logic to poll chinaz API until results are ready
- Extracts and returns list of discovered IP addresses
- **Note**: The function expects `options.retryTime` and `options.waittingInterval` but `index.js` passes `times` and `interval`, causing a parameter mismatch bug (see Troubleshooting section)

### Data Flow

1. On startup: Load IP list → Test all IPs → Select best server → Start proxy
2. Proxy request: Client request → Check if hostname matches `originalHost` → Replace with optimal IP → Forward request
3. Periodic refresh (every hour): Re-test existing IPs → Update best server
4. Daily IP update: Fetch new IPs from chinaz → Merge with existing list → Save to `ip_list.txt` → Re-test all IPs

### Configuration Structure

The `config.json5` file contains:
- `host`: Target CDN hostname to optimize (default: 'upos-hz-mirrorakam.akamaized.net')
- `port`: Local proxy server port (default: 2689)
- `refreshInterval`: How often to re-test IPs in seconds
- `refreshIpList.interval`: How often to fetch new IPs from chinaz in seconds
- `refreshIpList.retry.times`: Number of retry attempts for chinaz API
- `refreshIpList.retry.interval`: Interval between chinaz retries in milliseconds
- `saveChinazResult`: Whether to persist newly discovered IPs to `ip_list.txt`

## Important Notes

- **Selective Proxy Behavior**: This is NOT a general-purpose HTTP proxy. It ONLY intercepts and redirects requests to `config.host` (default: upos-hz-mirrorakam.akamaized.net). All other requests pass through unchanged. This is a critical distinction - the proxy acts as a pass-through for everything except the specific CDN domain being optimized.
- The proxy modifies the destination hostname while preserving all other request parameters
- IPv6 addresses are filtered out (only IPv4 supported)
- The `best` object is passed by reference to the proxy, so updates to the optimal server take effect immediately without restarting the proxy
- Error handling: If chinazPing fails, the system falls back to refreshing the existing IP list rather than crashing

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

**Root Cause Understanding**: This proxy is designed SPECIFICALLY for Bilibili's CDN domain (`upos-hz-mirrorakam.akamaized.net`). It will not optimize or affect traffic to other domains. The proxy passes through all non-matching requests unchanged.

**Proper Configuration**:

1. **For SwitchyOmega/ZeroOmega - Use Selective Proxy Mode**:
   - Create a new proxy profile with server `127.0.0.1` and port `2689` (HTTP proxy)
   - In "Switch Rules" or "Auto Switch" mode, add a rule:
     - Condition Type: Host wildcard
     - Pattern: `*.akamaized.net` or specifically `upos-hz-mirrorakam.akamaized.net`
     - Profile: Your proxy profile
   - This ensures only Bilibili CDN requests go through the proxy

2. **Do NOT use "Proxy all requests" mode** unless you understand that only `upos-hz-mirrorakam.akamaized.net` will be optimized while other requests pass through normally.

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
2. The website you're visiting doesn't use `upos-hz-mirrorakam.akamaized.net` - only Bilibili video streams use this CDN
3. Browser is caching DNS or using QUIC/HTTP3 which bypasses the proxy

**Solutions**:
1. Test specifically with Bilibili video playback (https://www.bilibili.com/video/*)
2. Clear browser cache and disable QUIC in browser settings
3. Check that the browser extension is active (icon should indicate proxy is enabled)

### Parameter Mismatch Bug in Code

**Critical Bug**: There is a parameter mismatch between `index.js:28` and `utils/chinazPing.js:23` that prevents retry configuration from working correctly:

**What's passed in index.js:28**:
```javascript
chinazPing(config.host, {times: config.refreshIpList.retry.time, interval: config.refreshIpList.retry.interval})
```

**What chinazPing expects in chinazPing.js:23**:
```javascript
{ times: options.retryTime, interval: options.waittingInterval }
```

**The bugs**:
1. `index.js` passes `times` but `chinazPing` expects `retryTime`
2. `index.js` passes `interval` but `chinazPing` expects `waittingInterval` (note typo with double 't')
3. `index.js` reads `config.refreshIpList.retry.time` (singular) but `config.json5` defines `retry.times` (plural)

**Impact**: The retry logic in chinazPing receives `undefined` for both parameters, so it falls back to `async.retry` defaults instead of using the configured values from `config.json5`.

**To fix this bug**:
- Either update `index.js:28` to pass `{retryTime: config.refreshIpList.retry.times, waittingInterval: config.refreshIpList.retry.interval}`
- Or update `chinazPing.js:23` to use `{times: options.times, interval: options.interval}`
- Also fix `config.refreshIpList.retry.time` to `config.refreshIpList.retry.times` in index.js:28
