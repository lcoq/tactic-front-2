import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../../utils/setup';

function createUserWithTeamwork() {
  const user = this.server.create('user');
  this.server.create('user-config', {
    user,
    id: 'teamwork',
    name: 'teamwork',
    type: 'boolean',
    description: 'Teamwork integration',
    value: true,
  });
  return user;
}

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
    const user = createUserWithTeamwork.call(this);
    await this.utils.authentication.authenticate(user);
    await visit('/teamwork/config');
    assert.strictEqual(
      currentURL(),
      '/teamwork/config',
      'should remains on teamwork config'
    );
  });

  test('shows teamwork domains', async function (assert) {
    const user = createUserWithTeamwork.call(this);
    const domains = [
      this.server.create('teamwork/domain', { user }),
      this.server.create('teamwork/domain', { user }),
      this.server.create('teamwork/domain', { user }),
    ];

    await this.utils.authentication.authenticate(user);
    await visit('/teamwork/config');

    assert
      .dom('[data-test-domain]')
      .exists({ count: 3 }, 'should show all domains');

    domains.forEach(function (domain) {
      assert
        .dom(`[data-test-domain="${domain.id}"] [data-test-domain-name]`)
        .exists(`should show ${domain.name} domain name`);
      assert
        .dom(`[data-test-domain="${domain.id}"] [data-test-domain-name]`)
        .hasText(domain.name, `should compute ${domain.name} domain name`);

      assert
        .dom(`[data-test-domain="${domain.id}"] [data-test-domain-alias]`)
        .exists(`should show ${domain.alias} domain alias`);
      assert
        .dom(`[data-test-domain="${domain.id}"] [data-test-domain-alias]`)
        .hasText(domain.alias, `should compute ${domain.alias} domain alias`);

      assert
        .dom(`[data-test-domain="${domain.id}"] [data-test-domain-token]`)
        .exists(`should show ${domain.token} domain token`);
      assert
        .dom(`[data-test-domain="${domain.id}"] [data-test-domain-token]`)
        .hasText(domain.token, `should compute ${domain.token} domain token`);
    });
  });
});
