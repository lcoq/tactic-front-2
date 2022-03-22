import { module, test } from 'qunit';
import { visit, click, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { Response } from 'miragejs';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Teamwork > Domains', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('shows teamwork domains', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
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

  test('updates domain name', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    assert
      .dom(
        `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
      )
      .exists('should show domain name container');

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`)
      .exists('should show domain name input');
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );

    await click('[data-test-header]');
    domain.reload();
    assert.strictEqual(
      domain.name,
      'new-domain-name',
      'should update domain name'
    );
  });

  test('updates domain alias', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    assert
      .dom(
        `[data-test-domain="${domain.id}"] [data-test-domain-alias-container]`
      )
      .exists('should show domain alias container');

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-alias-container]`
    );

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-edit-alias]`)
      .exists('should show domain alias input');
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-alias]`,
      'new-domain-alias'
    );

    await click('[data-test-header]');
    domain.reload();
    assert.strictEqual(
      domain.alias,
      'new-domain-alias',
      'should update domain alias'
    );
  });

  test('updates domain token', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    assert
      .dom(
        `[data-test-domain="${domain.id}"] [data-test-domain-token-container]`
      )
      .exists('should show domain token container');

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-token-container]`
    );

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-edit-token]`)
      .exists('should show domain token input');
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-token]`,
      'new-domain-token'
    );

    await click('[data-test-header]');
    domain.reload();
    assert.strictEqual(
      domain.token,
      'new-domain-token',
      'should update domain token'
    );
  });

  test('updates domain a single time after multiple changes', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-alias]`,
      'new-domain-alias'
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-token]`,
      'new-domain-token'
    );
    await click('[data-test-header]');

    domain.reload();

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      1,
      'should send PATCH a single time for a single domain update in a reasonable time'
    );

    assert.strictEqual(
      domain.name,
      'new-domain-name',
      'should update domain name'
    );
    assert.strictEqual(
      domain.alias,
      'new-domain-alias',
      'should update domain alias'
    );
    assert.strictEqual(
      domain.token,
      'new-domain-token',
      'should update domain token'
    );
  });

  test('updates domain and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-alias]`,
      'new-domain-alias'
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-token]`,
      'new-domain-token'
    );
    await click('[data-test-header]');

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-edit-rollback]`)
      .exists('should show rollback');
    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-rollback]`
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH'
    );
  });

  test('deletes domain', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-delete]`)
      .exists('should show delete action');

    await click(`[data-test-domain="${domain.id}"] [data-test-domain-delete]`);

    assert
      .dom(`[data-test-domain="${domain.id}"]`)
      .doesNotExist('should remove domain from list');
    assert.notOk(
      this.server.db.entries.find(domain.id),
      'should destroy domain'
    );
  });

  test('deletes domain and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');
    await click(`[data-test-domain="${domain.id}"] [data-test-domain-delete]`);

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-edit-rollback]`)
      .exists('should show rollback');
    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-rollback]`
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'DELETE').length,
      0,
      'should not send DELETE'
    );
  });

  test('allows to retry update on server error', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    this.server.patch('/teamwork/domains/:id', () => new Response(500, {}, {}));

    await visit('/teamwork/config');
    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );
    await click('[data-test-header]');

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-retry]`)
      .exists('should show retry action');

    this.server.patch('/teamwork/domains/:id', 'teamwork/domains');
    await click(`[data-test-domain="${domain.id}"] [data-test-domain-retry]`);

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-retry]`)
      .doesNotExist('should no longer show retry action');

    domain.reload();
    assert.strictEqual(
      domain.name,
      'new-domain-name',
      'should update domain name'
    );
  });

  test('warns on invalid and allows to edit it again', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');
    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      ''
    );
    await click('[data-test-header]');

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not update with invalid name'
    );

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-edit-invalid]`)
      .exists('should show invalid edit action');
    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-invalid]`
    );
    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`)
      .exists('should show domain name input');
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );

    await click('[data-test-header]');

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-edit-invalid]`)
      .doesNotExist('should no longer show invalid edit action');

    domain.reload();
    assert.strictEqual(
      domain.name,
      'new-domain-name',
      'should update domain name'
    );
  });

  test('creates new domain', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    assert
      .dom(`[data-test-domain-new]`)
      .exists('should show new domain action');
    assert
      .dom(`[data-test-domain-new]`)
      .includesText('Create new domain', 'should compute new domain label');

    await click(`[data-test-domain-new]`);

    assert.dom(`[data-test-domain="-1"]`).exists('should show new domain row');

    assert
      .dom(`[data-test-domain="-1"] [data-test-domain-edit-name]`)
      .exists('should edits new domain name');
    assert
      .dom(`[data-test-domain="-1"] [data-test-domain-edit-name]`)
      .isFocused('should focus new domain name');

    await fillIn(
      `[data-test-domain="-1"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );
    await fillIn(
      `[data-test-domain="-1"] [data-test-domain-edit-alias]`,
      'new-domain-alias'
    );
    await fillIn(
      `[data-test-domain="-1"] [data-test-domain-edit-token]`,
      'new-domain-token'
    );
    await click('[data-test-header]');

    assert.strictEqual(
      this.server.db['teamwork/domains'].length,
      1,
      'should have created domain'
    );
    const domain = this.server.db['teamwork/domains'][0];
    assert.strictEqual(domain.name, 'new-domain-name', 'should set name');
    assert.strictEqual(domain.alias, 'new-domain-alias', 'should set alias');
    assert.strictEqual(domain.token, 'new-domain-token', 'should set token');

    assert
      .dom(`[data-test-domain="${domain.id}"]`)
      .exists('should show domain in domains list');
  });

  test('creates new domain and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = this.server.create('user', 'withTeamwork');
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');
    await click(`[data-test-domain-new]`);
    await fillIn(
      `[data-test-domain="-1"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );
    await fillIn(
      `[data-test-domain="-1"] [data-test-domain-edit-alias]`,
      'new-domain-alias'
    );
    await fillIn(
      `[data-test-domain="-1"] [data-test-domain-edit-token]`,
      'new-domain-token'
    );
    await click('[data-test-header]');

    assert
      .dom(`[data-test-domain="-1"] [data-test-domain-edit-rollback]`)
      .exists('should show rollback');
    await click(`[data-test-domain="-1"] [data-test-domain-edit-rollback]`);

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'POST').length,
      0,
      'should not send POST'
    );

    assert
      .dom(`[data-test-domain="-1"]`)
      .doesNotExist('should remove new domain from list after rollback');
  });
});
