import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('remains on index when a valid session token is stored in cookies', async function (assert) {
    const user = this.server.create('user');
    const session = this.server.create('session', { user: user });
    document.cookie = `token=${session.token}; path=/`;
    await visit('/');
    assert.strictEqual(currentURL(), '/', 'should remains on index');
  });
});
