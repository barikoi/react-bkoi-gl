import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import globals from 'globals'
import { FlatCompat } from '@eslint/eslintrc'
import prettier from 'eslint-plugin-prettier'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

const eslintconfig = [
  // Global ignores
  {
    ignores: [
      '**/tsconfig.json',
      '**/index.d.ts',
      '**/*.config.js',
      '**/*.config.mjs',
      'dist/',
      'src/maplibre/worker-bundle.generated.ts',
      'node_modules/',
      'coverage/',
      'tests/',
      'examples/',
      '*.md',
      'scripts/',
    ],
  },

  // Base JS configuration
  js.configs.recommended,

  // Prettier integration
  {
    plugins: {
      prettier, // Enable Prettier as an ESLint plugin
    },
    rules: {
      'prettier/prettier': 'error', // Run Prettier as an ESLint rule
    },
  },

  // React and other plugins using compat
  ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:prettier/recommended'
  ),

  // Main configuration for all files
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Your existing rules (keep non-stylistic ones)
      'react/prop-types': 'off',
      'react/forbid-prop-types': 'error',
      'react/default-props-match-prop-types': 'error',
      'react/self-closing-comp': 'error',
      'react/no-unused-prop-types': 'error',
      'react/jsx-key': 'error',
      'react/no-unused-state': 'error',
      'react/state-in-constructor': 'error',
      'react/function-component-definition': 'off',
      'react/require-default-props': 'off',
      'react/no-array-index-key': 'off',
      'react/no-unescaped-entities': 'off',
      'react/no-unstable-nested-components': 'off',
      'react/no-danger': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/interactive-supports-focus': 'off',
      'import/first': 'error',
      'import/no-mutable-exports': 'error',
      'import/no-useless-path-segments': 'error',
      'import/no-named-as-default': 'error',
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      'import/no-extraneous-dependencies': 'off',
      'import/order': 'off',
      'import/named': 'off',
      'import/no-cycle': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': 'off', // TypeScript handles this
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-bitwise': 'off',
      'no-underscore-dangle': 'off',
      'no-nested-ternary': 'off',
      'no-restricted-syntax': 'off',
      'no-unused-vars': 'off',
      'no-return-await': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unused-prop-types': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },

  // TypeScript-specific configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      '@typescript-eslint/return-await': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false,
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-as-const': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/quotes': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
]

export default eslintconfig
