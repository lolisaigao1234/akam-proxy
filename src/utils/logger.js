/**
 * Simple structured logger
 * Provides consistent logging format across the application
 */

function log(message, ...args) {
    console.log(message, ...args)
}

function error(message, ...args) {
    console.error(message, ...args)
}

function warn(message, ...args) {
    console.warn(message, ...args)
}

function box(title, lines = []) {
    const maxLength = Math.max(title.length, ...lines.map(l => l.length))
    const width = Math.min(maxLength + 4, 62)

    console.log('╔' + '═'.repeat(width) + '╗')
    console.log('║  ' + title.padEnd(width - 2) + '║')
    if (lines.length > 0) {
        console.log('╠' + '═'.repeat(width) + '╣')
        lines.forEach(line => {
            console.log('║  ' + line.padEnd(width - 2) + '║')
        })
    }
    console.log('╚' + '═'.repeat(width) + '╝')
}

module.exports = {
    log,
    error,
    warn,
    box
}
