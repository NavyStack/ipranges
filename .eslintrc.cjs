module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
      ],
      plugins: ['@typescript-eslint'],
      rules: {}
    },
    {
      env: {
        node: true
      },
      files: ['.eslintrc.{js,cjs}', '**/*.js'],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ]
}
