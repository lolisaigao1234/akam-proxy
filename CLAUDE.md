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
- Includes browser-like headers to bypass WAF/anti-bot protection (Bug 1 fix applied)
- Extracts `enkey` from HTML and iterates through all chinaz test servers
- Uses async retry logic to poll chinaz API until results are ready
- Extracts and returns list of discovered IP addresses
- **Note**: The function expects `options.retryTime` and `options.waittingInterval` (note typo) parameters. Bug 2 fix ensures these are properly passed from `index.js:28`

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

## Bug Fixes Applied

The following bugs have been identified and fixed in this codebase:

**Summary of Changes**:
- `index.js:28` - Fixed parameter names and config property reference
- `utils/chinazPing.js:9-13, 29-34` - Added browser headers to bypass 403 errors
- `utils/chinazPing.js:6-40` - Added chinaz.com structure change detection and warnings
- `libs/proxy.js:10-12` - Fixed missing mapper parameter (Bug 4)
- `libs/proxy.js:10, 49` - Replaced deprecated url.parse() with new URL API (Bug 5)
- `libs/proxy.js:31-45, 63-83` - Improved error handling for connection errors

### Bug 1: chinaz.com Returns 403 Forbidden (FIXED ✓)

**Symptom**: `get chinaz results error: Error: Forbidden` with status 403

**Location**: `utils/chinazPing.js:9-13` and `utils/chinazPing.js:29-34`

**Root Cause**:
- The superagent requests to chinaz.com lack browser headers
- chinaz.com's WAF/anti-bot protection blocks requests without proper User-Agent, Referer, and Accept headers
- Both the initial GET request (line 9) and subsequent POST requests (line 25) are blocked

**Impact**:
- IP discovery from chinaz.com failed completely
- System fell back to existing `ip_list.txt` (proxy still worked with cached IPs)
- No new IP addresses could be discovered
- Daily IP refresh functionality was broken

**Fix Applied**: Added browser-like headers to both requests:

```javascript
// Line 9 - Initial GET request
request.get('https://ping.chinaz.com/' + host)
    .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    .set('Referer', 'https://ping.chinaz.com/')
    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
    .set('Accept-Language', 'en-US,en;q=0.9')
    .then(res => {

// Line 25 - POST requests for ping results
request.post('https://ping.chinaz.com/iframe.ashx?t=ping')
    .type('form')
    .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    .set('Referer', 'https://ping.chinaz.com/' + host)
    .set('Accept', '*/*')
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({
```

### Bug 2: Parameter Mismatch Prevents Config from Working (FIXED ✓)

**Symptom**: chinazPing retry configuration from `config.json5` was ignored

**Location**: `index.js:28` calling `utils/chinazPing.js:27`

**Root Cause**: Three separate parameter mismatches:

1. **Parameter name mismatch #1**:
   - `index.js:28` passes: `times: ...`
   - `chinazPing.js:23` expects: `retryTime: ...`

2. **Parameter name mismatch #2**:
   - `index.js:28` passes: `interval: ...`
   - `chinazPing.js:23` expects: `waittingInterval: ...` (note typo with double 't')

3. **Config property typo**:
   - `index.js:28` reads: `config.refreshIpList.retry.time` (singular)
   - `config.json5` defines: `retry.times` (plural)

**Current code in index.js:28**:
```javascript
chinazPing(config.host, {times: config.refreshIpList.retry.time, interval: config.refreshIpList.retry.interval})
```

**What chinazPing.js:23 expects**:
```javascript
retry({ times: options.retryTime, interval: options.waittingInterval }, ...)
```

**Impact**:
- chinazPing received `undefined` for both retry parameters
- Fell back to `async.retry` defaults (5 attempts, immediate retry)
- User's configured values (50 attempts, 10s interval) were completely ignored

**Fix Applied** (Option A - Fixed caller in `index.js:28`):
```javascript
chinazPing(config.host, {
    retryTime: config.refreshIpList.retry.times,  // Fixed: times (plural) and retryTime
    waittingInterval: config.refreshIpList.retry.interval  // Fixed: waittingInterval
})
```

This fix was chosen because it's less invasive (1 line change vs function signature change) and preserves existing parameter names in chinazPing.

### Bug 3: ECONNABORTED Socket Errors (FIXED ✓)

**Symptom**: `client socket error: Error: write ECONNABORTED` appeared in logs cluttering output

**Location**: `libs/proxy.js:31-45` and `libs/proxy.js:63-83`

**Root Cause**:
- Occurs when browser/client disconnects before proxy completes the request
- Common in normal proxy operation:
  - User navigates away from page
  - Browser cancels duplicate requests
  - Client-side network timeout
- Error handlers attempt operations on already-destroyed sockets

**Impact**:
- Cosmetic issue - cluttered logs with scary-looking but harmless errors
- Did NOT crash the server (properly caught by error handlers)
- Did NOT affect successful requests
- Proxy continued working normally but logs were confusing

**Fix Applied** (Improved error handling with better logging):

Applied to both HTTP (lines 31-45) and HTTPS (lines 63-83) error handlers:

```javascript
clientSocket.on('error', (e) => {
  if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET') {
    console.log("client disconnected: " + e.message);
  } else {
    console.log("client socket error: " + e);
  }
  if (serverSocket && !serverSocket.destroyed) {
    serverSocket.destroy();
  }
});

serverSocket.on('error', (e) => {
  if (e.code === 'ECONNABORTED' || e.code === 'ECONNRESET') {
    console.log("server disconnected: " + e.message);
  } else {
    console.log("forward proxy server connection error: " + e);
  }
  if (clientSocket && !clientSocket.destroyed) {
    clientSocket.destroy();
  }
});
```

This fix:
- Distinguishes expected disconnects from real errors
- Checks if sockets are destroyed before cleanup
- Uses `.destroy()` instead of `.end()` for proper cleanup
- Provides clearer log messages for debugging

### Bug 4: Parse Error - Invalid Method (FIXED ✓)

**Symptom**: `client error: Error: Parse Error: Invalid method encountered` - All HTTP proxy requests failed

**Location**: `libs/proxy.js:12`

**Root Cause**:
- HTTP proxy handler was missing the `mapper` parameter when calling `proxyMap()`
- Line 12: `const { hostname, port } = proxyMap(reqUrl)` (missing mapper)
- Compare with HTTPS handler line 51: `const { hostname, port } = proxyMap(mapper, reqUrl)` ✓ Correct
- Without the mapper parameter, proxyMap received incorrect arguments and returned malformed data
- This caused the HTTP request to be constructed with invalid parameters
- Result: All HTTP requests failed with "Parse Error: Invalid method"

**Impact**:
- All HTTP (non-HTTPS) proxy requests failed completely
- Any website using HTTP was inaccessible through the proxy
- HTTPS requests worked fine (they had the correct mapper parameter)

**Fix Applied**:
```javascript
// Line 12 - Changed from:
const { hostname, port } = proxyMap(reqUrl)

// To:
const { hostname, port } = proxyMap(mapper, reqUrl)
```

### Bug 5: Deprecated url.parse() Warnings (FIXED ✓)

**Symptom**:
```
(node:xxxx) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized
and prone to errors that have security implications. Use the WHATWG URL API instead.
```

**Location**: `libs/proxy.js:10` and `libs/proxy.js:49`

**Root Cause**:
- The code used Node.js's deprecated `url.parse()` method
- This method has security implications and will be removed in future Node.js versions
- Modern code should use the WHATWG URL API (`new URL()`)

**Impact**:
- Warning messages cluttered logs
- Code will break in future Node.js versions
- Potential security vulnerabilities from non-standard URL parsing

**Fix Applied**:

Removed the url module import and replaced all uses:

```javascript
// Removed:
var url = require('url');

// HTTP handler - Line 10
// Changed from:
var reqUrl = url.parse(clientReq.url);

// To:
var reqUrl = new URL(clientReq.url);

// Also updated path construction on line 17:
// Changed from:
path: reqUrl.path,

// To:
path: reqUrl.pathname + reqUrl.search,

// HTTPS handler - Line 49
// Changed from:
var reqUrl = url.parse('https://' + clientReq.url);

// To:
var reqUrl = new URL('https://' + clientReq.url);
```

**Key Differences**:
- `url.parse().path` → `new URL().pathname + new URL().search`
- `new URL()` returns a proper URL object with standardized behavior
- No more deprecation warnings

### Bug 6: chinaz.com HTML Structure Changed (DOCUMENTED)

**Symptom**: `chinaz servers count: 0` - No IPs discovered from chinaz.com

**Location**: `utils/chinazPing.js:27`

**Root Cause**:
- chinaz.com changed from static HTML to dynamic JavaScript in 2025
- Old selector `$('#speedlist .listw')` no longer finds server list
- The page now uses:
  - Encrypted tokens for authentication
  - Dynamic JavaScript to load content
  - Hidden API endpoints (not easily accessible)
- Scraping approach no longer works reliably

**Impact**:
- IP discovery from chinaz.com returns 0 new IPs
- Proxy still works perfectly with cached `ip_list.txt`
- Users cannot automatically discover new CDN IPs

**Fix Applied** (Option A + C: Graceful degradation with clear messaging):

Added comprehensive error detection and user guidance:

```javascript
/**
 * Attempts to discover IP addresses by scraping chinaz.com ping service
 *
 * NOTE: As of 2025, chinaz.com changed from static HTML to dynamic JavaScript
 * with encrypted tokens. The old selector-based approach may not work anymore.
 * If this returns empty results, manually update ip_list.txt with IPs from:
 * - DNS queries: nslookup or dig commands
 * - Alternative tools: https://tool.chinaz.com/speedworld/
 *
 * The proxy will continue to work with the existing ip_list.txt file.
 */

// Check if chinaz.com structure changed
if (serverList.length === 0) {
    console.warn('WARNING: chinaz.com HTML structure may have changed')
    console.warn('No server list found with selector "#speedlist .listw"')
    console.warn('IP discovery disabled. Using existing ip_list.txt')
    console.warn('To manually update IPs, use: nslookup ' + host)
    // Return empty array to fall back to existing IP list
    resolve([])
    return
}
```

**Manual IP Discovery Instructions**:

Users can manually update `ip_list.txt` using these methods:

1. **DNS Query** (recommended):
   ```bash
   nslookup upos-hz-mirrorakam.akamaized.net
   # Or on Linux/Mac:
   dig upos-hz-mirrorakam.akamaized.net
   ```

2. **Alternative tools**:
   - Visit https://tool.chinaz.com/speedworld/ for traceroute results
   - Use online ping/IP lookup services
   - Check CDN provider documentation

3. **Update ip_list.txt**:
   - Add discovered IPs (one per line)
   - Remove old/dead IPs
   - Restart the proxy

The proxy will automatically test all IPs and select the best one.

## Testing Results

After applying all six bug fixes:

**Fixes 1-3 (Initial Round)**:
1. ✓ **Server starts successfully** - No EADDRINUSE errors (as long as port is free)
2. ✓ **No 403 Forbidden errors** - chinaz.com requests succeed with proper headers
3. ✓ **Retry configuration works** - Config values from `config.json5` are properly used
4. ✓ **Cleaner error logs** - Expected disconnects are logged differently from real errors

**Fixes 4-6 (Second Round)**:
5. ✓ **HTTP proxy works** - No "Parse Error: Invalid method" errors
6. ✓ **No deprecation warnings** - Replaced url.parse() with new URL API
7. ✓ **Clear chinaz warnings** - Users informed when IP discovery doesn't work
8. ✓ **Graceful fallback** - Proxy uses existing ip_list.txt when chinaz.com fails
9. ✓ **Proxy functions correctly** - Successfully proxies both HTTP and HTTPS traffic

**Current Behavior**:
```
forward proxy server started, listening on port 2689
chinaz servers count: 0
WARNING: chinaz.com HTML structure may have changed
No server list found with selector "#speedlist .listw"
IP discovery disabled. Using existing ip_list.txt
To manually update IPs, use: nslookup upos-hz-mirrorakam.akamaized.net
available servers count: 75
Pinging ipList
save chinaz results successfully
The best server is 67.69.196.154 which delay is 16.618ms
```

The proxy is fully functional and selects the optimal server from the cached IP list.
