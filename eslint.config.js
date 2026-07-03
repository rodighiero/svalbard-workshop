import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

export default [
    { ignores: ['docs/**', 'node_modules/**'] },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                s: 'writable', // shared app-state object (window.s), read across modules
            },
        },
    },
    {
        // Config files run in Node
        files: ['*.config.js'],
        languageOptions: { globals: { ...globals.node } },
    },
    prettier, // turn off rules that would conflict with Prettier formatting
]
