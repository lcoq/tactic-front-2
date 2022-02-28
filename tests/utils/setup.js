import setupAuthentication from './authentication';
import setupStubs from './stubs';

export function setupUtils(hooks) {
  hooks.beforeEach(function () {
    this.utils = {};
  });
  hooks.afterEach(function () {
    delete this.utils;
  });

  setupAuthentication(hooks);
  setupStubs(hooks);
}
