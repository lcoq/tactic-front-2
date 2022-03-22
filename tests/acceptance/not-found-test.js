import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../utils/setup';

module('Acceptance | Not Found', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/nonexistant-url');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/nonexistant-url');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('shows 404 page when a valid session token is stored in cookies', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/nonexistant-url');
    assert.strictEqual(
      currentURL(),
      '/nonexistant-url',
      'should remains on nonexistant-url'
    );
  });
});
