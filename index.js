/**
 * akam-proxy
 * Intelligent proxy server for Bilibili CDN optimization
 *
 * Entry point: Loads configuration and starts the server
 */

require('json5/lib/register')
const fs = require('fs')
const path = require('path')
const Server = require('./src/core/server')
const { validateConfig } = require('./src/utils/validators')

// Load configuration
let config
const configPath = path.join(__dirname, 'config.json5')

try {
    config = require('./config.json5')
} catch (error) {
    console.error('Error loading config.json5:', error.message)
    console.error('\nPlease create config.json5 in the project root.')
    console.error('You can copy config/example.json5 as a starting point:')
    console.error('  cp config/example.json5 config.json5')
    process.exit(1)
}

// Validate configuration
const validation = validateConfig(config)
if (!validation.valid) {
    console.error('Configuration validation failed:')
    validation.errors.forEach(error => {
        console.error('  - ' + error)
    })
    console.error('\nPlease fix the errors in config.json5')
    console.error('See config/example.json5 for reference')
    process.exit(1)
}

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
