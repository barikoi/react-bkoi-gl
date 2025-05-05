module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: 'commonjs'
    }],
    ['@babel/preset-typescript', { 
      allowNamespaces: true, 
      allowDeclareFields: true, 
      onlyRemoveTypeImports: true 
    }],
    '@babel/preset-react'
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    ['@babel/plugin-transform-runtime', { regenerator: true, useESModules: false }]
  ]
}; 