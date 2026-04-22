const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle .glb files as assets
config.resolver.assetExts.push('glb');

module.exports = config;
