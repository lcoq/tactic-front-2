import { module, test, skip } from 'qunit';
import {
  visit,
  currentURL,
  find,
  findAll,
  click,
  fillIn,
  typeIn,
  pauseTest,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupUtils } from '../utils/setup';
import moment from 'moment';
import { Response } from 'miragejs';

import mirageGetEntriesRoute from '../../mirage/routes/get-entries';

function setupStubs (hooks) {
  hooks.beforeEach(function () {
    this.stubbedCallbacks = [];
  });
  hooks.afterEach(function () {
    this.stubbedCallbacks.forEach((callback) => callback());
  });
}

function stub (target, methodName, replacement) {
  const initial = target[methodName];
  target[methodName] = replacement;
  this.stubbedCallbacks.push(() => target[methodName] = initial);
  return initial;
}

/* This stubs the deferer service by removing running entry clock updates.
   This avoids infinite loop issue due to constant restart of the timer.
 */
function stubCreateEntryClock () {
  const deferer = this.owner.lookup('service:deferer');
  const initialLater = stub.call(this, deferer, 'later', function (key) {
    if (key === 'create-entry:clock') {
      return 12345;
    } else {
      return initialLater.apply(deferer, arguments);
    }
  });
}

/* This stubs the deferer service to use native timeout with "reasonable" delay.
   This allows to test `rollback` on entry as `await` will not wait the
   pending save entry state to actually save the entry */
function stubForNativeTimeoutOn (keyForNativeTimeout) {
  const deferer = this.owner.lookup('service:deferer');
  const initialUsesNativeTimeout = stub.call(this, deferer, 'usesNativeTimeout', function (key) {
    if (key === keyForNativeTimeout) {
      return true;
    } else {
      return initialUsesNativeTimeout.call(deferer);
    }
  });
  const initialWait = stub.call(this, deferer, 'wait', function (key) {
    if (key === keyForNativeTimeout) {
      return 10;
    } else {
      return initialWait.call(deferer);
    }
  });
}

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);
  setupStubs(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('remains on index when a valid session token is stored in cookies', async function (assert) {
    await this.utils.authenticate();
    await visit('/');
    assert.strictEqual(currentURL(), '/', 'should remains on index');
  });

  test('shows recent user entries grouped by day', async function (assert) {
    const user = await this.utils.authenticate();

    const projectTactic = this.server.create('project', { name: 'Tactic' });
    const projectOther = this.server.create('project', { name: 'Other' });

    const dayBeforeYesterdayEntries = [
      this.server.create('entry', {
        user,
        project: projectTactic,
        title: 'Debugging Tactic',
        startedAt: moment()
          .startOf('day')
          .subtract(2, 'd')
          .add(3, 'h')
          .toDate(),
        stoppedAt: moment()
          .startOf('day')
          .subtract(2, 'd')
          .add(4, 'h')
          .add(6, 'm')
          .toDate(),
      }),
      this.server.create('entry', {
        user,
        project: projectTactic,
        title: 'Deploying Tactic',
        startedAt: moment()
          .startOf('day')
          .subtract(2, 'd')
          .add(8, 'h')
          .toDate(),
        stoppedAt: moment()
          .startOf('day')
          .subtract(2, 'd')
          .add(8, 'h')
          .add(5, 'm')
          .add(13, 's')
          .toDate(),
      }),
      this.server.create('entry', {
        user,
        project: projectTactic,
        title: 'Prod testing Tactic',
        startedAt: moment()
          .startOf('day')
          .subtract(2, 'd')
          .add(15, 'h')
          .toDate(),
        stoppedAt: moment()
          .startOf('day')
          .subtract(2, 'd')
          .add(16, 'h')
          .add(8, 'm')
          .toDate(),
      }),
    ];

    const yesterdayEntries = [
      this.server.create('entry', {
        user,
        project: projectOther,
        title: 'Eating',
        startedAt: moment()
          .startOf('day')
          .subtract(1, 'd')
          .add(10, 'h')
          .toDate(),
        stoppedAt: moment()
          .startOf('day')
          .subtract(1, 'd')
          .add(10, 'h')
          .add(59, 'm')
          .toDate(),
      }),
    ];

    const todayEntries = [
      this.server.create(
        'entry',
        {
          user,
          startedAt: moment().startOf('day').add(4, 'h').toDate(),
          stoppedAt: moment().startOf('day').add(11, 'h').add(12, 'm').toDate(),
        },
        'withoutTitle'
      ),
    ];

    const allEntries = [
      ...dayBeforeYesterdayEntries,
      ...yesterdayEntries,
      ...todayEntries,
    ];

    this.server.get('/entries', mirageGetEntriesRoute.specificEntries(allEntries));

    await visit('/');

    const expected = [
      {
        title: 'Today',
        duration: '07:12:00',
        entries: [
          {
            title: 'No title',
            project: 'No project',
            duration: '07:12:00',
            startedAt: '4:00',
            stoppedAt: '11:12',
          },
        ],
      },
      {
        title: 'Yesterday',
        duration: '00:59:00',
        entries: [
          {
            title: 'Eating',
            project: 'Other',
            duration: '00:59:00',
            startedAt: '10:00',
            stoppedAt: '10:59',
          },
        ],
      },
      {
        title: moment().startOf('day').subtract(2, 'd').format('ddd[,] D MMM'),
        duration: '02:19:13',
        entries: [
          {
            title: 'Prod testing Tactic',
            project: 'Tactic',
            duration: '01:08:00',
            startedAt: '15:00',
            stoppedAt: '16:08',
          },
          {
            title: 'Deploying Tactic',
            project: 'Tactic',
            duration: '00:05:13',
            startedAt: '8:00',
            stoppedAt: '8:05',
          },
          {
            title: 'Debugging Tactic',
            project: 'Tactic',
            duration: '01:06:00',
            startedAt: '3:00',
            stoppedAt: '4:06',
          },
        ],
      },
    ];

    assert
      .dom('[data-test-entry-group]')
      .exists({ count: 3 }, 'should show 3 groups');
    const groups = findAll('[data-test-entry-group]');

    expected.forEach(function (groupAttributes, groupIndex) {
      const group = groups[groupIndex];
      const entries = Array.from(group.querySelectorAll('[data-test-entry]'));
      const groupId = `group ${groupIndex + 1}`;

      assert
        .dom(group.querySelector('[data-test-entry-group-title]'))
        .exists(`${groupId} should show its title`);
      assert
        .dom(group.querySelector('[data-test-entry-group-title]'))
        .hasText(groupAttributes.title, `${groupId} should compute title`);
      assert
        .dom(group.querySelector('[data-test-entry-group-duration]'))
        .exists(`${groupId} should show its duration`);
      assert
        .dom(group.querySelector('[data-test-entry-group-duration]'))
        .hasText(
          groupAttributes.duration,
          `${groupId} should compute duration`
        );
      assert.equal(
        entries.length,
        groupAttributes.entries.length,
        `${groupId} should show its entries`
      );

      groupAttributes.entries.forEach(function (entryAttributes, entryIndex) {
        const entry = entries[entryIndex];
        const entryId = `${groupId} entry ${entryIndex + 1}`;
        assert
          .dom(entry.querySelector('[data-test-entry-title'))
          .exists(`${entryId} should show entry title`);
        assert
          .dom(entry.querySelector('[data-test-entry-title'))
          .hasText(
            entryAttributes.title,
            `${entryId} should compute entry title`
          );
        assert
          .dom(entry.querySelector('[data-test-entry-project'))
          .exists(`${entryId} should show entry project`);
        assert
          .dom(entry.querySelector('[data-test-entry-project'))
          .hasText(
            entryAttributes.project,
            `${entryId} should compute entry project`
          );
        assert
          .dom(entry.querySelector('[data-test-entry-duration'))
          .exists(`${entryId} should show entry duration`);
        assert
          .dom(entry.querySelector('[data-test-entry-duration'))
          .hasText(
            entryAttributes.duration,
            `${entryId} should compute entry duration`
          );
        assert
          .dom(entry.querySelector('[data-test-entry-started-at'))
          .exists(`${entryId} should show entry started at`);
        assert
          .dom(entry.querySelector('[data-test-entry-started-at'))
          .hasText(
            entryAttributes.startedAt,
            `${entryId} should compute entry started at`
          );
        assert
          .dom(entry.querySelector('[data-test-entry-stopped-at'))
          .exists(`${entryId} should show entry stopped at`);
        assert
          .dom(entry.querySelector('[data-test-entry-stopped-at'))
          .hasText(
            entryAttributes.stoppedAt,
            `${entryId} should compute entry stopped at`
          );
      });
    });
  });

  test('updates entry title', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);

    assert.dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`).exists('should show title edit');
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`, 'My new entry title');

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(
      entry.title,
      'My new entry title',
      'should update entry title'
    );
  });

  test('updates entry started at', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-started-at]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`)
      .exists('should show started at edit');
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`, '02:05');

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(
      moment(entry.startedAt).format('HH:mm'),
      '02:05',
      'should update entry started at'
    );
  });

  test('updates entry stopped at', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-stopped-at]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`)
      .exists('should show stopped at edit');
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`, '02:05');

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(
      moment(entry.stoppedAt).format('HH:mm'),
      '02:05',
      'should update entry stopped at'
    );
  });

  test('updates entry stopped at after duration update', async function (assert) {
    const user = await this.utils.authenticate();

    const startedAt = moment()
      .startOf('day')
      .add(1, 'h')
      .add(3, 'm')
      .add(5, 's')
      .toDate();

    const entry = this.server.create('entry', { startedAt });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-duration]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-duration]`)
      .exists('should show duration edit');
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-duration]`, '00:08:00');

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(
      entry.stoppedAt,
      moment(startedAt).add(8, 'm').toISOString(),
      'should update entry stopped at'
    );
  });

  test('updates project', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');

    const projectTactic = this.server.create('project', { name: 'Tactic' });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-project]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-project]`)
      .exists('should show project edit');
    await typeIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-project]`, 'Tacti');

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-project-choice]`)
      .exists('should show projects choice list');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-project-choice]`);

    entry.reload();
    assert.equal(entry.project.name, 'Tactic', 'should update entry project');
  });

  test('updates started at and stopped at date', async function (assert) {
    const user = await this.utils.authenticate();
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
    const entry = this.server.create('entry', { startedAt, stoppedAt });

    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`)
      .exists('should show edit date action');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] .ui-datepicker-calendar`)
      .exists('should show datepicker calendar');
    assert.dom(`[data-test-entry="${entry.id}"] .ui-datepicker-today`).exists('should show datepicker today');

    await click(`[data-test-entry="${entry.id}"] .ui-datepicker-today a`);

    entry.reload();
    assert.equal(
      entry.startedAt,
      moment(startedAt).dayOfYear(moment().dayOfYear()).toISOString(),
      'should update entry started at'
    );
    assert.equal(
      entry.stoppedAt,
      moment(stoppedAt).dayOfYear(moment().dayOfYear()).toISOString(),
      'should update entry stopped at'
    );
  });

  test('updates entry a single time after multiple changes', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    assert.dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`).exists('should show title edit');

    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`, 'My new entry title');
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`, '02:05');
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`, '03:06');
    await click('[data-test-header]'); // send focusout

    entry.reload();

    assert.equal(
      server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      1,
      'should send PATCH a single time for a single entry update in a reasonable time'
    );

    assert.equal(
      entry.title,
      'My new entry title',
      'should update entry title'
    );
    assert.equal(
      moment(entry.startedAt).format('HH:mm'),
      '02:05',
      'should update entry started at'
    );
    assert.equal(
      moment(entry.stoppedAt).format('HH:mm'),
      '03:06',
      'should update entry stopped at'
    );
  });

  test('updates entry and rollback', async function (assert) {
    stubForNativeTimeoutOn.call(this, 'mutable-record-state-manager:save');

    const user = await this.utils.authenticate();
    const entry = this.server.create('entry', {
      title: 'My initial title',
      startedAt: '2022-02-22T18:45:40.000Z',
      stoppedAt: '2022-02-22T18:50:00.000Z',
    });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`, 'My new entry title');
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-started-at]`, '02:05');
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-stopped-at]`, '03:06');

    await click('[data-test-header]');

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`)
      .exists('should show rollback');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`);

    assert.equal(
      server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH entry'
    );

    entry.reload();
    assert.equal(
      entry.title,
      'My initial title',
      'should not have updated entry title'
    );
    assert.equal(
      entry.startedAt,
      '2022-02-22T18:45:40.000Z',
      'should not have updated entry started at'
    );
    assert.equal(
      entry.stoppedAt,
      '2022-02-22T18:50:00.000Z',
      'should not have updated entry stopped at'
    );
  });

  test('deletes entry', async function (assert) {
    const user = await this.utils.authenticate();
    this.server.create('entry');
    const entry = this.server.create('entry');
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    assert.dom(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`).exists('should show delete action');

    this.server.get('/entries', mirageGetEntriesRoute.default()); // needed to avoid sending the previously deleted entry

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);

    assert.dom(`[data-test-entry="${entry.id}"]`).doesNotExist('should remove entry from list');
    assert.notOk(server.db.entries.find(entry.id), 'should destroy entry');
  });

  test('deletes entry and rollback', async function (assert) {
    stubForNativeTimeoutOn.call(this, 'mutable-record-state-manager:delete');

    const user = await this.utils.authenticate();
    this.server.create('entry');
    const entry = this.server.create('entry');
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    assert.dom(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`).exists('should show delete action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`)
      .exists('should show rollback');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-rollback]`);

    assert.dom(`[data-test-entry="${entry.id}"]`).exists('should keep entry in list');
    assert.ok(server.db.entries.find(entry.id), 'should not have destroyed entry');
  });

  test('allows to retry entry update on server error', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));
    this.server.patch('/entries/:id', () => new Response(500, {}, {}));

    await visit('/');
    assert.dom(`[data-test-entry="${entry.id}"] [data-test-entry-retry]`).doesNotExist('should not show retry action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);
    await fillIn(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`, 'My new entry title');
    await click('[data-test-header]'); // send focusout
    assert.dom('[data-test-entry-retry]').exists('should show retry action');

    this.server.patch('/entries/:id');
    await click('[data-test-entry-retry]');
    assert.dom('[data-test-entry-retry]').doesNotExist('should no longer show retry action');

    entry.reload();
    assert.equal(
      entry.title,
      'My new entry title',
      'should update entry title'
    );
  });

  test('allows to retry entry deletion on server error', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));
    this.server.delete('/entries/:id', () => new Response(500, {}, {}));

    await visit('/');
    assert.dom(`[data-test-entry="${entry.id}"] [data-test-entry-retry]`).doesNotExist('should not show retry action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);
    assert.dom('[data-test-entry-retry]').exists('should show retry action');

    this.server.get('/entries', mirageGetEntriesRoute.default()); // needed to avoid sending the previously deleted entry

    this.server.delete('/entries/:id');
    await click('[data-test-entry-retry]');
    assert.dom('[data-test-entry-retry]').doesNotExist('should no longer show retry action');

    assert.notOk(server.db.entries.find(entry.id), 'should destroy entry');
  });

  test('starts entry on start click', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    await visit('/');
    assert.dom(`[data-test-start-entry]`).exists('should show start button');
    await click(`[data-test-start-entry]`);

    assert.equal(server.db.entries.length, 1, 'should have created entry');
    assert.ok(server.db.entries[0].startedAt, 'should have set entry started at');
    assert.notOk(server.db.entries[0].stoppedAt, 'should not have stopped entry');
  });

  test('starts entry update the favicon', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    await visit('/');

    /* `assert.dom` does not work here, probably because this is "outside" of
       the Ember app root element */
    const $favicon16 = $('[data-test-favicon-16]');
    const $favicon32 = $('[data-test-favicon-32]');

    assert.equal($favicon16.length, 1, 'should have 16x16 favicon');
    assert.equal($favicon16.prop('sizes'), '16x16', 'should have 16x16 favicon size attribute');
    assert.equal($favicon16.attr('href'), '/assets/images/favicon-16x16.png', 'should have non-started 16x16 favicon');

    assert.equal($favicon32.length, 1, 'should have 32x32 favicon');
    assert.equal($favicon32.prop('sizes'), '32x32', 'should have 32x32 favicon size attribute');
    assert.equal($favicon32.attr('href'), '/assets/images/favicon-32x32.png', 'should have non-started 32x32 favicon');

    await click(`[data-test-start-entry]`);

    assert.equal($favicon16.attr('href'), '/assets/images/favicon-started-16x16.png', 'should have started 16x16 favicon after start');
    assert.equal($favicon32.attr('href'), '/assets/images/favicon-started-32x32.png', 'should have started 32x32 favicon after start');
  });

  test('starts entry on title type', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    await visit('/');
    assert.dom(`[data-test-running-entry-title]`).exists('should show running entry title input');
    await typeIn(`[data-test-running-entry-title]`, "My entry title");

    assert.equal(server.db.entries.length, 1, 'should have created entry');
    assert.ok(server.db.entries[0].startedAt, 'should have set entry started at');
    assert.equal(server.db.entries[0].title, "My entry title", 'should have set entry title');
    assert.notOk(server.db.entries[0].stoppedAt, 'should not have stopped entry');
  });

  test('starts entry on project search type', async function (assert) {
    stubCreateEntryClock.call(this);

    const project = this.server.create('project', { name: "Tactic" })

    const user = await this.utils.authenticate();
    await visit('/');
    assert.dom(`[data-test-running-entry] [data-test-entry-edit-project]`).exists('should show running entry project input');

    await typeIn(`[data-test-running-entry] [data-test-entry-edit-project]`, "Tacti");

    assert.equal(server.db.entries.length, 1, 'should have created entry');
    assert.ok(server.db.entries[0].startedAt, 'should have set entry started at');
    assert.notOk(server.db.entries[0].stoppedAt, 'should not have stopped entry');

    assert
      .dom(`[data-test-running-entry] [data-test-entry-edit-project-choice]`)
      .exists('should show projects choice list');

    await click(`[data-test-running-entry] [data-test-entry-edit-project-choice]`);
    assert.equal(server.db.entries[0].projectId, `${project.id}`, 'should set project');
  });

  test('starts entry allows to retry save on server error', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    this.server.post('/entries', () => new Response(500, {}, {}));
    await visit('/');
    await typeIn(`[data-test-running-entry-title]`, "My entry title");

    assert.dom(`[data-test-running-entry-retry]`).exists('should show entry save retry action');

    this.server.post('/entries');

    await click(`[data-test-running-entry-retry]`);
    assert.dom(`[data-test-running-entry-retry]`).doesNotExist('should remove entry save retry action after save');

    assert.ok(server.db.entries.findBy({ title: "My entry title", stoppedAt: null }), 'should save entry on retry');
  });

  test('loads the running entry when it exists', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    const project = this.server.create('project', { name: "Tactic" });
    const runningEntry = this.server.create('entry', {
      title: "My running entry",
      project: project,
      startedAt: moment().subtract(2, 'h').subtract(1, 'm').toDate()
    }, 'running');

    this.server.get('/entries', mirageGetEntriesRoute.runningEntry(runningEntry));

    await visit('/');
    assert.dom(`[data-test-start-entry]`).doesNotExist('should not show start button');
    assert.dom(`[data-test-stop-entry]`).exists('should show stop button');
    assert.dom(`[data-test-running-entry] [data-test-running-entry-title]`).hasValue('My running entry', 'should set running entry title');
    assert.dom(`[data-test-running-entry] [data-test-entry-edit-project]`).hasValue('Tactic', 'should set running entry project name');
    assert.dom(`[data-test-running-entry] [data-test-running-entry-duration]`).exists('should show running entry duration');
    assert.dom(`[data-test-running-entry] [data-test-running-entry-duration]`).includesText('02:', 'should compute running entry duration');
  });

  test('stops the running entry', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    const project = this.server.create('project', { name: "Tactic" });
    const runningEntry = this.server.create('entry', {
      title: "My running entry",
      project: project,
      startedAt: moment().subtract(2, 'h').subtract(1, 'm').toDate()
    }, 'running');

    this.server.get('/entries', mirageGetEntriesRoute.runningEntry(runningEntry));

    await visit('/');
    await click(`[data-test-stop-entry]`);

    assert.dom(`[data-test-start-entry]`).exists('should show start button after stop');

    runningEntry.reload();
    assert.ok(runningEntry.stoppedAt, 'should set stopped at on running entry');

    assert.dom(`[data-test-entry="${runningEntry.id}"]`).exists('should show stopped entry in list');
    assert.dom(`[data-test-entry="${runningEntry.id}"] [data-test-entry-title]`).hasText('My running entry', 'should show stopped entry title in list');
  });

  test('restarts entry', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    const project = this.server.create('project', { name: "Tactic" });
    const entry = this.server.create('entry', {
      title: "My old entry title",
      project: project
    });
    this.server.get('/entries', mirageGetEntriesRoute.specificEntries([entry]));

    await visit('/');
    assert.dom(`[data-test-entry="${entry.id}"] [data-test-entry-restart]`).exists('should show restart action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-restart]`);
    assert.dom(`[data-test-stop-entry]`).exists('should show stop button');
    assert.dom(`[data-test-running-entry] [data-test-running-entry-title]`).hasValue('My old entry title', 'should set running entry title');
    assert.dom(`[data-test-running-entry] [data-test-entry-edit-project]`).hasValue('Tactic', 'should set running entry project name');
  });

  test('restarts entry stop the running and restart the entry', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    const runningEntry = this.server.create('entry', 'running');
    this.server.get('/entries', mirageGetEntriesRoute.runningEntry(runningEntry));

    const project = this.server.create('project', { name: "Tactic" });
    const entry = this.server.create('entry', {
      title: "My old entry title",
      project: project
    });

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-restart]`);

    runningEntry.reload();
    assert.ok(runningEntry.stoppedAt, 'should stop the previously running entry');

    assert.dom(`[data-test-stop-entry]`).exists('should show stop button');
    assert.dom(`[data-test-running-entry] [data-test-running-entry-title]`).hasValue('My old entry title', 'should set running entry title');
    assert.dom(`[data-test-running-entry] [data-test-entry-edit-project]`).hasValue('Tactic', 'should set running entry project name');

    const newEntry = this.server.db.entries.findBy({ stoppedAt: null });
    assert.ok(newEntry, 'should start new entry');
    assert.equal(newEntry.title, 'My old entry title', 'should set new entry title');
    assert.equal(newEntry.projectId, project.id, 'should set new entry project');
  });

  test('restarts entry stop the running and restart the entry even when the stop results in server error', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    const runningEntry = this.server.create('entry', 'running');
    this.server.get('/entries', mirageGetEntriesRoute.runningEntry(runningEntry));

    const project = this.server.create('project', { name: "Tactic" });
    const entry = this.server.create('entry', {
      title: "My old entry title",
      project: project
    });

    this.server.patch('/entries/:id', () => new Response(500, {}, {}));

    await visit('/');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-restart]`);

    assert.dom(`[data-test-entry="${runningEntry.id}"]`).exists('should move the running entry to the entry list');
    assert.dom(`[data-test-entry="${runningEntry.id}"] [data-test-entry-retry]`).exists('should show retry on the entry that cannot be stopped');

    assert.dom(`[data-test-stop-entry]`).exists('should show stop button');
    assert.dom(`[data-test-running-entry] [data-test-running-entry-title]`).hasValue('My old entry title', 'should set running entry title');
    assert.dom(`[data-test-running-entry] [data-test-entry-edit-project]`).hasValue('Tactic', 'should set running entry project name');
  });

  test('saves entry stopped locally but resulted in server error before saving new running entry', async function (assert) {
    stubCreateEntryClock.call(this);

    const user = await this.utils.authenticate();
    const runningEntry = this.server.create('entry', 'running');
    this.server.get('/entries', mirageGetEntriesRoute.runningEntry(runningEntry));

    this.server.patch('/entries/:id', () => new Response(500, {}, {}));
    this.server.post('/entries', () => new Response(500, {}, {}));

    await visit('/');
    await click(`[data-test-stop-entry]`);
    await click(`[data-test-start-entry]`);
    await typeIn(`[data-test-running-entry-title]`, "My entry title");

    assert.equal(
      server.pretender.handledRequests.filterBy('method', 'POST').length,
      0,
      'should not save new running entry before previous running entry stop success'
    );
  });

});
