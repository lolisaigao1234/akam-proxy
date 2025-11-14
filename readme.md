# akam-proxy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14-brightgreen)](https://nodejs.org/)

**Intelligent proxy server that optimizes Bilibili video streaming by automatically selecting the fastest CDN node.**

A Node.js proxy that tests latency across Bilibili's overseas CDN nodes (`upos-hz-mirrorakam.akamaized.net`) and intelligently routes traffic to the lowest-delay server for optimal streaming performance.

## Features

✨ **Automatic Server Selection** - Tests latency and chooses the fastest CDN node
🔄 **Continuous Optimization** - Periodically re-tests and updates the best server
🤖 **Optional Auto-Discovery** - Automatically discovers new CDN IPs using Python akamTester
🎯 **Selective Proxying** - Only intercepts Bilibili CDN traffic, passes through everything else
📊 **Smart IP Management** - Automatically removes dead IPs and manages pool size
⚡ **Zero Downtime Updates** - Switches servers without restarting the proxy

## Quick Start

```bash
# Install dependencies
npm install

# Create configuration
cp config/example.json5 config.json5

# Start the proxy
npm start
```

**That's it!** The server will:
1. Load and test all available CDN IPs
2. Select the fastest server
3. Start proxy on port 2689

**Next**: Configure your browser proxy extension to use `127.0.0.1:2689` for `*.akamaized.net` domains.

👉 **See [Quick Start Guide](docs/README.md) for detailed setup instructions with screenshots.**

## Documentation

- 📖 **[Quick Start Guide](docs/README.md)** - Installation and basic setup
- 🔧 **[Detailed Setup](docs/SETUP.md)** - Step-by-step configuration with screenshots
- 🏗️ **[Architecture](docs/ARCHITECTURE.md)** - How it works under the hood
- 🐛 **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- 📚 **[API Reference](docs/API.md)** - Code documentation for developers
- 🤖 **[Claude Code Guide](CLAUDE.md)** - AI assistant instructions

## How It Works

```
┌─────────┐         ┌──────────────┐         ┌─────────────┐
│ Browser │────────▶│  akam-proxy  │────────▶│  Best CDN   │
│         │         │  Port 2689   │         │  Server     │
└─────────┘         └──────────────┘         └─────────────┘
                           │
                           ├─ Test all IPs with tcp-ping
                           ├─ Select lowest latency
                           ├─ Re-test every hour
                           └─ Auto-discover new IPs (optional)
```

1. **IP Discovery**: Load IPs from file or auto-discover with Python akamTester
2. **Latency Testing**: Ping each IP 3 times, calculate average
3. **Server Selection**: Route traffic to the fastest server
4. **Continuous Optimization**: Periodically re-test and update
5. **Dead IP Removal**: Automatically remove failing IPs

## Configuration

Edit `config.json5` to customize:

```json5
{
  host: 'upos-hz-mirrorakam.akamaized.net',  // Target CDN
  port: 2689,                                  // Proxy port
  refreshInterval: 3600,                       // Re-test every hour
  akamTester: {
    enabled: true,                             // Auto-discover IPs
    interval: 900,                             // Every 15 minutes
    // ... see config/example.json5 for all options
  }
}
```

See [Setup Guide](docs/SETUP.md) for all configuration options.

## Project Structure

After restructuring (Phase 1 & 2 complete):

```
akam-proxy/
├── src/
│   ├── core/           # Application lifecycle
│   ├── proxy/          # HTTP/HTTPS proxy implementation
│   ├── ip-management/  # IP discovery, testing, pool management
│   └── utils/          # Logging, validation
├── data/               # IP lists
├── tools/              # Python akamTester
├── docs/               # Documentation
├── config/             # Configuration files
└── index.js            # Entry point (24 lines!)
```

**Before restructure**: 190-line index.js, mixed concerns, deprecated code
**After restructure**: Clean modules, clear boundaries, 87% code reduction in entry point

See [Architecture Guide](docs/ARCHITECTURE.md) for detailed component documentation.

## Requirements

- **Node.js** 14+ (tested with v24.x)
- **Optional**: Python 3.6+ for automatic IP discovery

## License

MIT License - see LICENSE file for details

## Credits

- **[akamTester](https://github.com/miyouzi/akamTester)** by @Miyouzi and @oldip - Python IP discovery tool
- **[ZeroOmega](https://github.com/zero-peak/ZeroOmega)** - Recommended browser proxy extension
- **[SwitchyOmega](https://github.com/FelisCatus/SwitchyOmega)** - Alternative browser proxy extension

## Contributing

Contributions welcome! This project was restructured and cleaned up using AI assistance (Claude Code).

1. Check [open issues](../../issues) or create a new one
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Submit a pull request

See [API Reference](docs/API.md) for code documentation.

## Acknowledgments

Note: This project benefited from extensive AI-assisted development and restructuring. Special thanks to Claude Code for helping organize and document the codebase.
