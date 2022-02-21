import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { setupUtils } from '../utils/setup';
import { Response } from 'miragejs';
import moment from 'moment';

function isCurrentWeekRequest(request, userId) {
  const params = request.queryParams;
  return params['filter[current-week]'] === '1' &&
    params['filter[user-id]'].length === 1 &&
    params['filter[user-id]'][0] === `${userId}`;
}

function isCurrentMonthRequest(request, userId) {
  const params = request.queryParams;
  return params['filter[current-month]'] === '1' &&
    params['filter[user-id]'].length === 1 &&
    params['filter[user-id]'][0] === `${userId}`;
}

module('Acceptance | application', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('shows login link when authenticated', async function (assert) {
    await this.utils.authenticate();
    await visit('/');
    assert
      .dom('[data-test-login-link]')
      .exists('should have link to login page');
    assert
      .dom('[data-test-login-link]')
      .hasAttribute('href', '/login', 'should links to login page');
  });

  test('shows index link when authenticated', async function (assert) {
    await this.utils.authenticate();
    await visit('/');
    assert
      .dom('[data-test-index-link]')
      .exists('should have link to index page');
    assert
      .dom('[data-test-index-link]')
      .hasAttribute('href', '/', 'should links to index page');
  });

  test('shows week user summary when authenticated', async function (assert) {
    const user = await this.utils.authenticate();

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

    this.server.get('/entries', (schema, request) => {
      if (isCurrentWeekRequest(request, user.id)) {
        done();
        return schema.entries.find(weekEntries.mapBy('id'));
      } else {
        return schema.entries.all();
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
    const user = await this.utils.authenticate();

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
        return schema.entries.all();
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
});
