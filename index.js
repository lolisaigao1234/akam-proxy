/**
 * akam-proxy
 * Intelligent proxy server for Bilibili CDN optimization
 *
 * Entry point: Loads configuration and starts the server
 */

require('json5/lib/register')
const config = require('./config.json5')
const Server = require('./src/core/server')

// Create and start server
const server = new Server(config)
server.start().catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
})

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...')
    server.stop()
    process.exit(0)
})
