import { module, test } from 'qunit';
import { visit, currentURL, findAll, click, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupUtils } from '../utils/setup';
import { Response } from 'miragejs';

module('Acceptance | projects', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/projects');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/projects');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('remains on projects when a valid session token is stored in cookies', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert.strictEqual(currentURL(), '/projects', 'should remains on projects');
  });

  // prettier-ignore
  test('show projects grouped by client', async function (assert) { // eslint-disable-line
    await this.utils.authentication.authenticate();

    this.server.create('project', { name: 'Music' });
    this.server.create('project', { name: 'Dungeon Master' });

    this.server.create('client', { name: 'Efficiency' });

    const client2 = this.server.create('client', { name: 'Productivity' });
    this.server.create('project', { client: client2, name: 'Tactic' });
    this.server.create('project', { client: client2, name: 'Tictoc' });

    const expected = [
      {
        name: 'No client',
        projects: [{ name: 'Dungeon Master' }, { name: 'Music' }],
      },
      {
        name: 'Efficiency',
        projects: [],
      },
      {
        name: 'Productivity',
        projects: [{ name: 'Tactic' }, { name: 'Tictoc' }],
      },
    ];

    await visit('/projects');

    assert
      .dom('[data-test-client-with-projects]')
      .exists({ count: 3 }, 'should show all clients (including "no client")');

    const clients = findAll('[data-test-client-with-projects]');

    expected.forEach(function (clientAttributes, clientIndex) {
      const client = clients[clientIndex];
      const projects = Array.from(
        client.querySelectorAll('[data-test-project]')
      );
      const clientId = `client ${clientIndex + 1}`;

      assert
        .dom(client.querySelector('[data-test-client-name]'))
        .exists(`${clientId} should show its name`);
      assert
        .dom(client.querySelector('[data-test-client-name]'))
        .hasText(clientAttributes.name, `${clientId} should compute its name`);
      assert.strictEqual(
        projects.length,
        clientAttributes.projects ? clientAttributes.projects.length : 0,
        `${clientId} should show its projects`
      );

      clientAttributes.projects.forEach(function (
        projectAttributes,
        projectIndex
      ) {
        const project = projects[projectIndex];
        const projectId = `${clientId} project ${projectIndex + 1}`;
        assert
          .dom(project.querySelector('[data-test-project-name]'))
          .exists(`${projectId} should show its name`);
        assert
          .dom(project.querySelector('[data-test-project-name]'))
          .hasText(
            projectAttributes.name,
            `${projectId} should compute its name`
          );
      });

      assert
        .dom(client.querySelector('[data-test-new-project]'))
        .exists('should show new project action');
      assert
        .dom(client.querySelector('[data-test-new-project]'))
        .includesText(
          'Create new project',
          'should show new project action label'
        );
    });
  });

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

  test('warn on invalid client and allows to edit it again', async function (assert) {
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

  test('warn on invalid newly created client and delete it on rollback', async function (assert) {
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
