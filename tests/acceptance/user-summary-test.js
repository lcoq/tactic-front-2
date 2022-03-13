import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../utils/setup';
import mirageGetEntriesRoute from '../../mirage/routes/get-entries';

function isCurrentWeekRequest(request, userId) {
  const params = request.queryParams;
  return (
    params['filter[current-week]'] === '1' &&
    params['filter[user-id]'].length === 1 &&
    params['filter[user-id]'][0] === `${userId}`
  );
}

function isCurrentMonthRequest(request, userId) {
  const params = request.queryParams;
  return (
    params['filter[current-month]'] === '1' &&
    params['filter[user-id]'].length === 1 &&
    params['filter[user-id]'][0] === `${userId}`
  );
}

module('Acceptance | User summary', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('shows week user summary when authenticated', async function (assert) {
    const user = await this.utils.authentication.authenticate();

    const weekEntries = [
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('week').add(5, 'm').toDate(),
        stoppedAt: moment().startOf('week').add(10, 'm').toDate(),
      }),
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('week').add(1, 'h').toDate(),
        stoppedAt: moment().startOf('week').add(2, 'h').add(15, 's').toDate(),
      }),
    ];

    let done = assert.async();

    this.server.get('/entries', function (schema, request) {
      if (isCurrentWeekRequest(request, user.id)) {
        done();
        return schema.entries.find(weekEntries.mapBy('id'));
      } else {
        return mirageGetEntriesRoute.default()(schema, request);
      }
    });

    await visit('/');
    assert
      .dom('[data-test-user-week-duration]')
      .exists('should show user week duration');
    assert
      .dom('[data-test-user-week-duration]')
      .hasText('01:05:15', 'should show computed user week duration');
  });

  test('shows monthly user summary when authenticated', async function (assert) {
    const user = await this.utils.authentication.authenticate();

    const monthEntries = [
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('month').add(5, 'm').toDate(),
        stoppedAt: moment().startOf('month').add(15, 'm').toDate(),
      }),
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('month').add(1, 'h').toDate(),
        stoppedAt: moment().startOf('month').add(3, 'h').add(18, 's').toDate(),
      }),
    ];

    let done = assert.async();

    this.server.get('/entries', (schema, request) => {
      if (isCurrentMonthRequest(request, user.id)) {
        done();
        return schema.entries.find(monthEntries.mapBy('id'));
      } else {
        return mirageGetEntriesRoute.default()(schema, request);
      }
    });

    await visit('/');
    assert
      .dom('[data-test-user-month-duration]')
      .exists('should show user month duration');
    assert
      .dom('[data-test-user-month-duration]')
      .hasText('02:10:18', 'should show computed user month duration');
  });

  test('rounds week user summary when user has rounding config enabled', async function (assert) {
    const user = this.server.create('user');
    this.server.create('user-config', {
      user,
      id: 'summary-rounding',
      name: 'rounding',
      type: 'boolean',
      description: 'Rounding bool',
      value: true,
    });
    await this.utils.authentication.authenticate(user);

    const weekEntries = [
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('week').add(5, 'm').toDate(),
        stoppedAt: moment().startOf('week').add(10, 'm').toDate(),
      }),
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('week').add(1, 'h').toDate(),
        stoppedAt: moment().startOf('week').add(2, 'h').add(15, 's').toDate(),
      }),
    ];

    this.server.get('/entries', function (schema, request) {
      if (isCurrentWeekRequest(request, user.id)) {
        return schema.entries.find(weekEntries.mapBy('id'));
      } else {
        return mirageGetEntriesRoute.default()(schema, request);
      }
    });

    await visit('/');
    assert
      .dom('[data-test-user-week-duration]')
      .hasText('01:05:00', 'should show rounded computed user week duration');
  });

  test('rounds monthly user summary when user has rounding config enabled', async function (assert) {
    const user = this.server.create('user');
    this.server.create('user-config', {
      user,
      id: 'summary-rounding',
      name: 'rounding',
      type: 'boolean',
      description: 'Rounding bool',
      value: true,
    });
    await this.utils.authentication.authenticate(user);

    const monthEntries = [
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('month').add(5, 'm').toDate(),
        stoppedAt: moment().startOf('month').add(15, 'm').toDate(),
      }),
      this.server.create('entry', {
        user,
        startedAt: moment().startOf('month').add(1, 'h').toDate(),
        stoppedAt: moment().startOf('month').add(3, 'h').add(18, 's').toDate(),
      }),
    ];

    this.server.get('/entries', (schema, request) => {
      if (isCurrentMonthRequest(request, user.id)) {
        return schema.entries.find(monthEntries.mapBy('id'));
      } else {
        return mirageGetEntriesRoute.default()(schema, request);
      }
    });

    await visit('/');
    assert
      .dom('[data-test-user-month-duration]')
      .hasText('02:10:00', 'should show rounded computed user month duration');
  });
});
