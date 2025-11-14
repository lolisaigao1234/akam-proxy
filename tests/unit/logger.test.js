const logger = require('../../src/utils/logger')

describe('logger', () => {
    let consoleLogSpy
    let consoleErrorSpy
    let consoleWarnSpy

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    })

    afterEach(() => {
        consoleLogSpy.mockRestore()
        consoleErrorSpy.mockRestore()
        consoleWarnSpy.mockRestore()
    })

    test('log should call console.log', () => {
        logger.log('test message', 123)
        expect(consoleLogSpy).toHaveBeenCalledWith('test message', 123)
    })

    test('error should call console.error', () => {
        logger.error('error message', 'details')
        expect(consoleErrorSpy).toHaveBeenCalledWith('error message', 'details')
    })

    test('warn should call console.warn', () => {
        logger.warn('warning message')
        expect(consoleWarnSpy).toHaveBeenCalledWith('warning message')
    })

    test('box should create formatted output', () => {
        logger.box('Title', ['Line 1', 'Line 2'])
        expect(consoleLogSpy).toHaveBeenCalled()
        // Check that box characters were used
        const calls = consoleLogSpy.mock.calls.map(call => call[0])
        expect(calls.some(call => call.includes('╔'))).toBe(true)
        expect(calls.some(call => call.includes('║'))).toBe(true)
        expect(calls.some(call => call.includes('╚'))).toBe(true)
    })

    test('box should handle empty lines array', () => {
        logger.box('Title Only')
        expect(consoleLogSpy).toHaveBeenCalled()
        const calls = consoleLogSpy.mock.calls.map(call => call[0])
        expect(calls.some(call => call.includes('Title Only'))).toBe(true)
    })
})
