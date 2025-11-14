# Architecture Documentation

Technical overview of akam-proxy's design and implementation.

## Table of Contents

- [System Overview](#system-overview)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Key Concepts](#key-concepts)
- [Module Reference](#module-reference)

## System Overview

akam-proxy is a **selective HTTP/HTTPS proxy** that optimizes Bilibili video streaming by:

1. **IP Discovery**: Finding available CDN nodes
2. **Latency Testing**: Measuring response time for each node
3. **Smart Routing**: Directing traffic to the fastest node
4. **Continuous Optimization**: Periodically re-testing and updating

### Design Philosophy

- **Selective proxying**: Only intercepts specific domains (bilivideo.com, akamaized.net)
- **Pass-through for others**: All other traffic flows unchanged
- **Zero downtime**: Updates best server without restarting proxy
- **Graceful degradation**: Works even if IP discovery fails

## Component Architecture

```
akam-proxy/
├── src/
│   ├── core/
│   │   └── server.js              # Application lifecycle manager
│   ├── proxy/
│   │   ├── server.js              # HTTP/HTTPS proxy implementation
│   │   └── mapper.js              # Domain → IP mapping logic
│   ├── ip-management/
│   │   ├── tester.js              # TCP ping for latency testing
│   │   ├── akam-runner.js         # Python akamTester integration
│   │   └── ip-pool.js             # IP list management
│   └── utils/
│       ├── logger.js              # Structured logging
│       └── validators.js          # Config/IP validation
├── data/
│   └── ip_list.txt                # Active IP list
├── tools/
│   └── akamTester/                # Python IP discovery tool
└── config/
    ├── default.json5              # Default configuration
    ├── example.json5              # User template
    └── schema.json                # Validation schema
```

## Component Details

### Core Layer

**`src/core/server.js`** - Application Lifecycle Manager

Responsibilities:
- Initialize IP pool and load IP list
- Set up periodic refresh timers
- Manage akamTester integration
- Coordinate between components
- Handle graceful shutdown

Key methods:
- `start()` - Initialize and start all services
- `initAkamTester()` - Setup automatic IP discovery
- `startPeriodicRefresh()` - Schedule IP re-testing
- `runDiscovery()` - Execute IP discovery cycle
- `stop()` - Cleanup and shutdown

### Proxy Layer

**`src/proxy/server.js`** - HTTP/HTTPS Proxy Server

Implements dual-mode proxy:
- **HTTP mode**: Intercept and forward HTTP requests
- **HTTPS CONNECT mode**: Tunnel encrypted traffic

Request flow:
1. Client sends request
2. Parse destination hostname
3. Check if domain matches (via mapper)
4. Replace hostname with optimal IP
5. Forward request to CDN
6. Stream response back to client

Debug logging:
- 10-step HTTP request logging
- 8-step HTTPS CONNECT logging
- Raw packet inspection for errors

**`src/proxy/mapper.js`** - Host Mapping

Maps domains to optimal IP:
```javascript
{
  hostname: 'upos-hz-mirrorakam.akamaized.net',
  port: 443
}
// ↓ mapped to ↓
{
  hostname: '2.16.11.163',  // Best IP
  port: 443
}
```

Supported domains:
- `*.bilivideo.com`
- `*.akamaized.net`
- Exact match for target host

### IP Management Layer

**`src/ip-management/tester.js`** - Latency Testing

Uses `tcp-ping` library to test IPs:
- Pings each IP 3 times
- 3 second timeout per ping
- Calculates average latency
- Filters out dead IPs (timeout/error)
- Sorts by lowest latency

Returns:
```javascript
[
  { host: '2.16.11.163', avg: 88.24, results: [...] },
  { host: '23.45.67.89', avg: 120.50, results: [...] },
  // ...
]
```

**`src/ip-management/ip-pool.js`** - IP Pool Manager

Centralized IP list management:
- Load/save IP list from/to file
- Track failure counts per IP
- Remove dead IPs after 5 consecutive failures
- Merge new discoveries with deduplication
- Enforce maximum pool size

Data structures:
```javascript
{
  ipList: ['2.16.11.163', '23.45.67.89', ...],
  ipFailureCount: Map {
    '2.16.11.163' => 0,
    '23.45.67.89' => 2
  },
  best: {
    host: '2.16.11.163',
    avg: 88.24,
    originalHost: 'upos-hz-mirrorakam.akamaized.net'
  }
}
```

**`src/ip-management/akam-runner.js`** - Python Integration

Executes Python akamTester script:
- Validates Python installation
- Spawns child process
- Parses output file
- Handles timeouts (10 min default)
- Mutex to prevent concurrent runs

Output parsing:
```
tools/akamTester/upos-hz-mirrorakam.akamaized.net_iplist.txt
↓ parsed ↓
['2.16.11.163', '23.45.67.89', ...]
```

### Utilities

**`src/utils/logger.js`** - Structured Logging

Provides consistent logging:
- `log()` - Standard messages
- `error()` - Error messages
- `warn()` - Warnings
- `box()` - Formatted box output

**`src/utils/validators.js`** - Validation

Config and IP validation:
- `validateConfig()` - Check config structure
- `validateIp()` - IPv4 format validation
- `validateIpList()` - Array of IPs validation

## Data Flow

### Startup Flow

```
1. index.js loads config.json5
2. Validate configuration
3. Create Server instance
4. Server loads IP list from data/ip_list.txt
5. Test all IPs with tcp-ping (tester.js)
6. Select best IP (lowest latency)
7. Start HTTP/HTTPS proxy server
8. Schedule periodic refresh (every 1 hour)
9. [Optional] Schedule akamTester runs (every 15 min)
```

### Proxy Request Flow

```
Client → Browser Extension → akam-proxy → CDN Server
                                 ↓
                    1. Receive request
                    2. Parse URL
                    3. Check domain (mapper.js)
                    4. Replace with best IP
                    5. Forward to CDN
                    6. Stream response
```

### IP Refresh Cycle

```
Every 1 hour (refreshInterval):
1. Test all IPs with tcp-ping
2. Calculate average latencies
3. Sort by latency
4. Update best server
5. Track failures
6. Remove IPs with 5+ consecutive failures
7. Save updated list to file
```

### IP Discovery Cycle

```
Every 15 minutes (if enabled):
1. Run akamTester.py (Python subprocess)
2. Parse output file
3. Merge new IPs with existing (Set deduplication)
4. Save to data/ip_list.txt
5. Re-test all IPs
6. Update best server
```

## Key Concepts

### Pass-by-Reference Best Server

The `best` object is shared between components:

```javascript
// Created in ip-pool
best = { host: '2.16.11.163', avg: 88.24, ... }

// Passed to proxy server
proxyServer(best, port)

// Updates to 'best' reflected immediately in proxy
// No restart needed!
```

### Selective Proxying

Not all requests are proxied:

```javascript
// These ARE proxied:
upos-hz-mirrorakam.akamaized.net → Best IP
*.bilivideo.com → Best IP
*.akamaized.net → Best IP

// These pass through unchanged:
google.com → google.com
github.com → github.com
```

### Dead IP Removal

Automatic cleanup prevents IP list bloat:

```
IP fails tcp-ping → failureCount++
IP succeeds → failureCount = 0
failureCount >= 5 → Remove from list
```

### IPv6 Filtering

Only IPv4 addresses supported:

```javascript
ipList = ipListText
  .split(/\r\n|\r|\n/)
  .filter(item => !!item && !/\:/.test(item))
  //                        ^^^^^^^^^^^^^^
  //                        Filter out IPv6 (contains ':')
```

## Module Reference

### Entry Point

**`index.js`** (52 lines)
- Load and validate configuration
- Create and start server
- Handle graceful shutdown

### Core

**`src/core/server.js`** (166 lines)
- Application lifecycle management
- Coordinates all subsystems

### Proxy

**`src/proxy/server.js`** (150+ lines)
- HTTP/HTTPS proxy implementation
- Comprehensive debug logging

**`src/proxy/mapper.js`** (50+ lines)
- Domain matching and IP replacement

### IP Management

**`src/ip-management/tester.js`** (50+ lines)
- TCP ping-based latency testing

**`src/ip-management/akam-runner.js`** (200+ lines)
- Python subprocess management

**`src/ip-management/ip-pool.js`** (139 lines)
- IP list management
- Dead IP tracking and removal

### Utilities

**`src/utils/logger.js`** (35 lines)
- Structured logging interface

**`src/utils/validators.js`** (130+ lines)
- Configuration and IP validation

## Performance Characteristics

### Memory Usage
- Baseline: ~50 MB (Node.js + dependencies)
- IP list: ~400 bytes per 100 IPs
- Total: <100 MB for typical usage

### CPU Usage
- Idle: <1%
- During IP testing: 10-30% (brief spike)
- During proxy: <5%

### Network
- IP testing: ~1 KB per test
- Proxy overhead: Minimal (header modification only)
- No data buffering (streaming)

### Timing
- Startup: 5-15 seconds (IP testing)
- IP refresh: 10-30 seconds (depends on IP count)
- akamTester run: 2-5 minutes (DNS queries)
- Proxy latency: <10 ms added

## Extension Points

Want to extend akam-proxy? Here are some ideas:

1. **Custom IP sources**: Add new discovery methods in `ip-management/`
2. **Additional domains**: Extend `mapper.js` domain matching
3. **Different testing methods**: Replace `tester.js` with HTTP-based testing
4. **Metrics/monitoring**: Add monitoring in `src/utils/`
5. **API server**: Expose status via HTTP API

See [API.md](API.md) for detailed function signatures.

## See Also

- [Setup Guide](SETUP.md) - Installation and configuration
- [API Reference](API.md) - Function documentation
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
