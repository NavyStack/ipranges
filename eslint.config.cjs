// eslint.config.cjs
const typescriptPlugin = require('@typescript-eslint/eslint-plugin')
const typescriptParser = require('@typescript-eslint/parser')

module.exports = {
  ignores: ['dist/**', 'eslint.config.cjs'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      es2021: true,
      node: true
    },
    parser: typescriptParser,
    parserOptions: {
      project: './tsconfig.json'
    }
  },
  plugins: {
    '@typescript-eslint': typescriptPlugin
  },
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error'
  }
}
