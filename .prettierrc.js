'use strict';

module.exports = {
  singleQuote: true,
  overrides: [
    {
      files: ['**/*.hbs', '**/*.html', '**/*.css', '**/*.ccss'],
      options: {
        singleQuote: false,
      },
    },
  ],
};
