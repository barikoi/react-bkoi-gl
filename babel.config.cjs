module.exports = api => {
  const isESM = api.env('esm') || api.env('esm-strict');
  const isTest = api.env('test');
  
  // For Jest testing, use CommonJS
  if (isTest) {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-typescript', { allowNamespaces: true, allowDeclareFields: true, onlyRemoveTypeImports: true }],
        '@babel/preset-react'
      ],
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        ['@babel/plugin-transform-runtime', { regenerator: true }]
      ]
    };
  }
  
  return {
    presets: [
      ['@babel/preset-env', { 
        targets: { node: 'current' },
        modules: isESM ? false : 'commonjs'
      }],
      ['@babel/preset-typescript', { 
        allowNamespaces: true, 
        allowDeclareFields: true, 
        onlyRemoveTypeImports: true 
      }],
      '@babel/preset-react'
    ],
    plugins: [
      // Only transform to CommonJS when not in ESM mode
      ...(isESM ? [] : ['@babel/plugin-transform-modules-commonjs']),
      ['@babel/plugin-transform-runtime', { regenerator: true, useESModules: isESM }],
      ...(isESM ? ['babel-plugin-add-import-extension'] : [])
    ]
  };
};
