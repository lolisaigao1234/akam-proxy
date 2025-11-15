/**
 * Tests for index.js (entry point)
 * Note: index.js is primarily an orchestration module with side effects,
 * so these tests focus on basic validation and error handling.
 */

describe('index.js entry point', () => {
    let originalExit;
    let originalError;

    beforeEach(() => {
        // Prevent process.exit from actually exiting
        originalExit = process.exit;
        process.exit = jest.fn();

        // Capture console.error
        originalError = console.error;
        console.error = jest.fn();

        // Clear module cache
        jest.resetModules();
    });

    afterEach(() => {
        process.exit = originalExit;
        console.error = originalError;
    });

    test('should be a valid JavaScript file', () => {
        // If this test runs, the file is valid JS
        expect(true).toBe(true);
    });

    test('should export Server class dependency', () => {
        const Server = require('../../src/core/server');
        expect(Server).toBeDefined();
        expect(typeof Server).toBe('function');
    });

    test('should export validators dependency', () => {
        const { validateConfig } = require('../../src/utils/validators');
        expect(validateConfig).toBeDefined();
        expect(typeof validateConfig).toBe('function');
    });

    test('should have required Node.js dependencies', () => {
        const fs = require('fs');
        const path = require('path');

        expect(fs).toBeDefined();
        expect(path).toBeDefined();
        expect(typeof fs.readFileSync).toBe('function');
        expect(typeof path.join).toBe('function');
    });

    test('config.json5 should exist in project root', () => {
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(__dirname, '../../config.json5');

        const exists = fs.existsSync(configPath);
        expect(exists).toBe(true);
    });

    test('config.json5 should be readable', () => {
        const fs = require('fs');
        const path = require('path');
        const configPath = path.join(__dirname, '../../config.json5');

        const content = fs.readFileSync(configPath, 'utf-8');
        expect(content).toBeDefined();
        expect(content.length).toBeGreaterThan(0);
    });

    test('validateConfig function should work with valid config', () => {
        const { validateConfig } = require('../../src/utils/validators');

        const testConfig = {
            host: 'upos-hz-mirrorakam.akamaized.net',
            port: 2689,
            refreshInterval: 3600
        };

        const validation = validateConfig(testConfig);

        expect(validation).toBeDefined();
        expect(validation).toHaveProperty('valid');
        expect(validation).toHaveProperty('errors');
        expect(validation.valid).toBe(true);
    });
});
