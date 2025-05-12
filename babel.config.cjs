const {getBabelConfig} = require('ocular-dev-tools/configuration');

module.exports = getBabelConfig({
  react: true,
  esm: true,
  overrides: {
    plugins: [
      ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }]
    ]
  }
});