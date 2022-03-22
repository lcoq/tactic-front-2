/* eslint-env node */
'use strict';

module.exports = function (deployTarget) {
  let ENV = {
    build: {},
    // include other plugin configuration that applies to all deploy targets here
  };

  if (deployTarget === 'development') {
    ENV.build.environment = 'development';
  }

  if (deployTarget === 'staging') {
    ENV.build.environment = 'production';

    ENV['simply-ssh'] = {
      connection: {
        host: '104.129.41.66',
        port: 22,
        username: 'ember-deploy',
        privateKey: '/root/.ssh/id_rsa',
      },
      dir: '/home/ember-deploy/tactic-front/www/staging',
      keep: 5,
    };
  }

  if (deployTarget === 'production') {
    ENV.build.environment = 'production';
  }

  // Note: if you need to build some configuration asynchronously, you can return
  // a promise that resolves with the ENV object instead of returning the
  // ENV object synchronously.
  return ENV;
};
