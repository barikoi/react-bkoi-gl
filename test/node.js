// This file is the entry point for node-based tests
require('@babel/register')({
  presets: ['@babel/preset-env', '@babel/preset-react'],
  extensions: ['.ts', '.tsx', '.js', '.jsx']
});

// Import all test files
require('./src/components/logo-control.test');
require('./src/components/attribution-control.test'); 