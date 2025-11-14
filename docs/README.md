# akam-proxy Quick Start

Intelligent proxy server that optimizes Bilibili video streaming by automatically selecting the fastest CDN node.

## Installation

### Prerequisites
- Node.js (tested with v24.x)
- Optional: Python 3+ for automatic IP discovery

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create configuration**:
   ```bash
   cp config/example.json5 config.json5
   ```

   Edit `config.json5` if needed (default port 2689 works for most users).

3. **Start the proxy**:
   ```bash
   npm start
   ```

4. **Verify startup**:
   ```
   Loaded 77 IP addresses from data/ip_list.txt
   Pinging ipList
   forward proxy server started, listening on port 2689
   The best server is X.X.X.X which delay is XXms
   ```

## Browser Setup

Configure your browser proxy extension (ZeroOmega or SwitchyOmega):

1. **Create new proxy profile**:
   - Protocol: HTTP
   - Server: `127.0.0.1`
   - Port: `2689`

2. **Add auto-switch rule**:
   - Condition: Host wildcard
   - Pattern: `*.akamaized.net`
   - Profile: Your proxy profile

See [SETUP.md](SETUP.md) for detailed configuration with screenshots.

## Common Commands

```bash
# Start the proxy server
npm start

# Update IP list manually (if Python installed)
cd tools/akamTester
python akamTester.py -u upos-hz-mirrorakam.akamaized.net
```

## Next Steps

- [Detailed Setup Guide](SETUP.md) - Step-by-step configuration
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [Architecture](ARCHITECTURE.md) - How it works
- [API Reference](API.md) - Code documentation

## Need Help?

- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [browser configuration screenshots](assets/screenshots/)
- See [main README](../readme.md) for project overview
