import { module, test } from 'qunit';
import { visit, click, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { Response } from 'miragejs';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Projects > Projects', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('updates project', async function (assert) {
    const project = this.server.create('project', { name: 'Tactic' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-project="${project.id}"]`)
      .exists('should show project');
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-name]`)
      .exists('should show project name');
    await click(`[data-test-project="${project.id}"] [data-test-project-name]`);
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-edit-name]`)
      .exists('should show project name input');
    await fillIn(
      `[data-test-project="${project.id}"] [data-test-project-edit-name]`,
      'My new project name'
    );
    await click('[data-test-header]');
    project.reload();
    assert.strictEqual(
      project.name,
      'My new project name',
      'should update project name'
    );
  });

  test('updates project and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const project = this.server.create('project', { name: 'Tactic' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-project="${project.id}"]`)
      .exists('should show project');
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-name]`)
      .exists('should show project name');
    await click(`[data-test-project="${project.id}"] [data-test-project-name]`);
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-edit-name]`)
      .exists('should show project name input');
    await fillIn(
      `[data-test-project="${project.id}"] [data-test-project-edit-name]`,
      'My new project name'
    );
    await click('[data-test-header]');
    assert
      .dom(
        `[data-test-project="${project.id}"] [data-test-project-edit-rollback]`
      )
      .exists('should show rollback');
    await click(
      `[data-test-project="${project.id}"] [data-test-project-edit-rollback]`
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH project'
    );
    project.reload();
    assert.strictEqual(
      project.name,
      'Tactic',
      'should not update project name'
    );
  });

  test('deletes project', async function (assert) {
    const project = this.server.create('project', { name: 'Tactic' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-project="${project.id}"]`)
      .exists('should show project');
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-delete]`)
      .exists('should show project delete action');
    await click(
      `[data-test-project="${project.id}"] [data-test-project-delete]`
    );
    assert
      .dom(`[data-test-project="${project.id}"]`)
      .doesNotExist('should remove project from list');
    assert.notOk(
      this.server.db.projects.find(project.id),
      'should destroy project'
    );
  });

  test('deletes project and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const project = this.server.create('project', { name: 'Tactic' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-project="${project.id}"]`)
      .exists('should show project');
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-delete]`)
      .exists('should show project delete action');
    await click(
      `[data-test-project="${project.id}"] [data-test-project-delete]`
    );

    assert
      .dom(
        `[data-test-project="${project.id}"] [data-test-project-edit-rollback]`
      )
      .exists('should show rollback');
    await click(
      `[data-test-project="${project.id}"] [data-test-project-edit-rollback]`
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'DELETE').length,
      0,
      'should not send DELETE project'
    );
    assert.ok(
      this.server.db.projects.find(project.id),
      'should not have destroyed project'
    );
  });

  test('allows to retry project update on server error', async function (assert) {
    const project = this.server.create('project', { name: 'Tactic' });
    await this.utils.authentication.authenticate();
    this.server.patch('/projects/:id', () => new Response(500, {}, {}));

    await visit('/projects');
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-retry]`)
      .doesNotExist('should not show retry action');

    await click(`[data-test-project="${project.id}"] [data-test-project-name]`);
    await fillIn(
      `[data-test-project="${project.id}"] [data-test-project-edit-name]`,
      'My new project name'
    );
    await click('[data-test-header]');
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-retry]`)
      .exists('should show retry action');

    this.server.patch('/projects/:id');
    await click(
      `[data-test-project="${project.id}"] [data-test-project-retry]`
    );
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-retry]`)
      .doesNotExist('should no longer show retry action');

    project.reload();
    assert.strictEqual(
      project.name,
      'My new project name',
      'should update project name'
    );
  });

  test('warns on invalid project and allows to edit it again', async function (assert) {
    const project = this.server.create('project', { name: 'Tactic' });
    await this.utils.authentication.authenticate();
    await visit('/projects');
    assert
      .dom(`[data-test-project="${project.id}"]`)
      .exists('should show project');
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-name]`)
      .exists('should show project name');
    await click(`[data-test-project="${project.id}"] [data-test-project-name]`);
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-edit-name]`)
      .exists('should show project name input');
    await fillIn(
      `[data-test-project="${project.id}"] [data-test-project-edit-name]`,
      ''
    );
    await click('[data-test-header]');

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not updated project with invalid name'
    );

    assert
      .dom(
        `[data-test-project="${project.id}"] [data-test-project-edit-invalid]`
      )
      .exists('should show project invalid edit action');

    await click(
      `[data-test-project="${project.id}"] [data-test-project-edit-invalid]`
    );
    assert
      .dom(`[data-test-project="${project.id}"] [data-test-project-edit-name]`)
      .exists('should show project name input');
    await fillIn(
      `[data-test-project="${project.id}"] [data-test-project-edit-name]`,
      'My new project name'
    );
    await click('[data-test-header]');

    assert
      .dom(
        `[data-test-project="${project.id}"] [data-test-project-edit-invalid]`
      )
      .doesNotExist('should no longer show project invalid edit action');

    project.reload();
    assert.strictEqual(
      project.name,
      'My new project name',
      'should update project name'
    );
  });

  test('creates new project', async function (assert) {
    const client = this.server.create('client');
    await this.utils.authentication.authenticate();
    await visit('/projects');

    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project-new]`
      )
      .exists('should show new project action');
    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project-new]`
      )
      .includesText(
        'Create new project',
        'should show new project action label'
      );

    await click(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-new]`
    );
    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-name]`
      )
      .exists('should show new project name input');
    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-name]`
      )
      .isFocused('should focus new project name input');

    await fillIn(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-name]`,
      'My new project name'
    );
    await click('[data-test-header]');

    assert.strictEqual(
      this.server.db.projects.length,
      1,
      'should have created project'
    );
    assert.strictEqual(
      this.server.db.projects[0].name,
      'My new project name',
      'should have set project name'
    );
    assert.strictEqual(
      this.server.db.projects[0].clientId,
      client.id,
      'should have set project client'
    );

    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project="${this.server.db.projects[0].id}"]`
      )
      .exists('should show project in client projects list');
  });

  test('creates new project and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const client = this.server.create('client');
    await this.utils.authentication.authenticate();
    await visit('/projects');
    await click(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-new]`
    );
    await fillIn(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-name]`,
      'My new project name'
    );
    await click('[data-test-header]');
    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-rollback]`
      )
      .exists('should show rollback');

    await click(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-rollback]`
    );

    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project]`
      )
      .doesNotExist('should have remove unsaved project after rollback');
    assert.strictEqual(
      this.server.db.projects.length,
      0,
      'should not have created project'
    );
  });

  test('warns on invalid newly created project and delete it on rollback', async function (assert) {
    const client = this.server.create('client');
    await this.utils.authentication.authenticate();
    await visit('/projects');
    await click(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-new]`
    );
    await fillIn(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-name]`,
      ''
    );
    await click('[data-test-header]');
    assert.strictEqual(
      this.server.db.projects.length,
      0,
      'should not have created project'
    );
    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-invalid]`
      )
      .exists('should show project invalid edit action');
    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-rollback]`
      )
      .exists('should show project rollback action');

    await click(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-edit-rollback]`
    );
    assert
      .dom(
        `[data-test-client-with-projects="${client.id}"] [data-test-project]`
      )
      .doesNotExist('should have remove unsaved project after rollback');
    assert.strictEqual(
      this.server.db.projects.length,
      0,
      'should not have created project'
    );
  });

  test('edit projects cancel client deletion', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const client = this.server.create('client', { name: 'Productivity' });
    const project = this.server.create('project', { client, name: 'Tactic' });
    await this.utils.authentication.authenticate();
    await visit('/projects');

    await click(`[data-test-client="${client.id}"] [data-test-client-delete]`);

    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-rollback]`)
      .exists('should show client rollback');

    await click(`[data-test-project="${project.id}"] [data-test-project-name]`);

    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-rollback]`)
      .doesNotExist('should no longer show client rollback');

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'DELETE').length,
      0,
      'should not send DELETE client'
    );
    assert.ok(
      this.server.db.clients.find(client.id),
      'should not have destroyed client'
    );

    await click('[data-test-header]'); // ensure no save timer is running after test
  });

  test('build new project cancel client deletion', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const client = this.server.create('client', { name: 'Productivity' });
    this.server.create('project', { client, name: 'Tactic' });
    await this.utils.authentication.authenticate();
    await visit('/projects');

    await click(`[data-test-client="${client.id}"] [data-test-client-delete]`);

    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-rollback]`)
      .exists('should show client rollback');

    await click(
      `[data-test-client-with-projects="${client.id}"] [data-test-project-new]`
    );

    assert
      .dom(`[data-test-client="${client.id}"] [data-test-client-edit-rollback]`)
      .doesNotExist('should no longer show client rollback');

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'DELETE').length,
      0,
      'should not send DELETE client'
    );
    assert.ok(
      this.server.db.clients.find(client.id),
      'should not have destroyed client'
    );

    await click('[data-test-header]'); // ensure no save timer is running after test
  });

  test('rollback project deletion cancel client deletion', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const client = this.server.create('client', { name: 'Productivity' });
    const project = this.server.create('project', { client, name: 'Tactic' });
    await this.utils.authentication.authenticate();
    await visit('/projects');

    await click(
      `[data-test-project="${project.id}"] [data-test-project-delete]`
    );
    await click(`[data-test-client="${client.id}"] [data-test-client-delete]`);
    await click(
      `[data-test-project="${project.id}"] [data-test-project-edit-rollback]`
    );

    await click('[data-test-header]'); // ensure delete timers ends

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'DELETE').length,
      0,
      'should not send DELETE client'
    );
    assert.ok(
      this.server.db.clients.find(client.id),
      'should not have destroyed client'
    );

    await click('[data-test-header]'); // ensure no save timer is running after test
  });

  test('build new project on new client adds it to the right client project group', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    await this.utils.authentication.authenticate();
    await visit('/projects');
    await click('[data-test-client-new]');
    await fillIn(`[data-test-client-edit-name]`, 'My new client name');
    await click('[data-test-header]');
    await click(
      `[data-test-client-with-projects="-1"] [data-test-project-new]`
    );
    await this.utils.sleep(50); // ensure client is now created (with id=1) for next DOM find
    assert
      .dom(`[data-test-client-with-projects="1"] [data-test-project="-1"]`)
      .exists('should add the project in the client group');
  });
});
