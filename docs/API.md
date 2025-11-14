# API Reference

Code documentation for akam-proxy modules and functions.

## Table of Contents

- [Core Modules](#core-modules)
- [Proxy Modules](#proxy-modules)
- [IP Management Modules](#ip-management-modules)
- [Utility Modules](#utility-modules)
- [Data Structures](#data-structures)

## Core Modules

### src/core/server.js

Main application lifecycle manager.

#### Class: Server

**Constructor**
```javascript
new Server(config)
```
- **Parameters**:
  - `config` (Object) - Configuration object from config.json5
- **Returns**: Server instance

**Methods**

**`async start()`**

Initialize and start all services.

```javascript
await server.start()
```

- **Returns**: Promise<void>
- **Actions**:
  - Loads IP list
  - Tests IPs and selects best
  - Starts proxy server
  - Schedules periodic tasks

**`initAkamTester()`**

Initialize akamTester integration if enabled.

```javascript
server.initAkamTester()
```

- **Returns**: void
- **Side effects**: Creates AkamRunner instance, logs configuration

**`startPeriodicRefresh()`**

Schedule periodic IP refresh using tcp-ping.

```javascript
server.startPeriodicRefresh()
```

- **Returns**: void
- **Interval**: Every `config.refreshInterval` seconds

**`startPeriodicDiscovery()`**

Schedule periodic IP discovery with akamTester.

```javascript
server.startPeriodicDiscovery()
```

- **Returns**: void
- **Interval**: Every `config.akamTester.interval` seconds
- **First run**: After 30 seconds delay

**`async runDiscovery()`**

Execute one IP discovery cycle.

```javascript
await server.runDiscovery()
```

- **Returns**: Promise<void>
- **Actions**:
  - Runs akamTester
  - Merges new IPs
  - Re-tests all IPs
  - Updates best server

**`stop()`**

Stop all timers and cleanup.

```javascript
server.stop()
```

- **Returns**: void
- **Actions**: Clears all intervals

## Proxy Modules

### src/proxy/server.js

HTTP/HTTPS proxy server implementation.

#### Function: proxy

**Signature**
```javascript
proxy(mapper, serverPort)
```

- **Parameters**:
  - `mapper` (Object) - Best server object { host, avg, originalHost }
  - `serverPort` (Number) - Port to listen on
- **Returns**: http.Server instance

**Behavior**:
- Creates HTTP server with CONNECT handler
- Proxies HTTP requests
- Tunnels HTTPS CONNECT requests
- Logs all proxy operations
- Handles errors gracefully

**HTTP Request Handler**:
```javascript
function httpOptions(clientReq, clientRes)
```
- Parses request URL
- Maps hostname via proxyMap
- Forwards to destination
- Streams response back

**HTTPS CONNECT Handler**:
```javascript
server.on('connect', (req, clientSocket, head) => {...})
```
- Parses CONNECT request
- Maps hostname via proxyMap
- Creates tunnel to destination
- Pipes data bidirectionally

### src/proxy/mapper.js

Domain to IP mapping logic.

#### Function: proxyMap

**Signature**
```javascript
proxyMap(mapper, hostname, port)
```

- **Parameters**:
  - `mapper` (Object) - Best server object { host, originalHost }
  - `hostname` (String) - Target hostname
  - `port` (Number) - Target port
- **Returns**: Object `{ hostname, port }`

**Mapping Logic**:
```javascript
// Exact match
if (hostname === mapper.originalHost) {
    return { hostname: mapper.host, port }
}

// Subdomain match
if (hostname.endsWith('.bilivideo.com') ||
    hostname.endsWith('.akamaized.net')) {
    return { hostname: mapper.host, port }
}

// Pass through
return { hostname, port }
```

**Example**:
```javascript
proxyMap(
    { host: '2.16.11.163', originalHost: 'upos-hz-mirrorakam.akamaized.net' },
    'upos-hz-mirrorakam.akamaized.net',
    443
)
// Returns: { hostname: '2.16.11.163', port: 443 }
```

## IP Management Modules

### src/ip-management/tester.js

TCP ping-based IP latency testing.

#### Function: getGoodServer

**Signature**
```javascript
async getGoodServer(ipList)
```

- **Parameters**:
  - `ipList` (String[]) - Array of IP addresses
- **Returns**: Promise<Array<{ host, avg, results }>>

**Testing Parameters**:
- Port: 443 (HTTPS)
- Attempts: 3
- Timeout: 3000ms per attempt

**Return Value**:
```javascript
[
  {
    host: '2.16.11.163',
    avg: 88.24,
    results: {
      avg: 88.24,
      max: 95.3,
      min: 82.1,
      results: [...]
    }
  },
  // ... more IPs, sorted by avg (ascending)
]
```

**Filtering**:
- Dead IPs (all attempts failed) are excluded
- Sorted by average latency (lowest first)

### src/ip-management/ip-pool.js

IP list management with dead IP tracking.

#### Class: IpPool

**Constructor**
```javascript
new IpPool(ipListPath, maxFailures = 5)
```

- **Parameters**:
  - `ipListPath` (String) - Path to IP list file
  - `maxFailures` (Number) - Max consecutive failures before removal
- **Returns**: IpPool instance

**Methods**

**`loadFromFile()`**

Load IP list from file.

```javascript
const ipList = ipPool.loadFromFile()
```

- **Returns**: String[] - Array of IPs
- **Filters**: IPv6 addresses (containing ':')

**`saveToFile()`**

Save current IP list to file.

```javascript
ipPool.saveToFile()
```

- **Returns**: void
- **Format**: One IP per line

**`getIpList()`**

Get current IP list.

```javascript
const ips = ipPool.getIpList()
```

- **Returns**: String[] - Array of IPs

**`setIpList(newIpList)`**

Set IP list (for merging).

```javascript
ipPool.setIpList(['2.16.11.163', '23.45.67.89'])
```

- **Parameters**:
  - `newIpList` (String[]) - New IP array
- **Returns**: void

**`getBest()`**

Get best server object.

```javascript
const best = ipPool.getBest()
// { host: '2.16.11.163', avg: 88.24, originalHost: '...' }
```

- **Returns**: Object - Best server info

**`async refreshBest()`**

Test all IPs and update best server.

```javascript
await ipPool.refreshBest()
```

- **Returns**: Promise<void>
- **Actions**:
  - Tests all IPs
  - Updates failure counts
  - Removes dead IPs (5+ failures)
  - Selects best server

**`removeDeadIps(deadIps)`**

Remove IPs from pool.

```javascript
ipPool.removeDeadIps(['23.45.67.89', '98.76.54.32'])
```

- **Parameters**:
  - `deadIps` (String[]) - IPs to remove
- **Returns**: void

**`mergeNewIps(newIps, maxIps = 200)`**

Merge discovered IPs into pool.

```javascript
const newCount = ipPool.mergeNewIps(['1.2.3.4', '5.6.7.8'], 200)
```

- **Parameters**:
  - `newIps` (String[]) - Newly discovered IPs
  - `maxIps` (Number) - Maximum total IPs
- **Returns**: Number - Count of actually new IPs
- **Deduplication**: Uses Set to merge

### src/ip-management/akam-runner.js

Python akamTester subprocess integration.

#### Class: AkamTesterRunner

**Constructor**
```javascript
new AkamTesterRunner(config)
```

- **Parameters**:
  - `config` (Object) - akamTester configuration
- **Returns**: AkamTesterRunner instance

**Methods**

**`async run()`**

Run akamTester and return discovered IPs.

```javascript
const newIps = await akamRunner.run()
```

- **Returns**: Promise<String[]> - Discovered IP addresses
- **Mutex**: Prevents concurrent runs
- **Timeout**: Configurable (default 10 minutes)

**`async validatePython()`**

Validate Python installation.

```javascript
const isValid = await akamRunner.validatePython()
```

- **Returns**: Promise<Boolean>
- **Checks**: Python executable, conda environment (if specified)

**`async executePython()`**

Execute Python script and return IPs.

```javascript
const ips = await akamRunner.executePython()
```

- **Returns**: Promise<String[]>
- **Actions**:
  - Spawns Python subprocess
  - Monitors output
  - Parses result file
  - Handles timeout

**`parseOutputFile(host)`**

Parse akamTester output file.

```javascript
const ips = akamRunner.parseOutputFile('upos-hz-mirrorakam.akamaized.net')
```

- **Parameters**:
  - `host` (String) - Target hostname
- **Returns**: String[] - Parsed IP addresses
- **File**: `tools/akamTester/{host}_iplist.txt`

## Utility Modules

### src/utils/logger.js

Structured logging utilities.

#### Functions

**`log(message, ...args)`**

Log standard message.

```javascript
logger.log('Server started on port', 2689)
```

**`error(message, ...args)`**

Log error message.

```javascript
logger.error('Failed to start:', error.message)
```

**`warn(message, ...args)`**

Log warning message.

```javascript
logger.warn('Port already in use')
```

**`box(title, lines = [])`**

Log formatted box.

```javascript
logger.box('akamTester Enabled', [
    'Interval: 900s',
    'Python: python3'
])
```

Output:
```
╔══════════════════════════════════════════════╗
║  akamTester Enabled                          ║
╠══════════════════════════════════════════════╣
║  Interval: 900s                              ║
║  Python: python3                             ║
╚══════════════════════════════════════════════╝
```

### src/utils/validators.js

Configuration and IP validation.

#### Functions

**`validateConfig(config)`**

Validate configuration object.

```javascript
const result = validateConfig(config)
// { valid: true, errors: [] }
```

- **Parameters**:
  - `config` (Object) - Configuration to validate
- **Returns**: Object `{ valid: Boolean, errors: String[] }`

**Validates**:
- Required fields (host, port, refreshInterval)
- Value ranges (port 1-65535, etc.)
- Type checking
- akamTester sub-configuration

**`validateIp(ip)`**

Validate IPv4 address format.

```javascript
validateIp('192.168.1.1')  // true
validateIp('invalid')       // false
validateIp('::1')           // false (IPv6)
```

- **Parameters**:
  - `ip` (String) - IP address
- **Returns**: Boolean

**`validateIpList(ipList)`**

Validate array of IPs.

```javascript
const result = validateIpList(['192.168.1.1', '10.0.0.1'])
// { valid: true, invalidIps: [] }
```

- **Parameters**:
  - `ipList` (String[]) - Array of IPs
- **Returns**: Object `{ valid: Boolean, invalidIps: String[] }`

## Data Structures

### Best Server Object

Shared reference between components.

```javascript
{
  host: '2.16.11.163',           // Current best IP
  avg: 88.24,                     // Average latency (ms)
  originalHost: 'upos-hz-mirrorakam.akamaized.net'  // Target CDN
}
```

**Note**: Passed by reference, updates reflected immediately in proxy.

### Configuration Object

Loaded from config.json5.

```javascript
{
  host: String,              // Target CDN hostname
  port: Number,              // Proxy server port
  refreshInterval: Number,   // IP refresh interval (seconds)
  akamTester: {
    enabled: Boolean,
    interval: Number,        // Discovery interval (seconds)
    pythonPath: String,
    condaEnv: String|null,
    scriptPath: String,
    targetHosts: String[],
    saveToFile: Boolean,
    timeout: Number,         // Execution timeout (ms)
    maxIps: Number           // Maximum IP pool size
  }
}
```

### IP Test Result

From tcp-ping.

```javascript
{
  host: '2.16.11.163',
  avg: 88.24,
  results: {
    avg: 88.24,
    max: 95.3,
    min: 82.1,
    results: [
      { seq: 0, time: 82.1 },
      { seq: 1, time: 88.5 },
      { seq: 2, time: 95.3 }
    ]
  }
}
```

## Usage Examples

### Basic Server Start

```javascript
const Server = require('./src/core/server')
const config = require('./config.json5')

const server = new Server(config)
await server.start()
```

### Manual IP Testing

```javascript
const tester = require('./src/ip-management/tester')

const ipList = ['2.16.11.163', '23.45.67.89']
const results = await tester(ipList)

console.log('Best IP:', results[0].host)
console.log('Latency:', results[0].avg, 'ms')
```

### IP Pool Management

```javascript
const IpPool = require('./src/ip-management/ip-pool')

const pool = new IpPool('data/ip_list.txt', 5)
pool.loadFromFile()

// Test and select best
await pool.refreshBest()

// Get best server
const best = pool.getBest()
console.log('Best server:', best.host, 'avg:', best.avg, 'ms')

// Merge new discoveries
pool.mergeNewIps(['1.2.3.4', '5.6.7.8'], 200)
pool.saveToFile()
```

### Configuration Validation

```javascript
const { validateConfig } = require('./src/utils/validators')

const config = require('./config.json5')
const result = validateConfig(config)

if (!result.valid) {
    console.error('Invalid configuration:')
    result.errors.forEach(err => console.error(' -', err))
    process.exit(1)
}
```

## See Also

- [Architecture Guide](ARCHITECTURE.md) - System design overview
- [Setup Guide](SETUP.md) - Installation and configuration
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
