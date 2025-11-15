module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        'index.js',
        '!src/**/*.test.js'
    ],
    coverageThreshold: {
        global: {
            branches: 35,
            functions: 40,
            lines: 30,
            statements: 30
        }
    },
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    verbose: true
}
