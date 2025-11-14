module.exports = {
    env: {
        node: true,
        es6: true,
        jest: true
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 2020
    },
    rules: {
        // Allow console logging (this is a CLI tool)
        'no-console': 'off',

        // Code style
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single', { avoidEscape: true }],
        'semi': ['error', 'never'],

        // Best practices
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-var': 'error',
        'prefer-const': 'warn',
        'prefer-arrow-callback': 'warn',

        // Spacing
        'space-before-function-paren': ['error', 'never'],
        'keyword-spacing': ['error', { before: true, after: true }],
        'comma-spacing': ['error', { before: false, after: true }],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],

        // Other
        'no-trailing-spaces': 'error',
        'eol-last': ['error', 'always']
    }
}
