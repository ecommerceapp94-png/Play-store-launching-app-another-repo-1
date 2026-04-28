module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-worklets plugin must be listed last.
      // It powers Reanimated worklets and IS REQUIRED for the app to start
      // when react-native-reanimated v4 is in the bundle.
      'react-native-worklets/plugin',
    ],
  };
};
