// ESLint配置文件
export default [
  {
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        Node: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly'
      },
      ecmaVersion: 2021,
      sourceType: 'script'
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
      'quotes': 'off',
      'semi': 'off',
      'comma-dangle': 'off'
    }
  }
];