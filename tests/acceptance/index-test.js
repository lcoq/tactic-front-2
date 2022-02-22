import { module, test } from 'qunit';
import {
  visit,
  currentURL,
  find,
  findAll,
  click,
  fillIn,
} from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupUtils } from '../utils/setup';
import moment from 'moment';

module('Acceptance | index', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

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

    const dayBeforeYesterdayEntries = [
      this.server.create('entry', {
        user,
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
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('day').add(4, 'h').toDate(),
        stoppedAt: moment().startOf('day').add(11, 'h').add(12, 'm').toDate(),
      }, 'withoutTitle'),
    ];

    const allEntries = [
      ...dayBeforeYesterdayEntries,
      ...yesterdayEntries,
      ...todayEntries,
    ];

    this.server.get('/entries', (schema, request) => {
      return schema.entries.find(allEntries.mapBy('id'));
    });

    await visit('/');

    const expected = [
      {
        title: 'Today',
        duration: '07:12:00',
        entries: [
          {
            title: 'No title',
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
            duration: '01:08:00',
            startedAt: '15:00',
            stoppedAt: '16:08',
          },
          {
            title: 'Deploying Tactic',
            duration: '00:05:13',
            startedAt: '8:00',
            stoppedAt: '8:05',
          },
          {
            title: 'Debugging Tactic',
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
    this.server.get('/entries', (schema, request) => {
      return schema.entries.find([entry.id]);
    });

    await visit('/');
    await click('[data-test-entry-title]');

    assert.dom('[data-test-entry-edit-title]').exists('should show title edit');
    await fillIn('[data-test-entry-edit-title]', 'My new entry title');

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(entry.title, 'My new entry title', 'should update entry title');
  });

  test('updates entry started at', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', (schema, request) => {
      return schema.entries.find([entry.id]);
    });

    await visit('/');
    await click('[data-test-entry-started-at]');

    assert.dom('[data-test-entry-edit-started-at]').exists('should show started at edit');
    await fillIn('[data-test-entry-edit-started-at]', '02:05');

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(moment(entry.startedAt).format('HH:mm'), '02:05', 'should update entry started at');
  });

  test('updates entry stopped at', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', (schema, request) => {
      return schema.entries.find([entry.id]);
    });

    await visit('/');
    await click('[data-test-entry-stopped-at]');

    assert.dom('[data-test-entry-edit-stopped-at]').exists('should show stopped at edit');
    await fillIn('[data-test-entry-edit-stopped-at]', '02:05');

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(moment(entry.stoppedAt).format('HH:mm'), '02:05', 'should update entry stopped at');
  });

  test('updates entry stopped at after duration update', async function (assert) {
    const user = await this.utils.authenticate();

    const startedAt = moment().startOf('day').add(1, 'h').add(3, 'm').add(5, 's').toDate();

    const entry = this.server.create('entry', { startedAt });
    this.server.get('/entries', (schema, request) => {
      return schema.entries.find([entry.id]);
    });

    await visit('/');
    await click('[data-test-entry-duration]');

    assert.dom('[data-test-entry-edit-duration]').exists('should show duration edit');
    await fillIn('[data-test-entry-edit-duration]', '00:08:00');

    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(entry.stoppedAt, moment(startedAt).add(8, 'm').toISOString(), 'should update entry stopped at');
  });

  test('updates entry a single time after multiple changes', async function (assert) {
    const user = await this.utils.authenticate();
    const entry = this.server.create('entry');
    this.server.get('/entries', (schema, request) => {
      return schema.entries.find([entry.id]);
    });

    let patchCount = 0;

    this.server.patch('/entries/:id', function (schema, request) {
      const id = request.params.id;
      const attrs = this.normalizedRequestAttrs();
      patchCount += 1;
      return schema.entries.find(id).update(attrs);
    });

    await visit('/');

    await click('[data-test-entry-title]');
    assert.dom('[data-test-entry-edit-title]').exists('should show title edit');

    await fillIn('[data-test-entry-edit-title]', 'My new entry title');
    await fillIn('[data-test-entry-edit-started-at]', '02:05');
    await fillIn('[data-test-entry-edit-stopped-at]', '03:06');
    await click('[data-test-header]'); // send focusout

    entry.reload();
    assert.equal(patchCount, 1, 'should send PATCH a single time for a single entry update in a reasonable time');

    assert.equal(entry.title, 'My new entry title', 'should update entry title');
    assert.equal(moment(entry.startedAt).format('HH:mm'), '02:05', 'should update entry started at');
    assert.equal(moment(entry.stoppedAt).format('HH:mm'), '03:06', 'should update entry stopped at');
  });


});
