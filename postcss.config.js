const postcssPresetEnv = require('postcss-preset-env');
const customProperties = require('./renderer/storybook/design/properties');
const customMedia = require('./renderer/storybook/design/media');

module.exports = {
  plugins: [
    postcssPresetEnv({
      stage: 2,
      preserve: false,
      browsers: '> 0.5%, last 2 versions, Firefox ESR, not dead',
      features: {
        'nesting-rules': true,
        'custom-media-queries': true,
        'color-mod-function': {
          unresolved: 'warn',
        },
      },
      importFrom: [
        {
          customProperties,
          customMedia,
        },
      ],
    }),
  ],
};
