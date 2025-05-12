import {resolve} from 'path';

export default {
  lint: {
    paths: ['src', '__tests__', 'scripts']
  },

  typescript: {
    project: 'tsconfig.build.json'
  },

  aliases: {
    'react-bkoi-gl/test': resolve('./__tests__'),
    'react-bkoi-gl': resolve('./src'),
    'react-bkoi-gl/styles': resolve('./dist/styles/react-bkoi-gl.css')
  },

  nodeAliases: {
    'react-dom': resolve('./__tests__/mocks/react-dom-mock.js')
  },

  browserTest: {
    server: {wait: 5000}
  },

  entry: {
    test: '__tests__/setup.js',
    'test-browser': '__tests__/setup.js',
    size: ['src/index.ts', 'src/components/index.ts']
  }
};