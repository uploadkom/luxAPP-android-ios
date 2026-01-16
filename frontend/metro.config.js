const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Onemogući Hermes
config.transformer = {
  ...config.transformer,
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {},
};

module.exports = config;
