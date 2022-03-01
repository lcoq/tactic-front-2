import { module, test } from 'qunit';
import { visit, click, fillIn, typeIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Reviews > Entries', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('updates entry title', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').add(1, 'd'),
    });

    await visit('/reviews');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`,
      'My new entry title'
    );

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.strictEqual(
      entry.title,
      'My new entry title',
      'should update entry title'
    );
  });

  test('updates project and moves the entry to the new project list', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').add(1, 'd'),
    });

    const client = this.server.create('client', { name: 'Productivity' });
    const projectTactic = this.server.create('project', { name: 'Tactic', client });

    await visit('/reviews');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-project]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-project]`)
      .exists('should show project edit');
    await typeIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-project]`,
      'Tacti'
    );

    assert
      .dom(
        `[data-test-entry="${entry.id}"] [data-test-entry-edit-project-choice]`
      )
      .exists('should show projects choice list');

    assert
      .dom(`[data-test-project-group="-1"] [data-test-entry="${entry.id}"]`)
      .exists('should show entry in the initial project group');
    assert
      .dom(
        `[data-test-project-group="${projectTactic.id}"] [data-test-entry="${entry.id}"]`
      )
      .doesNotExist('should not show entry in the future project group');

    await click(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-project-choice]`
    );

    entry.reload();
    assert.strictEqual(
      entry.project.name,
      'Tactic',
      'should update entry project'
    );

    assert
      .dom(`[data-test-project-group="-1"] [data-test-entry="${entry.id}"]`)
      .doesNotExist('should not show entry in the old project group');
    assert
      .dom(
        `[data-test-project-group="${projectTactic.id}"] [data-test-entry="${entry.id}"]`
      )
      .exists('should show entry in the new project group');
    assert
      .dom(
        `[data-test-entry="${entry.id}"] [data-test-project="${projectTactic.id}"]`
      )
      .exists('should show project entry in the entry');
  });

  test('deletes entry and removes it from the project list', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });
    const project = this.server.create('project', { name: 'Tactic' });
    this.server.create('entry', { user, project });
    const entry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').add(1, 'd'),
    });

    await visit('/reviews');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`)
      .exists('should show delete action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);

    assert
      .dom(`[data-test-entry="${entry.id}"]`)
      .doesNotExist('should remove entry from list');
    assert.notOk(this.server.db.entries.find(entry.id), 'should destroy entry');
  });

  test('deletes entry removes the project and client when empty', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const client = this.server.create('client', { name: 'Productivity' });
    const project = this.server.create('project', { client, name: 'Tactic' });
    const entry = this.server.create('entry', {
      user,
      project,
      startedAt: moment().startOf('month').add(1, 'd'),
    });

    await visit('/reviews');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`)
      .exists('should show delete action');

    assert.dom(`[data-test-entry="${entry.id}"]`).exists('should show entry');
    assert
      .dom(`[data-test-project-group="${project.id}"]`)
      .exists('should show project');
    assert
      .dom(`[data-test-client-group="${client.id}"]`)
      .exists('should show client');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);

    assert
      .dom(`[data-test-entry="${entry.id}"]`)
      .doesNotExist('should remove entry from list');
    assert
      .dom(`[data-test-project-group="${project.id}"]`)
      .doesNotExist('should remove project from list');
    assert
      .dom(`[data-test-client-group="${client.id}"]`)
      .doesNotExist('should remove client from list');
  });
});
