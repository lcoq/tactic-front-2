import { module, test } from 'qunit';
import { visit, find, click, triggerEvent, select } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';
import { Chart } from 'chart.js';

import { setupUtils } from '../../utils/setup';
import mirageGetStatsRoute from '../../../mirage/routes/get-stats';

module('Acceptance | Stats > Filters', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('groups by day by default', async function (assert) {
    await this.utils.authentication.authenticate();

    this.server.create('entries-stat-group', {
      title: 'My title',
      nature: 'hour/day',
      entriesStats: [],
    });

    await visit('/stats');

    const request = this.server.pretender.handledRequests.find((r) =>
      r.url.match('/stats/daily')
    );
    assert.ok(request, 'should send day group request by default');
  });

  test('filters by current user by default', async function (assert) {
    const user = await this.utils.authentication.authenticate();

    this.server.create('entries-stat-group', {
      title: 'My title',
      nature: 'hour/day',
      entriesStats: [],
    });

    await visit('/stats');

    const request = this.server.pretender.handledRequests.find((r) =>
      r.url.match('/stats/daily')
    );
    assert.strictEqual(
      request.queryParams['filter[user-id]'].length,
      1,
      'should send 1 user id filter'
    );
    assert.strictEqual(
      request.queryParams['filter[user-id]'][0],
      user.id,
      'should send current user user id filter'
    );

    assert.strictEqual(
      Object.keys(Chart.instances).length,
      1,
      'should show chart'
    );
    const chart = Object.values(Chart.instances)[0];
    assert.strictEqual(
      chart.config.options.plugins.title.text,
      'My title',
      'should show chart title'
    );
  });

  test('filters by current month by default', async function (assert) {
    await this.utils.authentication.authenticate();

    this.server.create('entries-stat-group', {
      title: 'My title',
      nature: 'hour/day',
      entriesStats: [],
    });

    await visit('/stats');

    const request = this.server.pretender.handledRequests.find((r) =>
      r.url.match('/stats/daily')
    );
    assert.strictEqual(
      request.queryParams['filter[since]'],
      moment().startOf('month').toISOString(),
      'should set since filter to start of month'
    );
    assert.strictEqual(
      request.queryParams['filter[before]'],
      moment().endOf('month').toISOString(),
      'should set before filter to end of month'
    );

    assert.strictEqual(
      Object.keys(Chart.instances).length,
      1,
      'should show chart'
    );
    const chart = Object.values(Chart.instances)[0];
    assert.strictEqual(
      chart.config.options.plugins.title.text,
      'My title',
      'should show chart title'
    );
  });

  test('filters with all clients & projects by default', async function (assert) {
    await this.utils.authentication.authenticate();

    const client = this.server.create('client');
    const otherClient = this.server.create('client');
    const allProjects = [
      this.server.create('project', { client }),
      this.server.create('project', { client: otherClient }),
      this.server.create('project'),
    ];

    this.server.create('entries-stat-group', {
      title: 'My title',
      nature: 'hour/day',
      entriesStats: [],
    });

    await visit('/stats');

    const request = this.server.pretender.handledRequests.find((r) =>
      r.url.match('/stats/daily')
    );
    assert.strictEqual(
      request.queryParams['filter[project-id]'].length,
      allProjects.length + 1,
      'should send all projects ids including "0" in project-id filter'
    );

    assert.strictEqual(
      Object.keys(Chart.instances).length,
      1,
      'should show chart'
    );
    const chart = Object.values(Chart.instances)[0];
    assert.strictEqual(
      chart.config.options.plugins.title.text,
      'My title',
      'should show chart title'
    );
  });

  test('filters by user', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const otherUser = this.server.create('user');

    const group = this.server.create('entries-stat-group', {
      title: 'My title',
      nature: 'hour/day',
      entriesStats: [],
    });

    const otherGroup = this.server.create('entries-stat-group', {
      title: 'My filtered title',
      nature: 'hour/day',
      entriesStats: [],
    });

    this.server.get(
      '/stats/daily',
      mirageGetStatsRoute.dailyFilters(
        group,
        (_, r) =>
          r.queryParams['filter[user-id]'].length === 1 &&
          r.queryParams['filter[user-id]'][0] === user.id
      )
    );

    await visit('/stats');

    assert.strictEqual(
      Object.keys(Chart.instances).length,
      1,
      'should show chart'
    );
    let chart = Object.values(Chart.instances)[0];
    assert.strictEqual(
      chart.config.options.plugins.title.text,
      'My title',
      'should show filtered chart title'
    );

    this.server.get(
      '/stats/daily',
      mirageGetStatsRoute.dailyFilters(
        otherGroup,
        (_, r) =>
          r.queryParams['filter[user-id]'].length === 1 &&
          r.queryParams['filter[user-id]'][0] === otherUser.id
      )
    );

    await click(`[data-test-filter-user="${otherUser.id}"]`);
    await click(`[data-test-filter-user="${user.id}"]`); // uncheck
    await triggerEvent(find('[data-test-filter-user-container]'), 'mouseleave');

    assert.strictEqual(
      Object.keys(Chart.instances).length,
      1,
      'should show chart'
    );
    chart = Object.values(Chart.instances)[0];
    assert.strictEqual(
      chart.config.options.plugins.title.text,
      'My filtered title',
      'should show filtered chart title'
    );
  });

  test('groups by day or month', async function (assert) {
    await this.utils.authentication.authenticate();

    this.server.create('entries-stat-group', {
      title: 'My title',
      nature: 'hour/day',
      entriesStats: [],
    });

    await visit('/stats');

    assert.dom('[data-test-filter-group]').exists('should show group filter');
    assert
      .dom('[data-test-filter-group]')
      .hasValue('day', 'should have group set to day by default');

    this.server.create('entries-stat-group', {
      title: 'My filtered title',
      nature: 'hour/month',
      entriesStats: [],
    });

    await select('[data-test-filter-group]', 'month');
    assert
      .dom('[data-test-filter-group]')
      .hasValue('month', 'should have group set to month');

    const request = this.server.pretender.handledRequests.find((r) =>
      r.url.match('/stats/monthly')
    );
    assert.ok(request, 'should send monthly group request by default');

    assert.strictEqual(
      Object.keys(Chart.instances).length,
      1,
      'should show chart'
    );
    const chart = Object.values(Chart.instances)[0];
    assert.strictEqual(
      chart.config.options.plugins.title.text,
      'My filtered title',
      'should show filtered chart title'
    );
  });

  test('filters are updated after client or project creation', async function (assert) {
    const user = await this.utils.authentication.authenticate();

    const client1 = this.server.create('client');
    const client1Project1 = this.server.create('project', { client: client1 });

    this.server.create('entries-stat-group', {
      title: 'My title',
      nature: 'hour/day',
      entriesStats: [],
    });

    await visit('/stats');

    assert
      .dom(`[data-test-filter-client]`)
      .exists({ count: 2 }, 'should show client 1 and no client filter');
    assert
      .dom(`[data-test-filter-project]`)
      .exists({ count: 2 }, 'should show project 1 and no project filter');

    await visit('/');

    const newClient = this.server.create('client');
    const newProject = this.server.create('project', { client: newClient });

    await visit('/stats');

    assert
      .dom(`[data-test-filter-client="${newClient.id}"]`)
      .exists('should show new client filter');
    assert
      .dom(`[data-test-filter-client="${newClient.id}"]`)
      .isNotChecked('should keep previous client filters values');

    await click(`[data-test-filter-client="${newClient.id}"]`);
    await triggerEvent(find('[data-test-filter-client-container]'), 'mouseleave');

    assert
      .dom(`[data-test-filter-project="${newProject.id}"]`)
      .exists('should show new project filter');
  });
});
