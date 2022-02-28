import { module, test } from 'qunit';
import { visit, click, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { Response } from 'miragejs';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Projects > Clients', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('updates client', async function (assert) {
    const client = this.server.create('client', { name: 'Productivity' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-client="${client.id}"]`)
      .exists('should show client');
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-name]`)
      .exists('should show client name');
    await click(`[data-test-client="${client.id}"] [data-test-client-name]`);
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-name]`)
      .exists('should show client name input');
    await fillIn(
      `[data-test-client="${client.id}"] [data-test-client-edit-name]`,
      'My new client name'
    );
    await click('[data-test-header]');
    client.reload();
    assert.strictEqual(
      client.name,
      'My new client name',
      'should update client name'
    );
  });

  test('updates client and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const client = this.server.create('client', { name: 'Productivity' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-client="${client.id}"]`)
      .exists('should show client');
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-name]`)
      .exists('should show client name');
    await click(`[data-test-client="${client.id}"] [data-test-client-name]`);
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-name]`)
      .exists('should show client name input');
    await fillIn(
      `[data-test-client="${client.id}"] [data-test-client-edit-name]`,
      'My new client name'
    );
    await click('[data-test-header]');
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-rollback]`)
      .exists('should show rollback');
    await click(
      `[data-test-client="${client.id}"] [data-test-client-edit-rollback]`
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH client'
    );
    client.reload();
    assert.strictEqual(
      client.name,
      'Productivity',
      'should not update client name'
    );
  });

  test('deletes client', async function (assert) {
    const client = this.server.create('client', { name: 'Productivity' });
    this.server.create('project', { client });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-client="${client.id}"]`)
      .exists('should show client');
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-delete]`)
      .exists('should show client delete action');
    await click(`[data-test-client="${client.id}"] [data-test-client-delete]`);
    assert
      .dom(`[data-test-client="${client.id}"]`)
      .doesNotExist('should remove client from list');
    assert.notOk(
      this.server.db.clients.find(client.id),
      'should destroy client'
    );
  });

  test('deletes client and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const client = this.server.create('client', { name: 'Productivity' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-client="${client.id}"]`)
      .exists('should show client');
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-delete]`)
      .exists('should show client delete action');
    await click(`[data-test-client="${client.id}"] [data-test-client-delete]`);

    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-rollback]`)
      .exists('should show rollback');
    await click(
      `[data-test-client="${client.id}"] [data-test-client-edit-rollback]`
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'DELETE').length,
      0,
      'should not send DELETE client'
    );
    assert.ok(
      this.server.db.clients.find(client.id),
      'should not have destroyed client'
    );
  });

  test('allows to retry client update on server error', async function (assert) {
    const client = this.server.create('client', { name: 'Productivity' });
    await this.utils.authentication.authenticate();
    this.server.patch('/clients/:id', () => new Response(500, {}, {}));

    await visit('/projects');
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-retry]`)
      .doesNotExist('should not show retry action');

    await click(`[data-test-client="${client.id}"] [data-test-client-name]`);
    await fillIn(
      `[data-test-client="${client.id}"] [data-test-client-edit-name]`,
      'My new client name'
    );
    await click('[data-test-header]');
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-retry]`)
      .exists('should show retry action');

    this.server.patch('/clients/:id');
    await click(`[data-test-client="${client.id}"] [data-test-client-retry]`);
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-retry]`)
      .doesNotExist('should no longer show retry action');

    client.reload();
    assert.strictEqual(
      client.name,
      'My new client name',
      'should update client name'
    );
  });

  test('warns on invalid client and allows to edit it again', async function (assert) {
    const client = this.server.create('client', { name: 'Productivity' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-client="${client.id}"]`)
      .exists('should show client');
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-name]`)
      .exists('should show client name');
    await click(`[data-test-client="${client.id}"] [data-test-client-name]`);
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-name]`)
      .exists('should show client name input');
    await fillIn(
      `[data-test-client="${client.id}"] [data-test-client-edit-name]`,
      ''
    );
    await click('[data-test-header]');

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not updated client with invalid name'
    );

    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-invalid]`)
      .exists('should show client invalid edit action');

    await click(
      `[data-test-client="${client.id}"] [data-test-client-edit-invalid]`
    );
    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-name]`)
      .exists('should show client name input');
    await fillIn(
      `[data-test-client="${client.id}"] [data-test-client-edit-name]`,
      'My new client name'
    );
    await click('[data-test-header]');

    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-invalid]`)
      .doesNotExist('should no longer show client invalid edit action');

    client.reload();
    assert.strictEqual(
      client.name,
      'My new client name',
      'should update client name'
    );
  });

  test('creates new client', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/projects');

    assert
      .dom('[data-test-client-new]')
      .exists('should show new client action');
    assert
      .dom('[data-test-client-new]')
      .includesText('Create new client', 'should show new client action label');

    await click('[data-test-client-new]');
    assert
      .dom('[data-test-client-edit-name]')
      .exists('should show new client name input');
    assert
      .dom('[data-test-client-edit-name]')
      .isFocused('should focus new client name input');

    await fillIn(`[data-test-client-edit-name]`, 'My new client name');
    await click('[data-test-header]');

    assert.strictEqual(
      this.server.db.clients.length,
      1,
      'should have created client'
    );
    assert.strictEqual(
      this.server.db.clients[0].name,
      'My new client name',
      'should have set client name'
    );
  });

  test('creates new client and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    await this.utils.authentication.authenticate();
    await visit('/projects');
    await click('[data-test-client-new]');
    await fillIn(`[data-test-client-edit-name]`, 'My new client name');
    await click('[data-test-header]');
    assert
      .dom(`[data-test-client-edit-rollback]`)
      .exists('should show rollback');
    await click(`[data-test-client-edit-rollback]`);

    assert
      .dom('[data-test-client]')
      .exists(
        { count: 1 },
        'should have remove unsaved client after rollback (only "No client" remains)'
      );
    assert.strictEqual(
      this.server.db.clients.length,
      0,
      'should not have created client'
    );
  });

  test('warns on invalid newly created client and delete it on rollback', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/projects');
    await click('[data-test-client-new]');
    await fillIn(`[data-test-client-edit-name]`, '');
    await click('[data-test-header]');
    assert.strictEqual(
      this.server.db.clients.length,
      0,
      'should not have created client'
    );
    assert
      .dom(`[data-test-client-edit-invalid]`)
      .exists('should show client invalid edit action');
    assert
      .dom(`[data-test-client-edit-rollback]`)
      .exists('should show client rollback action');

    await click('[data-test-client-edit-rollback]');
    assert
      .dom('[data-test-client]')
      .exists(
        { count: 1 },
        'should have remove unsaved client after rollback (only "No client" remains)'
      );
    assert.strictEqual(
      this.server.db.clients.length,
      0,
      'should not have created client'
    );
  });
});
