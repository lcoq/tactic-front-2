import authentication from './authentication';

export function setupUtils(hooks) {
  hooks.beforeEach(function () {
    const server = this.server;
    this.utils = Object.assign({ server }, authentication);
  });
  hooks.afterEach(function () {
    delete this.utils;
  });
}
