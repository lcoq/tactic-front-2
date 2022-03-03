import { module, test } from 'qunit';
import { visit, click, fillIn, typeIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../../utils/setup';
import mirageGetEntriesRoute from '../../../mirage/routes/get-entries';

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
    const projectTactic = this.server.create('project', {
      name: 'Tactic',
      client,
    });

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
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-project]`)
      .hasText('Tactic', 'should show project entry in the entry');
  });

  test('updates entry and reload summary', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('week').add(1, 'd'),
      stoppedAt: moment().startOf('week').add(1, 'd').add(3, 'h'),
    });

    await visit('/reviews');

    assert
      .dom(`[data-test-user-week-duration]`)
      .hasText('03:00:00', 'should include entry in week duration');
    assert
      .dom(`[data-test-user-month-duration]`)
      .hasText('03:00:00', 'should include entry in month duration');

    this.server.get('/entries', function (schema, request) {
      if (request.queryParams['filter[current-week]'] === '1') {
        return schema.entries.find([]);
      } else if (request.queryParams['filter[current-month]'] === '1') {
        return schema.entries.find([]);
      } else {
        return mirageGetEntriesRoute.default()(schema, request);
      }
    });

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`);
    await click(`[data-test-entry="${entry.id}"] .ui-datepicker-prev`); // move to previous month
    await click(
      `[data-test-entry="${entry.id}"] .ui-datepicker-calendar [data-date="1"]`
    ); // select 1st day of previous month

    assert
      .dom(`[data-test-user-week-duration]`)
      .hasText('00:00:00', 'should no longer include entry in week duration');
    assert
      .dom(`[data-test-user-month-duration]`)
      .hasText('00:00:00', 'should no longer include entry in month duration');
  });

  test('removes entry from list when the new date is out of range', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').add(1, 'd'),
    });

    await visit('/reviews');

    assert.dom(`[data-test-entry="${entry.id}"]`).exists('should show entry');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`);
    await click(`[data-test-entry="${entry.id}"] .ui-datepicker-prev`); // move to previous month
    await click(
      `[data-test-entry="${entry.id}"] .ui-datepicker-calendar [data-date="1"]`
    ); // select 1st day of previous month

    assert
      .dom(`[data-test-entry="${entry.id}"]`)
      .doesNotExist('should no longer show entry');
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

  test('deletes entry and reload summary', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('week').add(1, 'd'),
      stoppedAt: moment().startOf('week').add(1, 'd').add(3, 'h'),
    });

    await visit('/reviews');

    assert
      .dom(`[data-test-user-week-duration]`)
      .hasText('03:00:00', 'should include entry in week duration');
    assert
      .dom(`[data-test-user-month-duration]`)
      .hasText('03:00:00', 'should include entry in month duration');

    this.server.get('/entries', function (schema, request) {
      if (request.queryParams['filter[current-week]'] === '1') {
        return schema.entries.find([]);
      } else if (request.queryParams['filter[current-month]'] === '1') {
        return schema.entries.find([]);
      } else {
        return mirageGetEntriesRoute.default()(schema, request);
      }
    });

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);

    assert
      .dom(`[data-test-user-week-duration]`)
      .hasText('00:00:00', 'should no longer include entry in week duration');
    assert
      .dom(`[data-test-user-month-duration]`)
      .hasText('00:00:00', 'should no longer include entry in month duration');
  });
});
