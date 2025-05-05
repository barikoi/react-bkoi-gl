module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: false // Preserve ES modules
    }],
    ['@babel/preset-typescript', { 
      allowNamespaces: true, 
      allowDeclareFields: true, 
      onlyRemoveTypeImports: true 
    }],
    '@babel/preset-react'
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', { regenerator: true, useESModules: true }],
    'babel-plugin-add-import-extension'
  ]
}; 