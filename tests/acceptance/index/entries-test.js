import { module, test } from 'qunit';
import {
  visit,
  click,
  fillIn,
  typeIn,
  triggerKeyEvent,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';
import { Response } from 'miragejs';

import { setupUtils } from '../../utils/setup';
import mirageGetEntriesRoute from '../../../mirage/routes/get-entries';

module('Acceptance | Index > Entries', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('updates entry title', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`)
      .exists('should show title edit');
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

  test('updates entry started at', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-started-at]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`)
      .exists('should show started at edit');
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`,
      '02:05'
    );

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.strictEqual(
      moment(entry.startedAt).format('HH:mm'),
      '02:05',
      'should update entry started at'
    );
  });

  test('updates entry stopped at', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-stopped-at]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`)
      .exists('should show stopped at edit');
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`,
      '02:05'
    );

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.strictEqual(
      moment(entry.stoppedAt).format('HH:mm'),
      '02:05',
      'should update entry stopped at'
    );
  });

  test('updates entry stopped at after duration update', async function (assert) {
    const user = await this.utils.authentication.authenticate();

    const startedAt = moment()
      .startOf('day')
      .add(1, 'h')
      .add(3, 'm')
      .add(5, 's')
      .toDate();

    const entry = this.server.create('entry', { startedAt, user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-duration]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-duration]`)
      .exists('should show duration edit');
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-duration]`,
      '00:08:00'
    );

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.strictEqual(
      entry.stoppedAt,
      moment(startedAt).add(8, 'm').toISOString(),
      'should update entry stopped at'
    );
  });

  test('updates project', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });

    this.server.create('project', { name: 'Tactic' });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
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

    await click(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-project-choice]`
    );

    entry.reload();
    assert.strictEqual(
      entry.project.name,
      'Tactic',
      'should update entry project'
    );
  });

  test('updates started at and stopped at date', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const startedAt = moment()
      .startOf('day')
      .subtract(1, 'day')
      .add(5, 'h')
      .add(3, 'm');
    const stoppedAt = moment()
      .startOf('day')
      .subtract(1, 'day')
      .add(5, 'h')
      .add(5, 'm');
    const entry = this.server.create('entry', { startedAt, stoppedAt, user });

    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`)
      .exists('should show edit date action');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] .ui-datepicker-calendar`)
      .exists('should show datepicker calendar');
    assert
      .dom(`[data-test-entry="${entry.id}"] .ui-datepicker-today`)
      .exists('should show datepicker today');

    await click(`[data-test-entry="${entry.id}"] .ui-datepicker-today a`);

    entry.reload();
    assert.strictEqual(
      entry.startedAt,
      moment(startedAt).dayOfYear(moment().dayOfYear()).toISOString(),
      'should update entry started at'
    );
    assert.strictEqual(
      entry.stoppedAt,
      moment(stoppedAt).dayOfYear(moment().dayOfYear()).toISOString(),
      'should update entry stopped at'
    );
  });

  test('continues entry edit on calendar previous month click', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').add(2, 'd'),
    });
    await visit('/');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`);
    assert
      .dom(`[data-test-entry="${entry.id}"] .ui-datepicker-calendar`)
      .exists('should show datepicker calendar');

    await click(`[data-test-entry="${entry.id}"] .ui-datepicker-prev`); // move to previous month
    assert
      .dom(`[data-test-entry="${entry.id}"] .ui-datepicker-calendar`)
      .exists('should continue to show datepicker calendar');

    await click(`.ui-datepicker-calendar [data-date="1"]`); // select 1st day of previous month

    entry.reload();
    assert.strictEqual(
      entry.startedAt,
      moment().startOf('month').subtract(1, 'month').toISOString(),
      'should update entry started at'
    );
  });

  test('updates entry a single time after multiple changes', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`)
      .exists('should show title edit');

    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`,
      'My new entry title'
    );
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`,
      '02:05'
    );
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`,
      '03:06'
    );
    await click('[data-test-header]'); // send focusout

    entry.reload();

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      1,
      'should send PATCH a single time for a single entry update in a reasonable time'
    );

    assert.strictEqual(
      entry.title,
      'My new entry title',
      'should update entry title'
    );
    assert.strictEqual(
      moment(entry.startedAt).format('HH:mm'),
      '02:05',
      'should update entry started at'
    );
    assert.strictEqual(
      moment(entry.stoppedAt).format('HH:mm'),
      '03:06',
      'should update entry stopped at'
    );
  });

  test('updates entry and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', {
      user,
      title: 'My initial title',
      startedAt: '2022-02-22T18:45:40.000Z',
      stoppedAt: '2022-02-22T18:50:00.000Z',
    });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`,
      'My new entry title'
    );
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`,
      '02:05'
    );
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`,
      '03:06'
    );

    await click('[data-test-header]');

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`)
      .exists('should show rollback');
    await click(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH entry'
    );

    entry.reload();
    assert.strictEqual(
      entry.title,
      'My initial title',
      'should not have updated entry title'
    );
    assert.strictEqual(
      entry.startedAt,
      '2022-02-22T18:45:40.000Z',
      'should not have updated entry started at'
    );
    assert.strictEqual(
      entry.stoppedAt,
      '2022-02-22T18:50:00.000Z',
      'should not have updated entry stopped at'
    );
  });

  test('updates entry and rollback without updating project', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    const project = this.server.create('project', { name: 'Tactic' });
    const entry = this.server.create('entry', { user, project });

    await visit('/');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`,
      'My new entry title'
    );
    await click('[data-test-header]');
    await click(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH entry'
    );

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-project]`)
      .hasText('Tactic', 'should keep initial project');
  });

  test('clears project', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const project = this.server.create('project', { name: 'Tactic' });
    const entry = this.server.create('entry', { user, project });

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-project]`);
    await triggerKeyEvent(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-project]`,
      'keyup',
      'Enter'
    );

    entry.reload();
    assert.notOk(entry.project, 'should clear entry project');
  });

  test('deletes entry', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });
    const entry = this.server.create('entry', { user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`)
      .exists('should show delete action');

    this.server.get('/entries', mirageGetEntriesRoute.default()); // needed to avoid sending the previously deleted entry

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);

    assert
      .dom(`[data-test-entry="${entry.id}"]`)
      .doesNotExist('should remove entry from list');
    assert.notOk(this.server.db.entries.find(entry.id), 'should destroy entry');
  });

  test('deletes entry and rollback', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });
    const entry = this.server.create('entry', { user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`)
      .exists('should show delete action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`)
      .exists('should show rollback');
    await click(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`
    );

    assert
      .dom(`[data-test-entry="${entry.id}"]`)
      .exists('should keep entry in list');
    assert.ok(
      this.server.db.entries.find(entry.id),
      'should not have destroyed entry'
    );
  });

  test('allows to retry entry update on server error', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));
    this.server.patch('/entries/:id', () => new Response(500, {}, {}));

    await visit('/');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-retry]`)
      .doesNotExist('should not show retry action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`,
      'My new entry title'
    );
    await click('[data-test-header]'); // send focusout
    assert.dom('[data-test-entry-retry]').exists('should show retry action');

    this.server.patch('/entries/:id');
    await click('[data-test-entry-retry]');
    assert
      .dom('[data-test-entry-retry]')
      .doesNotExist('should no longer show retry action');

    entry.reload();
    assert.strictEqual(
      entry.title,
      'My new entry title',
      'should update entry title'
    );
  });

  test('allows to retry entry deletion on server error', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));
    this.server.delete('/entries/:id', () => new Response(500, {}, {}));

    await visit('/');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-retry]`)
      .doesNotExist('should not show retry action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);
    assert.dom('[data-test-entry-retry]').exists('should show retry action');

    this.server.get('/entries', mirageGetEntriesRoute.default()); // needed to avoid sending the previously deleted entry

    this.server.delete('/entries/:id');
    await click('[data-test-entry-retry]');
    assert
      .dom('[data-test-entry-retry]')
      .doesNotExist('should no longer show retry action');

    assert.notOk(this.server.db.entries.find(entry.id), 'should destroy entry');
  });

  test('restarts entry', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    const user = await this.utils.authentication.authenticate();
    const project = this.server.create('project', { name: 'Tactic' });
    const entry = this.server.create('entry', {
      user,
      title: 'My old entry title',
      project: project,
    });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-restart]`)
      .exists('should show restart action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-restart]`);
    assert.dom(`[data-test-stop-entry]`).exists('should show stop button');
    assert
      .dom(`[data-test-running-entry] [data-test-running-entry-title]`)
      .hasValue('My old entry title', 'should set running entry title');
    assert
      .dom(`[data-test-running-entry] [data-test-entry-edit-project]`)
      .hasValue('Tactic', 'should set running entry project name');
    assert
      .dom(`[data-test-running-entry] [data-test-running-entry-duration]`)
      .includesText('00:00:', 'should starts entry timer');
  });

  test('restarts entry stop the running and restart the entry', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    const user = await this.utils.authentication.authenticate();
    const runningEntry = this.server.create('entry', { user }, 'running');
    this.server.get(
      '/entries',
      mirageGetEntriesRoute.runningEntry(runningEntry)
    );

    const project = this.server.create('project', { name: 'Tactic' });
    const entry = this.server.create('entry', {
      user,
      title: 'My old entry title',
      project: project,
    });

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-restart]`);

    runningEntry.reload();
    assert.ok(
      runningEntry.stoppedAt,
      'should stop the previously running entry'
    );

    assert.dom(`[data-test-stop-entry]`).exists('should show stop button');
    assert
      .dom(`[data-test-running-entry] [data-test-running-entry-title]`)
      .hasValue('My old entry title', 'should set running entry title');
    assert
      .dom(`[data-test-running-entry] [data-test-entry-edit-project]`)
      .hasValue('Tactic', 'should set running entry project name');

    const newEntry = this.server.db.entries.findBy({ stoppedAt: null });
    assert.ok(newEntry, 'should start new entry');
    assert.strictEqual(
      newEntry.title,
      'My old entry title',
      'should set new entry title'
    );
    assert.strictEqual(
      newEntry.projectId,
      project.id,
      'should set new entry project'
    );
  });

  test('restarts entry stop the running and restart the entry even when the stop results in server error', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    const user = await this.utils.authentication.authenticate();
    const runningEntry = this.server.create('entry', { user }, 'running');
    this.server.get(
      '/entries',
      mirageGetEntriesRoute.runningEntry(runningEntry)
    );

    const project = this.server.create('project', { name: 'Tactic' });
    const entry = this.server.create('entry', {
      user,
      title: 'My old entry title',
      project: project,
    });

    this.server.patch('/entries/:id', () => new Response(500, {}, {}));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-restart]`);

    assert
      .dom(`[data-test-entry="${runningEntry.id}"]`)
      .exists('should move the running entry to the entry list');
    assert
      .dom(`[data-test-entry="${runningEntry.id}"] [data-test-entry-retry]`)
      .exists('should show retry on the entry that cannot be stopped');

    assert.dom(`[data-test-stop-entry]`).exists('should show stop button');
    assert
      .dom(`[data-test-running-entry] [data-test-running-entry-title]`)
      .hasValue('My old entry title', 'should set running entry title');
    assert
      .dom(`[data-test-running-entry] [data-test-entry-edit-project]`)
      .hasValue('Tactic', 'should set running entry project name');
  });
});
