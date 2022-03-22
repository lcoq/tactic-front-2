/* global $ */
import { module, test } from 'qunit';
import {
  visit,
  click,
  typeIn,
  fillIn,
  triggerEvent,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupUtils } from '../../utils/setup';
import moment from 'moment';
import { Response } from 'miragejs';

import mirageGetEntriesRoute from '../../../mirage/routes/get-entries';

module('Acceptance | Index > Running entry', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('starts entry on start click', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    await this.utils.authentication.authenticate();
    await visit('/');
    assert.dom(`[data-test-start-entry]`).exists('should show start button');
    await click(`[data-test-start-entry]`);

    assert.strictEqual(
      this.server.db.entries.length,
      1,
      'should have created entry'
    );
    assert.ok(
      this.server.db.entries[0].startedAt,
      'should have set entry started at'
    );
    assert.notOk(
      this.server.db.entries[0].stoppedAt,
      'should not have stopped entry'
    );
  });

  test('starts entry update the favicon', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    await this.utils.authentication.authenticate();
    await visit('/');

    /* `assert.dom` does not work here, probably because this is "outside" of
       the Ember app root element */
    const $favicon16 = $('[data-test-favicon-16]');
    const $favicon32 = $('[data-test-favicon-32]');

    assert.strictEqual($favicon16.length, 1, 'should have 16x16 favicon');
    assert.strictEqual(
      $favicon16.attr('sizes'),
      '16x16',
      'should have 16x16 favicon size attribute'
    );
    assert.strictEqual(
      $favicon16.attr('href'),
      '/assets/images/favicon-16x16.png',
      'should have non-started 16x16 favicon'
    );

    assert.strictEqual($favicon32.length, 1, 'should have 32x32 favicon');
    assert.strictEqual(
      $favicon32.attr('sizes'),
      '32x32',
      'should have 32x32 favicon size attribute'
    );
    assert.strictEqual(
      $favicon32.attr('href'),
      '/assets/images/favicon-32x32.png',
      'should have non-started 32x32 favicon'
    );

    await click(`[data-test-start-entry]`);

    assert.strictEqual(
      $favicon16.attr('href'),
      '/assets/images/favicon-started-16x16.png',
      'should have started 16x16 favicon after start'
    );
    assert.strictEqual(
      $favicon32.attr('href'),
      '/assets/images/favicon-started-32x32.png',
      'should have started 32x32 favicon after start'
    );
  });

  test('starts entry on title type', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    this.utils.authentication.authenticate();
    await visit('/');
    assert
      .dom(`[data-test-running-entry-title]`)
      .exists('should show running entry title input');
    await typeIn(`[data-test-running-entry-title]`, 'My entry title');

    assert.strictEqual(
      this.server.db.entries.length,
      1,
      'should have created entry'
    );
    assert.ok(
      this.server.db.entries[0].startedAt,
      'should have set entry started at'
    );
    assert.strictEqual(
      this.server.db.entries[0].title,
      'My entry title',
      'should have set entry title'
    );
    assert.notOk(
      this.server.db.entries[0].stoppedAt,
      'should not have stopped entry'
    );
  });

  test('starts entry on project search type', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    const project = this.server.create('project', { name: 'Tactic' });

    await this.utils.authentication.authenticate();
    await visit('/');
    assert
      .dom(`[data-test-running-entry] [data-test-entry-edit-project]`)
      .exists('should show running entry project input');

    await typeIn(
      `[data-test-running-entry] [data-test-entry-edit-project]`,
      'Tacti'
    );

    assert.strictEqual(
      this.server.db.entries.length,
      1,
      'should have created entry'
    );
    assert.ok(
      this.server.db.entries[0].startedAt,
      'should have set entry started at'
    );
    assert.notOk(
      this.server.db.entries[0].stoppedAt,
      'should not have stopped entry'
    );

    assert
      .dom(`[data-test-running-entry] [data-test-entry-edit-project-choice]`)
      .exists('should show projects choice list');

    await click(
      `[data-test-running-entry] [data-test-entry-edit-project-choice]`
    );
    assert.strictEqual(
      this.server.db.entries[0].projectId,
      `${project.id}`,
      'should set project'
    );
  });

  test('starts entry allows to retry save on server error', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    await this.utils.authentication.authenticate();
    this.server.post('/entries', () => new Response(500, {}, {}));
    await visit('/');
    await typeIn(`[data-test-running-entry-title]`, 'My entry title');

    assert
      .dom(`[data-test-running-entry-retry]`)
      .exists('should show entry save retry action');

    this.server.post('/entries');

    await click(`[data-test-running-entry-retry]`);
    assert
      .dom(`[data-test-running-entry-retry]`)
      .doesNotExist('should remove entry save retry action after save');

    assert.ok(
      this.server.db.entries.findBy({
        title: 'My entry title',
        stoppedAt: null,
      }),
      'should save entry on retry'
    );
  });

  test('loads the running entry when it exists', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    const user = await this.utils.authentication.authenticate();
    const project = this.server.create('project', { name: 'Tactic' });
    const runningEntry = this.server.create(
      'entry',
      {
        user,
        title: 'My running entry',
        project: project,
        startedAt: moment().subtract(2, 'h').subtract(1, 'm').toDate(),
      },
      'running'
    );

    this.server.get(
      '/entries',
      mirageGetEntriesRoute.runningEntry(runningEntry)
    );

    await visit('/');
    assert
      .dom(`[data-test-start-entry]`)
      .doesNotExist('should not show start button');
    assert.dom(`[data-test-stop-entry]`).exists('should show stop button');
    assert
      .dom(`[data-test-running-entry] [data-test-running-entry-title]`)
      .hasValue('My running entry', 'should set running entry title');
    assert
      .dom(`[data-test-running-entry] [data-test-entry-edit-project]`)
      .hasValue('Tactic', 'should set running entry project name');
    assert
      .dom(`[data-test-running-entry] [data-test-running-entry-duration]`)
      .exists('should show running entry duration');
    assert
      .dom(`[data-test-running-entry] [data-test-running-entry-duration]`)
      .includesText('02:', 'should compute running entry duration');
  });

  test('updates entry on title paste', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    const user = await this.utils.authentication.authenticate();
    const runningEntry = this.server.create('entry', { user }, 'running');

    this.server.get(
      '/entries',
      mirageGetEntriesRoute.runningEntry(runningEntry)
    );

    await visit('/');

    await fillIn(
      `[data-test-running-entry-title]`,
      'New title'
    ); /* `fillIn` doesn't trigger keyUp */
    await triggerEvent(
      `[data-test-running-entry] [data-test-running-entry-title]`,
      'paste'
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      1,
      'should udpate entry on title paste'
    );

    runningEntry.reload();
    assert.strictEqual(
      runningEntry.title,
      'New title',
      'should update running entry title'
    );
  });

  test('stops the running entry', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    const user = await this.utils.authentication.authenticate();
    const project = this.server.create('project', { name: 'Tactic' });
    const runningEntry = this.server.create(
      'entry',
      {
        user,
        title: 'My running entry',
        project: project,
        startedAt: moment().subtract(2, 'h').subtract(1, 'm').toDate(),
      },
      'running'
    );

    this.server.get(
      '/entries',
      mirageGetEntriesRoute.runningEntry(runningEntry)
    );

    await visit('/');
    await click(`[data-test-stop-entry]`);

    assert
      .dom(`[data-test-start-entry]`)
      .exists('should show start button after stop');

    runningEntry.reload();
    assert.ok(runningEntry.stoppedAt, 'should set stopped at on running entry');

    assert
      .dom(`[data-test-entry="${runningEntry.id}"]`)
      .exists('should show stopped entry in list');
    assert
      .dom(`[data-test-entry="${runningEntry.id}"] [data-test-entry-title]`)
      .hasText('My running entry', 'should show stopped entry title in list');
  });

  test('saves entry stopped locally but resulted in server error before saving new running entry', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();

    const user = await this.utils.authentication.authenticate();
    const runningEntry = this.server.create('entry', { user }, 'running');
    this.server.get(
      '/entries',
      mirageGetEntriesRoute.runningEntry(runningEntry)
    );

    this.server.patch('/entries/:id', () => new Response(500, {}, {}));
    this.server.post('/entries', () => new Response(500, {}, {}));

    await visit('/');
    await click(`[data-test-stop-entry]`);
    await click(`[data-test-start-entry]`);
    await typeIn(`[data-test-running-entry-title]`, 'My entry title');

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'POST').length,
      0,
      'should not save new running entry before previous running entry stop success'
    );
  });
});
