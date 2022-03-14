import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Teamwork > Page', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/teamwork/config');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/teamwork/config');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to account when authenticated with user having teamwork config disabled', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/teamwork/config');
    assert.strictEqual(currentURL(), '/account', 'should redirect to account');
  });

  test('remains on teamwork config when authenticated with user having teamwork config enabled', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    await this.utils.authentication.authenticate(user);
    await visit('/teamwork/config');
    assert.strictEqual(
      currentURL(),
      '/teamwork/config',
      'should remains on teamwork config'
    );
  });
});
