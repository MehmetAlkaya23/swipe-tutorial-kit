// Resolves the kit straight from ../src so edits hot-reload in the example,
// while React and React Native always come from the example's node_modules.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '..');
const escapeRegExp = (p) => p.replace(/[/\\^$*+?.()|[\]{}]/g, '\\$&');

const config = getDefaultConfig(__dirname);

config.watchFolders = [root];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
config.resolver.extraNodeModules = {
  'react-native-swipe-tutorial-kit': path.join(root, 'src'),
};
config.resolver.blockList = [new RegExp(`^${escapeRegExp(path.join(root, 'node_modules'))}\\/.*$`)];

module.exports = config;
