module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    node: true,
    es2020: true
  },
  rules: {
    // Code quality - reasonable limits
    'max-depth': ['warn', 5],
    'complexity': ['warn', 20],
    'max-statements': ['warn', 30],
    
    // TypeScript - relaxed for library code
    '@typescript-eslint/ban-ts-comment': ['warn', {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': 'allow-with-description',
      'ts-nocheck': true
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-wrapper-object-types': 'warn',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    
    // Best practices
    'no-prototype-builtins': 'warn',
    'no-unused-expressions': 'off',
    'no-undef': 'off', // TypeScript handles this
    
    // Style - disabled for flexibility
    'indent': 'off',
    'quotes': 'off',
    'spaced-comment': 'off',
    'object-shorthand': 'off',
    'callback-return': 'off'
  }
};
