module.exports = {
  // Parser configuration for TypeScript
  parser: '@typescript-eslint/parser',

  // Parser options
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    // This ensures TypeScript rules can access your tsconfig
    project: './tsconfig.json',
  },

  // Extend configurations
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // Make sure this is last to override other configs
  ],

  // Enable plugins
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],

  // Custom rules
  rules: {
    // Disable common warnings completely
    'no-console': 'off', // Disable console warnings - there are many
    '@typescript-eslint/no-explicit-any': 'off', // Disable any type warnings
    '@typescript-eslint/no-unused-vars': 'off', // Disable unused vars
    'react-hooks/exhaustive-deps': 'off', // Disable dependency issues
    '@next/next/no-img-element': 'off', // Disable img element warnings
    'react/no-unescaped-entities': 'off', // Disable unescaped entities

    // React rules
    'react/react-in-jsx-scope': 'off', // Not needed with Next.js
    'react/prop-types': 'off', // Not needed with TypeScript

    // Other rules that we'll keep as warnings
    'prettier/prettier': 'warn',
  },

  // Files to ignore
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'public/',
    '*.config.js',
    'next.config.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'server.js',
    'dev-https-server.js',
  ],

  // Specific file overrides
  overrides: [
    // JavaScript files should not use TypeScript rules
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
      },
    },
  ],

  // Environment
  env: {
    browser: true,
    node: true,
    es6: true,
  },

  // React configuration
  settings: {
    react: {
      version: 'detect',
    },
  },
};
